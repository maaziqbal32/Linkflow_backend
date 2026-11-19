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

    // Handle Markdown link input
    const markdownMatch = normalizedUrl.match(
      /^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/i,
    );

    if (markdownMatch) {
      normalizedUrl = markdownMatch[1];
    }

    // Add HTTPS automatically
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let parsedUrl;

    try {
      // IMPORTANT: Use NodeURL, NOT URL
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
        error: "Please enter a valid domain",
      });
    }

    const shortID = nanoid(8);

    await URL.create({
      userId: req.user.userId,
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

    const result = await URL.findOne({
      shortId,
      userId: req.user.userId,
    }).select("shortId redirectUrl visitHistory");

    if (!result) {
      return res.status(404).json({
        error: "URL not found",
      });
    }

    return res.status(200).json({
      shortId: result.shortId,
      redirectUrl: result.redirectUrl,
      totalClicks: result.visitHistory.length,
      analytics: result.visitHistory,
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
    const urls = await URL.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(urls);
  } catch (error) {
    console.error("Get URLs error:", error);

    return res.status(500).json({
      error: "Failed to fetch URLs",
    });
  }
}

// Delete a shortened URL
async function handleDeleteURL(req, res) {
  try {
    const { shortId } = req.params;

    const deletedURL = await URL.findOneAndDelete({
      shortId,
      userId: req.user.userId,
    });

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
        error: "Invalid status",
      });
    }

    const updatedURL = await URL.findOneAndUpdate(
      {
        shortId,
        userId: req.user.userId,
      },
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!updatedURL) {
      return res.status(404).json({
        error: "URL not found",
      });
    }

    return res.status(200).json({
      message: "Status updated successfully",
      shortId: updatedURL.shortId,
      status: updatedURL.status,
    });
  } catch (error) {
    console.error("Status update error:", error);

    return res.status(500).json({
      error: "Failed to update status",
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
