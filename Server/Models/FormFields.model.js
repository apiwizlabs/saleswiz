const mongoose = require("mongoose");
const { Schema, Types } = mongoose;



const FormFieldsSchema = new Schema(
    {
      _id: {
          type: Types.ObjectId,
          required: true,
          auto: true,
      },
      fieldType: {
        type: String,
        enum: [
            "Text Field",
            "Number",
            "Text Area",
            "Dropdown",
            "Checkbox",
            "Radio",
            "Date Picker",
            "Attachment",
            "Currency",
            "Phone",
            "Email",
            "Users"
        ],
        required: [true, "Form Type Required"]
      },

      formTemplateType: {
        type: String,
        enum:[
            "CUSTOMER",
            "DEAL",
            "CONTACT",
        ]
      },

      iconSvgString:{
        type: String,
      },

      isTechnicalInfo:{
        type: Boolean,
        default: false,
      },

      isDefault:{
        type: Boolean,
        default: false
      },
      isSensitive:{
        type: Boolean,
        default: false
      },
      isMandatory:{
        type: Boolean,
        default: false,
      },
      needsApproval:{
        type: Boolean,
        default: false,
      },
      labelName: {
        type: String,
        required: [true, "label name for each input is required"],
      }, 
      toolTip:{
        type: String,
      },
      valueOptions: [
        {type: String}
      ],
      createdBy: {
        type: Types.ObjectId,
        ref: "users"
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      readAccessRoles: [],
      writeAccessRoles: [],
    },
    {
      collection: 'formFields'
    }
  );


const FormFieldsModel = mongoose.model('formFields', FormFieldsSchema)

module.exports = {FormFieldsSchema, FormFieldsModel};
