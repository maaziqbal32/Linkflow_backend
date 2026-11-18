const { nanoid } = require("nanoid");
const { URL: NodeURL } = require("node:url");
const URL = require("../models/url");

// Create a new short URL
async function handleGenerateNewShortURL(req, res) {
  try {
    const body = req.body;

    if (typeof body?.url !== "string" || !body.url.trim()) {
      return res.status(400).json({
        error: "Please provide a destination URL",
      });
    }

    let normalizedUrl = body.url.trim();

    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let parsedUrl;

    try {
      parsedUrl = new NodeURL(normalizedUrl);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format",
      });
    }

    const validHostname =
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname.includes(".");

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !validHostname
    ) {
      return res.status(400).json({
        error: "Please enter a valid domain, such as google.com",
      });
    }

    const shortID = nanoid(8);

    await URL.create({
      shortId: shortID,
      redirectUrl: parsedUrl.toString(),
      visitHistory: [],
      status: "active",
    });

    return res.status(201).json({
      id: shortID,
    });
  } catch (error) {
    console.error("Create URL error:", error);

    return res.status(500).json({
      error: "Failed to create short URL",
    });
  }
}

// Get analytics for an individual short URL
async function handleGetAnalytics(req, res) {
  try {
    const { shortId } = req.params;

    const result = await URL.findOne({ shortId }).select(
      "shortId redirectUrl visitHistory",
    );

    if (!result) {
      return res.status(404).json({
        error: "URL not found",
      });
    }

    const analytics = result.visitHistory || [];

    return res.status(200).json({
      shortId: result.shortId,
      redirectUrl: result.redirectUrl,
      totalClicks: analytics.length,
      analytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      error: "Failed to fetch analytics",
    });
  }
}

// Get all shortened URLs
async function handleGetAllURLs(req, res) {
  try {
    const urls = await URL.find().sort({ createdAt: -1 });

    return res.status(200).json(urls);
  } catch (error) {
    console.error("Error fetching URLs:", error);

    return res.status(500).json({
      error: "Failed to fetch URLs",
    });
  }
}

// Delete a shortened URL
async function handleDeleteURL(req, res) {
  try {
    const { shortId } = req.params;

    const deletedURL = await URL.findOneAndDelete({ shortId });

    if (!deletedURL) {
      return res.status(404).json({
        error: "URL not found",
      });
    }

    return res.status(200).json({
      message: "URL deleted successfully",
    });
  } catch (error) {
    console.error("Delete URL error:", error);

    return res.status(500).json({
      error: "Failed to delete URL",
    });
  }
}

// Update URL status
async function handleUpdateURLStatus(req, res) {
  try {
    const { shortId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        error: "Status must be active or inactive",
      });
    }

    const updatedURL = await URL.findOneAndUpdate(
      { shortId },
      { $set: { status } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedURL) {
      return res.status(404).json({
        error: "URL not found",
      });
    }

    return res.status(200).json({
      message: "URL status updated successfully",
      shortId: updatedURL.shortId,
      status: updatedURL.status,
    });
  } catch (error) {
    console.error("Update URL status error:", error);

    return res.status(500).json({
      error: "Failed to update URL status",
    });
  }
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleGetAllURLs,
  handleDeleteURL,
  handleUpdateURLStatus,
};