const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {addCurrencyController, getAllCurrency, deleteCurrencyController} = require("../Controllers/Currency.controller");


router.route("/").post(isSalesOwnerOrAdminUser, addCurrencyController);
router.route("/").get(isAuthenticated, getAllCurrency);
router.route("/:currencyId").delete(isSalesOwnerOrAdminUser, deleteCurrencyController);

module.exports = router;