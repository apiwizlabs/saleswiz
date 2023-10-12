const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {NotesModel}= require("../Models/Notes.model");
const ContactModel = require("../Models/Contacts.model");
const { CustomerModel } = require("../Models/Customers.model");
const DealModel = require('../Models/Deals.model');
const TeamModel = require("../Models/Teams.model");
const {NotificationModel} = require("../Models/Notifications.model");
const UserModel = require("../Models/Users.model");


const getNotificationsController = async (req, res) => {
    try{
         let currentUserRole = res.locals.decodedToken.role;
         let currentUserId = res.locals.decodedToken.userId;

         const userNotificationsData = await UserModel.findById(currentUserId).select('notifications firstName lastName role').populate({path: 'notifications', model: NotificationModel})

         return res.status(200).json({
             success: true,
             data: userNotificationsData
         })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}

const deleteNotificationController = async (req, res) => {
    try{
         const {notificationId} = req.params;
         let currentUserRole = res.locals.decodedToken.role;
         let currentUserId = res.locals.decodedToken.userId;

         await UserModel.findByIdAndUpdate(currentUserId, {$pull: {notifications: notificationId}});

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

const deleteAllNotifications = async (req, res) => {
    try{
         let currentUserId = res.locals.decodedToken.userId;
         await UserModel.findByIdAndUpdate(currentUserId, {'notifications': []});

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

  module.exports = {getNotificationsController, deleteAllNotifications, deleteNotificationController};