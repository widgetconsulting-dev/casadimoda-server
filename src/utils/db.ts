import mongoose from "mongoose";

interface Connection {
  isConnected?: number | boolean;
}

const connection: Connection = {};

async function connect() {
  if (connection.isConnected) return;
  if (mongoose.connections.length > 0) {
    connection.isConnected = mongoose.connections[0].readyState;
    if (connection.isConnected === 1) return;
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  const db = await mongoose.connect(process.env.MONGODB_URI);
  connection.isConnected = db.connections[0].readyState;
}

async function disconnect() {
  if (connection.isConnected && process.env.NODE_ENV === "production") {
    await mongoose.disconnect();
    connection.isConnected = false;
  }
}

const db = { connect, disconnect };
export default db;
