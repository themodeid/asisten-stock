import { Router } from 'express';
import { handleExportPortfolioPDF, handleExportTransactionCSV, handleExportTaxReportPDF } from './export.controller';

const router = Router();
router.get('/portfolio/:id/pdf', handleExportPortfolioPDF);
router.get('/transactions/:id/csv', handleExportTransactionCSV);
router.get('/tax-report/:id/pdf', handleExportTaxReportPDF);

export default router;
