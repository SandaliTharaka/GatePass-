const express = require("express");
const router = express.Router();
const { getStatusTimeline } = require("../controllers/timelineController");

router.get("/:referenceNumber", getStatusTimeline);

module.exports = router;
