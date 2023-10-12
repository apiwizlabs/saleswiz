const express = require("express")
const router = express.Router();
const {isAdminUser, isLeadOrAdminUser} = require("../middlewares/userTypeCheck");
const {googleAuthController, getAllInvites, resendInviteController, verifyUserController, updateInviteController, basicAuthController, inviteUsersController, resetPasswordController, basicSignupController, googleSignupController} = require("../Controllers/Auth.controller");
const { isAuthenticated } = require("../middlewares/authentication");

router.route("/google").post(googleAuthController);
router.route("/basic").post(basicAuthController);
router.route("/signup/basic").post(basicSignupController);
router.route("/signup/google").post(googleSignupController);
router.route("/verify").post(verifyUserController);
router.route("/reset").post(resetPasswordController);
router.route("/invite").post(isAdminUser ,inviteUsersController);
router.route("/invites").get(isLeadOrAdminUser ,getAllInvites);
router.route("/resend/:inviteId").post(isAdminUser ,resendInviteController);
router.route("/invite/:inviteId").put(isAdminUser, updateInviteController);

module.exports = router;