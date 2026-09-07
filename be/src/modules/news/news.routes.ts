import { Router } from "express";
import { handleGetNewsFeed, handleGetNewsByTicker } from "./news.controller";

const router = Router();

/**
 * @openapi
 * /news/feed:
 *   get:
 *     summary: Mendapatkan feed berita keuangan terkini beserta skor sentimen AI
 *     tags:
 *       - News & Intelligence
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ALL, STOCK, CRYPTO, MACRO, GOLD, GLOBAL]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan feed berita pasar
 */
router.get("/feed", handleGetNewsFeed);

/**
 * @openapi
 * /news/ticker/{ticker}:
 *   get:
 *     summary: Mendapatkan berita dan sentimen khusus suatu ticker aset
 *     tags:
 *       - News & Intelligence
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan berita ticker
 */
router.get("/ticker/:ticker", handleGetNewsByTicker);

export default router;
