
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

// ===================================================================
//  !!! THIS IS THE CRITICAL CODE THAT NEEDS TO BE ADDED/FIXED !!!
// ===================================================================

// 1. Get the directory name of the current file's location.
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Construct the correct path to the frontend's 'dist' folder.
//    It navigates up two directories from `/backend/dist` to the project root `/`,
//    then into the frontend's `dist` folder.
const frontendDistPath = path.join(__dirname, '..', '..', 'dist');

// Add this line for debugging. It will show the exact path in your logs.
console.log(`Serving static files from: ${frontendDistPath}`);

// 3. Serve the static Vite build.
app.use(express.static(frontendDistPath));

// 4. Fallback for Single-Page Applications (SPA):
//    If a request doesn't match an API route or a static file,
//    send the 'index.html' file.
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ===================================================================



const startServer = async () => {
  await connectToDB();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
