const config = require("../config");
const { ADMIN_ROLES, TEAM_LEADS } = require("../helpers/roleGroups");
const {CustomerModel} = require('../Models/Customers.model');
const DealModel = require('../Models/Deals.model');
const {ApprovalModel} = require('../Models/Approval.models');
const UserModel = require('../Models/Users.model');
const ContactModel = require('../Models/Contacts.model');
const TeamModel = require("../Models/Teams.model");
const {NotesModel} = require("../Models/Notes.model");
const ActivityModel = require("../Models/Activities.model");
const TemplateModel = require("../Models/Templates.model");
const {FormFieldsModel} = require("../Models/FormFields.model");
const dbConnect = require("../db/db.connect");
const {validateUserValueType} = require("../helpers/utils");
const {NotificationModel} = require("../Models/Notifications.model");
const {dealNameLabel, customerNameLabel, dealStagesLabel} = require("../helpers/constants")
const {transportObject} = require('../helpers/constants');
const mongoose = require("mongoose");
const moment = require('moment');



const sendApprovalNotification = async (approvalModel, salesOwnerEmail) => {
    try{
        const approvalSiteLink = config.BASE_URL+ 'approvals/'
        let transporter = nodemailer.createTransport(transportObject)
    
        return new Promise((resolve, reject) => {
          ejs.renderFile(
            "emailTemplates/approvalNotification.ejs",
            {entityName: approvalModel.entityName, approvalSiteLink},
            (err, data) => {
              if (err) {
                console.log(err);
                reject(err); 
              } else {
                const emailMessage = {
                  from: config.MAIL_FROM,
                  to: salesOwnerEmail,
                  subject: `New Approval Request for ${approvalModel.entityName}`,
                  text: "New approval request notification",
                  html: data,
              }
        
                transporter.sendMail(emailMessage, (error, info) => {
                  if (error) {
                    console.log(error);
                    reject(error); 
                  } else {
                    resolve(info); 
                  }
                });
              }
            }
          );
        });
        
      }catch(err){
        console.log(err)
      }
  }


  const createDealController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        logger.info("CURR ROLE :: ",currentUserRole);
        let currentUserId = res.locals.decodedToken.userId;
        const {userValues, linkedCustomer, linkedContacts} = req.body;
        logger.info("USER VALUE INOUT DEAL :: ",JSON.stringify(userValues));
        logger.info("CUSTOMER DEAL :: ",JSON.stringify(userValues));

        if(!linkedCustomer || !userValues ){
            return res.status(400).json({
                success: false,
                message: "Invalid Inputs for Deal Creation"
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

        if(!labelNamesArr.includes('Deal Name') || !labelNamesArr.includes('Select Stage')  ){
            return res.status(400).json({
                success: false,
                message: `'Select Stage' and 'Deal Name' fields need to be part of your deal form`
            });
        }

        if(duplicatesLen.length > 0){
            return res.status(400).json({
                success: false,
                message: `Label Names need to be unique for ${duplicatesLen.toString()}`
            });
        }

        const {formFields: templateFormFields} = await TemplateModel.findOne({$or: [{templateType: "DEAL"}, {templateType: "deal"}]}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});
        let linkedCustomerDoc = await CustomerModel.findById(linkedCustomer).populate({path: 'linkedTeam', model: TeamModel, match:{isDeleted: false}, populate: {path: 'members', model: UserModel, select: 'role email'} })
        if( !linkedCustomerDoc ||  linkedCustomerDoc?.isDeleted || linkedCustomerDoc?.linkedTeam?.isDeleted){
            return res.status(400).json({
                success: false,
                message: "Invalid Customer"
            });
        }

        if(linkedContacts?.length > 0){
            const contactsNotInCustomer = linkedContacts.filter(item => !linkedCustomerDoc.contacts.includes(item))
            if(contactsNotInCustomer.length > 0){
                return res.status(400).json({
                    success: false,
                    message: "Invalid Contacts were linked to deal"
                });
            }
        }



        //get team from customer
        if(!ADMIN_ROLES.includes(currentUserRole) && !linkedCustomerDoc?.linkedTeam?.members?.map(member => member?._id?.toString())?.includes(currentUserId)){
            return res.status(403).json({
                success: false,
                message: "User Needs to be present in Customer's Team to assign it"
            });
        }

        let remainingFieldValues = [];
        let templateFieldId = null;
        let entityName = null; 
        

        for(let input of userValues){
            if(input.labelName === dealNameLabel){
                entityName = input?.fieldValue
            }
        }

        const teamMembers = linkedCustomerDoc?.linkedTeam?.members || null;
        if(!teamMembers){
            return res.status(400).json({
                success: false,
                message: `Valid Team is required`
            });
        }
        let salesOwnerId = [];
        let salesOwnerEmail = [];

        for(let user of teamMembers){
            if(user.role === "SALES_OWNER"){
                salesOwnerId.push(user._id.toString());
                salesOwnerEmail.push(user.email);
            }
        }
        if(salesOwnerId?.length < 1){
            return res.status(400).json({
                success: false,
                message: `Sales Owner required`
            });
        }

        for(let i = 0; i < templateFormFields.length; i++){
            const currentField = templateFormFields[i];
            templateFieldId = currentField._id;
            if(currentField.isMandatory && (!currentField?.isSensitive || currentField.writeAccessRoles.includes(currentUserRole))){
                for(let j = 0; j < userValues.length; j++){
                    let {labelName, fieldValue} = userValues[j];

                    if(j === userValues.length - 1 && labelName !== currentField.labelName ){
                         return res.status(400).json({
                            success: false,
                            message: `Value not in template for mandatory field ${currentField.labelName}`
                        });
                    }

                     if(labelName === currentField.labelName){
                        if(currentField?.isSensitive && !currentField.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
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

                        if(currentField.fieldType === "Date Picker"){
                            fieldValue = moment.utc(fieldValue, "DD/MM/YYYY").toDate()
                        }
                        
                        const {success, label, formattedValue} = validateUserValueType(fieldValue, currentField)
                        if(!success){
                            return res.status(400).json({
                                success: false,
                                message: `Invalid value given for ${label}`
                            });
                        }
                       
                        if(success){ 
                            let approvalId = null;
                            if(currentField?.needsApproval){
                                let formattedFieldValue = fieldValue;
                                if(Array.isArray(fieldValue)){
                                    formattedFieldValue = fieldValue?.join(" ");
                                }
                                const approvalModelValues = {linkedFieldId: currentField._id, entityName, fieldValue: formattedFieldValue, requestor: currentUserId, salesOwnerId, status: "PENDING"  }
                                const newApproval =  new ApprovalModel(approvalModelValues)
                                const validationErrors = newApproval.validateSync();
                                if(validationErrors){
                                    return res.status(400).send(validationErrors.message);
                                }
                                const savedApproval = await newApproval.save();
                                approvalId = savedApproval._id;
                                try{
                                    await sendApprovalNotification(approvalModelValues, salesOwnerEmail);
                                    const approvalNotif = new NotificationModel({type: "APPROVAL", description: `Approval needed for ${labelName} belonging to ${entityName}`})
                                    const savedApprovalNotif =  await approvalNotif.save();
                                    await UserModel.updateMany({_id : {$in : salesOwnerId} },{$push: {'notifications': savedApprovalNotif._id}})
                                }catch(err){
                                    logger.info(err)
                                }
                            }
                        
                                if(formattedValue){
                                    const userValue = approvalId ? {labelName: labelName, fieldValue: formattedValue, templateFieldId, approvalFieldId : approvalId} : {labelName: labelName, fieldValue: formattedValue, templateFieldId}
                                    remainingFieldValues.push(userValue);
                                }else{
                                    const userValue = approvalId ? {labelName: labelName, fieldValue: fieldValue, templateFieldId, approvalFieldId: approvalId} : {labelName: labelName, fieldValue: fieldValue, templateFieldId,}
                                    remainingFieldValues.push(userValue);
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

            let {labelName, fieldValue} = filteredUserValues[i];
         
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
                    if(templateField?.isSensitive && !templateField.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
                        return res.status(400).json({
                            success: false,
                            message: `User does not have write access for ${labelName}`
                        });
                    }
                    if(templateField.fieldType === "Date Picker"){
                        fieldValue = moment.utc(fieldValue, "DD/MM/YYYY").toDate()
                    }
                    const {success, label, formattedValue} = validateUserValueType(fieldValue, templateField);
                    
                    if(!success){
                        return res.status(400).json({
                            success: false,
                            message: `Invalid value given for ${label}`
                        });
                    }
                    if(success){
                        let approvalId = null;
                        if(templateField?.needsApproval){
                            let formattedFieldValue = fieldValue
                            if(Array.isArray(fieldValue)){
                                formattedFieldValue = fieldValue.join(" ");
                            }
                            const approvalModelValues = {linkedFieldId: templateField._id, entityName, fieldValue: formattedFieldValue, requestor: currentUserId, salesOwnerId, status: "PENDING"  }
                            const newApproval =  new ApprovalModel(approvalModelValues);
                            const validationErrors = newApproval.validateSync();
                            if(validationErrors){
                                return res.status(400).send(validationErrors.message);
                            }
                            const savedApproval = await newApproval.save();
                            approvalId = savedApproval._id;
                            try{
                                await sendApprovalNotification(approvalModelValues, salesOwnerEmail);
                                const approvalNotif = new NotificationModel({type: "APPROVAL", description: `Approval needed for ${labelName} belonging to ${entityName}`})
                                const savedApprovalNotif =  await approvalNotif.save();
                                await UserModel.updateMany({_id : {$in : salesOwnerId} },{$push: {'notifications': savedApprovalNotif._id}})
                            }catch(err){
                                logger.info(err)
                            }
                        }
                        if(formattedValue){
                            const userValue = approvalId ? {labelName: labelName, fieldValue: formattedValue, templateFieldId, approvalFieldId : approvalId} : {labelName: labelName, fieldValue: formattedValue, templateFieldId}
                            remainingFieldValues.push(userValue);
                        }else{
                            const userValue = approvalId ? 
                            {labelName: labelName, fieldValue: fieldValue, templateFieldId, approvalFieldId: approvalId} : {labelName: labelName, fieldValue: fieldValue, templateFieldId,}
                            remainingFieldValues.push(userValue);
                        }
                        break;
                    }
                }
            }
        }

        const newDeal = new DealModel({linkedCustomer, linkedContacts, userValues: remainingFieldValues, createdBy: currentUserId});
         
        let customerName = "";
        linkedCustomerDoc.userValues.find(item => {
            if(item.labelName === customerNameLabel){
                customerName = item?.fieldValue;
            }
        });   

        const validationErrors = newDeal.validateSync();
        if(validationErrors){
            return res.status(400).send(validationErrors.message);
        }
        
        const savedDeal = await newDeal.save();
        linkedCustomerDoc.deals.push(savedDeal?._id);
        const savedCustomer = await linkedCustomerDoc.save();
        const teamData = await TeamModel.findById({_id: linkedCustomerDoc.linkedTeam._id}).populate({path: 'members', model: UserModel, select: 'role firstName lastName'});
        const memberNoAdminInList = teamData.members.filter(member => !ADMIN_ROLES.includes(member.role)).map(member => member._id.toString());

        if(teamData){
            const createDealNotif = new NotificationModel({description: `New Deal, ${entityName} created for ${customerName} Customer`, type: "DEAL"});
            const savedNotif = await createDealNotif.save();
            await UserModel.updateMany({_id: {$in : teamData.members}},{$push: {'notifications': savedNotif._id}});
        }
        let selectedStage = savedDeal.userValues.find(userValue => userValue.labelName === "Select Stage")?.fieldValue;
        if(!selectedStage){
            selectedStage = 'Unassigned'
        }
        const pipelineObject = {};
        pipelineObject[`pipelineSequence.${selectedStage}`] = savedDeal._id;        

        await UserModel.updateMany({_id: {$in: memberNoAdminInList} },{$push: pipelineObject});
        await UserModel.updateMany({role: {$in: ADMIN_ROLES}},{$push: pipelineObject});
        return res.status(200).json({
            success: true,
            data: {
                customer: savedCustomer, 
                deal: savedDeal
            }
        });

    }catch (err) {
        logger.info("ERROR IN DEAL CREATION:: ",err);
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }


  const updateDealController = async (req, res) => {
    try{

        //do not send linked team details unless changed by user ; only send the values changed. 

        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        // currentUserRole = "SALES_OWNER";

        const {linkedCustomer , userValues} = req.body;
        const {dealId} = req.params;

        const existingDeal = await DealModel.findById(dealId)
        .populate({path: 'linkedCustomer', model: CustomerModel,
         populate: {path: 'linkedTeam', model: TeamModel, 
         populate: {path: 'members', model: UserModel, select: 'role email'}}});

        const teamData = existingDeal?.linkedCustomer?.linkedTeam;
        

        if(!existingDeal || existingDeal.isDeleted){
            return res.status(404).json({sucess: false, message: "Deal does not exist"})
        }

        const {formFields: templateFormFields} = await TemplateModel.findOne({$or: [{templateType: "DEAL"}, {templateType: "deal"}]}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});

        if((!userValues || userValues.length < 1) && !linkedCustomer){
            return res.status(200).json({sucess: true, data: "Nothing Changed"})
        }

        else if(userValues.length > 0){

            const labelNamesArr = userValues.map(item => item.labelName);
            const duplicatesLen = labelNamesArr.filter((item, index) => labelNamesArr.indexOf(item) !== index);
    
            if(duplicatesLen.length > 0){
                return res.status(400).json({
                    success: false,
                    message: `Label Names need to be unique for ${duplicatesLen.toString()}`
                });
            }
        }
       

        // let newCustomer = null;

        // if(linkedCustomer){
        //     if(linkedCustomer && (ADMIN_ROLES.includes(currentUserRole) || currentUserRole === "SALES_OWNER")){
        //         newCustomer = await CustomerModel.findById(linkedCustomer);
        //         if(newCustomer.isDeleted){
        //            return res.status(400).json({success: false, message: "Cannot link a deleted customer to a deal"}) 
        //         }
        //     }else{
        //         return res.status(403).json({
        //             success: false,
        //             message: "Access Denied unless admin or sales owner"
        //         });
        //     }
        // }

        let entityName = null; 
        let salesOwnerId = [];
        let salesOwnerEmail = [];
        let teamMembers = existingDeal.linkedCustomer.linkedTeam.members
        let isStagePresent = false;
        let olderStage = existingDeal?.userValues?.find(userValue => userValue?.labelName === "Select Stage")?.fieldValue

        for(let input of userValues){
            if(input.labelName === "Select Stage") isStagePresent = true
            if(input.labelName === dealNameLabel){
                entityName = input?.fieldValue
            }
        }


        if(!entityName || !isStagePresent){
            return res.status(404).json({sucess: false, message: "Deal needs `Deal Name` and `Select Stage` form label name to update"})
        }

        for(let user of teamMembers){
            if(user.role === "SALES_OWNER"){
                salesOwnerId.push(user._id);
                salesOwnerEmail.push(user.email);
            }
        }

        if(!salesOwnerId){
            return res.status(400).json({
                success: false,
                message: `Sales Owner required`
            });
        }



        for(let i = 0; i < userValues.length; i++){
            let {labelName, fieldValue} = userValues[i];
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
                    if(templateField?.isMandatory && (!templateField?.isSensitive || templateField?.writeAccessRoles.includes(currentUserRole)) && !fieldValue){
                        return res.status(400).json({
                            success: false,
                            message:`Value not present for required ${labelName} field`
                        });
                    }
                    if( templateField?.isSensitive && !templateField?.writeAccessRoles.includes(currentUserRole) && !ADMIN_ROLES.includes(currentUserRole)){
                        return res.status(400).json({
                            success: false,
                            message: `User does not have write access for ${labelName}`
                        });
                    }
                    if(templateField.fieldType === "Date Picker"){
                        fieldValue = moment.utc(fieldValue, "DD/MM/YYYY").toDate();
                    }
                    const {success, label} = validateUserValueType(fieldValue, templateField);
                    if(!success){
                        return res.status(400).json({
                            success: false,
                            message: `Invalid value given for ${label}`
                        });
                    }else{
                        let isLabelAlreadyPresent = existingDeal.userValues.find(o => o.labelName === labelName)
                        let approvalId = null;
                        if(templateField?.needsApproval){
                            if((templateField.fieldType === "Currency" && isLabelAlreadyPresent?.fieldValue[0] !== fieldValue[0]) || 
                            (["Text Field", "Text Area", "Number"].includes(templateField.fieldType) && isLabelAlreadyPresent?.fieldValue !== fieldValue) ){
                                const approvalModelValues = {linkedFieldId: templateField._id, entityName, fieldValue, requestor: currentUserId, salesOwnerId, status: "PENDING"  }
                                const newApproval =  new ApprovalModel(approvalModelValues)
                                const validationErrors = newApproval.validateSync();
                                if(validationErrors){
                                    return res.status(400).send(validationErrors.message);
                                }
                                const savedApproval = await newApproval.save();
                                approvalId = savedApproval._id;
                                if(isLabelAlreadyPresent?.approvalFieldId){
                                    const currentApproval = await ApprovalModel.findById(isLabelAlreadyPresent.approvalFieldId)
                                    if(currentApproval?.status === "PENDING"){
                                        await ApprovalModel.findByIdAndUpdate(isLabelAlreadyPresent.approvalFieldId, {status: "NA"})
                                    }
                                }
                      
                                try{
                                    await sendApprovalNotification(approvalModelValues, salesOwnerEmail);
                                    const approvalNotif = new NotificationModel({type: "APPROVAL", description: `Approval needed for ${labelName} belonging to ${entityName}`})
                                    const savedApprovalNotif =  await approvalNotif.save();
                                    await UserModel.updateMany({_id : {$in : salesOwnerId} },{$push: {'notifications': savedApprovalNotif._id}})
                                }catch(err){
                                    logger.info(err)
                                }
                            }else{
                                approvalId = isLabelAlreadyPresent.approvalFieldId
                            }
                        }
                        if(isLabelAlreadyPresent){
                            for(let m = 0; m < existingDeal.userValues.length; m++){
                                const currObj = existingDeal.userValues[m];
                                if(currObj.labelName === labelName){
                                    existingDeal.userValues[m].fieldValue = fieldValue;
                                    if(approvalId){
                                        existingDeal.userValues[m].approvalFieldId = approvalId;
                                    }
                                }
                            }
                        }else if(!isLabelAlreadyPresent){
                            if(approvalId){
                                existingDeal.userValues.push({labelName, fieldValue, templateFieldId, approvalFieldId: approvalId});    
                            }else{
                                existingDeal.userValues.push({labelName, fieldValue, templateFieldId});
                            }
                        }
                        break;
                    }
                }
            }
        }


        if(userValues?.length > 0){
            const validationErrors = existingDeal.validateSync();
            if(validationErrors){
                return res.status(400).send(validationErrors.message);
            }
            // if(newCustomer){
            //     await CustomerModel.findByIdAndUpdate(existingDeal.linkedCustomer, {$pull: {deals: existingDeal._id}});
            //     await CustomerModel.findByIdAndUpdate(linkedCustomer, {$push: {deals: existingDeal._id}});
            //     existingDeal.linkedCustomer = newCustomer._id;
            // }         
            const updatedDeal = await DealModel.findByIdAndUpdate(dealId, existingDeal, {new: true});

            const newStage = updatedDeal.userValues.find(userValue => userValue.labelName === "Select Stage")?.fieldValue;
            // const oldStage = existingDeal.userValues.find(userValue => userValue.labelName === "Select Stage")?.fieldValue;
            if(newStage !== olderStage){
                const dealUpdatedNotif = new NotificationModel({description: `${entityName} stage has been updated from ${olderStage} to ${newStage}`, type: 'DEAL'});
                const savedNotif = await dealUpdatedNotif.save()
                await UserModel.updateMany({_id: {$in : teamData.members}},{$push: {'notifications': savedNotif._id}});
          
                const memberNoAdminList = existingDeal?.linkedCustomer?.linkedTeam?.members?.filter(member => !ADMIN_ROLES.includes(member.role)).map(member => member._id);
                const pipelineObject = {};
                pipelineObject[`pipelineSequence.${newStage}`] = updatedDeal._id;    
                const olderPipelineObject = {};
                olderPipelineObject[`pipelineSequence.${olderStage}`] = updatedDeal._id;    

                await UserModel.updateMany({_id: {$in: memberNoAdminList} },{$push: pipelineObject});
                await UserModel.updateMany({role: {$in: ADMIN_ROLES}},{$push: pipelineObject});

                await UserModel.updateMany({_id: {$in: memberNoAdminList} },{$pull: olderPipelineObject});
                await UserModel.updateMany({role: {$in: ADMIN_ROLES}},{$pull: olderPipelineObject});
            }

            return res.status(200).json({
                success: true,
                data: existingDeal,
            });
        }

        // if(newCustomer){
        //     await CustomerModel.findByIdAndUpdate(existingDeal.linkedCustomer, {$pull: {deals: existingDeal._id}});
        //     await CustomerModel.findByIdAndUpdate(linkedCustomer, {$push: {deals: existingDeal._id}});
        //     existingDeal.linkedCustomer = newCustomer._id;
        //     await DealModel.findByIdAndUpdate(dealId, existingDeal);
        //     return res.status(200).json({
        //         success: true,
        //         data: existingDeal,
        //     });
        // }

       

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 1);
  }
  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 2);
  }


  const getAllDealsController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {customerIdList, teamIdList, dateFrom, dateTo, quarter, quarterYear, searchInput,  page : paramsPage, limit: paramsLimit} = req.query;
        let adminQuery = {isDeleted: false}
        let teamQuery = {members: currentUserId, isDeleted: false };
        const page = parseInt(paramsPage) - 1;
        const limit = parseInt(paramsLimit);
        const skipCount = page && limit ? page * limit : 0;
        const search = searchInput?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || "";
        const estimatedCloseLabel = "Estimated Deal Completion Date";
        let quarterFrom = "";
        let quarterTo = "";

        if(quarter && quarterYear){
            if(quarter === "Q4"){
                quarterFrom = getFirstDayOfMonth(quarterYear, 9);
                quarterTo = getLastDayOfMonth(quarterYear, 11)
                //oct to dec
            }else if(quarter === "Q3"){
                //jul to sept
                quarterFrom = getFirstDayOfMonth(quarterYear, 6);
                quarterTo = getLastDayOfMonth(quarterYear, 8)
            }else if(quarter === "Q2"){
                //apr to jun
                quarterFrom = getFirstDayOfMonth(quarterYear, 3);
                quarterTo = getLastDayOfMonth(quarterYear, 5)

            }else if(quarter === "Q1"){
                //jan mar
                quarterFrom = getFirstDayOfMonth(quarterYear, 0);
                quarterTo = getLastDayOfMonth(quarterYear, 2)

            }
        }


        let generatedCustomerIdList = []

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
            // teamQuery._id = {$in : teamInputIdList}
        }

        if(customerIdList && customerIdList?.split(",")?.length > 0){
            const cleanedList = customerIdList?.split(",")?.map(item => item.replace(/['"]+/g, ''))
            generatedCustomerIdList = [...generatedCustomerIdList, ...cleanedList];
        }

        let uniqueCustomerIdList = [...new Set(generatedCustomerIdList)].map(item => mongoose.Types.ObjectId(item));
        const filteredCustomers = await CustomerModel.find({_id: {$in : uniqueCustomerIdList}})
        let filteredDealIds = []
        for(let customer of filteredCustomers){
            for(let deal of customer.deals){
                filteredDealIds.push(deal);
            }
        }

        if((customerIdList && customerIdList?.split(",")?.length > 0) || (teamIdList && teamIdList?.split(",")?.length > 0)){
            adminQuery._id = {$in : filteredDealIds}
        }

        if(dateFrom){
            adminQuery.cts = {
                ...adminQuery.cts,
                $gte :  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
            }
        }
        if(dateTo){
            adminQuery.cts = {
                ...adminQuery.cts,
                $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()
            }
        }

        if(quarter && quarterYear){
            adminQuery.userValues = {
                $elemMatch: {
                  labelName: estimatedCloseLabel,
                  fieldValue: {
                    $gte :  moment.utc(quarterFrom, 'DD/MM/YYYY').startOf('day').toDate(),
                    $lte :  moment.utc(quarterTo, 'DD/MM/YYYY').endOf('day').toDate()
                  }, 
                },
            }
        }

const dealsQuery = { isDeleted: false }
        if(search){
            adminQuery.userValues = {
                $elemMatch: {
                  labelName: "Deal Name",
                  fieldValue: { $regex: search, $options: "i" }, // Case-insensitive regex search
                },
            }
            dealsQuery.userValues = {
                $elemMatch: {
                  labelName: "Deal Name",
                  fieldValue: { $regex: search, $options: "i" }, // Case-insensitive regex search
                },
            }
        }



        if(ADMIN_ROLES.includes(currentUserRole)){
            const totalCount = await DealModel.countDocuments(adminQuery)
            const allDeals = paramsLimit && paramsPage?
             await DealModel.find(adminQuery).skip(skipCount).limit(limit)
            .populate({path:'userValues.templateFieldId', match: {isDeleted: false}})
            .populate({
                path: 'linkedCustomer',
                model: CustomerModel,
                populate: [
                    { path: 'contacts', model: ContactModel },
                    {
                    path: 'linkedTeam',
                    model: TeamModel,
                    populate: {
                        path: 'members',
                        model: UserModel,
                        select: 'firstName lastName role profilePicture'
                    }
                    }
                ]
            }) :    await DealModel.find(adminQuery)
            .populate({path:'userValues.templateFieldId', match: {isDeleted: false}})
            .populate({
                path: 'linkedCustomer',
                model: CustomerModel,
                populate: [
                    { path: 'contacts', model: ContactModel },
                    {
                    path: 'linkedTeam',
                    model: TeamModel,
                    populate: {
                        path: 'members',
                        model: UserModel,
                        select: 'firstName lastName role profilePicture'
                    }
                    }
                ]
            })

            return res.status(200).json({
                success: true,
                data: allDeals,
                totalCount,
            });
        }

        //filtering only by filtered deal ids

      const teamsData = await TeamModel.find(teamQuery)
      .populate({path: 'members', model: UserModel, select: 'firstName lastName role'})
      .populate({path: 'customers', model: CustomerModel, match: { isDeleted: false }, 
      populate: {path: 'deals', match: dealsQuery, model: DealModel,
      populate: {path:'userValues.templateFieldId', match: {isDeleted: false}, model: FormFieldsModel} }})

      let allDealsData = [];

      for(let i = 0; i < teamsData.length; i++){
        const teamData = teamsData[i];
        const teamCustomers = teamData.customers;

        for(let j = 0; j < teamCustomers.length; j++){
            //check the below line logic later
            // if( customerIdList && customerIdList?.split(",")?.length > 0 && !customerIdList?.split(",")?.map(item => item.replace(/['"]+/g, ''))?.includes(teamCustomers[j]._id.toString())){
            //     continue;
            // }
            const customerDeals = teamCustomers[j].deals;
            if(!ADMIN_ROLES.includes(currentUserRole)){
                for(let k = 0; k < customerDeals.length; k++){
                    let filteredDealsData = []
                    if((customerIdList?.length > 0 || teamIdList?.length > 0) && !filteredDealIds?.map(item => item.toString()).includes(customerDeals[k]._id.toString())){
                        continue;
                    }
                    if(dateFrom && dateTo){
                        const deal = customerDeals[k];
                        if(
                           ( moment.utc(deal.cts).startOf('day').valueOf() < 
                            moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').valueOf()) ||
                            (moment.utc(deal.cts).startOf('day').valueOf() > 
                            moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').valueOf())
                          ){
                            continue;
                        }
                    }
                    else if(dateFrom){
                        const deal = customerDeals[k];
                        if(moment.utc(deal.cts).startOf('day').valueOf() <  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').valueOf()){
                            continue;
                        }
                    }
                    else if(dateTo){
                        const deal = customerDeals[k];
                        if(moment.utc(deal.cts).startOf('day').valueOf() >  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').valueOf()){
                            continue;
                        }
                    }
                    if(quarter && quarterYear){
                        const deal = customerDeals[k];
   
                        if(
                           ( moment.utc(deal.userValues.find(userValue => userValue.labelName === estimatedCloseLabel)?.fieldValue).startOf('day').valueOf() < 
                            moment.utc(quarterFrom, 'DD/MM/YYYY').startOf('day').valueOf()) ||
                            (moment.utc(deal.userValues.find(userValue => userValue.labelName === estimatedCloseLabel)?.fieldValue).startOf('day').valueOf() > 
                            moment.utc(quarterTo, 'DD/MM/YYYY').endOf('day').valueOf())
                          ){
                            continue;
                        }
                    }
                    for(let m = 0; m < customerDeals[k].userValues.length; m++){
                        const userValue = customerDeals[k].userValues[m];
                        if(userValue?.templateFieldId?.needsApproval ){
                            if(!userValue.fieldValue){
                                continue;
                            }
                            const approval = await ApprovalModel.findById(userValue?.approvalFieldId);
                            logger.info("APPROVAL LOGGER AFTER FIND :: ",JSON.stringify(approval))
                            logger.info("USERVALUE LOGGER AFTER FIND :: ",JSON.stringify(userValue))
                            if(currentUserId === approval?.requestor?.toString() || ["ADMIN", "SALES_OWNER"].includes(currentUserRole)){
                                filteredDealsData.push(userValue);
                                continue;
                            }
                            else if(approval && approval?.status === "APPROVED"){
                                if(userValue?.templateFieldId?.isSensitive){
                                    if(userValue?.templateFieldId?.isSensitive && !ADMIN_ROLES.includes(currentUserRole)){
                                        filteredDealsData.push(userValue);
                                        continue;
                                    }
                                    continue;
                                }
                                filteredDealsData.push(userValue);
                                continue;
                            }
                            continue;
                        }
                        if(userValue?.templateFieldId?.isSensitive){
                            if(userValue.templateFieldId.readAccessRoles.includes(currentUserRole)){
                                filteredDealsData.push(userValue);
                                continue;
                            }
                            continue;
                        } 
                        filteredDealsData.push(userValue);
                        continue;
                    }
                    customerDeals[k].userValues = filteredDealsData;                    
                    customerDeals[k]._doc.customerName = teamCustomers[j]?.userValues?.find(userValue => userValue.labelName === "Customer Name")?.fieldValue;
                    customerDeals[k]._doc.teamName = teamsData[i].teamName;
                    const salesOwner= teamsData[i].members?.find(member => member.role === "SALES_OWNER")
                    customerDeals[k]._doc.salesOwnerName = salesOwner.firstName + " " + salesOwner.lastName;
                    allDealsData.push(customerDeals[k]);
                }
            }
        }
      }

      const paginatedDeals = (paramsPage || paramsLimit) ?  allDealsData.slice(skipCount, skipCount + limit) : allDealsData;


      return res.status(200).json({
            success: true,
            data: paginatedDeals,
            totalCount: allDealsData?.length

      });

    }catch (err) {
        logger.info("LOOK FOR ME IN GRAFANA :: ",err)
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }


  const deleteDealController = async (req, res) => {
   try{
        const {dealId} = req.params;
        const dealData = await DealModel.findByIdAndUpdate(dealId, {isDeleted: true});
        const currentStage = dealData.userValues.find(userValue => userValue.labelName === "Select Stage")?.fieldValue;
        const pipelineObject = {};
        pipelineObject[`pipelineSequence.${currentStage}`] = dealId;  
        if(dealData?.linkedCustomer){
            await CustomerModel.findByIdAndUpdate(dealData?.linkedCustomer, {$pull: {deals: dealId}});
            const customerData = await CustomerModel.findById(dealData?.linkedCustomer).populate({path: 'linkedTeam', model: TeamModel})
            await ActivityModel.updateMany({_id: {$in: dealData.activities}}, {isDeleted: true});
            const deleteNotif = new NotificationModel({description: `${dealData?.userValues?.find(userValue => userValue?.labelName === "Deal Name")?.fieldValue} Deal has been deleted`, type: "DEAL"});
            const savedNotif = await deleteNotif.save();
            if(customerData?.linkedTeam?.members){
                await UserModel.updateMany({_id: {$in : customerData?.linkedTeam?.members}},{$push: {'notifications': savedNotif._id}});
                await UserModel.updateMany({_id: {$in : customerData?.linkedTeam?.members}},{$pull: pipelineObject});
            }
        }
        await UserModel.updateMany({role: {$in: ADMIN_ROLES}},{$pull: pipelineObject});
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

  const getDealByIdController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        const {dealId} = req.params;
        const dealData = await DealModel.findOne({_id: dealId, isDeleted: false})
        .populate({
          path: 'userValues.templateFieldId',
          match: { isDeleted: false }
        })
        .populate({
          path: 'linkedCustomer',
          model: CustomerModel,
          populate: [
            { path: 'contacts', model: ContactModel },
            {
              path: 'linkedTeam',
              model: TeamModel,
              populate: {
                path: 'members',
                model: UserModel,
                select: 'firstName lastName role profilePicture'
              }
            }
          ]
        })
        .populate({ path: 'notes', model: NotesModel })
        .populate({ path: 'activities', model: ActivityModel });
      

        if(!dealData || dealData?.isDeleted){
            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });
        }

        if(ADMIN_ROLES.includes(currentUserRole)){
            return res.status(200).json({
                success: true,
                data: dealData
            });
        }

        const customerData = await CustomerModel.findById(dealData?.linkedCustomer).populate({path: 'linkedTeam', model: TeamModel})
        const isUserInTeam = customerData?.linkedTeam?.members?.map(member => member.toString()).includes(currentUserId);
        const isAdmin = ADMIN_ROLES.includes(currentUserRole);

        if(!isUserInTeam && !isAdmin){
            return res.status(400).json({
                success: false,
                message: "User is not part of customer team"
            });
        }
        const dealUserValues = dealData.userValues;
        let filteredDealValues = [];
        if([...ADMIN_ROLES, ...TEAM_LEADS].includes(currentUserRole)){


            for(let i = 0; i < dealUserValues.length; i++){
                const currentUserValue = dealUserValues[i];
               
                if(currentUserValue?.templateFieldId?.needsApproval && currentUserValue?.fieldValue ){
                    const approval = await ApprovalModel.findById(currentUserValue?.approvalFieldId);
                    if(currentUserId === approval?.requestor?.toString() || ["ADMIN", "SALES_OWNER"].includes(currentUserRole)){
                        filteredDealValues.push(currentUserValue);
                        continue;
                    }
                    else if(approval.status === "APPROVED"){
                        if(currentUserValue?.templateFieldId?.isSensitive){
                            if(currentUserValue?.templateFieldId?.readAccessRoles?.includes(currentUserRole)){
                                filteredDealValues.push(currentUserValue);
                                continue;
                            }
                            continue;
                        }
                        filteredDealValues.push(currentUserValue);
                        continue;
                    }
                    continue;
                }
                if(currentUserValue?.templateFieldId?.isSensitive && !currentUserValue?.templateFieldId?.needsApproval){
                    if(ADMIN_ROLES.includes(currentUserRole) || currentUserValue?.templateFieldId?.readAccessRoles?.includes(currentUserRole)){
                        filteredDealValues.push(currentUserValue);
                        continue;
                    }
                    continue;
                } 
                filteredDealValues.push(currentUserValue);
            }

            // filteredDealValues = dealUserValues.filter(userField => {
            //         if(userField?.templateFieldId?.isSensitive && !userField?.templateFieldId?.needsApproval && !ADMIN_ROLES.includes(currentUserRole)){
            //         return userField?.templateFieldId?.readAccessRoles?.includes(currentUserRole);
            //     } 
            //     return true;
            // });
        }else{

            for(let i = 0; i < dealUserValues.length; i++){
                const userValue = dealUserValues[i]
                if(userValue?.templateFieldId?.needsApproval ){
                    if(!userValue?.fieldValue){
                        continue;
                    }
                    const approval = await ApprovalModel.findById(userValue?.approvalFieldId);
                    if(approval.status === "APPROVED"){
                        if(userValue?.templateFieldId?.isSensitive){
                            if(userValue?.templateFieldId?.readAccessRoles?.includes(currentUserRole)){
                                filteredDealValues.push(userValue);
                                continue;
                            }
                            continue;
                        }
                        filteredDealValues.push(userValue);
                        continue;
                    }
                    continue;
                }
                if(userValue?.templateFieldId?.isSensitive){
                    if(userValue.templateFieldId.readAccessRoles.includes(currentUserRole)){
                        filteredDealValues.push(userValue);
                        continue;
                    }
                    continue;
                } 
                filteredDealValues.push(userValue);
                continue;
            }
        }
       
        dealData.userValues = filteredDealValues;

        return res.status(200).json({
            success: true,
            data: dealData
        });
    

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }


  module.exports = {createDealController, updateDealController, getAllDealsController, deleteDealController, getDealByIdController}
