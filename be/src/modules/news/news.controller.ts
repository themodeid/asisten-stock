import { Request, Response } from "express";
import * as newsService from "./news.service";

export const handleGetNewsFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const news = await newsService.getNewsFeed(category, limit);

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil feed berita pasar.",
      error: error.message,
    });
  }
};

export const handleGetNewsByTicker = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticker = req.params.ticker;
    if (!ticker) {
      res.status(400).json({ success: false, message: "Ticker wajib diisi." });
      return;
    }

    const news = await newsService.getNewsByTicker(ticker);

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Gagal mengambil berita untuk ticker ${req.params.ticker}.`,
      error: error.message,
    });
  }
};
