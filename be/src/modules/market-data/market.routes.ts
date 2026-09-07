import { Router } from "express";
import * as marketController from "./market.controller";

const router = Router();

/**
 * @openapi
 * /market/popular:
 *   get:
 *     summary: Mendapatkan ringkasan harga aset populer (IHSG, Crypto, Gold, Global ETF)
 *     tags:
 *       - Market Data
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan list harga aset populer
 */
router.get("/popular", marketController.getPopularQuotes);

/**
 * @openapi
 * /market/quote/{ticker}:
 *   get:
 *     summary: Mendapatkan kutipan harga real-time suatu ticker
 *     tags:
 *       - Market Data
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         example: BBCA
 *     responses:
 *       200:
 *         description: Data quote harga real-time
 */
router.get("/quote/:ticker", marketController.getQuote);

/**
 * @openapi
 * /market/fx-rate:
 *   get:
 *     summary: Mendapatkan kurs USD/IDR live real-time
 *     tags:
 *       - Market Data
 *     responses:
 *       200:
 *         description: Info kurs USD/IDR terkini
 */
router.get("/fx-rate", marketController.handleGetFxRate);

export default router;
