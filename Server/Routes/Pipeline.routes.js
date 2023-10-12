const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {getDealsForPipeline, updatePipelineDealStage} = require("../Controllers/Pipeline.controller");


router.route("/").get(isAuthenticated, getDealsForPipeline);
router.route("/").put(isAuthenticated, updatePipelineDealStage);

module.exports = router;