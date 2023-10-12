const config = require("../config.js")
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const DealModel = require("../Models/Deals.model")
const {AttachmentModel }= require("../Models/Attachments.model");
const UserModel = require("../Models/Users.model.js");
const {ADMIN_ROLES} = require("../helpers/roleGroups.js");

const bucketName = config.AWS_BUCKET_NAME;
const publicBucketName = config.PUBLIC_AWS_BUCKET_NAME;
const region = config.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESSKEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const publicSecretAccessKey = process.env.PUBLIC_AWS_SECRET_KEY;
const publicAccessKeyId = process.env.PUBLIC_AWS_ACCESS_KEY;


const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const publicS3 = new S3({
  region,
  accessKeyId: publicAccessKeyId,
  secretAccessKey: publicSecretAccessKey,
});

const uploadFile = (file) => {
    const filestream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName,
        Body: filestream,
        Key: file.filename
    }


    return s3.upload(uploadParams).promise()
}

const uploadFileToPublicBucket = (file) => {
    const filestream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: publicBucketName,
        Body: filestream,
        Key: file.filename
    }

    return publicS3.upload(uploadParams).promise()
}

const deleteFile = (fileKey) => {

    const deleteParams = {
        Bucket: bucketName,
        Key: fileKey,
    }

     return s3.deleteObject(deleteParams).promise()
}

const deleteFileFromPublicBucket = (fileKey) => {

    const deleteParams = {
        Bucket: publicBucketName,
        Key: fileKey,
    }

     return publicS3.deleteObject(deleteParams).promise()
}


const optimisedDownloadAttachment = async (req, res) => {
    try {
      const {fileKey, dealId} = req.params;
      let currentUserId = res.locals.decodedToken.userId;
      let currentUserRole = res.locals.decodedToken.role;
      
      const dealData = await DealModel.findById(dealId).populate({path: "linkedCustomer", populate: {path: "linkedTeam"}});
      if(!ADMIN_ROLES.includes(currentUserRole) && !dealData.linkedCustomer.linkedTeam.members.includes(currentUserId)){
        return res.status(403).json({
          success: false,
          message: `User needs to be member of associated Team or be an admin`
        });
      }
  
      const downloadParams = {
        Key: fileKey,
        Bucket: bucketName,
      };
  
      const fileStream = s3.getObject(downloadParams).createReadStream();
  
      res.attachment(fileKey);
  
      fileStream.pipe(res);
  
      fileStream.on('error', (err) => {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Error in downloading file"
        });
      });
  
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  };

const getProfilePicture = async (req, res) => {
  const {userId} = req.params;
  const userData = await UserModel.findById(userId)
  if(!userData.profilePicture){
    return res.status(400).json({
      success: false,
      message: "User does Not Have a profile picture"
    });
  }
  const params = {
    Bucket: bucketName,
    Key: userData.profilePicture,
  };

  const headObjectResponse = await s3.headObject(params).promise();
  const mimeType = headObjectResponse.ContentType;
  
  const getObjectResponse = await s3.getObject(params).promise();
  const imageData = getObjectResponse.Body.toString('base64');

  return {
    mimeType,
    imageData,
  };
}

module.exports = { uploadFile, deleteFile, optimisedDownloadAttachment, getProfilePicture, deleteFileFromPublicBucket, uploadFileToPublicBucket }