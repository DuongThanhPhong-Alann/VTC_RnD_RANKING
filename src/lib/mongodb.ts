import { MongoClient } from "mongodb";
import { requireEnv } from "@/lib/env";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global.__mongoClientPromise) {
      const client = new MongoClient(requireEnv("MONGODB_URI"));
      global.__mongoClientPromise = client.connect();
    }
    return global.__mongoClientPromise;
  }

  if (!clientPromise) {
    const client = new MongoClient(requireEnv("MONGODB_URI"));
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(requireEnv("MONGODB_DB_NAME"));
}
