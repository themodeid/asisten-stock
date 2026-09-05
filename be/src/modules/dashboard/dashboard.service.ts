import { pool } from "../../config/database";
import * as portfolioService from "../portfolio/portfolio.service";
import * as alertService from "../watchlist-alert/alert.service";
import * as transactionService from "../transactions/transaction.service";

export interface DashboardMetrics {
  totalNetWorth: number;
  totalInvested: number;
  totalCash: number;
  totalFloatingPnl: number;
  totalFloatingPnlPercent: number;
  activeHoldingsCount: number;
  holdings: any[];
  recentTransactions: any[];
  watchlist: any[];
  assetAllocations?: any[];
}

export const getDashboardMetrics = async (
  userId: number
): Promise<DashboardMetrics> => {
  const portfolio = await portfolioService.getPrimaryPortfolioByUserId(userId);
  const summary = await portfolioService.getPortfolioSummary(portfolio.id);
  const transactions = await transactionService.getTransactions(portfolio.id);
  const watchlist = await alertService.getWatchlistByUserId(userId);

  return {
    totalNetWorth: summary.total_net_worth,
    totalInvested: summary.total_invested,
    totalCash: summary.cash_balance,
    totalFloatingPnl: summary.total_floating_pnl,
    totalFloatingPnlPercent: summary.total_floating_pnl_percent,
    activeHoldingsCount: summary.holdings_count,
    holdings: summary.holdings,
    recentTransactions: transactions.slice(0, 5),
    watchlist: watchlist.slice(0, 5),
    assetAllocations: summary.asset_allocations || [],
  };
};

