const config = require("../config");
const UserModel = require('../Models/Users.model');
const TeamModel = require('../Models/Teams.model');
const DealModel = require('../Models/Deals.model');
const {ADMIN_ROLES, SALES_OWNER} = require('../helpers/roleGroups');
const {filterOutUndefinedValues} = require("../helpers/utils");
const { CustomerModel } = require("../Models/Customers.model");
const {NotificationModel} = require("../Models/Notifications.model");
const mongoose = require("mongoose");


const createTeamController = async (req, res) => {
    try{
        const {members, teamName} = req.body;
        if(members.length < 2){
            return res.status(400).json({
                message: "Number of team members need to be more than two"
            });
        }
        const findOwners = await UserModel.find({role: "SALES_OWNER", isLocked: false, isDeleted: false}).select('_id');
        const teamSalesOwner = members.filter(member => findOwners._id === member._id);
        const isSalesOwnerPresent = teamSalesOwner.length > 0;
        if(!isSalesOwnerPresent){
            return res.status(400).json({
                message: "Atleast one valid sales owner needs to present"
            });
        }
        const sameNameDocs = await TeamModel.countDocuments({teamName: teamName});
        if(sameNameDocs > 0){
            return res.status(400).json({
                message: "Team with the same Name already exists."
            });
        }

        const newTeam = {members, teamName};
        const teamToAdd = new TeamModel(newTeam);
        await teamToAdd.save(); 
       const teamCreationNotif = new NotificationModel({type: "TEAM", description: `you've been added as a team member to ${teamName}`})
       const newNotif = await teamCreationNotif.save()
       await UserModel.updateMany({_id: {$in: members}},{$push: {'notifications': newNotif._id}})

        return res.status(200).json({
            success:true
        });
    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteTeamController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        const currentUserId = res.locals.decodedToken.userId;

        const {teamId} = req.params;
        const teamToBeUpdated = await TeamModel.findById(teamId).populate({path: 'members', model: UserModel, select: "role"}).populate({path: "customers", model: CustomerModel, populate: {path: 'deals', model: DealModel}});
        const memberNoAdminInList = teamToBeUpdated.members.filter(member => !ADMIN_ROLES.includes(member.role)).map(member => member._id.toString());
        let dealList =[]
        
        for(let customer of teamToBeUpdated.customers){
            if(customer.deals.length > 0){
                for(deal of customer.deals){
                    dealList.push({id: deal._id, stage: deal.userValues.find(userValue => userValue.labelName === 'Select Stage').fieldValue})
                }
            }
        }

        const updateOperations = memberNoAdminInList.map(userId => ({
            updateOne: {
              filter: { _id: mongoose.Types.ObjectId(userId) },
              update: {
                $pull: {},
              },
            },
          }));
          
          for (const updateOperation of updateOperations) {
            for (const deal of dealList) {
              updateOperation.updateOne.update.$pull[`pipelineSequence.${deal.stage}`] = { $in: deal.id };
            }
          }
        await UserModel.bulkWrite(updateOperations);
        // await UserModel.updateMany({_id: {$in: memberNoAdminInList}}, {});


        if(ADMIN_ROLES.includes(currentUserRole)){
            const teamDoc = await TeamModel.findByIdAndUpdate(teamId, {isDeleted: true});
            const teamDelNotif = new NotificationModel({type: "TEAM", description: `${teamDoc.teamName} has been deleted`})
            const savedNotif = await teamDelNotif.save();
            await UserModel.updateMany({_id: {$in : teamDoc.members}},{$push: {'notifications': savedNotif._id}});
            await CustomerModel.updateMany({_id: {$in: teamDoc.customers}},{linkedTeam: null});

            return res.status(200).json({
                success: true,
                message: "All associated customers are unassigned to any team"
            });
        }
        if(teamToBeUpdated.members.includes(currentUserId)){
            teamToBeUpdated.isDeleted = true;
            teamToBeUpdated.save();
            const teamDelNotif = new NotificationModel({type: "TEAM", description: `${teamToBeUpdated.teamName} has been deleted`})
            const savedNotif = await teamDelNotif.save();
            await UserModel.updateMany({_id: {$in : teamToBeUpdated.members}},{$push: {'notifications': savedNotif._id}});
            return res.status(200).json({
                success: true,
            });
        }else{
            return res.status(403).json({
                success: false,
                message: "Only the teams Sales Owners are permitted to delete a team"
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

  const updateTeamController = async (req, res) => {
    try{
        //send whole members list incase there are any changes to it;
        const currentUserRole = res.locals.decodedToken.role;
        const currentUserId = res.locals.decodedToken.userId;
        const {teamId} = req.params
        // currentUserRole = "ADMIN";
        const {members} = req.body;
        const teamToBeUpdated = await TeamModel.findById(teamId).populate({path: 'customers', model: CustomerModel, populate: {path: 'deals', model: DealModel}});

        // let updatedTeamDetails = {members, customers, teamName}
        // const cleanedTeamDetails = filterOutUndefinedValues(updatedTeamDetails);

        // if(cleanedTeamDetails.teamName === teamToBeUpdated.teamName){
        //     return res.status(400).json({
        //         message: `Team Name cannot be the same as previous`
        //     });
        // }

        const addedMembers = [];
        const removedMembers = [];

        if(members){
            if(members?.length < 2){
                return res.status(400).json({
                    message: "More than one member needs to be present"
                });
            }
            const findOwners = await UserModel.find({role: "SALES_OWNER", isLocked: false, isDeleted: false}).select('_id');
            const teamSalesOwner = members?.filter(member => findOwners._id === member._id);
            const isSalesOwnerPresent = teamSalesOwner.length > 0;
            if(!isSalesOwnerPresent){
                return res.status(400).json({
                    message: "Atleast one valid sales owner needs to present"
                });
            }
          
            const oldTeamMembers = teamToBeUpdated?.members;
            const newTeamMembers = members;
            // Check for added items
            newTeamMembers.forEach((item) => {
                if (!oldTeamMembers.includes(item)) {
                    addedMembers.push(item);
                }
            });

            // Check for removed items
            oldTeamMembers.forEach((item) => {
                if (!newTeamMembers.includes(item.toString())) {
                    removedMembers.push(item.toString());
                }
            });
        }

        if(currentUserRole === "SALES_OWNER" && !teamToBeUpdated.members.includes(currentUserId)){
            return res.status(400).json({
                success: false,
                message: "Team can be updated only by the admin or the salesowner of the team"
            });
        }
        let dealList = [];
        for (let customer of teamToBeUpdated.customers){
            for(let deal of customer.deals){
                dealList.push({
                    dealId: deal._id, 
                    stage: deal?.userValues?.find(userValue => userValue.labelName === "Select Stage")?.fieldValue
                })
            }
        }
        if(addedMembers.length > 0){

            const updateOperations = addedMembers.map(userId => ({
                updateOne: {
                  filter: { _id: mongoose.Types.ObjectId(userId) },
                  update: {
                    $set: {},
                  },
                  upsert: true,
                },
              }));


              for (const updateOperation of updateOperations) {
                for (const deal of dealList) {
                  const pipelineSequenceField = `pipelineSequence.${deal.stage}`;
                //   const updateField = `$addToSet.${pipelineSequenceField}`;
                  if (!updateOperation.updateOne.update.$set.hasOwnProperty(pipelineSequenceField)) {
                    updateOperation.updateOne.update.$set[pipelineSequenceField] = [];
                  }
                  updateOperation.updateOne.update.$set[pipelineSequenceField].push(deal.dealId);
                }
              }
              
              updateOperations.map(updateOperation => {
                return updateOperation;
              })
              await UserModel.bulkWrite(updateOperations);
            
            const addedMemberNotif = new NotificationModel({description: `You've been added to ${teamToBeUpdated?.teamName} Team`, type: "TEAM"}) 
            const savedNotif = await addedMemberNotif.save()
            await UserModel.updateMany({_id: {$in: addedMembers}},{$push: {'notifications': savedNotif._id}});

        }
        if(removedMembers?.length > 0){
         

            const updateOperations = removedMembers.map(userId => ({
                updateOne: {
                  filter: { _id: mongoose.Types.ObjectId(userId) },
                  update: {
                    $pull: {},
                  },
                },
              }));

              for (const updateOperation of updateOperations) {
                for (const deal of dealList) {
                  updateOperation.updateOne.update.$pull[`pipelineSequence.${deal.stage}`] = { $in: deal.dealId };
                }
              }
              
              await UserModel.bulkWrite(updateOperations);


            const removedMemberNotif = new NotificationModel({description: `You've been removed from ${teamToBeUpdated?.teamName} Team`, type: "TEAM"}) 
            const savedNotif = await removedMemberNotif.save()
            await UserModel.updateMany({_id: {$in: removedMembers}},{$push: {'notifications': savedNotif._id}});
        }
        //following executes if team name changes
        // if(teamToBeUpdated?.teamName !== teamName){
        //     const updatedNameNotif = new NotificationModel({description: `Team Name changed from ${teamToBeUpdated?.teamName} to ${teamName}`, type: "TEAM"});
        //     await UserModel.updateMany({_id: {$in: teamToBeUpdated.members}},{$push: {'notifications': updatedNameNotif._id}});
        // }
        await TeamModel.findByIdAndUpdate(teamId, {members});

        return res.status(200).json({
            success:true
        });

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getTeamsController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;

        if(ADMIN_ROLES.includes(currentUserRole)){
            const allTeams = await TeamModel.find({isDeleted: false}).populate({path: 'customers', model: CustomerModel}).populate({path: 'members', model: UserModel, select: 'firstName lastName profilePicture'});
            return res.status(200).json({
                success: true,
                data: allTeams
            });
        } else{
            const teamsUserPresentIn = await TeamModel.find({members: currentUserId, isDeleted: false})
            .populate({path: 'customers', model: CustomerModel})
            .populate({path: 'members', model: UserModel, select: 'firstName lastName profilePicture'});

            return res.status(200).json({
                success: true,
                data: teamsUserPresentIn
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

  const getTeamByIdController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {teamId} = req.params;
        logger.info("CURRENT USER ID IN GET TEAM :: ",currentUserId)
        const foundTeam = await TeamModel.findById(teamId).populate({path: 'members', model: UserModel, select: 'firstName lastName role'}).populate({path: 'customers', model: CustomerModel})
        const relatedCustomers = await CustomerModel.find({linkedTeam: teamId})
        logger.info("FOUND TEAM DATA MEMBERS",foundTeam.members)

        if(ADMIN_ROLES.includes(currentUserRole)){
            return res.status(200).json({
                success: true,
                relatedCustomers,
                data: foundTeam
            });
        }else{
            const membersId = foundTeam.members.map(member => member._id.toString());
            if(membersId.includes(currentUserId)){
                return res.status(200).json({
                    data: foundTeam,
                    relatedCustomers,
                    success: true,
                });
            }else{
                return res.status(400).json({
                    success: false,
                    message: "Team can only be viewed by team members"
                });
            }
        }

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  module.exports = {createTeamController, updateTeamController, getTeamsController, deleteTeamController, getTeamByIdController}