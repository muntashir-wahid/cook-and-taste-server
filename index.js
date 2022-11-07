const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// ----------- //
// Middlewares
// ---------- //
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// ------------------ //
// Connect to MongoDB
// ----------------- //

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hjjckmu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  console.log("Connected to Database");
});

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
