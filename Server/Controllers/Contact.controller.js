const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {CustomerModel} = require('../Models/Customers.model');
const DealModel = require('../Models/Deals.model')
const TeamModel = require("../Models/Teams.model");
const UserModel = require("../Models/Users.model");
const TemplateModel = require("../Models/Templates.model");
const {NotificationModel} = require("../Models/Notifications.model");
const {FormFieldsModel} = require("../Models/FormFields.model");
const dbConnect = require("../db/db.connect");
const {validateUserValueType} = require("../helpers/utils");
const ContactModel = require("../Models/Contacts.model");
const {customerNameLabel, contactNameLabel} = require("../helpers/constants");
const mongoose = require("mongoose");
const moment = require('moment');



  const createContactController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {userValues, linkedCustomer} = req.body;

        if(!linkedCustomer || !userValues ){
            return res.status(400).json({
                success: false,
                message: "Invalid Inputs for Contact Creation"
            });
        }

        if(userValues.length < 1){
            return res.status(400).json({
                success: false,
                message: "Atleast one user input needs to be present."
            });
        }

        const labelNamesArr = userValues.map(item => item.labelName);
        const duplicatesLen = labelNamesArr.filter((item, index) => labelNamesArr.indexOf(item) !== index);

        if(duplicatesLen.length > 0){
            return res.status(400).json({
                success: false,
                message: `Label Names need to be unique for ${duplicatesLen.toString()}`
            });
        }

        const {formFields: templateFormFields} = await TemplateModel.findOne({$or: [{templateType: "CONTACT"}, {templateType: "contact"}]}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});
        let linkedCustomerDoc = await CustomerModel.findById(linkedCustomer).populate({path: 'linkedTeam', model: TeamModel});
        if( !linkedCustomerDoc ||  linkedCustomerDoc?.isDeleted || linkedCustomerDoc?.linkedTeam?.isDeleted){
            return res.status(400).json({
                success: false,
                message: "Invalid Customer"
            });
        }


        //get team from customer
        if(!ADMIN_ROLES.includes(currentUserRole) && !linkedCustomerDoc?.linkedTeam?.members.includes(currentUserId)){
                return res.status(403).json({
                    success: false,
                    message: "User Needs to be present in Customer's Team to assign it"
                });
        }

        let remainingFieldValues = [];
        let templateFieldId = null;

        for(let i = 0; i < templateFormFields.length; i++){
            const currentField = templateFormFields[i];
            templateFieldId = currentField._id;
            if(currentField.isMandatory  && (!currentField.isSensitive || currentField.writeAccessRoles.includes(currentUserRole))){
                for(let j = 0; j < userValues.length; j++){
                    let {labelName, fieldValue} = userValues[j];

                    if(j === userValues.length - 1 && labelName !== currentField.labelName ){
                         return res.status(400).json({
                            success: false,
                            message: `Value not in template for mandatory field ${currentField.labelName}`
                        });
                    }

                     if(labelName === currentField.labelName){
                        if(currentField.isSensitive && !currentField.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
                            return res.status(400).json({
                                success: false,
                                message: `User does not have write access for ${labelName}`
                            });
                        }
                        if(!fieldValue){
                            return res.status(400).json({
                                success: false,
                                message: `Value not present for required ${labelName} field`
                            });
                        }
                        
                        const {success, label, formattedValue} = validateUserValueType(fieldValue, currentField)
                        if(!success){
                            return res.status(400).json({
                                success: false,
                                message: `Invalid value given for ${label}`
                            });
                        }
                        if(success){ 
                            if(formattedValue){
                                remainingFieldValues.push({labelName: labelName, fieldValue: formattedValue, templateFieldId});
                            }else{
                                remainingFieldValues.push({labelName: labelName, fieldValue: fieldValue, templateFieldId});
                            }
                            break;
                        }
                    }
                }
            }
        }

        let filteredUserValues = userValues;
        if(remainingFieldValues.length > 0){
            filteredUserValues = userValues.filter(value => !remainingFieldValues.find(o => value.labelName === o.labelName));
        }

        for(let i = 0; i < filteredUserValues.length; i++){

            const {labelName, fieldValue} = filteredUserValues[i];
         
            for(let k = 0; k < templateFormFields.length; k++){
                const templateField = templateFormFields[k]
                templateFieldId = templateField._id
                if(k === templateFormFields.length - 1 && templateField.labelName !== labelName ){
                    return res.status(400).json({
                       success: false,
                       message: `${labelName} not present in template`,
                   });
                }
                if(templateField.labelName === labelName){
                    if(templateField.isSensitive && !templateField.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
                        return res.status(400).json({
                            success: false,
                            message: `User does not have write access for ${labelName}`
                        });
                    }
                    const {success, label, formattedValue} = validateUserValueType(fieldValue, templateField);
                    if(!success){
                        return res.status(400).json({
                            success: false,
                            message: `Invalid value given for ${label}`
                        });
                    }else{
                        if(formattedValue){
                            remainingFieldValues.push({labelName, fieldValue: formattedValue, templateFieldId}); 
                        }else{
                            remainingFieldValues.push({labelName, fieldValue, templateFieldId});
                        }
                        break;
                    }
                }
            }
        }

        const newContact = new ContactModel({linkedCustomer, userValues: remainingFieldValues, createdBy: currentUserId});
        let contactName = ""
        remainingFieldValues.find(item => {
            if(item.labelName === contactNameLabel){
                contactName = item.fieldValue
            }
        });   
        let customerName = "";
        linkedCustomerDoc.userValues.find(item => {
            if(item.labelName === customerNameLabel){
                customerName = item.fieldValue;
            }
        });   


        const savedContact = await newContact.save();
        linkedCustomerDoc.contacts.push(savedContact?._id);
        const savedCustomer = await linkedCustomerDoc.save();
        const teamData = await TeamModel.findById({_id: linkedCustomerDoc.linkedTeam._id});
        if(teamData){
            const createDealNotif = new NotificationModel({type: "CONTACT" , description: `New Contact, ${contactName || `[Contact Name]`} created for ${customerName || `[Customer Name]`} Customer`});
            const savedNotif = await createDealNotif.save();
            await UserModel.updateMany({_id: {$in : teamData.members}},{$push: {'notifications': savedNotif._id}});
        }

        return res.status(200).json({
            success: true,
            data: {customer: savedCustomer, contact: savedContact}
        });

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const updateContactController = async (req, res) => {
    try{

        //do not send linked team details unless changed by user ; only send the values changed. 

        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        const {linkedCustomer , userValues} = req.body;
        const {contactId} = req.params;

        const existingContact = await ContactModel.findById(contactId);

        if(!existingContact || existingContact.isDeleted){
            return res.status(404).json({sucess: false, message: "Contact does not exist"})
        }

        const {formFields: templateFormFields} = await TemplateModel.findOne({$or: [{templateType: "CONTACT"}, {templateType: "contact"}]}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});

        if((!userValues || userValues.length < 1) && !linkedCustomer){
            return res.status(200).json({sucess: true, data: "Nothing Changed"})
        }

        else if(userValues.length > 0){

            const labelNamesArr = userValues.map(item => item.labelName);
            const duplicatesLen = labelNamesArr.filter((item, index) => labelNamesArr.indexOf(item) !== index)
    
            if(duplicatesLen.length > 0){
                return res.status(400).json({
                    success: false,
                    message: `Label Names need to be unique for ${duplicatesLen.toString()}`
                });
            }
        }
       

        let newCustomer = null;

        if(linkedCustomer){
            if(linkedCustomer && (ADMIN_ROLES.includes(currentUserRole) || currentUserRole === "SALES_OWNER")){
                newCustomer = await CustomerModel.findById(linkedCustomer);
                if(newCustomer.isDeleted){
                   return res.status(400).json({success: false, message: "Cannot link a deleted customer to a contact"}) 
                }
            }else{
                return res.status(403).json({
                    success: false,
                    message: "Access Denied unless admin or sales owner"
                });
            }
        }
     

        for(let i = 0; i < userValues.length; i++){
            const {labelName, fieldValue} = userValues[i];
            let templateFieldId = null;

            for(let k = 0; k < templateFormFields.length; k++){

                const templateField = templateFormFields[k];
                templateFieldId = templateField._id;

                if(k === templateFormFields.length - 1 && templateField.labelName !== labelName ){
                    return res.status(400).json({
                       success: false,
                       message: `${labelName} not present in template`
                   });
                }

                if(templateField.labelName === labelName){
                    if(templateField.isMandatory && !fieldValue){
                        return res.status(400).json({
                            success: false,
                            message:`Value not present for required ${labelName} field`
                        });
                    }
                    if( templateField.isSensitive && !templateField.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
                        return res.status(400).json({
                            success: false,
                            message: `User does not have write access for ${labelName}`
                        });
                    }
                    const {success, label} = validateUserValueType(fieldValue, templateField);
                    if(!success){
                        return res.status(400).json({
                            success: false,
                            message: `Invalid value given for ${label}`
                        });
                    }else{
                        let isLabelAlreadyPresent = existingContact.userValues.find(o => o.labelName === labelName)
                        if(isLabelAlreadyPresent){
                            existingContact.userValues.find((o, i)=>{
                                if(o.labelName === labelName){
                                    existingContact.userValues[i].fieldValue = fieldValue
                                    return true;
                                }
                            })
                        }else{
                            existingContact.userValues.push({labelName, fieldValue, templateFieldId})
                        }
                        break;
                    }
                }
            }
        }

        if(userValues?.length > 0){
            const validationErrors = existingContact.validateSync();
            if(validationErrors){
                return res.status(400).send(validationErrors.message);
            }
            if(newCustomer){
                await CustomerModel.findByIdAndUpdate(existingContact.linkedCustomer, {$pull: {contacts: existingContact._id}});
                await CustomerModel.findByIdAndUpdate(linkedCustomer, {$push: {contacts: existingContact._id}});
                existingContact.linkedCustomer = newCustomer._id;
            }


            await ContactModel.findByIdAndUpdate(contactId, existingContact);
            return res.status(200).json({
                success: true,
                data: existingContact,
            });
        }

        if(newCustomer){
            await CustomerModel.findByIdAndUpdate(existingContact.linkedCustomer, {$pull: {contacts: existingContact._id}});
            await CustomerModel.findByIdAndUpdate(linkedCustomer, {$push: {contacts: existingContact._id}});
            existingContact.linkedCustomer = newCustomer._id;
            await ContactModel.findByIdAndUpdate(contactId, existingContact);
            return res.status(200).json({
                success: true,
                data: existingContact,
            });
        }

       

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getAllContactsController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {customerIdList, teamIdList, dateFrom, dateTo, searchInput, page : paramsPage, limit: paramsLimit} = req.query;
        const page = parseInt(paramsPage) - 1;
        const limit = parseInt(paramsLimit);
        const skipCount = page && limit ? page * limit : 0;

        let generatedCustomerIdList = []
        const search = searchInput?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || "";

        if(teamIdList && teamIdList?.split(",")?.length > 0){
            const teamInputIdList = teamIdList?.split(",")?.map(item =>{
                item.replace(/['"]+/g, '');
                return mongoose.Types.ObjectId(item);
            }) 
            const teamsData = await TeamModel.find({_id: {$in: teamInputIdList }});
            
            for(let team of teamsData){
                for(customer of team.customers){
                    generatedCustomerIdList.push(customer.toString())
                }
            }
        }

        if(customerIdList && customerIdList?.split(",")?.length > 0){
            const cleanedList = customerIdList?.split(",")?.map(item => item.replace(/['"]+/g, ''))
            generatedCustomerIdList = [...generatedCustomerIdList, ...cleanedList];
        }

        let uniqueCustomerIdList = [...new Set(generatedCustomerIdList)].map(item => mongoose.Types.ObjectId(item));
        const filteredCustomers = await CustomerModel.find({_id: {$in : uniqueCustomerIdList}})
        let filteredContactIds = []
        for(let customer of filteredCustomers){
            for(let contact of customer.contacts){
                filteredContactIds.push(contact);
            }
        }

        let adminQuery = {isDeleted: false}
        let customerQuery ={ isDeleted: false }
        let contactsQuery = { isDeleted: false }


        if((customerIdList && customerIdList?.split(",")?.length > 0) || (teamIdList && teamIdList?.split(",")?.length > 0)){
            adminQuery._id = {$in : filteredContactIds}
            customerQuery._id = {$in : uniqueCustomerIdList}
        }
        if(dateFrom){
            adminQuery.cts = {
                ...adminQuery.cts,
                $gte :  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
            }
            contactsQuery.cts = {
                ...contactsQuery.cts,
                $gte :  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
            }
        }
        if(dateTo){
            adminQuery.cts = {
                ...adminQuery.cts,
                $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()
            }
            contactsQuery.cts = {
                ...contactsQuery.cts,
                $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()
            }
        }
        if(search){
            adminQuery.userValues = {
                $elemMatch: {
                  labelName: "Contact Name",
                  fieldValue: { $regex: search, $options: "i" }, // Case-insensitive regex search
                },
            }
            contactsQuery.userValues = {
                $elemMatch: {
                  labelName: "Contact Name",
                  fieldValue: { $regex: search, $options: "i" }, // Case-insensitive regex search
                },
            }
        }



        if(ADMIN_ROLES.includes(currentUserRole)){
            const totalCount = await ContactModel.countDocuments(adminQuery)
            const allContacts = paramsLimit && paramsPage ?
             await ContactModel.find(adminQuery).skip(skipCount).limit(limit).populate({path:'userValues.templateFieldId', match: {isDeleted: false}}).populate({path:'linkedCustomer', model: CustomerModel}).populate({path: 'createdBy', model: UserModel, select: "firstName lastName profilePicture"})
             : await ContactModel.find(adminQuery).populate({path:'userValues.templateFieldId', match: {isDeleted: false}}).populate({path:'linkedCustomer', model: CustomerModel}).populate({path: 'createdBy', model: UserModel, select: "firstName lastName profilePicture"})
            return res.status(200).json({
                success: true,
                data: allContacts,
                totalCount,
            });
        }

      const teamsData = await TeamModel.find({members: currentUserId, isDeleted: false })
      .populate({path: 'customers', match: customerQuery, 
        populate: {
            path: 'contacts', match: contactsQuery, 
            populate: {path:'userValues.templateFieldId', match: {isDeleted: false}}, 
            populate: {path: 'createdBy', model: UserModel, select: "firstName lastName profilePicture"},
       }}).exec()

      for(let i = 0; i < teamsData.length; i++){
        const teamData = teamsData[i];
        const teamCustomers = teamData.customers;

        for(let j = 0; j < teamCustomers.length; j++){

            const customerContacts = teamCustomers[j].contacts;

            for(let k = 0; k < customerContacts.length; k++){
                const filteredContactsData = customerContacts[k].userValues.filter(userValue => {
                    if(userValue.templateFieldId.isSensitive && !ADMIN_ROLES.includes(currentUserRole)){
                        return userValue.templateFieldId.readAccessRoles.includes(currentUserRole)
                    } return true;
                })
                customerContacts[k].userValues = filteredContactsData;
                customerContacts[k]._doc.relatedCustomer = teamCustomers[j].userValues.find(userValue => userValue.labelName === "Customer Name")?.fieldValue;
            }
        }
      }

       const allContacts = teamsData.flatMap(team => team.customers.flatMap(customer => customer.contacts));
       const paginatedContacts = (paramsPage || paramsLimit) ?  allContacts.slice(skipCount, skipCount + limit) : allContacts;
       

      return res.status(200).json({
            success: true,
            data: paginatedContacts,
            totalCount: allContacts?.length
        });

      

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteContactController = async (req, res) => {
   try{
        const {contactId} = req.params;

        const contactData = await ContactModel.findByIdAndUpdate(contactId, {isDeleted: true});
        await CustomerModel.findByIdAndUpdate(contactData.linkedCustomer._id, {$pull: {contacts: contactId}});
        return res.status(200).json({
            success: true,
        })
   }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getContactByIdController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        const {contactId} = req.params;
        let contactData = await ContactModel.findOne({_id: contactId, isDeleted: false}).populate({path:'userValues.templateFieldId', match: {isDeleted: false}}).populate({path: 'linkedCustomer', populate: {path: 'deals', model: DealModel}});
        if(!contactData || contactData?.isDeleted){
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        if(ADMIN_ROLES.includes(currentUserRole)){
            return res.status(200).json({
                success: true,
                data: contactData
            });
        }

        const customerData = await CustomerModel.findById(contactData?.linkedCustomer).populate({path: 'linkedTeam'})
        const isUserInTeam = customerData.linkedTeam.members.map(member => member.toString()).includes(currentUserId);

        if(!isUserInTeam && !ADMIN_ROLES.includes(currentUserRole)){
            return res.status(403).json({
                success: false,
                message: "User is not part of customer team"
            });
        }
        const contactUserValues = contactData.userValues;
        const filteredContactValues = contactUserValues.filter(userField => {
            if(userField.templateFieldId.isSensitive && !ADMIN_ROLES.includes(currentUserRole)){
                return userField.templateFieldId.readAccessRoles.includes(currentUserRole);
            } return true;
        });
        contactData.userValues = filteredContactValues;

        return res.status(200).json({
            success: true,
            data: contactData   
        });
    

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }


  module.exports = {createContactController, updateContactController, getAllContactsController, deleteContactController, getContactByIdController}