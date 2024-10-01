exports.errorHandler = (next, err) => {
  console.log(err);

  if (!err.statusCode) {
    err.statusCode = 500;
  }
  next(err);
};
