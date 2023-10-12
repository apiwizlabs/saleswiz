const { Schema, Types } = require("mongoose");
const mongoose = require("mongoose")

const InvitedUserSchema = new Schema(
  {
    _id: {
      type: Types.ObjectId,
      required: true,
      auto: true,
    },
    email: {
      type: String,
      required: [true, "Invitee Email required"],
      unique: true,
      validate: {
        validator: function (email) {
          const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          return emailRegex.test(email);
        },
        message: "Please Enter a valid email",
      },
    },
    role: {
        type: String,
        required: [true, "User role is required"],
        uppercase: true,
        trim: true,
        enum:["SALES_OWNER", "ACCOUNT_OWNER", "PRE_SALES", "ENGINEERING", "MARKETING", "ADMIN", "ORG_OWNER" ]
    },
    isRegistered:{
      default: false,
      type: Boolean,
    },
    invitedBy: {
      type: Types.ObjectId,
      ref: "users",
    },
    lastInvitedBy:{
      type: Types.ObjectId,
      ref: "users",
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    inviteCount:{
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'invites'
  }
);

// UserSchema.pre('save', function(next){
//   if(this.type === "CLIENT USER"){
//     if(!this.organizationId ){
//       return next(new Error("organisation id needs to be present for clients"))
//     }
//   }
//   next()
// })

const InvitedUserModel = mongoose.model('invites', InvitedUserSchema)

module.exports = InvitedUserModel;
