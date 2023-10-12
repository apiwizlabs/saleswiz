const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {getActivitiesController, getMyActivitiesController ,createActivityController, deleteActivityController, updateActivityController} = require("../Controllers/Activities.controller");

router.route("/:activityType").get(isAuthenticated, getMyActivitiesController);
router.route("/deal/:dealId/:activityType").get(isAuthenticated, getActivitiesController);
router.route("/:dealId").post(isAuthenticated, createActivityController);
router.route("/:activityId").put(isAuthenticated, updateActivityController);
router.route("/:dealId/:activityId").delete(isAuthenticated, deleteActivityController);

// router.route("/:customerId/:activityId").put(isLeadOrAdminUser, updateActivityController);
// router.route("/:customerId/:activityId").delete(isAuthenticated, deleteActivityController);

module.exports = router;