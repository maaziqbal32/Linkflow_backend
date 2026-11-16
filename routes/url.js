const express = require("express");
const { handleGenerateNewShortURL,handleGetAnalytics } = require("../controllers/url");
const router = express();

// post request to shorten the url
router.post("/", handleGenerateNewShortURL);

// get requesto to get the analytics of the shortid
router.get('/analytics/:shortId',handleGetAnalytics);

module.exports = router;
