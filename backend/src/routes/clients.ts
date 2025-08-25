
import { Router } from 'express';
import { connectToDB } from '../db.js';
import type { Client } from '../../../types.js'; // Adjust path as needed

const router = Router();

const getClientsCollection = async () => {
  const db = await connectToDB();
  return db.collection('clients');
};

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const collection = await getClientsCollection();
    const clients = await collection.find({ userId }).sort({ id: -1 }).toArray();
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const { userId, ...clientData } = req.body;
  if (!userId || !clientData.name || !clientData.value || !clientData.status) {
    return res.status(400).json({ message: 'Missing required client data' });
  }

  try {
    const collection = await getClientsCollection();
    const newClient: Client = {
      id: Date.now(),
      ...clientData,
      lastContact: new Date().toISOString().split('T')[0],
      userId: userId,
    };
    await collection.insertOne(newClient);
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Add client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const collection = await getClientsCollection();
    const allClients = await collection.find({}).toArray() as Client[];
    const clientsByUser = allClients.reduce((acc: Record<string, Client[]>, client: Client) => {
      if (!acc[client.userId]) {
        acc[client.userId] = [];
      }
      acc[client.userId].push(client as unknown as Client);
      return acc;
    }, {});
    res.json(clientsByUser);
  } catch (error) {
    console.error('Get all clients data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
