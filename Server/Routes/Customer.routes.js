const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {getAllCustomersController, createCustomerController, updateCustomerController, getCustomerByIdController, deleteCustomerController} = require("../Controllers/Customer.controller");

router.route("/").get(isAuthenticated, getAllCustomersController);
router.route("/").post(isLeadOrAdminUser, createCustomerController);
router.route("/:customerId").put(isLeadOrAdminUser, updateCustomerController);
router.route("/:customerId").get(isAuthenticated, getCustomerByIdController);
router.route("/:customerId").delete(isLeadOrAdminUser, deleteCustomerController);

module.exports = router