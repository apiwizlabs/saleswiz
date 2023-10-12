const jwt = require("jsonwebtoken");
const config = require("../config");
const JSEncrypt = require('node-jsencrypt');
const { OAuth2Client } = require("google-auth-library");
const UserModel = require('../Models/Users.model');
const InvitedUserModel = require('../Models/InvitedUsers.model');
const ejs = require("ejs");
const nodemailer = require('nodemailer');
const {ADMIN_ROLES} = require('../helpers/roleGroups')
const {transportObject} = require('../helpers/constants')
const {filterOutUndefinedValues} = require('../helpers/utils');
const jwt_decode = require("jwt-decode");
const { hashPassword, hashCompare } = require("../utils/services");


async function verify(code) {
    try {

      logger.info(process.env.GOOGLE_CLIENT_ID, "::: GOOGLE CLITNE ID")
      logger.info(process.env.GOOGLE_CLIENT_SECRET, "::: GOOGLE CLITNE SECTET")

      const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'postmessage',
      );
      const {tokens} = await oAuth2Client.getToken(code);
      const data = jwt_decode(tokens.id_token)
      logger.info("RESPONSE DATA GOAUTH :: ", JSON.stringify(data))
      const { email_verified} = data;
      if (email_verified) {
        return {verified: true, ...data};
      } else{
        return {
            verified: false,
        }
      }
    } catch (err) {
      return {
        verified: false,
      };
    }
}

const decryptPassword = (password) => {
  const jsDecrypt = new JSEncrypt();
  logger.info(" PRIVATE KEY :: ", process.env.PRIVATE_KEY);
  jsDecrypt.setPrivateKey(process.env.PRIVATE_KEY);
  return jsDecrypt.decrypt(password);
};


  const googleAuthController = async (req, res) => {
    try {
      const reqBody = req.body;
      logger.info("THE TOKEN AUTH ", JSON.stringify(reqBody))
      const { verified, email, name, hd } = await verify(reqBody.token);
      logger.info("GOOGLE OAuTH RESULTS  :: ",JSON.stringify({ verified, email, name, hd }))
      if (verified) {
        const isUserPresent = await UserModel.findOne({ email: email });
        if(!isUserPresent){
          return res.status(401).json({
            success: false,
            message: "Invalid Login",
          });
        }
        if( (!isUserPresent.isLocked && !isUserPresent.isDeleted ) || 
        (ADMIN_ROLES.includes(isUserPresent?.role))){
            const updateObject = {
                lastLogin: Date.now()
              }
            UserModel.findByIdAndUpdate(
                isUserPresent._id.toString(),
                {
                  ...updateObject
                },
                {runValidators: true},
                (err, data) => {
                  if (err) {
                    return res.status(500).json({
                      success: false,
                      message: "Error in Signing In",
                      errorMessage: err.message
                    });
                  } else if (data) {
                    return res.status(200).json({
                      success: true,
                      data: {
                        token: jwt.sign({ userId: data._id, role: data.role }, process.env.JWT_SECRET, {
                          expiresIn: config.TOKEN_EXPIRY,
                        }),
                      },
                    });
                  }
                }
              );
         
        }else{
          return res.status(401).json({
            success: false,
            message: "Invalid User",
          });
        }
      } 
      else {
        return res.status(403).json({
          success: false,
          message: "User cannot be verified",
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  };


  const basicAuthController = async (req, res) => {
        try{
            const {password, email} = req.body;
            const userProfile = await UserModel.findOne({ email });  
          
            if(!((userProfile && !userProfile.isLocked && !userProfile.isDeleted ) || ADMIN_ROLES.includes(userProfile?.role) )){
              logger.info(userProfile, "USER PROFILE")
              return res.status(401).json({
                success: false,
                message: "Your Profile has either been locked or deleted",
              });
            }
            logger.info(password, "bfr DE crypt pswd");
            const decryptedPassword = decryptPassword(password);
            logger.info(decryptedPassword, "after DE crypt pswd");
            // const hashedPassword = await bcrypt.hash(decryptedPassword, 10)
            // logger.info("HASHED PSWD", decryptedPassword);

            const isValidPassword = await hashCompare({password: decryptedPassword, hashedPassword: userProfile.password});
            logger.info(isValidPassword, "PASSWORD CREDS");
            if(!isValidPassword){
                return res.status(401).json({
                    success: false,
                    message: "Incorrect Credentials",
                });
            }else if(isValidPassword){
                userProfile.lastLogin = Date.now();
                await userProfile.save();
                const role = userProfile.role
                const userId = userProfile._id
                return res.status(200).json({
                success: true,
                data: {
                    token: jwt.sign({ userId, role }, 
                    process.env.JWT_SECRET, {
                    expiresIn: config.TOKEN_EXPIRY,
                    }),
                },
                });
            }
           
        }catch (err) {
          logger.info(err)
            return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            errorMessage: err.message,
          });
        }
  }

  const googleSignupController = async (req, res) => {
    try{
      const signupObj = req.body;
      const { verified,  email, given_name, family_name, hd } = await verify(signupObj.code);
  
      if (verified) {

        const inviteToken = signupObj.inviteToken;
        const decodedToken = jwt.verify(inviteToken, process.env.JWT_SECRET);
        const isUserPresent = await UserModel.exists({ email });
      
        if (isUserPresent) {
          return res.status(201).json({
            success: true,
            data: "Already Signed Up. Please Login."
          });
        } 
        else if(!isUserPresent) {   
  
          const pendingInvite = await InvitedUserModel.findOne({ email: decodedToken.inviteeEmail});
          if( !pendingInvite || pendingInvite.isDisabled || pendingInvite.isDeleted ){
            return res.status(401).json({
              success: false,
              message: "Invalid User invite data",
            });
          }
            const userObj = {
              firstName: given_name,
              lastName: family_name, 
              email,
              role: pendingInvite.role,
            }
      
            let userToSave = new UserModel(userObj);
            const savedUser = await userToSave.save();
            pendingInvite.isRegistered = true;
            await pendingInvite.save();

            return res.status(200).json({
              success: true,
              data: {
                token: jwt.sign({ userId: savedUser._id, role: pendingInvite.role, }, process.env.JWT_SECRET, {
                  expiresIn: config.TOKEN_EXPIRY,
                }),
              },
            });
            
        }
        else{
              return res.status(401).json({
                success: false,
                message: "User not registered",
              });
        }
      } 
      else {
        return res.status(401).json({
          success: false,
          message: "User cannot be verified",
        });
      }
  
  
  }catch (err) {
    logger.info("ERROR IN SIGNUP :: ",err)
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }

  const basicSignupController = async (req, res) => {
    try{
    const saltRounds = 10;
    const {password, firstName, lastName, inviteToken} = req.body;
    const decodedToken = jwt.verify(inviteToken, process.env.JWT_SECRET);
    const isUserPresent = await UserModel.exists({ email: decodedToken.inviteeEmail });
    if(isUserPresent){
      return res.status(201).json({
        success: true,
        data: "Already Signed Up. Please Login."
      });
    }
    
    const pendingInvite = await InvitedUserModel.findOne({ email: decodedToken.inviteeEmail});

  
    if(!pendingInvite || pendingInvite?.isDisabled || pendingInvite?.isDeleted){
      return res.status(401).json({
        success: false,
        message: "Invalid Signup",
      });
    }

  
      const decryptedPassword = decryptPassword(password);  
      
      const hashedPassword = await hashPassword(decryptedPassword)
      const userObj = {
        firstName,
        lastName, 
        email: decodedToken.inviteeEmail,
        role: pendingInvite.role,
        password: hashedPassword,
      }
  
      const userToSave = new UserModel(userObj);
      const savedUser = await userToSave.save();
      pendingInvite.isRegistered = true;
      await pendingInvite.save();
      return res.status(200).json({
        success: true,
        data: {
          token: jwt.sign({ userId : savedUser._id, role: pendingInvite.role }, process.env.JWT_SECRET, {
            expiresIn: config.TOKEN_EXPIRY,
          }),
        },
      });   
  
    }catch (err) {
      if(err?.name === "TokenExpiredError"){
        return res.status(402).json({
          success: false,
          message: "Internal Server Error",
          errorMessage: err
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err
      });
    }
  }

  const sendInviteEmail = ({inviteEmail, token}) => {
    try{
        const inviteLink = config.BASE_URL+ 'signup/' + token
        let transporter = nodemailer.createTransport(transportObject)
    
        return new Promise((resolve, reject) => {
          ejs.renderFile(
            "emailTemplates/inviteUser.ejs",
            {inviteUserLink: inviteLink},
            (err, data) => {
              if (err) {
                console.log(err);
                reject(err); 
              } else {
                const emailMessage = {
                  from: config.MAIL_FROM,
                  to: [inviteEmail],
                  subject: "Invitation To Sign Up for Saleswiz ",
                  text: "Hello! Please Click on the button to sign up for the app",
                  html: data,
              }
        
                transporter.sendMail(emailMessage, (error, info) => {
                  if (error) {
                    console.log(error);
                    reject(error); 
                  } else {
                    resolve(info); 

                  }
                });
              }
            }
          );
        });
        
      }catch(err){
        console.log(err)
      }
    }

  const inviteUsersController = async (req, res) => {
    try{
      const {userDetails} = req.body;
      const currentUserId = res.locals.decodedToken.userId;
      let cleanedUserDetails = {insertDocs: [], extractedEmails: [], alreadyInvitedUsers: []}

      for(const curr of userDetails){
        const isInvitePresent = await InvitedUserModel.findOne({email: curr.email})
        if(!isInvitePresent){
          cleanedUserDetails.extractedEmails.push(curr.email)
        }else{
          cleanedUserDetails.alreadyInvitedUsers.push(curr.email)
        }
      }

      const promises = cleanedUserDetails?.extractedEmails?.length > 0 ? cleanedUserDetails?.extractedEmails?.map(async (inviteeEmail)=>{
      const isUserAlreadyPresent = await UserModel.exists({ email: inviteeEmail });
      if(isUserAlreadyPresent){
          return Promise.reject(`${inviteeEmail} has Already Signed Up`)
      }
      const linkToken = jwt.sign({ inviteeEmail }, process.env.JWT_SECRET, {expiresIn: config.INVITE_EXPIRY });
      
      return sendInviteEmail({token: linkToken, inviteEmail: inviteeEmail});

    }) : []

    const executedPromises = cleanedUserDetails?.extractedEmails?.length > 0 ? await Promise.allSettled(promises) : [];
    if(executedPromises.length > 0){
      const acceptedEmails = executedPromises.reduce((acc, curr)=>{
        const accepted = curr?.value?.accepted;
        if(accepted?.length > 0){
          return [...acc, accepted[0]]
        }
        return [...acc];
      },[])
      const emailStatus = cleanedUserDetails.extractedEmails.reduce((acc, curr) => {
        if(acceptedEmails.includes(curr)){
          return {...acc, accepted: [...acc.accepted, curr]}
        }else{
          return {...acc, rejected: [...acc.rejected, curr]}
        }
      },
      {accepted : [], rejected: []});
      cleanedUserDetails.alreadyInvitedUsers.push(...emailStatus.rejected);
      for(const curr of userDetails){
        if(emailStatus.accepted.includes(curr.email)){
          const newInvite = new InvitedUserModel({
            email: curr.email,
            role: curr.role,
            invitedBy: currentUserId,
            lastInvitedBy: currentUserId,
            inviteCount: 1
          });
          cleanedUserDetails.insertDocs.push(newInvite)
        }
      }
    }

      if(cleanedUserDetails?.insertDocs?.length > 0){
        await InvitedUserModel.insertMany(cleanedUserDetails.insertDocs, {ordered: true});
      }
    

    return res.status(200).json({
      success: true,
      emailData: executedPromises || "",
      skippedEmails: cleanedUserDetails?.alreadyInvitedUsers
    });

    }catch (err) {
      console.log(err);
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
  }

  const resendInviteController = async (req, res) => {
    try{
      const {inviteId} = req.params;
      const currentUserId = res.locals.decodedToken.userId;
      const existingInvite = await InvitedUserModel.findById(inviteId);
      if(existingInvite.isRegistered){
        return res.status(401).json({
          success: false,
          message: "User already signed up, cannot resend invite"
        })
      }
      const invitedDoc = await InvitedUserModel.findByIdAndUpdate(inviteId, {$inc: {'inviteCount': 1}, lastInvitedBy: currentUserId})
      const linkToken = jwt.sign({ inviteeEmail: invitedDoc.email }, process.env.JWT_SECRET, {expiresIn: config.INVITE_EXPIRY })
      await sendInviteEmail({token: linkToken, inviteEmail: invitedDoc.email})
      return res.status(200).json({
        success: true,
      });

    }catch (err) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
  }

  const updateInviteController = async (req, res) => {
    try{
      const {inviteId} = req.params;
      const {isDisabled, isDeleted, role} = req.body;
      let inputParams = {isDisabled, isDeleted, role}
      const existingInvite = await InvitedUserModel.findById(inviteId);
      if(existingInvite.isRegistered){
        return res.status(401).json({
          success: false,
          message: "User already signed up, cannot update invite"
        })
      }
      const filteredInputParams = filterOutUndefinedValues(inputParams)
      await InvitedUserModel.findByIdAndUpdate(inviteId, filteredInputParams);
      return res.status(200).json({
        success: true
      })
    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const verifyUserController = async (req, res) => {
    try{
      const {emailId} = req.body;
      const isUserPresent = await UserModel.findOne({ email: emailId });

      if( (isUserPresent && !isUserPresent.isLocked && !isUserPresent.isDeleted ) || (isUserPresent && ADMIN_ROLES.includes(isUserPresent.role))){
      const resetToken = jwt.sign({ emailId: emailId, date: Date.now() }, process.env.JWT_SECRET, {expiresIn: config.RESET_EXPIRY })
  
      const resetPswdLink = config.BASE_URL + "reset/" + resetToken
      let transporter = nodemailer.createTransport(transportObject)
      const resetEmail = new Promise((resolve, reject) => {
        ejs.renderFile(
          "emailTemplates/resetPassword.ejs",
          {resetLink: resetPswdLink},
          (err, data) => {
            if (err) {
              console.log(err);
              reject(err); 
            } else {
              const emailMessage = {
                from: config.MAIL_FROM,
                to: [emailId],
                subject: "Reg: Password Reset",
                text: "Click on the button to Reset your password",
                html: data,
              }
      
              transporter.sendMail(emailMessage, (error, info) => {
                if (error) {
                  console.log(error);
                  reject(error); 
                } else {
                  resolve(info); 
                }
              });
            }
          }
        );
      });

      const resp = await resetEmail;
      return res.status(200).json({
        success: true,
        data: resp,
      });  

      }else{
        return res.status(401).json({
          success: false,
          message: "User not present or is Invalid",
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

  const getAllInvites = async (req, res) => {
    try{

      const allInvites = await InvitedUserModel.find({isDeleted: false}).populate({path: 'lastInvitedBy', model: UserModel, select: 'firstName lastName'});
      return res.status(200).json({
        success: true,
        data: allInvites,
      });  

    }catch (err) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const resetPasswordController = async (req, res) => {
    try{
      const {emailId, password, resetToken} = req.body;
      const decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET);
      const isUserPresent = await UserModel.findOne({ email: emailId });
      if(( (isUserPresent && !isUserPresent.isLocked && !isUserPresent.isDeleted ) || (isUserPresent && ADMIN_ROLES.includes(isUserPresent.role))) && isUserPresent.email === decodedToken?.emailId){
        const decryptedPassword = decryptPassword(password);
        const hashedPassword = await hashPassword(decryptedPassword);
        UserModel.findByIdAndUpdate(isUserPresent._id.toString(), {password: hashedPassword},  
        (err, data)=>{
          if (err) {
            return res.status(500).json({
                success: false,
                message: "Error in updating password",
                errorMessage: err.message,
            }); }
          else if (data){
            return res.status(200).json({
              success: true,
              message: "Password updated",
          });}
         })
      }else{
        return res.status(401).json({
          success: false,
          message: "User does not exist or is invalid",
        });
      }

    }catch (err) {
      console.log(err)
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }



  module.exports = {googleAuthController, googleSignupController, basicSignupController, getAllInvites, resendInviteController, verifyUserController, updateInviteController, basicAuthController, inviteUsersController, resetPasswordController}