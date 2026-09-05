import { Request, Response, NextFunction } from "express";
import * as portfolioService from "./portfolio.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";

export const getPortfolioSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const summary = await portfolioService.getPortfolioSummary(portfolioId);
    return successResponse(res, summary, "Portfolio summary retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getPrimaryPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId || req.query.userId || 1);
    const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
    const summary = await portfolioService.getPortfolioSummary(portfolio.id);
    return successResponse(res, summary, "Primary portfolio details");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getPortfolioHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const { getPortfolioHealthScore } = await import("./portfolio-health.service");
    const health = await getPortfolioHealthScore(portfolioId);
    return successResponse(res, health, "Portfolio health score retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getPortfolioDividends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const { getDividendSummary } = await import("./dividend.service");
    const dividends = await getDividendSummary(portfolioId);
    return successResponse(res, dividends, "Portfolio dividend summary retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const exportPortfolioReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const format = req.query.format === "csv" ? "csv" : "json";
    const summary = await portfolioService.getPortfolioSummary(portfolioId);
    const { pool } = await import("../../config/database");

    const txRes = await pool.query(
      "SELECT * FROM stock_transactions WHERE portfolio_id = $1 ORDER BY transaction_date DESC;",
      [portfolioId]
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=portfolio_export_${portfolioId}_${Date.now()}.csv`
      );

      let csv = "--- RINGKASAN PORTOFOLIO ---\n";
      csv += `Nama Portofolio,${summary.portfolio_name}\n`;
      csv += `Total Nilai Portofolio (IDR),${summary.total_net_worth}\n`;
      csv += `Total Modal Ditanam (IDR),${summary.total_invested}\n`;
      csv += `Floating P/L (IDR),${summary.total_floating_pnl}\n`;
      csv += `Floating P/L (%),${summary.total_floating_pnl_percent}%\n\n`;

      csv += "--- DAFTAR KEPEMILIKAN ASET (HOLDINGS) ---\n";
      csv += "Ticker,Kelas Aset,Kuantitas,Mata Uang,Avg Buy Price,Total Modal (IDR),Nilai Pasar (IDR),Floating PnL (%),Bobot (%)\n";
      for (const h of summary.holdings) {
        csv += `"${h.ticker}","${h.asset_type || "STOCK"}",${h.quantity || h.total_shares},"${h.currency}",${h.avg_buy_price},${h.total_invested_idr || h.total_invested},${h.market_value_idr || h.market_value},${h.floating_pnl_percent}%,${h.weight_percent}%\n`;
      }

      csv += "\n--- RIWAYAT TRANSAKSI LENGKAP ---\n";
      csv += "ID,Tanggal,Tipe,Ticker,Kelas Aset,Jumlah Lot,Kuantitas,Harga Satuan,Mata Uang,Total Nilai,Catatan\n";
      for (const t of txRes.rows) {
        csv += `${t.id},"${new Date(t.transaction_date).toISOString()}","${t.type}","${t.ticker}","${t.asset_type || "STOCK"}",${t.lots || ""},${t.quantity || t.shares},${t.price_per_share},"${t.currency}",${t.total_amount},"${(t.notes || "").replace(/"/g, '""')}"\n`;
      }

      return res.status(200).send(csv);
    }

    return successResponse(
      res,
      {
        summary,
        transactions: txRes.rows,
      },
      "Portfolio export data retrieved"
    );
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getRebalancePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(
      req.params.portfolioId || req.body.portfolioId || req.body.portfolio_id || req.query.portfolioId || 1
    );
    const freshCapital = Number(
      req.body.freshCapital ?? req.body.fresh_capital_idr ?? req.query.freshCapital ?? 1000000
    );
    const strategy = String(
      req.body.strategy ?? req.body.strategy_name ?? "ALL_WEATHER"
    );
    const customTargets = req.body.customTargets;

    const plan = await portfolioService.calculateRebalancePlan(
      portfolioId,
      freshCapital,
      strategy,
      customTargets
    );

    return successResponse(res, plan, "Portfolio rebalance plan calculated");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const simulateTax = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      asset_type,
      ticker,
      sell_amount_idr,
      sell_quantity,
      is_bappebti,
      has_npwp,
      portfolio_id,
    } = req.body;

    const result = await portfolioService.calculateTaxSimulation({
      asset_type,
      ticker,
      sell_amount_idr: sell_amount_idr !== undefined ? Number(sell_amount_idr) : undefined,
      sell_quantity: sell_quantity !== undefined ? Number(sell_quantity) : undefined,
      is_bappebti,
      has_npwp,
      portfolio_id: Number(portfolio_id || 1),
    });

    return successResponse(res, result, "Tax simulation calculated successfully");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getTaxSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const summary = await portfolioService.getPortfolioTaxSummary(portfolioId);
    return successResponse(res, summary, "Portfolio tax summary retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};




export const getFxAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || 1);
    const data = await portfolioService.getFxAnalytics(portfolioId);
    return successResponse(res, data, "Analisis keuntungan ganda kurs USD/IDR berhasil");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getPortfolioChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = Number(req.params.portfolioId || req.query.portfolioId || 1);
    const timeframe = String(req.query.timeframe || "ALL").toUpperCase();
    const data = await portfolioService.getPortfolioChart(portfolioId, timeframe);
    return successResponse(res, data, "Portfolio chart data retrieved successfully");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};
