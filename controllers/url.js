const { nanoid } = require("nanoid");

// import the data schema kiu ka hum uska andr apni short id store kare gain
const URL = require("../models/url");

async function handleGenerateNewShortURL(req, res) {
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "url is required" });
  const shortID = nanoid(8);

  await URL.create({
    shortId: shortID,
    redirectUrl: body.url,
    visitHistory: [],
  });

  return res.json({ id: shortID });
}

async function handleGetAnalytics(req, res) {
  const shortId = req.params.shortId;
  const result = await URL.findOne({ shortId });
  return res.json({
    totalClicks: result.visitHistory.length,
    analytics: result.History,
  });
}


// Get all shortened URLs
async function handleGetAllURLs(req, res) {
  try {
    const urls = await URL.find().sort({ createdAt: -1 });
    return res.status(200).json(urls);
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return res.status(500).json({ error: "Failed to fetch URLs" });
  }
}


// Delete a shortened URL
async function handleDeleteURL(req, res) {
  try {
    const { shortId } = req.params;
    const deleteURL = await URL.findOneAndDelete({ shortId });
    if (!deleteURL) {
      return res.status(404).json({ error: "URL not found" });
    }
    return res.status(200).json({ message: "URL deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete URL" });
  }
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleGetAllURLs,
  handleDeleteURL,
};
