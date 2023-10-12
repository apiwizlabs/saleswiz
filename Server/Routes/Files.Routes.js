const express = require("express")
const router = express.Router();

const {optimisedDownloadAttachment, getProfilePicture} = require("../Controllers/AwsFileManagement.controller");
const { isAuthenticated } = require("../middlewares/authentication");
const {uploadDealAttachment, uploadDealLink, deleteDealAttachment, uploadProfilePicture, getFilesData, deleteProfilePicture } = require("../Controllers/File.controller");
const {upload} = require("../helpers/fileHelper");


router.route("/single/:dealId")
  .post(isAuthenticated, upload.single("file") ,uploadDealAttachment )

  router.route("/link/:dealId")
  .post(isAuthenticated, uploadDealLink );

  router.route("/:dealId/:attachmentId")
  .delete(isAuthenticated, deleteDealAttachment )

  router.route("/:dealId/:fileKey")
  .get(isAuthenticated, optimisedDownloadAttachment )

  router.route("/:dealId")
  .get(isAuthenticated, getFilesData )

  router.route("/profile")
  .post(isAuthenticated, upload.single("file") ,uploadProfilePicture )

  router.route("/")
  .delete(isAuthenticated, deleteProfilePicture )

  // router.route("/profile/:userId")
  // .get(isAuthenticated, getProfilePicture )

  module.exports = router