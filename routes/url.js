const express = require("express");

const {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleGetAllURLs,
  handleDeleteURL,
  handleUpdateURLStatus,
} = require("../controllers/url");

const router = express.Router();

router.post("/", handleGenerateNewShortURL);
router.get("/", handleGetAllURLs);
router.get("/analytics/:shortId", handleGetAnalytics);
router.patch("/:shortId/status", handleUpdateURLStatus);
router.delete("/:shortId", handleDeleteURL);

module.exports = router;