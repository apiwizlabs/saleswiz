const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {NotesModel}= require("../Models/Notes.model");
const ContactModel = require("../Models/Contacts.model");
const { CustomerModel } = require("../Models/Customers.model");
const DealModel = require('../Models/Deals.model');
const TeamModel = require("../Models/Teams.model");
const TimelineModel = require("../Models/Timeline.model");


const getTimelineData = async (req, res) => {
    try{
         const {dealId} = req.params;

         const foundDeal =  await DealModel.findById(dealId).populate({path: "notes"}).populate({path: 'linkedCustomer', populate: {path: 'linkedTeam', model: TeamModel}});
         if(!foundDeal || foundDeal.isDeleted){
          return res.status(400).json({
               success: false,
               message: 'Deal is deleted or invalid'
           })
         }
         if(!ADMIN_ROLES.includes(currentUserRole) && !foundDeal?.linkedCustomer?.linkedTeam?.members?.map(member => member.toString()).includes(currentUserId)){
            return res.status(403).json({
                success: false,
                message: 'Not Admin or part of team'
           });
         }

         const timelineData = await TimelineModel.find({linkedDeal: dealId})

         return res.status(200).json({
             success: true,
             data: timelineData
         })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}

  
  module.exports = {getTimelineData};