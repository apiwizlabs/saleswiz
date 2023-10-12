const mongoose = require("mongoose");
const { Schema, Types } = mongoose;


const NotificationsSchema = new Schema(
  {
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    type: {
        type: String,
        enum: ["TASK","CALL","TEAM","DEAL","CUSTOMER","CONTACT", "APPROVAL"]
    },
    description:{
      type: String,
      required: [true, "Notification Content Required"]
    },
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'notifications'
  }
);


const NotificationModel = mongoose.model('notifications', NotificationsSchema)

module.exports = {NotificationsSchema, NotificationModel};
