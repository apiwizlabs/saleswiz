const mongoose = require("mongoose");
const { boolean } = require("webidl-conversions");
const { Schema, Types } = mongoose;
// const FormValueSchema = require("./FormValue.model");

const TeamSchema = new Schema(
    {
      _id: {
          type: Types.ObjectId,
          required: true,
          auto: true,
      },

      teamName: {
        type: String,
        unique: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
      },
      deals: [
        {
          type: Types.ObjectId,
          ref: "deals",
        }
      ],
      customers: [
         {
            type: Types.ObjectId,
            ref: "customers",
         }
      ],
      members: [
        {
          type: Types.ObjectId,
          ref: "users",
        }
      ]
    },
    {
      timestamps: { createdAt: "cts", updatedAt: "mts" },
      collection: 'teams'
    }
  );

  const TeamModel = mongoose.model('teams', TeamSchema)

module.exports = TeamModel;
