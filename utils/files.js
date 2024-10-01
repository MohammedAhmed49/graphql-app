const path = require("path");
const fs = require("fs");

exports.clearFile = (filePath) => {
  const newFilePath = path.join(__dirname, "..", filePath);
  fs.unlink(newFilePath, (err) => {
    if (err) {
      const error = new Error("Failed to delete image");
      error.statusCode = 500;
      throw error;
    }
  });
};
