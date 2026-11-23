
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { connectToMongoDB } = require("./connection");
const urlRoute = require("./routes/url");
const authRoute = require("./routes/auth");
const URL = require("./models/url");

const app = express();

const PORT = process.env.PORT || 8001;

const MONGO_URI =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV !== "production"
    ? "mongodb://127.0.0.1:27017/short-url"
    : undefined);

if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

// MongoDB connection cache
let mongoConnectionPromise;

async function ensureMongoConnection() {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = connectToMongoDB(MONGO_URI)
      .then(() => {
        console.log("Connection to MongoDB successful.");
      })
      .catch((error) => {
        mongoConnectionPromise = null;
        throw error;
      });
  }

  return mongoConnectionPromise;
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await ensureMongoConnection();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return res.status(503).json({
      error: "Database connection unavailable",
    });
  }
});

app.use("/auth", authRoute);
app.use("/url", urlRoute);

// Public short URL redirect
app.get("/:shortID", async (req, res) => {
  try {
    const { shortID } = req.params;

    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );

    const entry = await URL.findOneAndUpdate(
      {
        shortId: shortID,
        status: "active",
      },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
          },
        },
      },
      { returnDocument: "after" },
    );

    if (!entry) {
      const exists = await URL.exists({ shortId: shortID });

      return res
        .status(exists ? 403 : 404)
        .send(
          exists
            ? "This short URL is inactive"
            : "Short URL not found",
        );
    }

    return res.redirect(302, entry.redirectUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).send("Something went wrong");
  }
});

// Local development only
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
  });
}

// Export Express app for Vercel
module.exports = app;
