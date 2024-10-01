const { validationResult } = require("express-validator");
const Post = require("../models/post");
const { errorHandler } = require("../utils/error");
const { clearFile } = require("../utils/files");
const User = require("../models/user");
const io = require("../socket");

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page;
  const perPage = 3;
  let totalItems;
  Post.countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * 2)
        .limit(perPage)
        .sort({ createdAt: -1 })
        .populate("creator");
    })
    .then((posts) => {
      res.status(200).json({ posts, totalItems: totalItems });
    })
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  if (!req.file) {
    const error = new Error("No image was uploaded!");
    error.statusCode = 422;
    throw error;
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!");
    error.statusCode = 422;
    throw error;
  }

  const post = new Post({
    title,
    content,
    imageUrl: "images/" + req.file.filename,
    creator: req.userId,
  });

  let relatedUser;

  post
    .save()
    .then((post) => {
      User.findById(req.userId)
        .then((user) => {
          relatedUser = user;
          user.posts.push(post);
          io.getIO().emit("posts", {
            action: "create",
            post: {
              ...post._doc,
              creator: { _id: req.userId, name: user.name },
            },
          });
          return user.save();
        })
        .then((results) => {
          res.status(201).json({
            message: "Post created successfully",
            creator: { _id: relatedUser._id, name: relatedUser.name },
            post,
          });
        })
        .catch((err) => errorHandler(next, err));
    })
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("No post was found!");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ post });
    })
    .catch((err) => {
      errorHandler(next, err);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!");
    error.statusCode = 422;
    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = "images/" + req.file.filename;
  }

  if (!imageUrl) {
    const error = new Error("No image was uploaded");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("No post was found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearFile(post.imageUrl);
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((post) => {
      io.getIO().emit("posts", {
        action: "update",
        post: post,
      });
      res.status(200).json({ post });
    })
    .catch((err) => errorHandler(next, err));
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("No post was found!");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }
      clearFile(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((results) => {
      return User.findById(req.userId).then((user) => {
        user.posts.pull(postId);
        return user.save();
      });
    })
    .then(() => {
      res.status(200).json({ message: "Deleted successfully!" });
    })
    .catch((err) => errorHandler(next, err));
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId).then((user) => {
    res.status(200).json({ status: user.status });
  });
};

exports.updateStatus = (req, res, next) => {
  const newStatus = req.body.status;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Status is empty!");
    error.statusCode = 422;
    throw error;
  }

  User.findById(req.userId)
    .then((user) => {
      user.status = newStatus;
      return user.save();
    })
    .then((result) => {
      res
        .status(201)
        .json({ message: "Status updated successfully", status: newStatus });
    })
    .catch((err) => errorHandler(next, err));
};
