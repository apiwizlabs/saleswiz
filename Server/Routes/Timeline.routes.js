const express = require("express")
const router = express.Router();
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {getTimelineData} = require("../Controllers/Timeline.controller");
const { isAuthenticated } = require("../middlewares/authentication");

router.route("/:dealId").get(isAuthenticated, getTimelineData);



module.exports = router