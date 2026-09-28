import express from 'express';
import cors from 'cors';
import authRoutes from '../server/authRoutes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Support both /api/auth and /auth paths depending on Vercel rewrite configuration
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Intelligent Vegetable Storage Backend',
    platform: 'Vercel Serverless',
    timestamp: new Date()
  });
});

export default app;
