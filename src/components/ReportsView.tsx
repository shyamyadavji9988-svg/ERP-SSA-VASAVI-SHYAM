/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Item, 
  PurchaseOrder, 
  GoodsReceiptNote, 
  SalesOrder, 
  ProductionEntry, 
  DispatchRecord, 
  SamplingRecord, 
  StockLedgerEntry 
} from '../types';
import { 
  FileText, 
  SlidersHorizontal, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Percent, 
  Calendar,
  Printer 
} from 'lucide-react';

interface ReportsViewProps {
  items: Item[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  salesOrders: SalesOrder[];
  productions: ProductionEntry[];
  dispatches: DispatchRecord[];
  samplings: SamplingRecord[];
  ledger: StockLedgerEntry[];
  currentStock: Record<string, number>;
}

export default function ReportsView({
  items,
  purchaseOrders,
  grns,
  salesOrders,
  productions,
  dispatches,
  samplings,
  ledger,
  currentStock
}: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<string>("LOW_STOCK");

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // 1. Compile Low Stock Report Data
  const lowStockReport = useMemo(() => {
    return items
      .map(item => {
        const stock = currentStock[item.id] || 0;
        return {
          ...item,
          stock,
          isLow: stock < item.minStock
        };
      })
      .filter(item => item.isLow);
  }, [items, currentStock]);

  // 2. Compile PO Status Data
  const poReportData = useMemo(() => {
    return purchaseOrders.map(po => {
      const totOrdered = po.items.reduce((sum, pi) => sum + pi.qty, 0);
      const totRec = po.items.reduce((sum, pi) => sum + pi.receivedQty, 0);
      const backlog = Math.max(0, totOrdered - totRec);
      const completion = totOrdered > 0 ? Math.round((totRec / totOrdered) * 100) : 0;
      return {
        ...po,
        totOrdered,
        totRec,
        backlog,
        completion
      };
    });
  }, [purchaseOrders]);

  // 3. Compile SO Status Data
  const soReportData = useMemo(() => {
    return salesOrders.map(so => {
      const totOrdered = so.items.reduce((sum, si) => sum + si.qty, 0);
      const totDisp = so.items.reduce((sum, si) => sum + si.dispatchedQty, 0);
      const backlog = Math.max(0, totOrdered - totDisp);
      const completion = totOrdered > 0 ? Math.round((totDisp / totOrdered) * 100) : 0;
      return {
        ...so,
        totOrdered,
        totDisp,
        backlog,
        completion
      };
    });
  }, [salesOrders]);

  // 4. Lab sampling Pass Rate compilation
  const samplingMetrics = useMemo(() => {
    const total = samplings.length;
    const approved = samplings.filter(s => s.status === 'Approved').length;
    const rejected = samplings.filter(s => s.status === 'Rejected').length;
    const pending = samplings.filter(s => s.status === 'Pending Review').length;
    const passRate = total > 0 ? Math.round((approved / (total - pending || 1)) * 100) : 100;
    
    return {
      total,
      approved,
      rejected,
      pending,
      passRate
    };
  }, [samplings]);

  // 5. Total Material Stock compilation
  const masterStockReport = useMemo(() => {
    return items.map(item => {
      const stock = currentStock[item.id] || 0;
      return {
        ...item,
        stock
      };
    });
  }, [items, currentStock]);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          /* Force solid white background and crisp dark text */
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide non-essential layout wrappers and standard margins */
          .print\\:hidden, 
          header, 
          aside, 
          #btn-print-active-report,
          #btn-print-stock-summary,
          .fixed,
          nav {
            display: none !important;
          }

          /* Reset container padding to prevent layout push */
          div.lg\\:pl-64,
          div.pl-64,
          main,
          .p-6,
          .md\\:p-8 {
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Ensure document sheet takes up full printable width */
          .bg-white {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          /* Setup A4 Page size & margins */
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }

          /* Style tables for clean print presentation */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            border-bottom: 2px solid #cbd5e1 !important;
            padding: 8px 10px !important;
          }
          td {
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 8px 10px !important;
            color: #334155 !important;
          }

          /* Ensure high-contrast badge colors print correctly */
          .bg-rose-50 {
            background-color: #fef2f2 !important;
          }
          .text-rose-700 {
            color: #b91c1c !important;
          }
          .bg-emerald-50 {
            background-color: #ecfdf5 !important;
          }
          .text-emerald-700 {
            color: #047857 !important;
          }
          .bg-slate-100 {
            background-color: #f1f5f9 !important;
          }
          .text-slate-650 {
            color: #475569 !important;
          }
        }
      `}</style>
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm print:hidden">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Executive Analytics</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">SSA Vasavi Corporate Reports</h2>
          <p className="text-xs text-slate-500">Examine operational audits, warehouse stocks, procurement backlogs, and QA laboratory pass-rates.</p>
        </div>
        <button
          onClick={handlePrint}
          id="btn-print-active-report"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition cursor-pointer shadow-sm"
        >
          <Printer size={15} />
          <span>Print Active Report</span>
        </button>
      </div>

      {/* Reports selector horizontal card */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
        <button
          onClick={() => setActiveReport("LOW_STOCK")}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
            activeReport === "LOW_STOCK" 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Low Stock Alerts
        </button>

        <button
          onClick={() => setActiveReport("MASTER_STOCK")}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
            activeReport === "MASTER_STOCK" 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Warehouse Stock Ledger
        </button>

        <button
          onClick={() => setActiveReport("PURCHASE_BACKLOG")}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
            activeReport === "PURCHASE_BACKLOG" 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          PO Backlog Metrics
        </button>

        <button
          onClick={() => setActiveReport("SALES_FULFILLMENT")}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
            activeReport === "SALES_FULFILLMENT" 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          SO Fulfillment Ledger
        </button>

        <button
          onClick={() => setActiveReport("QA_SAMPLING")}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
            activeReport === "QA_SAMPLING" 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Laboratory QA Reports
        </button>
      </div>

      {/* REPORT SHEETS */}
      <div className="bg-white rounded-xl border border-slate-200/65 shadow-md p-6 min-h-[500px]">
        {/* Document Corporate Header (visible on prints) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-widest">SSA VASAVI ENTERPRISES</h1>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Dry-Mix Putty, Cement Adhesives & Tile Grout Plant</span>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="font-bold">SYSTEM REPORT: {activeReport.replace("_", " ")}</span>
              <p className="text-slate-500">Date: {new Date().toISOString().substring(0, 10)}</p>
            </div>
          </div>
        </div>

        {/* 1. LOW STOCK Sheet */}
        {activeReport === "LOW_STOCK" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Low Stock Inventory Alerts</h3>
                <p className="text-xs text-slate-500 mt-0.5">Specifies materials which have fallen beneath their required minimum layout reserves.</p>
              </div>
              <span className="text-xs bg-rose-50 border border-rose-100 text-rose-700 px-3 py-1 rounded font-bold font-mono">
                {lowStockReport.length} Alert Triggers
              </span>
            </div>

            {lowStockReport.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 border border-dashed rounded-xl border-slate-200">
                <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                <h4 className="text-slate-805 font-bold text-sm">All Inventory Reserves Stable</h4>
                <p className="text-slate-500 text-xs mt-1">All warehouse item quantities are currently above safety layout protocols.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead className="bg-[#f8fafc] text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Min Stock Limit</th>
                      <th className="py-2.5 px-3 text-right text-rose-700 font-bold">Current Stock Level</th>
                      <th className="py-2.5 px-3 font-semibold text-right pr-6">Deficit Quantity</th>
                      <th className="py-2.5 px-3">UoM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {lowStockReport.map(item => {
                      const deficit = item.minStock - item.stock;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.code}</td>
                          <td className="py-3 px-3 text-slate-950 font-bold">{item.name}</td>
                          <td className="py-3 px-3 text-slate-500 uppercase text-[10px]">{item.category}</td>
                          <td className="py-3 px-3 text-right font-mono">{item.minStock}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-rose-600">{item.stock}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold pr-6 text-indigo-700">-{deficit}</td>
                          <td className="py-3 px-3 text-slate-450 uppercase">{item.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. MASTER_STOCK Sheet */}
        {activeReport === "MASTER_STOCK" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Dry-Mix Warehouse Inventory Statements</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculates precise visual summary blocks for current inventory levels of all active lines.</p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <span className="text-xs bg-slate-100 text-slate-650 border border-slate-200 px-3 py-1.5 rounded font-bold font-mono">
                  {masterStockReport.length} Item Catalogues
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  id="btn-print-stock-summary"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-650 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
                >
                  <Printer size={13} />
                  <span>PDF Stock Summary</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead className="bg-[#f8fafc] text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Item Category</th>
                    <th className="py-2.5 px-3 text-right">Safety Minimum Limit</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Current Stock balance</th>
                    <th className="py-2.5 px-3">UoM</th>
                    <th className="py-2.5 px-3 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-707">
                  {masterStockReport.map(item => {
                    const isLow = item.stock < item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.code}</td>
                        <td className="py-3 px-3 text-slate-900 font-bold">{item.name}</td>
                        <td className="py-3 px-3 text-slate-450 uppercase text-[10px]">{item.category}</td>
                        <td className="py-3 px-3 text-right font-mono">{item.minStock}</td>
                        <td className={`py-3 px-3 text-right font-mono font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.stock}</td>
                        <td className="py-3 px-3 uppercase text-slate-500">{item.unit}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded ${
                            isLow ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isLow ? 'REORDER NOW' : 'STABLE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PURCHASE BACKLOG Sheet */}
        {activeReport === "PURCHASE_BACKLOG" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Open Purchase Backlogs & Backorder Report</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">Details supplier raw-material backlogs that are currently outstanding.</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-150 px-3 py-1 rounded font-bold font-mono">
                {poReportData.filter(po => po.status !== 'Completed').length} Pending Orders
              </span>
            </div>

            {poReportData.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl">
                <p className="text-slate-500 text-xs">No procurement purchase orders booked.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8fafc] text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">PO Code</th>
                      <th className="py-2.5 px-3">Log Date</th>
                      <th className="py-2.5 px-3">Vendor</th>
                      <th className="py-2.5 px-3 text-right">Contracted Qty</th>
                      <th className="py-2.5 px-3 text-right">Inward Rec Qty</th>
                      <th className="py-2.5 px-3 text-right text-amber-700 font-semibold">Remaining Backlog Qty</th>
                      <th className="py-2.5 px-3">Order Status</th>
                      <th className="py-2.5 px-3 text-right">Fulfillment %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {poReportData.map(po => {
                      return (
                        <tr key={po.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{po.poNo}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{po.date}</td>
                          <td className="py-3 px-3 font-extrabold text-slate-950">{po.vendor}</td>
                          <td className="py-3 px-3 text-right font-mono">{po.totOrdered}</td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600">{po.totRec}</td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-600">{po.backlog}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex px-1.5 rounded text-[10px] font-bold ${
                              po.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                              po.status === 'Partial' ? 'bg-amber-50 text-amber-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {po.completion}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. SALES_FULFILLMENT Sheet */}
        {activeReport === "SALES_FULFILLMENT" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Outstanding Sales orders & dispatch Backlog</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assesses booking contracts, checking totals dispatched and remaining outbound backorders.</p>
              </div>
              <span className="text-xs bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded font-bold font-mono">
                {soReportData.filter(so => so.status !== 'Completed').length} Outstanding SOs
              </span>
            </div>

            {soReportData.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl">
                <p className="text-slate-505 text-xs">No client booking orders raised yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8fafc] text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">SO Code</th>
                      <th className="py-2.5 px-3">Booking Date</th>
                      <th className="py-2.5 px-3">Customer Consignee</th>
                      <th className="py-2.5 px-3 text-right">Sold Qty</th>
                      <th className="py-2.5 px-3 text-right">Total Dispatched</th>
                      <th className="py-2.5 px-3 text-right text-rose-700">Remaining backlog</th>
                      <th className="py-2.5 px-3">Order Status</th>
                      <th className="py-2.5 px-3 text-right">Fulfillment Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {soReportData.map(so => {
                      return (
                        <tr key={so.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{so.soNo}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{so.date}</td>
                          <td className="py-3 px-3 text-slate-950 font-bold">{so.customer}</td>
                          <td className="py-3 px-3 text-right font-mono">{so.totOrdered}</td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-blue-600">{so.totDisp}</td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-600">{so.backlog}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex px-1.5 rounded text-[10px] font-bold ${
                              so.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                              so.status === 'Partial' ? 'bg-amber-50 text-amber-700' :
                              'bg-indigo-50 text-indigo-700'
                            }`}>
                              {so.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {so.completion}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. QA_SAMPLING Sheet */}
        {activeReport === "QA_SAMPLING" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Laboratory Quality Assurance metrics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculates core QA parameters, lab audit pass rates, and tracking registries.</p>
              </div>
              <span className="text-xs bg-emerald-50 border border-emerald-110 text-emerald-700 px-3 py-1 rounded font-bold font-mono">
                Pass Rate: {samplingMetrics.passRate}%
              </span>
            </div>

            {/* QA KPIs row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Total lots sampled</span>
                <p className="text-lg font-black text-slate-900 font-mono">{samplingMetrics.total}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Cert Approved</span>
                <p className="text-lg font-black text-emerald-700 font-mono">{samplingMetrics.approved}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Cert Rejected</span>
                <p className="text-lg font-black text-rose-600 font-mono">{samplingMetrics.rejected}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Pending analysis</span>
                <p className="text-lg font-black text-amber-655 font-mono">{samplingMetrics.pending}</p>
              </div>
            </div>

            {samplings.length === 0 ? (
              <div className="text-center py-16 bg-white">
                <p className="text-slate-500 text-xs text-center">No quality assurance inspections completed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Inspection Logs ledger</h4>
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">QC Code</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Material Name</th>
                      <th className="py-2.5 px-3">Sample Volume</th>
                      <th className="py-2.5 px-3">Batch Lot Ref</th>
                      <th className="py-2.5 px-3 text-center">Testing status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {samplings.map(sample => (
                      <tr key={sample.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{sample.samplingNo}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{sample.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{sample.itemName}</td>
                        <td className="py-3 px-3 font-mono">{sample.qty} {sample.unit}</td>
                        <td className="py-3 px-3 font-mono uppercase text-indigo-700 font-bold">{sample.sourceNo}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            sample.status === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            sample.status === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' :
                            'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {sample.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
