const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const ContactSchema = new Schema(
  {
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
},
{
  timestamps: { createdAt: "cts", updatedAt: "mts" },
  collection: 'contacts'
}
  );

  const ContactModel = mongoose.model('contacts', ContactSchema)

module.exports = ContactModel;
