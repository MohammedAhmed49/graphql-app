const jsonwebtoken = require("jsonwebtoken");

exports.isAuth = (req, res, next) => {
  const authorizationHeader = req.get("Authorization");
  if (!authorizationHeader) {
    const error = new Error("Not authorized!");
    error.statusCode = 401;
    throw error;
  }
  const token = authorizationHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jsonwebtoken.verify(token, "solongsecretkey");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Not authorized!");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
