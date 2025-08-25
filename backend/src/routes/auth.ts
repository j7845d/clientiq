
import { Router } from 'express';
import { connectToDB } from '../db';
import type { User } from '../../../types'; // Adjust path as needed

const router = Router();

const getUsersCollection = async () => {
  const db = await connectToDB();
  return db.collection('users');
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const users = await getUsersCollection();
    const existingUser = await users.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const isAdmin = (await users.countDocuments()) === 0;

    const newUser: User & { password: string } = {
      id: `user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password, // In a real app, this should be hashed!
      isAdmin,
    };

    await users.insertOne(newUser);

    const { password: _, ...userToReturn } = newUser;
    res.status(201).json(userToReturn);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user || user.password !== password) { // In a real app, compare hashed passwords
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const { password: _, ...userToReturn } = user;
    res.json(userToReturn);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await getUsersCollection();
    const allUsers = await users.find({}).toArray();
    const usersToReturn = allUsers.map(({ password, ...user }) => user);
    res.json(usersToReturn);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
