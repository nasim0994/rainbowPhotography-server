const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bnskqpv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Verify JET (use line: 97)
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const Service = client.db("RainbowPhotography").collection("services");
    const Review = client.db("RainbowPhotography").collection("reviews");
    const Gallery = client.db("RainbowPhotography").collection("gallery");

    app.get("/gallery", async (req, res) => {
      const cursor = Gallery.find({});
      const gallery = await cursor.toArray();
      res.send(gallery);
    });

    //Service post api
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await Service.insertOne(service);
      res.send(result);
    });

    // 3 Services api for home
    app.get("/homepageServices", async (req, res) => {
      const cursor = Service.find({});
      // const services = await cursor.limit(3).toArray();
      const services = (await cursor.toArray()).slice(-3).reverse();
      res.send(services);
    });

    // All Services api
    app.get("/services", async (req, res) => {
      const cursor = Service.find({});
      const services = await cursor.toArray();
      res.send(services);
    });

    // Singel Service api
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await Service.findOne(query);
      res.send(service);
    });

    // Reviews  jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Review data post
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await Review.insertOne(review);
      res.send(result);
    });

    // Reviews  data get api
    app.get("/reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access" });
      }

      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const cursor = Review.find(query).sort({ dateTime: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // Reviews all  data get api
    app.get("/allReviews", async (req, res) => {
      let query = {};
      const cursor = Review.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // Review data get
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await Review.findOne(query);
      res.send(review);
    });

    //Update Review
    app.put("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const updateReview = req.body;
      const option = { upsert: true };

      const updateDoc = {
        $set: {
          message: updateReview.message,
          rating: updateReview.rating,
          date: updateReview.date,
          time: updateReview.time,
        },
      };

      const result = await Review.updateOne(query, updateDoc, option);
      res.send(result);
    });

    // Delete Review:
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await Review.deleteOne(query);
      res.send(result);
    });
    //
  } catch (error) {
    console.error(error.message);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log("Server Running om : ", port);
});
