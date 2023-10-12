const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const CustomerSchema = new Schema(
    {
      _id: {
          type: Types.ObjectId,
          required: true,
          auto: true,
      },

      // templateId: {type: Types.ObjectId, ref: 'templates'},

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

      linkedTeam:{
        type: Types.ObjectId,
        ref: "teams",
      },

      contacts: [{type: Types.ObjectId, ref: 'contacts'}],
      
      deals: [{type: Types.ObjectId, ref: 'deals'}],

      createdBy: {
        type: Types.ObjectId,
        ref: "users",
        required: [true, "Form Value Owner Required"]
      }
      
    },
    {
      timestamps: { createdAt: "cts", updatedAt: "mts" },
      collection: 'customers'
    }
  );

  const CustomerModel = mongoose.model('customers', CustomerSchema)

module.exports = {CustomerModel, CustomerSchema};
