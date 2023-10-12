const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {createContactController, getAllContactsController, getContactByIdController, deleteContactController, updateContactController} = require("../Controllers/Contact.controller");

router.route("/").post(isLeadOrAdminUser, createContactController);
router.route("/").get(isAuthenticated, getAllContactsController);
router.route("/:contactId").put(isLeadOrAdminUser, updateContactController);
router.route("/:contactId").get(isAuthenticated, getContactByIdController);
router.route("/:contactId").delete(isSalesOwnerOrAdminUser, deleteContactController);

module.exports = router;