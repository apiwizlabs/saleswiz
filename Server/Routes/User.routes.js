const express = require("express")
const router = express.Router();
const {isAuthenticated} = require("../middlewares/authentication");
const {isAdminUser, isLeadOrAdminUser} = require("../middlewares/userTypeCheck");
const {getAllUsersController, updateUserController, getUserByIdController, removeProfilePicture} = require("../Controllers/User.controller");

router.route("/").get(isAuthenticated, getAllUsersController);
router.route("/:userId").put(isAuthenticated, updateUserController);
router.route("/:userId").get(isAuthenticated, getUserByIdController);
router.route("/removedp").get(isAuthenticated, removeProfilePicture);

module.exports = router