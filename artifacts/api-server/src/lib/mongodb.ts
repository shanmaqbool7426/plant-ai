import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/leaflens";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    logger.info({ uri: uri.replace(/\/\/.*@/, "//***@") }, "MongoDB connected");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed — using in-memory fallback");
    await startInMemoryMongo();
  }
}

async function startInMemoryMongo(): Promise<void> {
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    isConnected = true;
    logger.info("MongoDB in-memory server started (data is not persisted across restarts)");
  } catch (err) {
    logger.error({ err }, "Failed to start in-memory MongoDB");
    throw err;
  }
}
