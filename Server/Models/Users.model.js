const { Schema, Types } = require("mongoose");
const mongoose = require("mongoose")

const UserSchema = new Schema(
  {
    _id: {
      type: Types.ObjectId,
      required: true,
      auto: true,
    },
    firstName: {
      type: String,
      required: [true, "First name required"],
    },
    lastName: {
      type: String,
    },
    mobile:{
      type: String,     
    },
    profilePicture:{
      type:  {
        
        profileKey: {
          type: String,
          trim: true,
          required: [true, "attachment profile key required"]
        },
        url:{
          type: String, 
          required: [true, "attachment file key required"]
        }
      
      },
     
    },
    email: {
      type: String,
      required: [true, "User Email required"],
      unique: true,
      validate: {
        validator: function (email) {
          const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          return emailRegex.test(email);
        },
        message: "Please Enter a valid email",
      },
    },
    password: {
      type: String,
      trim: true,
      validate: {
        validator: function (password) {
          if(!password) return true
          const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*~`;:><,/."'?&#^)(+=\-_}{[\]])[a-zA-Z\d@$#+=^()|`~.><,/:;"'!%*?&\-_}{[\]^()]{6,}$/;
          return passwordRegex.test(password);
        },
        message: "Please Enter a valid password",
      },
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    role: {
        type: String,
        required: [true, "User role is required"],
        uppercase: true,
        trim: true,
        enum: ["SALES_OWNER", "ACCOUNT_OWNER", "PRE_SALES", "ENGINEERING", "MARKETING", "ADMIN", "ORG_OWNER" ],
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    notifications: [{
      type: Types.ObjectId,
      ref: 'notifications'
    }],
    pipelineSequence:{
      type: Map,
      of: [{
        type: Types.ObjectId,
        ref: 'deals'
      }],
      default: {},
    },
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'users'
  }
);


const UserModel = mongoose.model('users', UserSchema)

module.exports = UserModel;
