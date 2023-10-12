const TemplateModel = require("../Models/Templates.model");
const {FormFieldsModel} = require("../Models/FormFields.model");
const {filterOutUndefinedValues} = require("../helpers/utils");
const { log } = require("winston");
const {CurrencyModel} = require("../Models/Currency.models");

const createFormFieldByTemplate = async (req, res) => {
  try{
    
      let currentUserId = res.locals.decodedToken.userId;
      const {type} = req.params;
      const {formFieldData} = req.body;
      const foundTemplate = await TemplateModel.findOne({templateType: type.toUpperCase(), isDeleted: false}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }})
      if(!foundTemplate){
        return res.status(400).json({
          success: false,
          message: "Template Not Found or is deleted"
      });
      }
      const {fieldType, valueOptions, isSensitive} = formFieldData;
      if((fieldType === "Radio" || fieldType === "Dropdown") && (valueOptions?.length < 2 || !valueOptions)){
        return res.status(400).json({
          success: false,
          message: "Checkbox/Radio/Dropdown Needs more than one option",
      });
      }
      if(fieldType === "Checkbox"  && (valueOptions?.length < 1 || !valueOptions)){
        return res.status(400).json({
          success: false,
          message: "Checkbox Needs atleast one option",
        });
      }
      const currencyList = await CurrencyModel.find({isDeleted: false})
      if(fieldType === "Currency" && currencyList?.length <= 0){
        return res.status(400).json({
          success: false,
          message: "Currency fields need to have atleast one valid currency added",
        });
      }
      if(isSensitive && ((!formFieldData?.writeAccessRoles || formFieldData?.writeAccessRoles?.length < 1) && (!formFieldData?.readAccessRoles || formFieldData?.readAccessRoles?.length < 1) )){
        return res.status(400).json({
          success: false,
          message: "Sensitive Fields need write access and read access roles to be mentioned",
      });
      }
      if(isSensitive || formFieldData?.readAccessRoles?.length > 0 || formFieldData?.writeAccessRoles?.length > 0){
        if(!formFieldData?.readAccessRoles){
          formFieldData.readAccessRoles = [];
        }
        if(!formFieldData?.writeAccessRoles){
          formFieldData.writeAccessRoles = [];
        }
      
        let updatedReadAccess = formFieldData?.readAccessRoles?.concat(formFieldData?.writeAccessRoles);
        formFieldData.isSensitive = true;
        formFieldData.readAccessRoles = [...new Set(updatedReadAccess)];


      }
      const isDuplicateLabel = foundTemplate.formFields.map(field => field.labelName).includes(formFieldData?.labelName)
      if(!formFieldData?.labelName || isDuplicateLabel){
        return res.status(400).json({
          success: false,
          message: "Label Name Needs to be unique"
        });
      }
      const multipleOptionFields = ["Checkbox", "Radio", "Dropdown"]
      if(!multipleOptionFields.includes(formFieldData.fieldType) && formFieldData?.valueOptions?.length > 0){
        return res.status(400).json({
          success: false,
          message: "Only Field Type Checkbox, Radio and Dropdown can have options"
        });
      }
      
      const newFormField = new FormFieldsModel({...formFieldData, createdBy: currentUserId, formTemplateType: type.toUpperCase()})
      const savedFormField = await newFormField.save()
      const previousTemplate = await TemplateModel.findByIdAndUpdate(foundTemplate._id, {$push:{ "formFields": savedFormField._id}})


      return res.status(200).json({
          success: true,
          data: previousTemplate
      });
     
  }catch (err) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
}

const updatedFormFieldByIdController = async (req, res) => {
  try{
    const {type, formId} = req.params;
    const {formFieldData} = req.body;

    const template = await TemplateModel.findOne({templateType : type.toUpperCase(), isDeleted: false}).populate({path: 'formFields', model: FormFieldsModel, match: {isDeleted: false}});
    if(!template){
      return res.status(400).json({
        message: "Form Template Type Not Found or is deleted."
      })
    }

    const isDuplicateLabelCount = template.formFields.map(form => form.labelName ).filter(item => item === formFieldData?.labelName).length

    if(!formFieldData?.labelName || isDuplicateLabelCount > 1){
      return res.status(400).json({
        message: "Label Name Needs To Be Unique"
      })
    }


    const {fieldType, valueOptions, isSensitive} = formFieldData;
    if((fieldType === "Checkbox" || fieldType === "Radio" || fieldType === "Dropdown") && (valueOptions?.length < 2 || !valueOptions)){
      return res.status(400).json({
        success: false,
        message: "Checkbox/Radio/Dropdown needs more than one option",
      });
    }
    const currencyList = await CurrencyModel.find({isDeleted: false})
    if(fieldType === "Currency" && currencyList?.length <= 0){
      return res.status(400).json({
        success: false,
        message: "Currency fields need to have atleast one valid currency added",
      });
    }
    if(isSensitive && (formFieldData?.writeAccessRoles?.length < 1 && formFieldData?.readAccessRoles?.length < 1)){
      return res.status(400).json({
        success: false,
        message: "Sensitive Fields need write access and read access roles to be mentioned"
    });
    }
    if(isSensitive || formFieldData.readAccessRoles.length > 0 || formFieldData.writeAccessRoles.length > 0){
      
      let updatedReadAccess = formFieldData.readAccessRoles.concat(formFieldData?.writeAccessRoles || []);
      formFieldData.isSensitive = true;

      formFieldData.readAccessRoles = [...new Set(updatedReadAccess)]
    }
    await FormFieldsModel.findByIdAndUpdate({_id: formId, isDeleted: false}, formFieldData)
    return res.status(200).json({
        success: true,
    });
     
  }catch (err) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
}

const deleteFormFieldByIdController = async (req, res) => {
  try{
    const {formId, type} = req.params;
    await FormFieldsModel.findByIdAndUpdate(formId, {isDeleted: true})
    await TemplateModel.findOneAndUpdate({templateType: type},{$pull:{"formFields": formId}})

    return res.status(200).json({
        success: true
    });
     
  }catch (err) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
}

const getFormFieldByIdController = async (req, res) => {
  try{
    const {formId} = req.params;
    const fieldData = await FormFieldsModel.findOne({_id: formId, isDeleted: false});

    return res.status(200).json({
        success: true,
        data: fieldData
    });
     
  }catch (err) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
}



const createTemplate = async (req, res) => {
  try{
      const {templateType} = req.body;
      if(!templateType){
           return res.status(400).json({
          success: false,
          message: "Template Type is Required"
      });
      }
       const newTemplate = new TemplateModel({templateType, formFields: []})
       await newTemplate.save()
       return res.status(200).json({
          success: true,
       });
     
  }catch (err) {
      return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: err.message,
    });
  }
}


  const getTemplateController = async (req, res) => {
    try{
        const {type} = req.params;
        const template = await TemplateModel.findOne({templateType : type.toUpperCase()}).populate({path: 'formFields', model: FormFieldsModel,  match: { isDeleted: false }});
        if(!template){
          return res.status(400).json({
            success: false,
            message: "Template not found"
          });
        }
        return res.status(200).json({
            success: true,
            data: template
        });
       
    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }

  const updateTemplate = async (req, res) => {
    //template name and deletion
    try{
        const {type} = req.params;
        const {isDeleted, templateType} = req.body;
        const templateInput = {isDeleted, templateType}
        const updateTemplateBody = filterOutUndefinedValues(templateInput)
        await TemplateModel.findOneAndUpdate({templateType: type.toUpperCase()}, updateTemplateBody, { runValidators: true });
        return res.status(200).json({
            success: true
        });
       
    }catch (err) {
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errorMessage: err.message,
      });
    }
  }



  module.exports = {createTemplate, deleteFormFieldByIdController, getTemplateController, updatedFormFieldByIdController, getFormFieldByIdController, createFormFieldByTemplate, updateTemplate }