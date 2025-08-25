
import { MongoClient, Db } from 'mongodb';

const url = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const client = new MongoClient(url);

let db: Db | null = null;

export const connectToDB = async (): Promise<Db> => {
  if (db) {
    return db;
  }
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('sales-power-up-suite');
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};
