const express = require("express");
const { connectToMongoDB } = require("./connection");
const urlRoute = require("./routes/url");

// url get kare gain model ma sa structure
const URL = require("./models/url");

const app = express();
const PORT = 8001;
connectToMongoDB("mongodb://127.0.0.1:27017/short-url").then(() =>
  console.log("Connection to mongoDB done."),
);

// adding the middleware that will allow the parsing the data
app.use(express.json());

app.use("/url", urlRoute);

// redirect the user to the original large url
app.get("/:shortID", async (req, res) => {
  const shortId = req.params.shortID;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory:{
            timestamps: Date.now(),
        },
      },
    },
  );
  res.redirect(entry.redirectUrl);
});
app.listen(PORT, () => console.log(`server started at ${PORT}`));
