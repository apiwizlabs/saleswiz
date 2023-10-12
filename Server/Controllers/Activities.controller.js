const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const ActivityModel = require("../Models/Activities.model");
const ContactModel = require("../Models/Contacts.model");
const { CustomerModel } = require("../Models/Customers.model");
const DealModel = require('../Models/Deals.model');
const { NotificationModel } = require("../Models/Notifications.model");
const TeamModel = require("../Models/Teams.model");
const UserModel = require("../Models/Users.model");
const moment = require('moment');
const mongoose = require('mongoose');
const {isDateStringValid} = require("../helpers/utils");


const getActivitiesController = async (req, res) => {
    try{
         const {dealId, activityType} = req.params;

         const foundDeal =  await DealModel.findById(dealId)
         .populate({path: 'activities', model: ActivityModel, match: {activityType: activityType.toUpperCase(), isDeleted: false},    
          populate: [
          { path: 'assignedTo', model: UserModel, select: 'firstName lastName profilePicture' },
          { path: 'linkedCallContact', model: ContactModel },
        ], });

         if(foundDeal.isDeleted){
          return res.status(400).json({
               success: false,
               message: 'Deleted Deal'
           })
         }
         return res.status(200).json({
             success: true,
             data: foundDeal.activities
         })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}


const getMyActivitiesController = async (req, res) => {
    try{
          let currentUserRole = res.locals.decodedToken.role;
          let currentUserId = res.locals.decodedToken.userId;

          const {status, searchInput, dealIdList, assignedToList, priority, dateFrom, dateTo, page : paramsPage, limit: paramsLimit} = req.query;
          const {activityType} = req.params;
          const search = searchInput?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || "";
          const page = parseInt(paramsPage) - 1;
          const limit = parseInt(paramsLimit);
          const skipCount = paramsPage && paramsLimit ? page * limit : 0;
     
          let query = {activityType: activityType.toUpperCase(), isDeleted: false}
       
          if(currentUserRole === "SALES_OWNER"){
               const teams = await TeamModel.find({members: currentUserId, isDeleted: false})
               const membersList = teams.flatMap(team => team.members.flatMap(member => member.toString()))
               const uniqueMembersList = [...new Set(membersList)]
               query = {assignedTo: {$in: uniqueMembersList}, activityType: activityType.toUpperCase(), isDeleted:false}
          }else if(currentUserRole !== "ADMIN" && currentUserRole !== "SALES_OWNER"){
               query = {assignedTo: currentUserId, activityType: activityType.toUpperCase(), isDeleted:false}
          }

          if( assignedToList && assignedToList?.split(",")?.length > 0){
               query.assignedTo = {$in: assignedToList.split(",").map(item =>{
                    item.replace(/['"]+/g, '');
                    return mongoose.Types.ObjectId(item)
               })}
          }
          if(dealIdList && dealIdList?.split(",")?.length > 0){
               query.linkedDeal = {$in: dealIdList.split(",").map(item =>{
                    item.replace(/['"]+/g, '');
                    return mongoose.Types.ObjectId(item)
               })}
          }
          if(status && status !== "ALL" && (status !=="PENDING")){
               query.status = status
          }
          else if(status && status === "PENDING"){
               if(activityType.toUpperCase() === "TASK"){ 
                    query.taskDueDate = {
                         $lte: moment.utc(new Date(), 'DD/MM/YYYY').endOf('day').toDate()
                    }
               }else {
                    query.callStartDate = {
                         $lte: moment.utc(new Date(), 'DD/MM/YYYY').endOf('day').toDate()
                    }
               }
          }
          if(priority !== "ALL" && priority){
               query.priority = priority;
          }
          if(dateFrom){
               if(activityType?.toUpperCase() === "CALL"){
                    query.callStartDate = {
                         $gte :  moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
                    }
               }else{
                    query.taskDueDate = {
                         $gte: moment.utc(dateFrom, 'DD/MM/YYYY').startOf('day').toDate()
                    }
               }
          }
          if(dateTo){
               if(activityType?.toUpperCase() === "CALL"){
                    query.callStartDate = {
                         ...query.callStartDate,
                         $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()

                    }
               }else{
                    query.taskDueDate = {
                         ...query.taskDueDate,
                         $lte :  moment.utc(dateTo, 'DD/MM/YYYY').endOf('day').toDate()
                    }
               }
          }
          if(search){
               if(activityType?.toUpperCase === "CALL"){
                    query.callDescription = {$regex: search, $options: "i"  }
               }else{
                    query.taskName = {$regex: search, $options: "i"  }
               }
           }

           const totalCount = await ActivityModel.countDocuments(query)

          const activities = paramsPage && paramsLimit ?
           await ActivityModel.find(query)
           .skip(skipCount)
           .limit(limit)
          .populate({path: 'linkedDeal', model: DealModel, match: {isDeleted: false} })
          .populate({path: 'linkedCallContact', model: ContactModel})
          .populate({path: 'assignedTo', model: UserModel, select: 'firstName lastName profilePicture' })
          : await ActivityModel.find(query)
          .populate({path: 'linkedDeal', model: DealModel, match: {isDeleted: false} })
          .populate({path: 'linkedCallContact', model: ContactModel})
          .populate({path: 'assignedTo', model: UserModel, select: 'firstName lastName profilePicture' })
          return res.status(200).json({
                success: true,
                data: activities,
                totalCount
          })

    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}


const createActivityController = async (req, res) => {
    try{
          let currentUserRole = res.locals.decodedToken.role;
          let currentUserId = res.locals.decodedToken.userId;
         const {dealId} = req.params;
         const activityBody= req.body;
         activityBody.linkedDeal = dealId;
         activityBody.createdBy = currentUserId;
         const {linkedCallContact, activityType, linkedDeal, assignedTo} = activityBody;

         const foundDeal = await DealModel.findById(linkedDeal).populate({path: 'linkedCustomer', populate: {path: 'linkedTeam', model: TeamModel}})

         if(!foundDeal || foundDeal.isDeleted){
          return res.status(400).json({
               success: false,
               message: `Deal not found or is deleted`
          });
         }
        
         if(!ADMIN_ROLES.includes(currentUserRole) && !foundDeal?.linkedCustomer?.linkedTeam?.members.includes(currentUserId)){
          return res.status(403).json({
               success: false,
               message: `User needs to be member of associated Team or be an admin`
          });
         }

         if(!foundDeal?.linkedCustomer?.linkedTeam?.members?.map(member => member._id.toString()).includes(assignedTo)){
          return res.status(400).json({
               success: false,
               message: `Assigned To User needs to be member of the associated Team`
          });
         }

         let saveActivityBody = {...activityBody}

         if(activityType === "CALL" ){
          if(!linkedCallContact){
               return res.status(400).json({
                    success: false,
                    message: `Call Contact Needs to be added`
               });
          }
          const foundContact = await ContactModel.findById(linkedCallContact)
          if(foundContact?.isDeleted || !foundContact ){
               return res.status(400).json({
                    success: false,
                    message: `Linked Contact is invalid`
               });
          }
          if(!foundDeal.linkedCustomer.contacts.includes(linkedCallContact)){
               return res.status(400).json({
                    success: false,
                    message: `Contact not present in Deal `
               });
          }
          if(!activityBody?.callStartDate){
               return res.status(400).json({
                    success: false,
                    message: `Call Start Date is not present in activity`
               });
          }
          saveActivityBody.callStartDate = moment.utc(activityBody?.callStartDate , "DD/MM/YYYY").toDate()
         }else{
          if(!activityBody?.taskDueDate){
               return res.status(400).json({
                    success: false,
                    message: `Task Due Date is not present in activity`
               });
          }
          saveActivityBody.taskDueDate = moment.utc(activityBody?.taskDueDate , "DD/MM/YYYY").toDate()

         }

         const newActivity = new ActivityModel(saveActivityBody);
         const savedActivity = await newActivity.save();
         const createdActNotif = new NotificationModel({type: activityType?.toUpperCase(), description: `New ${activityType.toLowerCase()} has been assigned to you in ${foundDeal?.userValues?.find(userValue => userValue.labelName === "Deal Name")?.fieldValue || `[No Deal Name]`} Deal`})
         const savedNotif = await createdActNotif.save();
         await UserModel.findByIdAndUpdate(assignedTo, {$push:{"notifications": savedNotif._id}})
         await DealModel.findByIdAndUpdate(dealId, {$push: {activities: savedActivity._id}});
         return res.status(200).json({
             success: true,
             data: savedActivity,
         })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}


const updateActivityController = async (req, res) => {
    try{
          let currentUserRole = res.locals.decodedToken.role;
          let currentUserId = res.locals.decodedToken.userId;
         const { activityId} = req.params;
         const activityBody = req.body;

         const foundActivity = await ActivityModel.findById(activityId);
         const foundDeal = await DealModel.findById(foundActivity.linkedDeal).populate({path: 'linkedCustomer', populate: {path: 'linkedTeam', model: TeamModel}});

         if(!foundActivity || foundActivity.isDeleted || !foundDeal || foundDeal.isDeleted){
              return res.status(400).json({
                   success: false,
                   message: `Activity or Deal is invalid`
              });
         }

         if(!activityBody.activityType || !activityBody.linkedDeal){
          return res.status(400).json({
               success: false,
               message: `cannot edit activity type or linked deal`
          });
         }

         if(activityBody?.activityType === "CALL"){
          if(!activityBody.callDescription){
               return res.status(400).json({
                    success: false,
                    message: `Call description is required`
               });
           }
         }else if (activityBody?.activityType === "TASK"){
          if(!activityBody.taskName || !activityBody.taskDueDate){
               return res.status(400).json({
                    success: false,
                    message: `Task Name and due date is required`
               });
           }
         }else{
          return res.status(400).json({
               success: false,
               message: `Invalid activity type`
          });
         }
         if(!ADMIN_ROLES.includes(currentUserRole) && (foundActivity?.createdBy.toString() !== currentUserId.toString() && foundActivity?.assignedTo.toString() !== currentUserId.toString())){
              return res.status(403).json({
                   success: false,
                   message: `not permitted to update activity`
              });
         }


         const {activityType : currentActivityType} = foundActivity;
         const {linkedCallContact, assignedTo} = activityBody;

         if(assignedTo !== foundActivity.assignedTo.toString()){
               if(!foundDeal?.linkedCustomer?.linkedTeam?.members?.map(member => member.toString()).includes(assignedTo)){
                    return res.status(400).json({
                         success: false,
                         message: `Assigned To needs to be member of the associated Team`
                    });
               }
         }

         let saveActivityBody = {...activityBody};

         if(currentActivityType === "CALL"){
          if(linkedCallContact){
               const foundContact = await ContactModel.findById(linkedCallContact)
               if(foundContact?.isDeleted || !foundContact  ){
                    return res.status(400).json({
                         success: false,
                         message: `Linked Contact is invalid`
                    });
               }
               //uncomment later
               // if( foundDeal?.linkedCustomer && !foundDeal?.linkedCustomer?.contacts?.map(contact => contact.toString()).includes(linkedCallContact._id)){
               //      return res.status(400).json({
               //           success: false,
               //           message: `Linked Contact is not present in deal`
               //      });
               // }
          }
          if(activityBody?.callStartDate && !isDateStringValid(activityBody?.callStartDate)){
                    saveActivityBody.callStartDate = moment(activityBody?.callStartDate , "DD/MM/YYYY").toDate()
          }
          
         }else{
               if(activityBody?.taskDueDate && !isDateStringValid(activityBody?.taskDueDate)){
                    saveActivityBody.taskDueDate = moment(activityBody?.taskDueDate , "DD/MM/YYYY").toDate()
               }
         }

         const m = await ActivityModel.findByIdAndUpdate(activityId, saveActivityBody)

         let activityName = currentActivityType === "CALL" ? activityBody.callDescription : activityBody.taskName;
         const updatedActNotif = new NotificationModel({type: activityBody?.activityType?.toUpperCase() , 
         description: `${activityName } Activity Assigned to you has been ${assignedTo !== foundActivity.assignedTo ? 'reassigned and' : ""} updated in ${foundDeal?.userValues?.find(uservalue => uservalue?.labelName === "Deal Name")?.fieldValue || `[Deal Name]`} deal.`})
         const savedNotif = await updatedActNotif.save();
         await UserModel.findByIdAndUpdate(foundActivity?.assignedTo, {$push:{"notifications": savedNotif._id}});
         if(assignedTo !== foundActivity?.assignedTo){
          const updatedActNotif = new NotificationModel({type: activityBody?.activityType?.toUpperCase(), description: `${activityName} Activity has been Assigned to you in ${foundDeal?.userValues?.find(uservalue => uservalue?.labelName === "Deal Name")?.fieldValue || `[Deal Name]`} deal.`})
          const savedNotif = await updatedActNotif.save();
          await UserModel.findByIdAndUpdate(assignedTo, {$push:{"notifications": savedNotif._id}});
         }

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


const deleteActivityController = async (req, res) => {
     try{
          let currentUserRole = res.locals.decodedToken.role;
          let currentUserId = res.locals.decodedToken.userId;
          const {dealId, activityId} = req.params;

          const foundActivity = await ActivityModel.findById(activityId);
          const foundDeal = await DealModel.findById(foundActivity.linkedDeal);

          if(!foundDeal || !foundActivity){
               return res.status(400).json({
                    success: false,
                    message: `Activity or Deal is invalid`
               });
          }

          if(!ADMIN_ROLES.includes(currentUserRole) && foundActivity.createdBy !== currentUserId){
               return res.status(403).json({
                    success: false,
                    message: `not permitted to delete activity`
               });
          }
          await ActivityModel.findByIdAndUpdate(activityId, {isDeleted: true})
          await DealModel.findByIdAndUpdate(dealId, {$pull:{activities: activityId}});
          const newNotif = new NotificationModel({description: `${foundActivity.currentActivityType === "CALL" ? foundActivity.callDescription : foundActivity.taskName } Activity has been deleted from  ${foundDeal?.userValues?.find(uservalue => uservalue?.labelName === "Deal Name")?.fieldValue || `[Deal Name]`} Deal`, type: foundActivity?.toUpperCase()});
          const savedNotif = await newNotif.save()
          await UserModel.findByIdAndUpdate(foundActivity.assignedTo, {$push:{"notifications": savedNotif._id}});
          await UserModel.findByIdAndUpdate(foundActivity.createdBy, {$push:{"notifications": savedNotif._id}});
          return res.status(200).json({
              success: true,
              data: foundDeal.activities
          })
     }catch (err) {
          return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err.message,
        });
      }
}


module.exports = {createActivityController, getActivitiesController, deleteActivityController, updateActivityController, getMyActivitiesController};