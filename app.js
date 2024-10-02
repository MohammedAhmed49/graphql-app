const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const http = require("http");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");

const app = express();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()) // This is for data submitted by <form> (x-www-form-urlencoded)

app.use(bodyParser.json()); // This is for json format sent in the request (application/json)

app.use(
  multer({ storage: diskStorage, fileFilter: fileFilter }).single("image")
);

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
  })
);

app.use((error, req, res, next) => {
  console.log(error);

  res
    .status(error.statusCode ?? 500)
    .json({ message: error.message, data: error.data });
});

mongoose
  .connect(
    "mongodb+srv://mohammed:123@cluster0.qkxwsji.mongodb.net/social?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
