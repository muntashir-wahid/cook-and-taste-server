const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

const getLimitedRecipes = async (req, res, next) => {
  const queryParams = req.query;
  if (queryParams.limit) {
    const limit = +queryParams.limit;
    const recipes = await recipesCollection
      .find({})
      .limit(limit)
      .map((recipe) => {
        return {
          _id: recipe._id,
          name: recipe.name,
          picture: recipe.picture,
          price: recipe.price,
          ratings: recipe.ratings,
          description: recipe.description,
        };
      })
      .toArray();

    return res.status(200).json({
      status: "success",
      data: {
        recipes,
      },
    });
  }

  next();
};

// ------------------- //
// Routes and Handlers
// ------------------- //
async function run() {
  try {
    // Read operation on Recepies collection
    app.get("/api/v1/recipes", getLimitedRecipes, async (req, res) => {
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

    // Read a specific Recipe
    app.get("/api/v1/recipes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const recipe = await recipesCollection.findOne(query);

      res.status(200).json({
        status: "success",
        data: {
          recipe,
        },
      });
    });

    // Create user review on database

    app.post("/api/v1/reviews", async (req, res) => {
      const body = req.body;
      const result = await reviewsCollection.insertOne(body);

      const recipeReview = Object.assign({ _id: result.insertedId }, body);

      res.status(201).json({
        status: "success",
        data: {
          recipeReview,
        },
      });
    });

    // Read review data from database

    app.get("/api/v1/reviews/:productId", async (req, res) => {
      const id = req.params.productId;
      const query = { recipeId: id };
      const cursor = reviewsCollection.find(query).sort({ reviewTime: -1 });

      const recipeReviews = await cursor.toArray();

      //
      res.status(200).json({
        status: "success",
        data: {
          recipeReviews,
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
