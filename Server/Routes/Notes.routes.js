const express = require("express")
const router = express.Router();

const {isAuthenticated} = require("../middlewares/authentication")
const {isLeadOrAdminUser, isSalesOwnerOrAdminUser} = require("../middlewares/userTypeCheck")
const {createNoteController, getNotesController, updateNoteController, deleteNoteController} = require("../Controllers/Notes.controller");


router.route("/:dealId").post(isAuthenticated, createNoteController);
router.route("/:dealId").get(isAuthenticated, getNotesController);
router.route("/:notesId").put(isAuthenticated, updateNoteController);
router.route("/:notesId").delete(isAuthenticated, deleteNoteController);

module.exports = router;