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
const db = client.db("cookAndTaste");
const recipesCollection = db.collection("recipes");
const reviewsCollection = db.collection("reviews");

// ------------------- //
// Custome Middlewares
// ------------------- //

// ------------------- //
// Routes and Handlers
// ------------------- //
async function run() {
  try {
    // Read operation on Recepies collection
    app.get("/api/v1/recipes", async (req, res) => {
      const query = {};

      const cursor = recipesCollection.find(query);
      const recipes = await cursor.toArray();

      res.status(200).json({
        status: "success",
        data: {
          recipes,
        },
      });
    });
  } finally {
    // await client.close();
  }
}
run().catch((error) => console.error(error));

// ------------ //
// Start server
// ----------- //
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Cook and taste server is running on port ${port}`);
});
