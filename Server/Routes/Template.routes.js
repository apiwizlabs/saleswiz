const express = require("express")
const router = express.Router();

const {isSalesOwnerOrAdminUser, isAdminUser, isLeadOrAdminUser} = require("../middlewares/userTypeCheck")
const {createTemplate, deleteFormFieldByIdController, getTemplateController, updatedFormFieldByIdController, getFormFieldByIdController, createFormFieldByTemplate, updateTemplate} = require("../Controllers/Template.controller");
const { isAuthenticated } = require("../middlewares/authentication");

router.route("/").post(isAdminUser, createTemplate);

router.route("/:type").post(isAdminUser, createFormFieldByTemplate);
router.route("/:type").get(isAuthenticated, getTemplateController);
router.route("/:type").put(isAdminUser, updateTemplate);

router.route("/:type/:formId").get(isAuthenticated, getFormFieldByIdController);
router.route("/:type/:formId").put(isAdminUser, updatedFormFieldByIdController);
router.route("/:type/:formId").delete(isAdminUser, deleteFormFieldByIdController);


module.exports = router;