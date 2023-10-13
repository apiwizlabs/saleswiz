const TemplateModel = require("../Models/Templates.model");
const UserModel = require("../Models/Users.model");
const { FormFieldsModel } = require("../Models/FormFields.model");
const config = require("../config");
const { hashPassword } = require("../utils/services");

module.exports = async () => {

//need to add seeders to populate the form fields

  try {
    const template = await TemplateModel.findOne().lean();
    if (!template) {
      await TemplateModel.insertMany([
        {
            templateType: "CUSTOMER",
            formFields: [],
          },
          {
            templateType: "DEAL",
            formFields: [],
          },
          {
            templateType: "CONTACT",
            formFields: [],
          }
      ]);
    }

    const dealStages = await FormFieldsModel.findOne({formTemplateType: "DEAL", labelName: "Select Stage" }).lean();
    const dealName = await FormFieldsModel.findOne({formTemplateType: "DEAL", labelName: "Deal Name" }).lean();
    const customerName = await FormFieldsModel.findOne({formTemplateType: "CUSTOMER", labelName: "Customer Name" }).lean();
    const contactName = await FormFieldsModel.findOne({formTemplateType: "CONTACT", labelName: "Contact Name" }).lean();
    console.log(dealStages, "DEAL STAGES")
    if (!dealStages) {
      const dealStagesData = {
        "fieldType": "Dropdown",
        "formTemplateType": "DEAL",
        "isDefault": true,
        "isMandatory": true,
        "labelName": "Select Stage",
        "toolTip": "Deal Stages",
        "valueOptions": [
          "Prospect",
          "Closed Lost",
          "Closed Won"
        ]
      }
      const dealStageDoc = new FormFieldsModel(dealStagesData)
      console.log(dealStageDoc)

      const savedStagesForm = await dealStageDoc.save()
      await TemplateModel.findOneAndUpdate({templateType: "DEAL"}, { $push: { "formFields": savedStagesForm._id } })
      
    }
    if(!dealName){
      const dealNameFieldData = {
        "fieldType": "Text Field",
        "formTemplateType": "DEAL",
        "isDefault": true,
        "isMandatory": true,
        "labelName": "Deal Name",
        "toolTip": "Deal Name"
      }
      const dealNameFieldDoc = new FormFieldsModel(dealNameFieldData)

      const savedDealNameForm = await dealNameFieldDoc.save()
      await TemplateModel.findOneAndUpdate({templateType: "DEAL"}, { $push: { "formFields": savedDealNameForm._id } })
      
    }
    if(!customerName){

      const customerFieldData = {
        "fieldType": "Text Field",
        "formTemplateType": "CUSTOMER",
        "isDefault": true,
        "isMandatory": true,
        "labelName": "Customer Name",
        "toolTip": "Customer Name"
      }
      const customerFieldDoc = new FormFieldsModel(customerFieldData)

      const savedCustomerNameForm = await customerFieldDoc.save()
      await TemplateModel.findOneAndUpdate({templateType: "CUSTOMER"}, { $push: { "formFields": savedCustomerNameForm._id } })

    }
    if(!contactName){
      const contactFieldData = {
        "fieldType": "Text Field",
        "formTemplateType": "CONTACT",
        "isDefault": true,
        "isMandatory": true,
        "labelName": "Contact Name",
        "toolTip": "Contact Name"
      }
      const contactFieldDoc = new FormFieldsModel(contactFieldData)

      const savedContactNameForm = await contactFieldDoc.save()
      await TemplateModel.findOneAndUpdate({templateType: "CONTACT"}, { $push: { "formFields": savedContactNameForm._id } })
    }

    const adminUser = await UserModel.findOne({ role: "ADMIN" }).lean();
    if (!adminUser) {
      if(config.NODE_ENV === "production"){
        let _hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);
        let _newAdminUser = new UserModel({
          email: process.env.ADMIN_EMAIL,
          isLocked: false,
          isDeleted: false,
          role: "ADMIN",
          password: _hashedPassword,
          customerAccess: [],
          firstName: "Admin",
          lastName: "",
          notifications: [],
          pipelineSequence: {},
        });
        await _newAdminUser.save();
      }else if(config.NODE_ENV === "development"){
        let _hashedPassword = await hashPassword(config.ADMIN_PASSWORD);
        let _newAdminUser = new UserModel({
          email: config.ADMIN_EMAIL,
          isLocked: false,
          isDeleted: false,
          role: "ADMIN",
          password: _hashedPassword,
          customerAccess: [],
          firstName: "Admin",
          lastName: "",
          notifications: [],
          pipelineSequence: {},
        });
        await _newAdminUser.save();
      }
    }
  } catch (err) {
    console.log("seeders err:", err);
  }
};
