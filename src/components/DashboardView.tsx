/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Item,
  OpeningBalance,
  PurchaseOrder,
  GoodsReceiptNote,
  SalesOrder,
  ProductionEntry,
  SamplingRecord,
  DispatchRecord,
  StockLedgerEntry
} from '../types';
import {
  Package,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  FileText,
  Warehouse,
  Truck,
  FlaskConical,
  ClipboardList,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';

interface DashboardViewProps {
  items: Item[];
  openingBalances: OpeningBalance[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  salesOrders: SalesOrder[];
  productions: ProductionEntry[];
  samplings: SamplingRecord[];
  dispatches: DispatchRecord[];
  itemStockMap: { [itemId: string]: number };
  navigate: (view: string) => void;
}

export default function DashboardView({
  items,
  openingBalances,
  purchaseOrders,
  grns,
  salesOrders,
  productions,
  samplings,
  dispatches,
  itemStockMap,
  navigate
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().substring(0, 10);

  // 1. KPI Calculations
  const totalItems = items.length;
  
  const lowStockItems = items.filter(it => {
    const currentStock = itemStockMap[it.id] || 0;
    return currentStock < it.minStock;
  });
  const lowStockCount = lowStockItems.length;

  const openPOs = purchaseOrders.filter(po => po.status === 'Pending' || po.status === 'Partial');
  const openSOs = salesOrders.filter(so => so.status === 'Open' || so.status === 'Partial');

  const todayGRNCount = grns.filter(grn => grn.date === todayStr).length;
  const todayProdCount = productions.filter(prod => prod.date === todayStr).length;
  const todayDispCount = dispatches.filter(disp => disp.date === todayStr).length;

  const pendingSampling = samplings.filter(s => s.status === 'Pending Review');
  const pendingSamplingQty = pendingSampling.reduce((sum, s) => sum + s.qty, 0);

  // Category statistics
  const categoryCount: { [key: string]: number } = {};
  items.forEach(item => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0f172a] to-teal-950 rounded-2xl p-6 md:p-8 text-white border border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MiIgaGVpZ2h0PSI0MiI+CjxwYXRoIGQ9Ik00MiAwSDBWMi4xSDQyVjBaIiBmaWxsPSIjMWUyOTNiIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgo8cGF0aCBkPSJNMCA0MlYwSDIuMVY0MkgwWiIgZmlsbD0iIzFlMjkzYiIgZmlsbC1vcGFjaXR5PSIwLjUiLz4KPC9zdmc+')] opacity-20" />
        
        <div className="relative z-10 flex gap-5 items-center w-full md:w-auto">
          {/* Logo Badge */}
          <div className="w-20 h-20 shrink-0 rounded-2xl bg-white flex items-center justify-center p-2 border border-slate-200 shadow-lg relative overflow-hidden group hover:scale-105 transition-transform">
            {/* Minimalist SVG Logo Placeholder */}
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="#E2E8F0" />
              <path d="M50 10 L85 30 L50 50 L15 30 Z" fill="#CBD5E1" />
              <text x="50" y="60" fontFamily="sans-serif" fontSize="24" fontWeight="800" textAnchor="middle" fill="#0F172A">VE</text>
            </svg>
            <div className="absolute inset-0 bg-slate-900/80 items-center justify-center hidden group-hover:flex transition">
              <span className="text-[9px] font-bold text-white text-center">Swap<br/>Logo</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full border border-teal-400/20">Enterprise Command Center</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">SYSTEM ONLINE</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1 drop-shadow-md">SSA Vasavi Enterprises</h1>
            <p className="text-teal-400 text-xs mt-1.5 font-bold uppercase tracking-wider">
              D-18 Sector-A5/6 Trans Delhi Signature City (Tronica City) Loni GZB 201102
            </p>
            <p className="text-slate-300 text-xs mt-1 font-medium max-w-md leading-relaxed">Next-generation resource tracking and intelligent manufacturing orchestration platform.</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:items-end gap-3 w-full md:w-auto">
          <div className="bg-slate-900/80 backdrop-blur px-5 py-3 rounded-xl border border-slate-700 shadow-inner w-full md:w-auto text-left md:text-right flex justify-between md:flex-col items-center md:items-end">
            <div>
              <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold block mb-0.5">Primary Architectural Concept</span>
              <span className="font-bold text-sm tracking-wide text-white uppercase text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white">Designed by Shyam Yadav</span>
            </div>
            <div className="md:mt-2 text-right">
              <span className="text-slate-500 text-[10px] tracking-widest font-bold uppercase block mb-0.5">Local Server Time</span>
              <span className="font-mono text-xs font-bold tracking-wider text-teal-400">{todayStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Item Master */}
        <div 
          onClick={() => navigate('items')}
          className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm cursor-pointer hover:shadow hover:border-slate-300 transition-all group"
          id="kpi-total-items"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Core Items Master</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
              <Package size={18} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">{totalItems}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>View Catalogue</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* KPI Low Stock Alert */}
        <div 
          onClick={() => navigate('reports')}
          className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer hover:shadow transition-all group ${
            lowStockCount > 0 ? "border-amber-200 bg-amber-50/20" : "border-slate-200/60"
          }`}
          id="kpi-low-stock"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Critical Alerts</span>
            <div className={`p-2 rounded-lg ${
              lowStockCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-500"
            }`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">{lowStockCount}</p>
          <div className="flex items-center gap-1 text-[11px] mt-2">
            <span className={lowStockCount > 0 ? "text-amber-700 font-medium" : "text-slate-500"}>
              {lowStockCount > 0 ? "Under Reorder Point" : "Stock Levels OK"}
            </span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* KPI Open PO */}
        <div 
          onClick={() => navigate('po')}
          className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm cursor-pointer hover:shadow hover:border-slate-300 transition-all group"
          id="kpi-open-po"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Inbound Pipeline</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <ClipboardList size={18} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">{openPOs.length}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Outstanding POs</span>
            <ChevronRight size={12} />
          </div>
        </div>

        {/* KPI Open SO */}
        <div 
          onClick={() => navigate('so')}
          className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm cursor-pointer hover:shadow hover:border-slate-300 transition-all group"
          id="kpi-open-so"
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Outbound Books</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <FileCheck size={18} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">{openSOs.length}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <span>Active Sales Orders</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Today Operations Grid */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mt-4 block">Today's Ledger Movements</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* GRN count */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs block font-medium">Inward Receipts (GRN)</span>
            <span className="font-mono text-xl font-bold text-slate-800">{todayGRNCount} entries</span>
          </div>
          <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
            <Warehouse size={18} />
          </div>
        </div>

        {/* Production count */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs block font-medium">Production Output</span>
            <span className="font-mono text-xl font-bold text-slate-800">{todayProdCount} runs</span>
          </div>
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Dispatch count */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs block font-medium">Dispatches Sent</span>
            <span className="font-mono text-xl font-bold text-slate-800">{todayDispCount} loads</span>
          </div>
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
            <Truck size={18} />
          </div>
        </div>

        {/* Quality control */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs block font-medium">Sampling Inspection</span>
            <span className="font-mono text-xl font-bold text-slate-800">{pendingSampling.length} lots ({pendingSamplingQty})</span>
          </div>
          <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700">
            <FlaskConical size={18} />
          </div>
        </div>
      </div>

      {/* Main Panel grid: Stock Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Stock Alerts panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="font-bold text-slate-900 text-base">Reorder & Stock Level Alert Warnings</h3>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-1 text-slate-600 rounded font-mono">
              Running Stock &lt; Minimum Stock
            </span>
          </div>

          <div className="overflow-x-auto">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">Perfect Stock Levels! No items are currently low.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase">
                    <th className="py-2.5">Item Code</th>
                    <th className="py-2.5">Item Name</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Min Stock</th>
                    <th className="py-2.5 text-right">Current Stock</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {lowStockItems.slice(0, 6).map((item) => {
                    const currentStock = itemStockMap[item.id] || 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono text-xs text-slate-800">{item.code}</td>
                        <td className="py-3 truncate max-w-[150px]">{item.name}</td>
                        <td className="py-3">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500">{item.minStock} {item.unit}</td>
                        <td className="py-3 text-right font-mono text-rose-600 font-bold">
                          {currentStock} {item.unit}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            Reorder
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Core Quick Workflow Navigation */}
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 text-base">Key ERP Workflows</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => navigate('opening')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition text-left cursor-pointer font-medium text-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded bg-teal-50 text-teal-600 text-xs font-bold">1</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Set Opening Stock</h4>
                  <p className="text-[11px] text-slate-500">Record fresh beginning balances</p>
                </div>
              </div>
              <ChevronRight size={15} />
            </button>

            <button
              onClick={() => navigate('po')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition text-left cursor-pointer font-medium text-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded bg-teal-50 text-teal-600 text-xs font-bold">2</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Create Purchase Order</h4>
                  <p className="text-[11px] text-slate-500">Add detailed structural POs</p>
                </div>
              </div>
              <ChevronRight size={15} />
            </button>

            <button
              onClick={() => navigate('grn')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition text-left cursor-pointer font-medium text-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded bg-emerald-50 text-emerald-600 text-xs font-bold">3</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Inward Inventory (GRN)</h4>
                  <p className="text-[11px] text-slate-500">Log GRN and increase physical stock</p>
                </div>
              </div>
              <ChevronRight size={15} />
            </button>

            <button
              onClick={() => navigate('production')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition text-left cursor-pointer font-medium text-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded bg-amber-50 text-amber-600 text-xs font-bold">4</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Production Entry</h4>
                  <p className="text-[11px] text-slate-500">Log manufactured output batches</p>
                </div>
              </div>
              <ChevronRight size={15} />
            </button>

            <button
              onClick={() => navigate('ledger')}
              className="flex items-center justify-between p-3 rounded-lg border border-teal-150 bg-teal-50/10 hover:bg-teal-50/30 hover:border-teal-200 transition text-left cursor-pointer font-medium text-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded bg-teal-600 text-white text-xs font-bold">
                  <ArrowRightLeft size={13} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Audit Stock Ledger</h4>
                  <p className="text-[11px] text-slate-500">Reconcile running balance inputs</p>
                </div>
              </div>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
