const config = require("../config");
const UserModel = require('../Models/Users.model');
const TeamModel = require('../Models/Teams.model');
const jwt = require("jsonwebtoken");
const {deleteFile} = require("./AwsFileManagement.controller");
const {ADMIN_ROLES, STANDARD_ROLES, SALES_OWNER} = require("../helpers/roleGroups");

const getAllUsersController = async (req, res) => {
    try{
        const currentUserRole = res.locals.decodedToken.role;
        if(currentUserRole === "ADMIN"){
            const users = await UserModel.find({isDeleted: false},{password: 0});
            return res.status(200).json({
                success: true,
                data: {users},
            });

        }else if(currentUserRole === "SALES_OWNER"){
            const users = await UserModel.find({isDeleted: false},{password: 0, teamDetails: 0});
            return res.status(200).json({
                success: true,
                data: {users},
            });

        }else{
            const users = await UserModel.find({isDeleted: false},{password: 0, teamDetails: 0});
            return res.status(200).json({
                success: true,
                data: {users},
            });
        }
        // }else{
        //     return res.status(400).json({
        //         message: "Invalid User Role Type"
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

  const updateUserController = async (req, res) => {
    try{
        let currentUserRole = res.locals.decodedToken.role;
        let currentUserId = res.locals.decodedToken.userId;
        const {userId} = req.params
        currentUserRole = "ADMIN";
        const {isLocked, isDeleted, mobile, firstName, lastName, role, teamDetails, profilePicture} = req.body;

        if(ADMIN_ROLES.includes(currentUserRole)){
            let newUserDetails = {isLocked, isDeleted, firstName, lastName, role, teamDetails, mobile, profilePicture}
            if(isDeleted || isLocked){
                const userToBeDeleted = await UserModel.findById(userId)
                if (userToBeDeleted.role === "ADMIN" ){
                  const validAdminUsers = await UserModel.find({role: "ADMIN", isLocked: false, isDeleted: false})
                  if(validAdminUsers.length < 2){
                    return res.status(400).json({
                        message: "Need atleast one valid admin user"
                    });
                  }
                }
            }
            Object.keys(newUserDetails).forEach(key => newUserDetails[key] === undefined ? delete newUserDetails[key] : {});
            const data = await UserModel.findByIdAndUpdate(userId, newUserDetails, {new: true});
            return res.status(200).json({
                success: true,
                data: data,
            });
        }else if(currentUserRole === "SALES_OWNER"){
            let newUserDetails = currentUserId === userId ? {firstName, lastName, teamDetails, mobile, profilePicture} : {firstName, lastName, teamDetails}
            Object.keys(newUserDetails).forEach(key => newUserDetails[key] === undefined ? delete newUserDetails[key] : {});
            const data = await UserModel.findByIdAndUpdate(userId, newUserDetails, {new:true});
            return res.status(200).json({
                success: true,
                data: data
            });
        }else if([...STANDARD_ROLES, "ACCOUNT_OWNER"].includes(currentUserRole)){
            if(currentUserId !== userId){
                return res.status(403).json({
                    message: "Unauthorised access to edit another user"
                });
            }
            let newUserDetails = {firstName, lastName, mobile, profilePicture}
            Object.keys(newUserDetails).forEach(key => newUserDetails[key] === undefined ? delete newUserDetails[key] : {});
            const data = await UserModel.findByIdAndUpdate(userId, newUserDetails, {new:true});
            return res.status(200).json({
                success: true,
                data: data
            });
        }
        else{
            return res.status(400).json({
                message: "Invalid User Role Type"
            });
        }
    } catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const getUserByIdController = async (req, res) => {
    try{
        const {userId} = req.params
        const user = await UserModel.findById(userId ,{password: 0});
        return res.status(200).json({
            success: true,
            data: {user},
        });     

    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const removeProfilePicture = async (req, res) => {
    try{
        let currentUserId = res.locals.decodedToken.userId;
        const user = await UserModel.findById(currentUserId ,{password: 0});
        const profilePicKey = user.profilePicture;
        await UserModel.findByIdAndUpdate(currentUserId, {profilePicture: ""})
        if(profilePicKey){
           await deleteFile(profilePicKey)
        }
        return res.status(200).json({
            success: true
        });     
    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  module.exports = {getAllUsersController, updateUserController, getUserByIdController, removeProfilePicture}