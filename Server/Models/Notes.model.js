const mongoose = require("mongoose");
const { Schema, Types } = mongoose;


const NotesSchema = new Schema(
  {
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    notesContent: {
        type: String,
        validate: {
          validator: function (note) {
            if(!note.length > 1){ return false }
            return true
          },
          message: "Please Enter a valid Note",
        },
        required: [true, "Notes Content Required"]
    },
    linkedDeal:{
      type: Types.ObjectId,
      ref: "deals",
    },
    createdBy:{
        type: Types.ObjectId,
        ref: "users",
    },
    isDeleted: {type: Boolean, default: false}
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'notes'
  }
);


const NotesModel = mongoose.model('notes', NotesSchema)

module.exports = {NotesModel, NotesSchema};
