import { Request, Response, NextFunction } from "express";
import * as cashflowService from "./cashflow.service";
import { successResponse } from "../../utils/response";

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 1;
    const { type, category, wallet_id, startDate, endDate, limit, offset } = req.query;

    const data = await cashflowService.getCashflowTransactions(userId, {
      type: type as string,
      category: category as string,
      wallet_id: wallet_id ? Number(wallet_id) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    return successResponse(res, data, "Riwayat arus kas berhasil diambil");
  } catch (err: any) {
    next(err);
  }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 1;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const summary = await cashflowService.getCashflowSummary(userId, month, year);
    return successResponse(res, summary, "Ringkasan keuangan berhasil diambil");
  } catch (err: any) {
    next(err);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 1;
    const transaction = await cashflowService.createCashflowTransaction(userId, req.body);
    return successResponse(res, transaction, "Transaksi kas berhasil dicatat", 201);
  } catch (err: any) {
    next(err);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 1;
    const id = Number(req.params.id);
    const updated = await cashflowService.updateCashflowTransaction(id, userId, req.body);
    return successResponse(res, updated, "Transaksi kas berhasil diperbarui");
  } catch (err: any) {
    next(err);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || 1;
    const id = Number(req.params.id);
    const result = await cashflowService.deleteCashflowTransaction(id, userId);
    return successResponse(res, result, "Transaksi kas berhasil dihapus");
  } catch (err: any) {
    next(err);
  }
};

export const scanReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "File gambar struk/bukti transfer wajib diunggah",
      });
    }

    const parsed = await cashflowService.parseReceiptImageWithGemini(
      req.file.buffer,
      req.file.mimetype
    );

    return successResponse(res, parsed, "Struk berhasil dipindai oleh AI");
  } catch (err: any) {
    next(err);
  }
};
