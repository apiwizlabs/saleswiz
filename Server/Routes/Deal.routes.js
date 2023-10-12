const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {createDealController, updateDealController, getAllDealsController, getDealByIdController, deleteDealController} = require("../Controllers/Deal.controller");


router.route("/").post(isLeadOrAdminUser, createDealController);
router.route("/").get(isAuthenticated, getAllDealsController);
router.route("/:dealId").put(isLeadOrAdminUser, updateDealController);
router.route("/:dealId").get(isAuthenticated, getDealByIdController);
router.route("/:dealId").delete(isSalesOwnerOrAdminUser, deleteDealController);

module.exports = router;