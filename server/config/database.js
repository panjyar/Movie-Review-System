// server/config/database.js

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use mongoose.connect to establish a connection
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Note: These options are deprecated in recent Mongoose versions and are no longer necessary.
      // You can safely remove them.
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Use mongoose.connection to listen for events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Handle graceful shutdown for the application
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;