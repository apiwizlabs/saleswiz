const mongoose = require("mongoose");
const { Schema, Types } = mongoose;


const ApprovalSchema = new Schema(
  {
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    linkedFieldId: {
          type: Types.ObjectId,
          ref: "formFields",
        },
    entityName:{
      type: String,
      required: true,
    },
    fieldValue:{
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestor:{
        type: Types.ObjectId,
        ref: "users",
        required: true,
    },
    approver:{
        type: Types.ObjectId,
        ref: "users",
    },
    salesOwnerId:[{
      type: Types.ObjectId,
      ref: "users",
    }],
    isHistory:{
      type: Boolean,
      default: false
    },
    status:{
        type: String,
        enum: [
            "PENDING",
            "APPROVED",
            "REJECTED",
            "NA"
        ],
        default: "PENDING",
        required: true
    },
    isDeleted: {type: Boolean, default: false}
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'approvals'
  }
);


const ApprovalModel = mongoose.model('approvals', ApprovalSchema)

module.exports = {ApprovalModel, ApprovalSchema};
