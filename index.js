const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

// Limit recipes

const getLimitedRecipes = async (req, res, next) => {
  const queryParams = req.query;
  if (queryParams.limit) {
    const limit = +queryParams.limit;
    const recipes = await recipesCollection
      .find({})
      .limit(limit)
      .sort({ _id: -1 })
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

// Verify jwt

const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      status: "fail",
      message: "unauthorized access",
    });
  }

  const [_, token] = authorization.split(" ");

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "fail",
        message: "unauthorized access",
      });
    }

    req.decoded = decoded;
    next();
  });
};

// ------------------- //
// Routes and Handlers
// ------------------- //
async function run() {
  try {
    // Authorization

    app.post("/api/v1/auth", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1h" });

      res.status(200).json({
        status: "success",
        data: {
          token,
        },
      });
    });

    // Create a Recipe

    app.post("/api/v1/recipes", async (req, res) => {
      const recipe = req.body;

      const result = await recipesCollection.insertOne(recipe);

      recipe._id = result.insertedId;

      res.status(201).json({
        status: "success",
        data: {
          recipe,
        },
      });
    });

    // Read operation on Recepies collection
    app.get("/api/v1/recipes", getLimitedRecipes, async (req, res) => {
      const query = {};

      const cursor = recipesCollection.find(query).sort({ _id: -1 });
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

    // ------- //
    // Reviews
    // ------ //

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

    // Read a specific review

    app.get("/api/v1/review/:reviewId", async (req, res) => {
      const id = req.params.reviewId;
      const query = { _id: ObjectId(id) };

      const review = await reviewsCollection.findOne(query);

      res.status(200).json({
        status: "success",
        data: {
          review,
        },
      });
    });

    // Read review data from database for a specific recipe
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

    // Read an users Reviews

    app.get("/api/v1/reviews/", verifyToken, async (req, res) => {
      const { email } = req.query;
      const decoded = req.decoded;
      console.log(email, decoded);

      if (email !== decoded.email) {
        return res.status(403).json({
          status: "fail",
          message: "unauthorized access",
        });
      }

      const cursor = reviewsCollection.find({
        "reviewer.email": { $eq: email },
      });
      const userReviews = await cursor.toArray();

      res.status(200).json({
        status: "success",
        result: userReviews.length,
        data: {
          userReviews,
        },
      });
    });

    // Delete a specific review

    app.delete("/api/v1/reviews/:reviewId", async (req, res) => {
      const id = req.params.reviewId;

      const query = { _id: ObjectId(id) };

      const result = await reviewsCollection.deleteOne(query);

      res.status(200).json({
        status: "success",
        data: {
          result,
        },
      });
    });

    // Update a review

    app.patch("/api/v1/reviews/:reviewId", async (req, res) => {
      const id = req.params.reviewId;
      const body = req.body;
      const filter = { _id: ObjectId(id) };

      const updatedDoc = {
        $set: body,
      };

      const result = await reviewsCollection.updateOne(filter, updatedDoc);

      res.status(200).json({
        status: "success",
        data: {
          result,
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
