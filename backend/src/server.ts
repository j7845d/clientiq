
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectToDB } from './db.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import analysisRoutes from './routes/analysis.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // Assuming /api/users is handled by auth routes
app.use('/api/clients', clientRoutes);
app.use('/api/analysis', analysisRoutes);

// Serve static files from the React app
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '..', '..', 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
});


const startServer = async () => {
  await connectToDB();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
