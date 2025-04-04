const ApiResponse = require("../utils/ApiResponse");

const healthCheck = (req, res) => {
  res.status(200).json(new ApiResponse(200, {}, "Health check passed"));
};

module.exports = healthCheck;
