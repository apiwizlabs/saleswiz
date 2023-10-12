const express = require("express")
const router = express.Router();
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {createTeamController, updateTeamController, getTeamsController, deleteTeamController, getTeamByIdController} = require("../Controllers/Team.controller");
const { isAuthenticated } = require("../middlewares/authentication");

router.route("/").post(isLeadOrAdminUser, createTeamController);
router.route("/").get(isAuthenticated, getTeamsController);
router.route("/:teamId").put(isLeadOrAdminUser, updateTeamController);
router.route("/:teamId").delete(isSalesOwnerOrAdminUser, deleteTeamController);
router.route("/:teamId").get(isAuthenticated, getTeamByIdController);



module.exports = router;