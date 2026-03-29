import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'smartdwell';
const COLLECTION_NAME = 'mqtt_packets';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient();
    db = mongoClient.db(DB_NAME);
  }
  return db;
}

export async function getMqttPacketsCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection(COLLECTION_NAME);
}

export async function getAliasesCollection(): Promise<Collection> {
  const database = await getDatabase();
  return database.collection('aliases');
}
