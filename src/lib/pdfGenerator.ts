import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseOrder, SalesOrder, GoodsReceiptNote, DispatchRecord } from '../types';

const COMPANY_NAME = "S.S.A VASAVI ENTERPRISES";
const COMPANY_ADDRESS = "D-18 SECTOR-A5/6 TRANS DELHI SIGNATURE CITY (TRONICA CITY) LONI GZB 201102";

// Helper to add standard header and footer to all PDFs
const addCompanyBranding = (doc: jsPDF, title: string, docNumber: string, date: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background
  doc.setFillColor(13, 148, 136); // Teal-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo Placeholder (White circle)
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 20, 12, 'F');
  doc.setTextColor(13, 148, 136);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SSAVE", 25, 21, { align: "center", baseline: "middle" });
  
  // Company Name & Address
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(COMPANY_NAME, 45, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_ADDRESS, 45, 25);
  doc.text("GSTIN: 09XXXXXXXXXXXYZ | Ph: +91 9XXXX XXXXX", 45, 30);
  
  // Doc Title & Number
  doc.setTextColor(13, 148, 136);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 14, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Document No: ${docNumber}`, 14, 62);
  doc.text(`Date: ${date}`, 14, 67);
};

const addAuthorizedSignatory = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text("For S.S.A VASAVI ENTERPRISES", pageWidth - 14, pageHeight - 40, { align: "right" });
  
  // Signature bounding box or placeholder
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 60, pageHeight - 20, pageWidth - 14, pageHeight - 20);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Authorized Signatory", pageWidth - 37, pageHeight - 15, { align: "center" });
};

export const generatePurchaseOrderPDF = (po: PurchaseOrder) => {
  const doc = new jsPDF();
  addCompanyBranding(doc, "Purchase Order", po.poNo, po.date);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Vendor Details:", 14, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${po.vendor}`, 14, 85);
  doc.text(`Status: ${po.status}`, 14, 90);
  
  const tableColumn = ["S.No", "Item Name", "Order Qty", "Received Qty"];
  const tableRows = po.items.map((item, index) => [
    index + 1,
    item.itemName,
    item.qty,
    item.receivedQty
  ]);
  
  autoTable(doc, {
    startY: 100,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] }, // Teal
    styles: { fontSize: 9 }
  });
  
  addAuthorizedSignatory(doc);
  doc.save(`${po.poNo}.pdf`);
};

export const generateSalesOrderPDF = (so: SalesOrder) => {
  const doc = new jsPDF();
  addCompanyBranding(doc, "Sales Order", so.soNo, so.date);
  
  const totalAmount = so.items.reduce((sum, i) => sum + i.amount, 0);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Client Details:", 14, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${so.customer}`, 14, 85);
  doc.text(`Total Amount: Rs ${totalAmount.toFixed(2)}`, 14, 90);
  
  const tableColumn = ["S.No", "Item Name", "Qty", "Unit Price", "Total"];
  const tableRows = so.items.map((item, index) => [
    index + 1,
    item.itemName,
    item.qty,
    `Rs ${item.rate.toFixed(2)}`,
    `Rs ${item.amount.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 100,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] },
    styles: { fontSize: 9 }
  });
  
  addAuthorizedSignatory(doc);
  doc.save(`${so.soNo}.pdf`);
};

export const generateGRNPDF = (grn: GoodsReceiptNote) => {
  const doc = new jsPDF();
  addCompanyBranding(doc, "Goods Receipt Note", grn.grnNo, grn.date);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt Details:", 14, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Vendor: ${grn.vendor}`, 14, 85);
  doc.text(`PO Ref: ${grn.poNo || 'Direct Inward'}`, 14, 90);
  doc.text(`Invoice No: ${grn.invoiceNo}`, 14, 95);
  
  const tableColumn = ["S.No", "Item Name", "Received Qty", "Lot/Batch", "Remarks"];
  const tableRows = grn.items.map((item, index) => [
    index + 1,
    item.itemName,
    item.qty,
    item.lotBatch || '-',
    item.remarks || '-'
  ]);
  
  autoTable(doc, {
    startY: 105,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] },
    styles: { fontSize: 9 }
  });
  
  addAuthorizedSignatory(doc);
  doc.save(`${grn.grnNo}.pdf`);
};

export const generateDispatchPDF = (dispatch: DispatchRecord) => {
  const doc = new jsPDF();
  addCompanyBranding(doc, "Delivery Challan / Dispatch Note", dispatch.dispatchNo, dispatch.date);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Dispatch Details:", 14, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Client: ${dispatch.customer}`, 14, 85);
  doc.text(`SO Ref: ${dispatch.soNo || 'Direct Dispatch'}`, 14, 90);
  doc.text(`Vehicle No: ${dispatch.vehicleNo}`, 14, 95);
  
  const tableColumn = ["S.No", "Item Name", "Dispatch Qty", "Ref"];
  const tableRows = dispatch.items.map((item, index) => [
    index + 1,
    item.itemName,
    item.qty,
    '-'
  ]);
  
  autoTable(doc, {
    startY: 105,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] },
    styles: { fontSize: 9 }
  });
  
  addAuthorizedSignatory(doc);
  doc.save(`${dispatch.dispatchNo}_Delivery.pdf`);
};
