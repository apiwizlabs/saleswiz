const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {NotesModel}= require("../Models/Notes.model");
const ContactModel = require("../Models/Contacts.model");
const { CustomerModel } = require("../Models/Customers.model");
const DealModel = require('../Models/Deals.model');
const TeamModel = require("../Models/Teams.model");
const UserModel = require("../Models/Users.model");


const getNotesController = async (req, res) => {
    try{
     const currentUserRole = res.locals.decodedToken.role;
     const currentUserId = res.locals.decodedToken.userId;
         const {dealId} = req.params;

         const foundDeal =  await DealModel.findById(dealId).populate({path: "notes", populate: {path: 'createdBy', model: UserModel, select: 'firstName lastName profilePicture'}})
         .populate({path: "linkedCustomer", model: CustomerModel, populate: {path: "linkedTeam", model: TeamModel}})
         if(!foundDeal || foundDeal.isDeleted){
          return res.status(400).json({
               success: false,
               message: 'Deal is deleted or invalid'
           })
         }
         const foundTeamForDeal = foundDeal?.linkedCustomer?.linkedTeam;
         if(!ADMIN_ROLES.includes(currentUserRole) && !foundTeamForDeal?.members?.map(member => member.toString())?.includes(currentUserId)){
            return res.status(403).json({
                success: false,
                message: 'Not Admin or part of team'
           });
         }
         return res.status(200).json({
             success: true,
             data: foundDeal.notes
         })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}

const createNoteController = async (req, res) => {
    try{
          let currentUserRole = res.locals.decodedToken.role;
          let currentUserId = res.locals.decodedToken.userId;
         const {dealId} = req.params;
         const {notesContent} = req.body;
         const foundDeal = await DealModel.findById(dealId).populate({path: 'linkedCustomer', populate: {path: 'linkedTeam', model: TeamModel}});
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

         const newNote = new NotesModel({notesContent, createdBy: currentUserId, linkedDeal: dealId})
         const savedNote = await newNote.save();
         await DealModel.findByIdAndUpdate(dealId, {$push: {notes: savedNote._id}})
        
         return res.status(200).json({
             success: true,
             data: savedNote
         })
    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}


const updateNoteController = async (req, res) => {
    try{
          let currentUserRole = res.locals.decodedToken.role;
          let currentUserId = res.locals.decodedToken.userId;
         const { notesId} = req.params;
         const {notesContent} = req.body;
         const foundNote = await NotesModel.findById(notesId)
        
         if(!ADMIN_ROLES.includes(currentUserRole) || !foundNote.createdBy === currentUserId){
            return res.status(403).json({
                success: false,
                message: 'Not permitted to edit the note'
           });
         }

        await NotesModel.findByIdAndUpdate(notesId, {notesContent: notesContent}, { runValidators: true });

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


const deleteNoteController = async (req, res) => {
     try{

        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
       const { notesId} = req.params;
       const foundNote = await NotesModel.findById(notesId)
        
       if(!ADMIN_ROLES.includes(currentUserRole) || !foundNote.createdBy === currentUserId){
          return res.status(403).json({
              success: false,
              message: 'Not permitted to delete the note'
         });
       }

      const noteDetails = await NotesModel.findByIdAndUpdate(notesId, {isDeleted: true} )
      await DealModel.findByIdAndUpdate(noteDetails.linkedDeal, {$pull : {notes: notesId}})

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
  
  module.exports = {createNoteController, deleteNoteController, updateNoteController, getNotesController};