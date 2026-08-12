import mongoose from 'mongoose';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      `${process.env.DATABASE_URL}/${config.dbName}`
      // No deprecated options — useNewUrlParser and useUnifiedTopology
      // have been no-ops since Mongoose 6 / MongoDB driver 4.
    );
    logger.info('db', `MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('db', 'MongoDB connection failed', { error: error.message });
    throw error;
  }
};

export default connectDB;
