const express = require("express")
const router = express.Router();
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {getNotificationsController, deleteAllNotifications, deleteNotificationController} = require("../Controllers/Notifications.controller");
const { isAuthenticated } = require("../middlewares/authentication");

router.route("/").get(isAuthenticated, getNotificationsController);
router.route("/:notificationId").delete(isAuthenticated, deleteNotificationController);
router.route("/").delete(isAuthenticated, deleteAllNotifications);



module.exports = router;