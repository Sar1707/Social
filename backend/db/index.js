import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // Check if the MONGODB_URI already includes the database name
    const connectionString = process.env.MONGODB_URI;
    
    // Connect to MongoDB
    const connectionInstance = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`);
    console.log(`Database: ${connectionInstance.connection.name}`);
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
