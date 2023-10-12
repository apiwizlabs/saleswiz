const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const DealModel = require("../Models/Deals.model");
const UserModel = require("../Models/Users.model");
const {AttachmentModel }= require("../Models/Attachments.model")
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {uploadFile, deleteFile, uploadFileToPublicBucket, deleteFileFromPublicBucket} = require("./AwsFileManagement.controller");
const TeamModel = require("../Models/Teams.model");
const { CustomerModel } = require("../Models/Customers.model");
const cummulativeFilesSizeLimit = 30000000; 
//30 MB aggregated fie size limit

const uploadDealAttachment = async (req, res) => {
    try {
      logger.info("THE FILE SENT FROM CLIENT :: ",req.file)
      let currentUserId = res.locals.decodedToken.userId;
      let currentUserRole = res.locals.decodedToken.role;
      const {dealId} = req.params;
      const dealData = await DealModel.findById(dealId).populate({path: "linkedCustomer", populate: {path: "linkedTeam"}}).populate({path: 'attachments', model: AttachmentModel});
      if(!ADMIN_ROLES.includes(currentUserRole) && !dealData.linkedCustomer.linkedTeam.members.includes(currentUserId)){
        return res.status(403).json({
          success: false,
          message: `User needs to be member of associated Team or be an admin`
     });
      }
      const currentFileSize = req.file.size;
      const fileName = req.file.filename;
      let occupiedStorage = 0;
      if(dealData.attachments.length > 0){
        for(let i = 0; i < dealData.attachments.length; i++){
          const currentAttachment = dealData.attachments[i];
          occupiedStorage += currentAttachment.fileSize;
        }
      }
      if(currentFileSize + occupiedStorage > cummulativeFilesSizeLimit){
        return res.status(400).json({
          success: false,
          message: `File has exceeded storage allocated for each deal by ${((currentFileSize + occupiedStorage) - cummulativeFilesSizeLimit)/1000000}MB`
        });
      }
      const result = await uploadFile(req.file);
      logger.info("AWS UPLOAD RESULT :: ",result);
      // Deleting from local if uploaded in S3 bucket
      await unlinkFile(req.file.path);
      const newAttachment = new AttachmentModel({fileKey: result.Key, fileSize: currentFileSize, uploadedBy: currentUserId,  
        attachmentType: "FILE", fileName: fileName})
      const savedAttachment = await newAttachment.save()
      await DealModel.findByIdAndUpdate(dealId,  {$push:{"attachments": savedAttachment._id}})
      return res.status(200).json({
        success: true,
        message: "File attached successfully",
        data: {
            url: result.Location,
            key: result.Key
        },
      });
    } catch (err) {
      logger.info("FILLE upload errorr :: ",err);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }


const uploadProfilePicture = async (req, res) => {

    try {
      let currentUserId = res.locals.decodedToken.userId; 
      const result = await uploadFileToPublicBucket(req.file);
      // Deleting from local if uploaded in S3 bucket
      await unlinkFile(req.file.path);
      await UserModel.findByIdAndUpdate(currentUserId, {profilePicture: {url: result.Location , profileKey: result.Key}})
      return res.status(200).json({
        success: true,
        message: "Profile Picture ATtached Successfully",
        imgUrl: result.Location
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

const deleteProfilePicture = async (req, res) => {
    try {
      let currentUserId = res.locals.decodedToken.userId;      
      const userData = await UserModel.findById(currentUserId)
      const deleteKey = userData.profilePicture.profileKey
      const result = await deleteFileFromPublicBucket(deleteKey);
      userData.profilePicture.url = "";
      userData.profilePicture.profileKey = "";
      await userData.save()

      return res.status(200).json({
        message: "Profile Picture Removed Successfully",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

const getFilesData = async (req, res) => {
    try {
      let currentUserId = res.locals.decodedToken.userId;      
      let currentUserRole = res.locals.decodedToken.role;      
      const {dealId} = req.params;
      const dealData = await DealModel.findById(dealId).populate({path: 'attachments', model: AttachmentModel, populate: {path: 'uploadedBy', model: UserModel, select: 'firstName lastName role'}});
      const customerData = await CustomerModel.findById(dealData?.linkedCustomer).populate({path: 'linkedTeam', model: TeamModel})
      const isUserInTeam = customerData.linkedTeam.members.map(member => member.toString()).includes(currentUserId);

      if(!isUserInTeam && !ADMIN_ROLES.includes(currentUserRole)){
          return res.status(403).json({
              success: false,
              message: "User is not part of deal team"
          });
      }
      return res.status(200).json({
        data: dealData
      })

    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const uploadDealLink = async (req, res) => {
    try {

      let currentUserId = res.locals.decodedToken.userId;
      let currentUserRole = res.locals.decodedToken.role;
      const {dealId} = req.params;
      const {fileUrl, fileName} = req.body;
      const dealData = await DealModel.findById(dealId).populate({path: "linkedCustomer", populate: {path: "linkedTeam"}});
      if(!ADMIN_ROLES.includes(currentUserRole) && !dealData.linkedCustomer.linkedTeam.members.includes(currentUserId)){
        return res.status(403).json({
          success: false,
          message: `User needs to be member of associated Team or be an admin`
     });
      }
      if(!fileName){
        return res.status(400).json({
          success: false,
          message: `Link Name is Required`
        });
      }

      const newAttachment = new AttachmentModel({fileUrl, fileName, uploadedBy: currentUserId,  attachmentType: "LINK"})

      const savedAttachment = await newAttachment.save()
      // dealData.attachments.push(newAttachment);
      // const savedDealData = await dealData.save();
      const m = await DealModel.findByIdAndUpdate(dealId,  {$push:{"attachments": savedAttachment._id}})
      return res.status(200).json({
        success: true,
        message: "File attached successfully"
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const deleteDealAttachment = async (req, res) => {
    try {

      let currentUserId = res.locals.decodedToken.userId;
      let currentUserRole = res.locals.decodedToken.role;
      const {dealId, attachmentId} = req.params;

      const dealData = await DealModel.findById(dealId).populate({path: "linkedCustomer", populate: {path: "linkedTeam"}});
      if(!ADMIN_ROLES.includes(currentUserRole) && !dealData.linkedCustomer.linkedTeam.members.includes(currentUserId)){
        return res.status(403).json({
          success: false,
          message: `User needs to be member of associated Team or be an admin`
        });
      }

       const index = dealData.attachments.indexOf(attachmentId)
       if(index < 0){
        return res.status(400).json({
          success: false,
          message: "Attachment Link not found"
        })
      }

      // let attachmentType = "";
      // let fileKey = "";
      const {fileKey, attachmentType} =await AttachmentModel.findById(attachmentId)
      await DealModel.findByIdAndUpdate(dealId,{$pull:{"attachments": attachmentId}} )

      // const filteredAttachments = dealData.attachments.filter(attachment => {
      //   if(attachment._id !== attachmentId) return true
      //   attachmentType = attachment.attachmentType;
      //   fileKey = attachment.fileKey;
      //   return false;
      // })
      // dealData.attachments = filteredAttachments;
      // await dealData.save();

      if(attachmentType === "LINK"){
        return res.status(200).json({
          success: true
        })
      }


      else if(attachmentType === "FILE"){
        const result = await deleteFile(fileKey);
        return res.status(200).json({
          success: true,
          data: result
        })
      }

    
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  module.exports = {uploadDealAttachment, uploadDealLink, deleteDealAttachment, uploadProfilePicture, getFilesData, deleteProfilePicture}