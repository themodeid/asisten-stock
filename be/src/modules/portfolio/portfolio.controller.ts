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
    const rawPid = req.params.portfolioId || req.query.portfolioId;
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    if (rawPid === "all" || rawPid === "0") {
      const summary = await portfolioService.getAggregatedPortfolioSummary(userId);
      return successResponse(res, summary, "Aggregated portfolio summary retrieved");
    }
    const portfolioId = Number(rawPid || 1);
    const summary = await portfolioService.getPortfolioSummary(portfolioId);
    return successResponse(res, summary, "Portfolio summary retrieved");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getWallets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    const wallets = await portfolioService.getUserWallets(userId);
    return successResponse(res, wallets, "Daftar dompet akun berhasil diambil");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const createWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id || Number(req.body.userId || 1);
    const { name, cash_balance } = req.body;
    const wallet = await portfolioService.createWallet(userId, name, Number(cash_balance) || 0);
    return successResponse(res, wallet, `Dompet ${wallet.name} berhasil dibuat`);
  } catch (error: any) {
    next(new AppError(error.message, 400));
  }
};

export const deleteWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    const walletId = Number(req.params.id);
    const result = await portfolioService.deleteWallet(walletId, userId);
    return successResponse(res, result, "Dompet berhasil dihapus");
  } catch (error: any) {
    next(new AppError(error.message, 400));
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
    const rawPid = req.params.portfolioId || req.query.portfolioId;
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    let portfolioId = Number(rawPid);

    const { pool } = await import("../../config/database");
    if (!portfolioId || isNaN(portfolioId)) {
      const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
      portfolioId = primary.id;
    } else {
      const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [portfolioId]);
      if (exists.rows.length === 0) {
        const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
        portfolioId = primary.id;
      }
    }

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
    const rawPid = req.params.portfolioId || req.query.portfolioId;
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    let portfolioId = Number(rawPid);

    const { pool } = await import("../../config/database");
    if (!portfolioId || isNaN(portfolioId)) {
      const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
      portfolioId = primary.id;
    } else {
      const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [portfolioId]);
      if (exists.rows.length === 0) {
        const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
        portfolioId = primary.id;
      }
    }

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
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    const rawPid = req.params.portfolioId || req.body.portfolioId || req.body.portfolio_id || req.query.portfolioId;
    let portfolioId = (rawPid === "all" || rawPid === "0") ? 0 : Number(rawPid);

    const { pool } = await import("../../config/database");
    if (portfolioId !== 0) {
      if (!portfolioId || isNaN(portfolioId)) {
        portfolioId = 0; // Default to aggregated
      } else {
        const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [portfolioId]);
        if (exists.rows.length === 0) {
          portfolioId = 0;
        }
      }
    }

    const freshCapital = Number(
      req.body.freshCapital ?? req.body.fresh_capital_idr ?? req.query.freshCapital ?? 2000000
    );
    const strategy = String(
      req.body.strategy ?? req.body.strategy_name ?? "STATELESS_GLOBAL"
    );
    const customTargets = req.body.customTargets;

    const plan = await portfolioService.calculateRebalancePlan(
      portfolioId,
      freshCapital,
      strategy,
      customTargets,
      userId
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
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    const {
      asset_type,
      ticker,
      sell_amount_idr,
      sell_quantity,
      is_bappebti,
      has_npwp,
      portfolio_id,
    } = req.body;

    let targetPid = Number(portfolio_id);
    const { pool } = await import("../../config/database");
    if (!targetPid || isNaN(targetPid)) {
      const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
      targetPid = primary.id;
    } else {
      const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [targetPid]);
      if (exists.rows.length === 0) {
        const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
        targetPid = primary.id;
      }
    }

    const result = await portfolioService.calculateTaxSimulation({
      asset_type,
      ticker,
      sell_amount_idr: sell_amount_idr !== undefined ? Number(sell_amount_idr) : undefined,
      sell_quantity: sell_quantity !== undefined ? Number(sell_quantity) : undefined,
      is_bappebti,
      has_npwp,
      portfolio_id: targetPid,
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
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    let portfolioId = Number(req.params.portfolioId || req.query.portfolioId);

    const { pool } = await import("../../config/database");
    if (!portfolioId || isNaN(portfolioId)) {
      const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
      portfolioId = primary.id;
    } else {
      const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [portfolioId]);
      if (exists.rows.length === 0) {
        const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
        portfolioId = primary.id;
      }
    }

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
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    let portfolioId = Number(req.params.portfolioId);

    const { pool } = await import("../../config/database");
    if (!portfolioId || isNaN(portfolioId)) {
      const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
      portfolioId = primary.id;
    } else {
      const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [portfolioId]);
      if (exists.rows.length === 0) {
        const primary = await portfolioService.getPrimaryPortfolioByUserId(userId);
        portfolioId = primary.id;
      }
    }

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
    const rawPid = req.params.portfolioId || req.query.portfolioId;
    const userId = (req as any).user?.id || Number(req.query.userId || 1);
    const timeframe = String(req.query.timeframe || "ALL").toUpperCase();

    if (rawPid === "all" || rawPid === "0" || !rawPid || isNaN(Number(rawPid))) {
      const data = await portfolioService.getAggregatedPortfolioChart(userId, timeframe);
      return successResponse(res, data, "Aggregated portfolio chart data retrieved successfully");
    }

    const portfolioId = Number(rawPid);
    const { pool } = await import("../../config/database");
    const exists = await pool.query("SELECT id FROM portfolios WHERE id = $1;", [portfolioId]);
    if (exists.rows.length === 0) {
      const data = await portfolioService.getAggregatedPortfolioChart(userId, timeframe);
      return successResponse(res, data, "Aggregated portfolio chart data retrieved successfully");
    }

    const data = await portfolioService.getPortfolioChart(portfolioId, timeframe);
    return successResponse(res, data, "Portfolio chart data retrieved successfully");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const calibrateHolding = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await portfolioService.calibrateHolding(req.body);
    return successResponse(res, result, `Posisi ${result.ticker} berhasil dikalibrasi secara presisi`);
  } catch (error: any) {
    next(new AppError(error.message, 400));
  }
};
