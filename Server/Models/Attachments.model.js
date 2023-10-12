const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const AttachmentSchema = new Schema(
    {
      _id: {
          type: Types.ObjectId,
          required: true,
          auto: true,
      },

      fileKey:{
        type: String,
      },

      fileUrl:{
        type: String
      },

      attachmentType:{
        type: String,
        enum: ["LINK", "FILE"]
      },

      fileSize:{
        type: Number
      },

      fileName:{
        type: String
      },

      uploadedBy: {
        type: Types.ObjectId,
        ref: "users",
        required: [true, "File Owner Required"]
      },
      
    },
    {
      timestamps: { createdAt: "cts", updatedAt: "mts" }
    }
  );

const AttachmentModel = mongoose.model('attachments', AttachmentSchema)

module.exports = {AttachmentModel, AttachmentSchema};
