import { Router } from 'express';
import { getTechnicalAnalysis } from './technical.service';

const router = Router();

// GET /api/market/technical/:ticker?timeframe=3M
router.get('/technical/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { timeframe } = req.query;
    const result = await getTechnicalAnalysis(ticker, timeframe as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;
