const mongoose = require("mongoose");

const filterOutUndefinedValues = (obj) => { 
    Object.keys(obj).forEach(key => obj[key] === undefined ? delete obj[key] : {}) 
    return obj
}

const throwError = ({res, message, status}) => {
    return res.status(status).json({
        success: false,
        message
    })
}

const validateUserValueType = (userValue, formField) => {
    switch(formField.fieldType){
        case "Number":
            return {success: !isNaN(userValue), label: formField.labelName}
        case "Currency":
            return {success: !isNaN(userValue[0]) && userValue[1].length === 3, label: formField.labelName}
        case "Text Field":
            if(typeof userValue !== 'string'){
                return {success: false, label: formField.labelName}
            }
            return {success: true}

        case "Email":
            if(typeof userValue !== 'string'){
                return {success: false, label: formField.labelName}
            }
            if(userValue === ''){ 
                return {success: true}
            }
            const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if(!emailRegex.test(userValue)){
                return {success: false, label: formField.labelName}
            }
            return {success: true}
        
        case "Phone":
            return {success: !isNaN(userValue[0]) && userValue[1].length === 2, label: formField.labelName}

        case "Users":
            return {success: mongoose.isValidObjectId(userValue), label: formField.labelName}

        case "Text Area":
            if(typeof userValue !== 'string'){
                return {success: false, label: formField.labelName}
            }
            return {success: true}
        case "Radio":
            if(typeof userValue !== 'string'){
                return {success: false, label: formField.labelName}
            }
            if(formField.valueOptions.includes(userValue)){
                return {success: true}
            }
            return {success: false, label: formField.labelName}
        case "Dropdown":
            if(typeof userValue !== 'string'){
                return {success: false, label: formField.labelName}
            }
            if(formField.valueOptions.includes(userValue)){
                return {success: true}
            }
            return {success: false, label: formField.labelName}
        case "Checkbox":
            if(userValue.every(elem => formField.valueOptions.includes(elem))){
                return {success: true, formattedValue: userValue}
            }
            return {success: false, label: formField.labelName }
        default:
            return {success: true}
    }
}

const isDateStringValid = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

module.exports = {filterOutUndefinedValues, throwError, validateUserValueType, isDateStringValid}