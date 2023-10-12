const mongoose = require("mongoose");
const { Schema, Types } = mongoose;


const TimelineSchema = new Schema(
  {
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    linkedDeal:{
        type: Types.ObjectId,
        ref: "deals",
    },
    title: {
        type: String,
        required: [true, "Notification Content Required"]
    },
    description:{
      type: Types.ObjectId,
      ref: "deals",
    },
    type:{
      type: String,
      enum: [
        "CALL", "NOTES", "FILES", "TASK"
      ]
    }
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'timeline'
  }
);


const TimelineModel = mongoose.model('timeline', TimelineSchema)

module.exports = {TimelineSchema, TimelineModel};
