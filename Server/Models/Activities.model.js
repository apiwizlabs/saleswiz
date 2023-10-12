

const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const ActivitySchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },

    linkedDeal: {
        type: Types.ObjectId,
        ref: "deals",
        required: [true, "Linked Deal Required"]
    },

    activityType:{
        type: String,
        enum: ["CALL", "TASK"],
        required: [true, "Activity Type Required"]
    },

    assignedTo:{
        type: Types.ObjectId,
        ref: "users",
        required: [true, "Activity Assignee Required"]
    },

    taskName: {
        type: String,
        //required if type is task
    },

    taskDescription: {
        type: String,
    },

    callDescription: {
        type: String
        //required if call
    },

    priority: {
        type: String,
        enum: ["HIGH", "NORMAL"],
        default: "NORMAL"
    },

    linkedCallContact: {
        type: Types.ObjectId,
        ref: "contacts",
        //requred if call
    },

    callStartTime: { 
        type : String, 
    },

    callStartDate:{
        type : Date, 
    },

    status:{
        type: String,
        enum: ["OPEN", "CLOSE"],
        default: "OPEN"
    },

    taskDueDate:{
        type : Date, 
    },

    isDeleted: {
        type: Boolean,
        default: false,
    },

    createdBy: {
        type: Types.ObjectId,
        ref: "users",
        required: [true, "Activity Owner Required"]
    },


},
{
  timestamps: { createdAt: "cts", updatedAt: "mts" },
  collection: 'activities'
})


ActivitySchema.pre('save', function(next){
    if(this.activityType === "TASK"){
        if(!this.taskName || !this.taskDueDate){
            return next(new Error("Task Requires task name and due date"))
        }
        next()
    } else if(this.activityType === "CALL" ){
        if(!this.callDescription){
            return next(new Error("Call Description is Required"))
        }
        next()
    }else{
        return next(new Error("Invalid Activity Type"))
    }
  })

  


const ActivityModel = mongoose.model('activities', ActivitySchema)

module.exports = ActivityModel;
