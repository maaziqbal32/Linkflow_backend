const express = require("express");
const { connectToMongoDB } = require("./connection");
const urlRoute = require("./routes/url");
const cors = require("cors");
const app = express();

// url get kare gain model ma sa structure
const URL = require("./models/url");

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
app.use(express.json());

const PORT = 8001;
connectToMongoDB("mongodb://127.0.0.1:27017/short-url").then(() =>
  console.log("Connection to mongoDB done."),
);

// adding the middleware that will allow the parsing the data
app.use(express.json());

app.use("/url", urlRoute);

// redirect the user to the original large url
app.get("/:shortID", async (req, res) => {
  try {
    const shortId = req.params.shortID;

    const entry = await URL.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
          },
        },
      },
      { new: true },
    );

    if (!entry) {
      return res.status(404).send("Short URL not found");
    }

    return res.redirect(entry.redirectUrl);
  } catch (error) {
    return res.status(500).send("Something went wrong");
  }
});

app.listen(PORT, () => console.log(`server started at ${PORT}`));
