const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Error connecting mongodb :  ", error.message);
  }
};

module.exports = connectDb;
