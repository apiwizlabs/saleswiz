const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const {AttachmentsSchema} = require("./Attachments.model")

const DealsSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },

    userValues: [{ 
        labelName: {type: String, required: [true, "label name is required"] },
        fieldValue: {type: mongoose.Schema.Types.Mixed, required: [true, "User value is required"] },
        approvalFieldId: { 
            type: Types.ObjectId,
            ref: "approvals", 
        },
        userIdRef: { 
            type: Types.ObjectId,
            ref: "users", 
        },
        templateFieldId:  {
          type: Types.ObjectId,
          ref: "formFields",
        }
    }],

    createdBy: {
        type: Types.ObjectId,
        ref: "users",
        required: [true, "Form Value Owner Required"]
    },

    writeAccess: [{type: Types.ObjectId, ref: "users"}],

    linkedCustomer: {
        type: Types.ObjectId,
        ref: "customers"
    },

    linkedContacts:[{
        type: Types.ObjectId,
        ref: "contacts" 
    }],

    notes: [
        {
            type: Types.ObjectId,
            ref: "notes"
        }
    ],

    attachments: [
        {
            type: Types.ObjectId,
            ref: "attachments"
        }
    ],

    activities: [
       {
        type: Types.ObjectId,
        ref: "activities"
       }
    ]
},
{
  timestamps: { createdAt: "cts", updatedAt: "mts" },
  collection: 'deals'
})


const DealModel = mongoose.model('deals', DealsSchema)

module.exports = DealModel;