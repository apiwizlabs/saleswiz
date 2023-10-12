
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/Users.model");
const {ADMIN_ROLES, TEAM_LEADS, TEAM_MEMBERS, SALES_OWNER} = require("../helpers/roleGroups")

const isAdminUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const isUserExists = await UserModel.findById(decoded.userId);
      if(ADMIN_ROLES.includes(isUserExists?.role)){
        res.locals.decodedToken = decoded
        return next()
      }else{
          return res.status(403).json({
          success: false,
          message: "User not an admin"
        })
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };

  const isSalesOwnerOrAdminUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);  
      const isUserExists = await UserModel.findById(decoded.userId);
      if(ADMIN_ROLES.includes(isUserExists?.role) || (isUserExists?.role === SALES_OWNER && !isUserExists.isLocked && !isUserExists.isDeleted)){
        res.locals.decodedToken = decoded
        return next()
      }else{
          return res.status(403).json({
          success: false,
          message: "User not an admin or a sales owner"
        })
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };


const isLeadOrAdminUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);  
      const isUserExists = await UserModel.findById(decoded.userId);
      if(ADMIN_ROLES.includes(isUserExists?.role) || (TEAM_LEADS.includes(isUserExists?.role) && !isUserExists.isLocked && !isUserExists.isDeleted)){
        res.locals.decodedToken = decoded
        return next()
      }else{
          return res.status(403).json({
          success: false,
          message: "User not an admin or a sales owner"
        })
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };

  const isStandardUser = async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Unauthorized message! Token missing",
          });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);  
      const isUserExists = await UserModel.findById(decoded.userId);
      if(ADMIN_ROLES.includes(isUserExists?.role) || (TEAM_MEMBERS.includes(isUserExists?.role) && !isUserExists.isLocked && !isUserExists.isDeleted)){
        res.locals.decodedToken = decoded
        return next()
      }else{
          return res.status(403).json({
          success: false,
          message: "User not an admin or a sales owner"
        })
      }
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access! token error",
        errorMessage: err.message,
      });
    }
  };


  module.exports = {isAdminUser, isLeadOrAdminUser, isStandardUser, isSalesOwnerOrAdminUser}