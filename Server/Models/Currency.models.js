const mongoose = require("mongoose");
const { Schema, Types } = mongoose;


const CurrencySchema = new Schema(
  {
    _id: {
        type: Types.ObjectId,
        required: true,
        auto: true,
    },
    currencyValue: {
        type: String,
        required: [true, "Currency Type Required"]
    },
    currencyLabel: {
        type: String,
        required: [true, "Currency Label Required"]
    },
    createdBy:{
        type: Types.ObjectId,
        ref: "users",
    },
    isDeleted: {type: Boolean, default: false}
  },
  {
    collection: 'currency'
  }
);


const CurrencyModel = mongoose.model('currency', CurrencySchema)

module.exports = {CurrencyModel, CurrencySchema};
