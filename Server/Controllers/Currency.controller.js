const config = require("../config");
const { ADMIN_ROLES } = require("../helpers/roleGroups");
const {NotesModel}= require("../Models/Notes.model");
const ContactModel = require("../Models/Contacts.model");
const { CustomerModel } = require("../Models/Customers.model");
const DealModel = require('../Models/Deals.model');
const TeamModel = require("../Models/Teams.model");
const UserModel = require("../Models/Users.model");
const { CurrencyModel } = require("../Models/Currency.models");


const addCurrencyController = async (req, res) => {
    try{
       let currentUserId = res.locals.decodedToken.userId;
       let {currencyValue, currencyLabel} = req.body;
       const newCurrency = new CurrencyModel({currencyValue, currencyLabel, createdBy: currentUserId});
       await newCurrency.save()

      return res.status(200).json({
       success: true,
     })

    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
    }
}

const getAllCurrency = async (req, res) => {
    try{
       const data = await CurrencyModel.find({isDeleted: false})

      return res.status(200).json({
       success: true,
       data: data
     })

    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}
const deleteCurrencyController = async (req, res) => {
    try{
      const {currencyId} = req.params
      await CurrencyModel.findByIdAndUpdate(currencyId, {isDeleted: true})

      return res.status(200).json({
       success: true,
     })

    }catch (err) {
         return res.status(500).json({
         success: false,
         message: "Internal Server Error",
         errorMessage: err.message,
       });
     }
}


 
 module.exports = {addCurrencyController, deleteCurrencyController, getAllCurrency};