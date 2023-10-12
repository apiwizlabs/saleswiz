
const jwt = require("jsonwebtoken");
const UserModel = require('../Models/Users.model');
const config = require("../config");
const {ADMIN_ROLES} = require("../helpers/roleGroups");

const isAuthenticated = async (req, res, next) => {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET, function (err, decoded){
        if(err){
          console.log(err)
        }
        return decoded;
      });  
      const isUserExists = await UserModel.findById(decoded.userId);
      if (ADMIN_ROLES.includes(isUserExists?.role) || (!isUserExists?.isLocked && !isUserExists?.isDeleted )) {
        res.locals.decodedToken = decoded;
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: "Error in authenticating"
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
  
  module.exports = {isAuthenticated}