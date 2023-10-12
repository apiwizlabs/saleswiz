const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const { isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {getAllApprovals, updateApprovalById} = require("../Controllers//Approvals.controller");

router.route("/").get(isSalesOwnerOrAdminUser, getAllApprovals);
router.route("/:approvalId").put(isSalesOwnerOrAdminUser, updateApprovalById);

module.exports = router;