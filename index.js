const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// ----------- //
// Middlewares
// ---------- //
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Routes and Handlers
app.get("/", (req, res) => {
  res.send("Hello from cook and taste server!");
});

// ------------ //
// Start server
// ----------- //
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Cook and taste server is running on port ${port}`);
});
