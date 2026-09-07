import { Request, Response } from 'express';
import * as exportService from './export.service';

export const handleExportPortfolioPDF = async (req: Request, res: Response) => {
  try {
    const portfolioId = Number(req.params.id) || 1;
    const pdfBuffer = await exportService.generatePortfolioPDF(portfolioId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=portfolio_report_${portfolioId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating portfolio PDF:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat PDF portofolio' });
  }
};

export const handleExportTransactionCSV = async (req: Request, res: Response) => {
  try {
    const portfolioId = Number(req.params.id) || 1;
    const { from, to } = req.query;
    const csv = await exportService.generateTransactionCSV(portfolioId, from as string, to as string);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${portfolioId}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating transaction CSV:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat CSV transaksi' });
  }
};

export const handleExportTaxReportPDF = async (req: Request, res: Response) => {
  try {
    const portfolioId = Number(req.params.id) || 1;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const pdfBuffer = await exportService.generateTaxReportPDF(portfolioId, year);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tax_report_${portfolioId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating tax report PDF:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat PDF laporan pajak' });
  }
};
