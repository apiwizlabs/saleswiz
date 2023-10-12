const TemplateModel = require("../Models/Templates.model");
const UserModel = require("../Models/Users.model");
const config = require("../config");
const { hashPassword } = require("../utils/services");

module.exports = async () => {

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
    loggers.info(err, ":: seeders err")
    console.log("seeders err:", err);
  }
};
