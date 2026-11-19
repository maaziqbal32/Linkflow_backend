const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    shortId: {
      type: String,
      required: true,
      unique: true,
    },

    redirectUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    visitHistory: [
      {
        timestamp: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

const URL = mongoose.model("url", urlSchema);

module.exports = URL;