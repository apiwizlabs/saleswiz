const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {CustomerModel, CustomerSchema} = require('../Models/Customers.model');
const TeamModel = require("../Models/Teams.model");
const TemplateModel = require("../Models/Templates.model");
const {FormFieldsModel} = require("../Models/FormFields.model");
const dbConnect = require("../db/db.connect");
const DealModel = require("../Models/Deals.model");
const ContactModel = require("../Models/Contacts.model");
const {validateUserValueType} = require("../helpers/utils");
const { NotificationModel } = require("../Models/Notifications.model");
const UserModel = require("../Models/Users.model");
const {customerNameLabel} = require("../helpers/constants")
const mongoose = require("mongoose");
const moment = require('moment');


  const createCustomerController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {linkedTeam, userValues} = req.body;

        if(!linkedTeam){
            return res.status(400).json({
                success: false,
                message: "Linked Team needs to be present"
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
        let customerName = "";
        userValues.find(item => {
            if(item.labelName === customerNameLabel){
                customerName = item.fieldValue
            }
        });
        if(!customerName) {
            return res.status(400).json({
                success: false,
                message: "Customer Name is required to be in Customer Name Label"
            });
        }

        if(duplicatesLen.length > 0){
            return res.status(400).json({
                success: false,
                message: `Label Names need to be unique for ${duplicatesLen.toString()}`
            });
        }

        const {formFields: templateFormFields} = await TemplateModel.findOne({$or: [{templateType: "CUSTOMER"}, {templateType: "customer"}]}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});
        let linkedTeamDoc = await TeamModel.findById(linkedTeam);
        if(linkedTeamDoc.isDeleted){
            return res.status(400).json({
                success: false,
                message: "Team has been deleted"
            });
        }
        if(!ADMIN_ROLES.includes(currentUserRole)){
            if(!linkedTeamDoc?.members.includes(currentUserId)){
                return res.status(403).json({
                    success: false,
                    message: "User Needs to be present in Team to assign it"
                });
            }
        }

        let remainingFieldValues = [];
        let templateFieldId = null;

        for(let i = 0; i < templateFormFields.length; i++){
            const currentField = templateFormFields[i];
            templateFieldId = currentField._id;
            if(currentField.isMandatory){
                for(let j = 0; j < userValues.length; j++){
                    let {labelName, fieldValue} = userValues[j];

                    if(j === userValues.length - 1 && labelName !== currentField.labelName ){
                         return res.status(400).json({
                            success: false,
                            message: `Label not present in template for ${currentField.labelName}`
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
                       message: `${labelName} not present in template`
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

        const newCustomer = new CustomerModel({linkedTeam, userValues: remainingFieldValues, createdBy: currentUserId})
        const validationErrors = newCustomer.validateSync();
        if(validationErrors){
            return res.status(400).send(validationErrors.message);
        }

        const savedCustomer = await newCustomer.save()
        linkedTeamDoc.customers.push(savedCustomer?._id);
        const teamnotif = new NotificationModel({description: `New ${customerName} Customer Added to ${linkedTeamDoc.teamName} Team`, type: "CUSTOMER"})
        const savedNotif = await teamnotif.save();
        await UserModel.updateMany({_id: {$in : linkedTeamDoc?.members}},{$push: {'notifications': savedNotif._id}});
        const t = await linkedTeamDoc.save()

        return res.status(200).json({
            success: true,
            data: {customer: savedCustomer, team: t}
        });

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const updateCustomerController = async (req, res) => {
    try{

        //do not send linked team details unless changed by user ; only send the values changed. 

        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        const {linkedTeam , userValues} = req.body;
        const {customerId} = req.params;

        const existingCustomer = await CustomerModel.findById(customerId);

        if(!existingCustomer || existingCustomer.isDeleted){
            return res.status(404).json({sucess: false, message: "Customer does not exist"})
        }

        const {formFields: templateFormFields} = await TemplateModel.findOne({$or: [{templateType: "CUSTOMER"}, {templateType: "customer"}]}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});

        if((!userValues || userValues.length < 1) && !linkedTeam){
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

        let oldCustomerName = "";
        let newCustomerName = "";
        existingCustomer.userValues.find(item => {
            if(item.labelName === customerNameLabel){
                oldCustomerName = item.fieldValue
            }
        });

        userValues.find(item => {
            if(item.labelName === customerNameLabel){
                newCustomerName = item.fieldValue
            }
        });

        if(!oldCustomerName && !newCustomerName) {
            return res.status(400).json({
                success: false,
                message: "Customer Name is required to be in Customer Name Label"
            });
        } 

        if(newCustomerName === oldCustomerName){
            newCustomerName = ""
        }
        
        let newTeam = null;


        if(linkedTeam !== existingCustomer?.linkedTeam.toString()){
            if(linkedTeam && (ADMIN_ROLES.includes(currentUserRole) || currentUserRole === "SALES_OWNER")){
                newTeam = await TeamModel.findById(linkedTeam);
                if(newTeam.isDeleted){
                   return res.status(400).json({success: false, message: "Cannot link a deleted team to a customer"}) 
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

                    if(templateField.isSensitive && !templateField.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
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
                        let isLabelAlreadyPresent = existingCustomer.userValues.find(o => o.labelName === labelName)
                        if(isLabelAlreadyPresent){
                            existingCustomer.userValues.find((o, i)=>{
                                if(o.labelName === labelName){
                                    existingCustomer.userValues[i].fieldValue = fieldValue
                                    return true;
                                }
                            })
                        }else{
                            existingCustomer.userValues.push({labelName, fieldValue, templateFieldId})
                        }
                        break;
                    }
                }
            }
        }

        const oldTeam = await TeamModel.findByIdAndUpdate(existingCustomer?.linkedTeam, {$pull: {customers: existingCustomer._id}});

        //TO DO: check this with .save() instead
        if(userValues?.length > 0){
            const validationErrors = existingCustomer.validateSync();
            if(validationErrors){
                return res.status(400).send(validationErrors.message);
            }
            if(newCustomerName && newCustomerName !== oldCustomerName && oldTeam){
                const nameChangeNotif = new NotificationModel({description: `Customer Name Changed From ${oldCustomerName || `[Customer Name]`} to ${newCustomerName}`, type:"CUSTOMER" });
                const savedNotif = await nameChangeNotif.save()
                await UserModel.updateMany({_id: {$in : oldTeam?.members}},{$push: {'notifications': savedNotif._id}});
            }
        }

        


        if(newTeam){
            const newTeam = await TeamModel.findByIdAndUpdate(linkedTeam, {$push: {customers: customerId}});
            existingCustomer.linkedTeam = newTeam._id;
            const notif = oldTeam ? 
                            await NotificationModel({type: "CUSTOMER", description: `${newCustomerName ? newCustomerName : oldCustomerName} Customer Team Changed from ${oldTeam.teamName} to ${newTeam.teamName}`})
                            : await NotificationModel({type:"CUSTOMER", description: `${newCustomerName ? newCustomerName : oldCustomerName} Team Changed from unassigned to ${newTeam.teamName}`});
            const savedNotif = await notif.save();
            const combinedMembers = oldTeam ? [...oldTeam?.members, ...newTeam?.members] : newTeam?.members
            const members = [...new Set(combinedMembers)];

            await UserModel.updateMany({_id: {$in : members}},{$push: {'notifications': savedNotif._id}});
            await UserModel.updateMany({_id: {$in : oldTeam?.members}},{$push: {'notifications': savedNotif._id}});
        }

        await CustomerModel.findByIdAndUpdate(customerId, existingCustomer);
        return res.status(200).json({
            success: true,
            data: existingCustomer,
        });

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteCustomerController = async (req, res) => {
    try{

        //TODO: remove customer from linked team
        const {customerId} = req.params;

        const customerDetails = await CustomerModel.findByIdAndUpdate(customerId, {isDeleted: true});
        const customerTeamDetails = await CustomerModel.findById(customerId).populate({path: 'linkedTeam', model: TeamModel, select: 'members'});
        let customerName = "";
        customerDetails.userValues.find(item => {
            if(item.labelName === customerNameLabel){
                customerName = item.fieldValue
            }
        });       
        const dealList = await DealModel.find({linkedCustomer: customerId});
        if(customerTeamDetails?.linkedTeam){
            const formattedDealObj = dealList ? dealList.map(deal => ({dealId: deal._id, stage: deal?.userValues?.find(userValue => userValue.labelName === "Select Stage")?.fieldValue})) : []
            const pullOperations = formattedDealObj.map(deal => ({
                updateOne: {
                  filter: {
                    _id: { $in: customerTeamDetails.linkedTeam.members.map(memberId => mongoose.Types.ObjectId(memberId)) },
                  },
                  update: {
                    $pull: { [`pipelineSequence.${deal.stage}`]: deal.dealId },
                  },
                },
              }));
            // Bulk update to remove matching items
            await UserModel.bulkWrite(pullOperations);
        }
      
        await DealModel.updateMany({linkedCustomer: customerId}, {isDeleted: true});

        await ContactModel.updateMany({linkedCustomer: customerId}, {isDeleted: true});
        if(customerDetails.linkedTeam){
            const teamData = await TeamModel.findByIdAndUpdate({_id: customerDetails.linkedTeam}, {$pull: {customers: customerDetails._id}});
            const notif = new NotificationModel({description: `${customerName ? customerName : "[Customer Name]"} Customer deleted from ${teamData?.teamName}`, type: "CUSTOMER"});
            const savedNotif = await notif.save();
            await UserModel.updateMany({_id: {$in : teamData.members}},{$push: {'notifications': savedNotif._id}});
            //TODO: ask customer name how?
        }

        return res.status(200).json({sucess: true, data: "Associated Deals and Contacts have also been deleted"});

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getAllCustomersController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {teamIdList, dealIdList, contactIdList, dateFrom, dateTo, searchInput,  page : paramsPage, limit: paramsLimit} = req.query;


        let adminQuery = {isDeleted: false};
        let teamQuery = {members: currentUserId, isDeleted: false }
        let customerQuery = { isDeleted: false }
        const search = searchInput?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || "";
        const page = parseInt(paramsPage) - 1;
        const limit = parseInt(paramsLimit);
        const skipCount = page && limit ? page * limit : 0;

        let generatedCustomerIdList = []

            
        if(teamIdList && teamIdList?.split(",")?.length > 0){
            const teamsData = await TeamModel.find({_id: {$in: teamIdList?.split(",")?.map(item =>{
                item.replace(/['"]+/g, '');
                return mongoose.Types.ObjectId(item);
            }) }});

            for(let team of teamsData){
                for(customer of team.customers){
                    generatedCustomerIdList.push(customer.toString())
                }
            }
            
        }


        if(dealIdList && dealIdList?.split(",")?.length > 0){
            const formattedDealList = dealIdList.split(",").map(item =>{
                item.replace(/['"]+/g, '');
                return mongoose.Types.ObjectId(item);
           })
            const customersList = await CustomerModel.find({deals: {$in: formattedDealList}})
            for(let customer of customersList){
                generatedCustomerIdList.push(customer._id.toString())
            }

        }


        if(contactIdList && contactIdList?.split(",")?.length > 0){
            formattedContactList  =  contactIdList.split(",").map(item =>{
                item.replace(/['"]+/g, '');
                return mongoose.Types.ObjectId(item)
           })
           const customersList = await CustomerModel.find({contacts: {$in: formattedContactList}})
           for(let customer of customersList){
               generatedCustomerIdList.push(customer._id.toString())
           }
        }

        let uniqueCustomerIdList = [...new Set(generatedCustomerIdList)].map(item => mongoose.Types.ObjectId(item));
        if((dealIdList && dealIdList?.split(",")?.length > 0) || (contactIdList && contactIdList?.split(",")?.length > 0)|| (teamIdList && teamIdList?.split(",")?.length > 0)){
            adminQuery._id = {
                $in : uniqueCustomerIdList
            }
            customerQuery._id = {
                $in : uniqueCustomerIdList
            }
        }

        if(search){
            adminQuery.userValues = {
                $elemMatch: {
                  labelName: "Customer Name",
                  fieldValue: { $regex: search, $options: "i" }, // Case-insensitive regex search
                },
            }
            customerQuery.userValues = {
                $elemMatch: {
                  labelName: "Customer Name",
                  fieldValue: { $regex: search, $options: "i" }, // Case-insensitive regex search
                },
            }
        }


        if(dateFrom){
            adminQuery.cts = {
                ...adminQuery.cts,
                $gte :  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
            }
            customerQuery.cts = {
                ...customerQuery.cts,
                $gte :  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
            }
        }
        if(dateTo){
            adminQuery.cts = {
                ...adminQuery.cts,
                $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()
            }
            customerQuery.cts = {
                ...customerQuery.cts,
                $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()
            }
        }


        if(ADMIN_ROLES.includes(currentUserRole)){
            const totalCount = await CustomerModel.countDocuments(adminQuery)

             const allCustomers = paramsLimit && paramsPage ?
              await CustomerModel.find(adminQuery).skip(skipCount).limit(limit).populate({path:'userValues.templateFieldId', match: {isDeleted: false}}).populate({path: 'createdBy', model: UserModel, select: 'firstName lastName profilePicture'})
              : await CustomerModel.find(adminQuery).populate({path:'userValues.templateFieldId', match: {isDeleted: false}}).populate({path: 'createdBy', model: UserModel, select: 'firstName lastName profilePicture'});
             return res.status(200).json({
                 success: true,
                 data: allCustomers,
                 totalCount,
             });
        }

      const teamsData = await TeamModel.find(teamQuery)
        .populate({path: 'customers', match: customerQuery, model: CustomerModel,
        populate: {path: 'userValues.templateFieldId', match: { isDeleted: false }},
        populate: {path : 'createdBy', model: UserModel, select: 'firstName lastName profilePicture'}
      });

      for(let i = 0; i < teamsData.length; i++){
        const teamData = teamsData[i];
        const teamCustomers = teamData.customers;

        for(let j = 0; j < teamCustomers.length; j++){
            const filteredData = teamCustomers[j].userValues.filter(userValue => {
                if(userValue.templateFieldId.isSensitive && !ADMIN_ROLES.includes(currentUserRole)){
                    return userValue.templateFieldId.readAccessRoles.includes(currentUserRole)
                } return true;
            })
            teamCustomers[j].userValues = filteredData;
        }
      }

      const allCustomers = teamsData.flatMap(team => team.customers);
      const paginatedCustomers = paramsLimit || paramsPage ?  allCustomers.slice(skipCount, skipCount + limit) : allCustomers;


       return res.status(200).json({
            success: true,
            data: paginatedCustomers,
            totalCount: allCustomers?.length
        });

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getCustomerByIdController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        const {customerId} = req.params;
        let customerData = await CustomerModel.findOne({_id: customerId, isDeleted: false}).populate({path:'userValues.templateFieldId', match: {isDeleted: false}}).populate({path: 'linkedTeam', model: TeamModel, populate: {path: 'members', model: UserModel}}).populate({path: 'deals', model: DealModel});
        if(!customerData){
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if(ADMIN_ROLES.includes(currentUserRole)){
            return res.status(200).json({
                success: true,
                data: customerData
            });
        }

        if(!customerData?.linkedTeam){
            return res.status(400).json({
                success: false,
                message: "Customer has not been linked to a team yet"
            });
        }

        const customerTeam = await TeamModel.findById(customerData?.linkedTeam)
        logger.info("MEMBERS presnet in customer Team :: ",customerTeam.members);
        const isUserInTeam = customerTeam.members.map(member => member.toString()).includes(currentUserId)
        logger.info("Admin Present or Not  :: ",customerTeam.members);

        if(!isUserInTeam && !ADMIN_ROLES.includes(currentUserRole)){
            return res.status(403).json({
                success: false,
                message: "User is not part of customer team"
            });
        }
        const customerUserValues = customerData.userValues;
        const filteredCustomerValues = customerUserValues.filter(userField => {
            if(userField.templateFieldId.isSensitive && !ADMIN_ROLES.includes(currentUserRole)){
                return userField.templateFieldId.readAccessRoles.includes(currentUserRole)
            } return true
        });
        customerData.userValues = filteredCustomerValues;

        return res.status(200).json({
            success: true,
            data: customerData
        });
    

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }


  module.exports = {getAllCustomersController, createCustomerController, updateCustomerController, getCustomerByIdController, deleteCustomerController }