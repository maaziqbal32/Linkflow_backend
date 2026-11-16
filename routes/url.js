const express = require("express");
const {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleGetAllURLs,
  handleDeleteURL,
} = require("../controllers/url");
const router = express();

// post request to shorten the url
router.post("/", handleGenerateNewShortURL);
router.get("/", handleGetAllURLs);
// get requesto to get the analytics of the shortid
router.get("/analytics/:shortId", handleGetAnalytics);
router.delete("/:shortId", handleDeleteURL);

module.exports = router;
