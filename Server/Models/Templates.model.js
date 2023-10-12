const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const {FormFieldsSchema}= require('./FormFields.model')


const TemplateSchema = new Schema(
  {
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    templateType: {
        type: String,
        enum:[
            "CUSTOMER",
            "DEAL",
            "CONTACT",
        ]
    },
    formFields: [ {type: Types.ObjectId, ref: "formFields"} ],
    isDeleted: {type: Boolean, default: false}
  },
  {
    timestamps: { createdAt: "cts", updatedAt: "mts" },
    collection: 'templates'
  }
);


const TemplateModel = mongoose.model('templates', TemplateSchema)

module.exports = TemplateModel;
