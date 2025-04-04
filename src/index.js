const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDb = require("./configs/db");
const errorHandler = require("./middlewares/error.middlewares");
const healthCheckRouter = require("./routes/healthCheck.routes");

const app = express();
const PORT = process.env.PORT;
connectDb();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// routes
app.get("/healtcheck", healthCheckRouter);

// global error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Server is running on port : ", PORT);
});
