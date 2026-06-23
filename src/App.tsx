/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  loadERPState, 
  saveERPState, 
  calculateStockLedger 
} from './lib/erpState';
import { 
  Item, 
  OpeningBalance, 
  PurchaseOrder, 
  GoodsReceiptNote, 
  SalesOrder, 
  ProductionEntry, 
  DispatchRecord, 
  SamplingRecord, 
  UserProfile,
  BillOfMaterials
} from './types';

// Importing Views
import DashboardView from './components/DashboardView';
import ItemsMasterView from './components/ItemsMasterView';
import OpeningBalanceView from './components/OpeningBalanceView';
import PurchaseOrdersView from './components/PurchaseOrdersView';
import GRNView from './components/GRNView';
import SalesOrdersView from './components/SalesOrdersView';
import ProductionView from './components/ProductionView';
import SamplingView from './components/SamplingView';
import DispatchView from './components/DispatchView';
import StockLedgerView from './components/StockLedgerView';
import ReportsView from './components/ReportsView';
import BOMView from './components/BOMView';

// Lucide Icons
import { 
  Building2, 
  LayoutDashboard, 
  Layers, 
  Coins, 
  ShoppingBag, 
  Inbox, 
  FileText, 
  Wrench, 
  FlaskConical, 
  Truck, 
  Calendar, 
  TrendingUp, 
  User, 
  Menu, 
  X,
  UserCheck,
  ClipboardList
} from 'lucide-react';

type SideTab = 
  | 'DASHBOARD'
  | 'ITEMS'
  | 'BOM'
  | 'OPENING_BALANCE'
  | 'PO'
  | 'GRN'
  | 'SO'
  | 'PRODUCTION'
  | 'SAMPLING'
  | 'DISPATCH'
  | 'LEDGER'
  | 'REPORTS';

export default function App() {
  // Mobile sidebar drawer selector toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SideTab>('DASHBOARD');

  // Shared Core ERP State
  const [items, setItems] = useState<Item[]>([]);
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [openingBalances, setOpeningBalances] = useState<OpeningBalance[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [productions, setProductions] = useState<ProductionEntry[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [samplings, setSamplings] = useState<SamplingRecord[]>([]);
  const [user, setUser] = useState<UserProfile>({
    id: "admin-01",
    name: "Factory Operator",
    role: "Admin",
    email: "ops@savashavi.com"
  });

  // 1. Initial State Loading from LocalStorage on mount
  useEffect(() => {
    const loaded = loadERPState();
    setItems(loaded.items);
    setOpeningBalances(loaded.openingBalances);
    setPurchaseOrders(loaded.purchaseOrders);
    setGrns(loaded.grns);
    setSalesOrders(loaded.salesOrders);
    setProductions(loaded.productions);
    setDispatches(loaded.dispatches);
    setSamplings(loaded.samplings);
    if (loaded.boms) setBoms(loaded.boms);
    if (loaded.user) setUser(loaded.user);
  }, []);

  // 2. Active Serialization to state file on mutations
  useEffect(() => {
    // Exclude first empty load render
    if (items.length > 0) {
      saveERPState({
        items,
        openingBalances,
        purchaseOrders,
        grns,
        salesOrders,
        productions,
        dispatches,
        samplings,
        user,
        boms
      });
    }
  }, [items, openingBalances, purchaseOrders, grns, salesOrders, productions, dispatches, samplings, user, boms]);

  // 3. Dynamic Stock Ledger Calculations (computes running quantities)
  const { ledger, itemStockMap: currentStock } = useMemo(() => {
    return calculateStockLedger(items, openingBalances, grns, productions, dispatches);
  }, [items, openingBalances, grns, productions, dispatches]);

  // Sidebar list definitions
  const menuItems = [
    { id: 'DASHBOARD' as SideTab, label: 'ERP Dashboard', icon: LayoutDashboard },
    { id: 'ITEMS' as SideTab, label: 'Items Master', icon: Layers },
    { id: 'BOM' as SideTab, label: 'Bill of Materials', icon: ClipboardList },
    { id: 'OPENING_BALANCE' as SideTab, label: 'Opening Balance', icon: Coins },
    { id: 'PO' as SideTab, label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'GRN' as SideTab, label: 'Goods Receipt (GRN)', icon: Inbox },
    { id: 'SO' as SideTab, label: 'Sales Orders', icon: FileText },
    { id: 'PRODUCTION' as SideTab, label: 'Production Entry', icon: Wrench },
    { id: 'SAMPLING' as SideTab, label: 'Sampling & QA', icon: FlaskConical },
    { id: 'DISPATCH' as SideTab, label: 'Dispatch / Delivery', icon: Truck },
    { id: 'LEDGER' as SideTab, label: 'Stock Ledger', icon: Calendar },
    { id: 'REPORTS' as SideTab, label: 'Reports Desk', icon: TrendingUp },
  ];

  const handleNavigate = (tab: SideTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans tracking-tight antialiased">
      {/* 1. SIDEBAR (Desktop sidebar, slide-out drawer on mobile) */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-[#1e293b] flex flex-col transform lg:translate-x-0 transition-transform duration-200 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } print:hidden`}
      >
        {/* Brand Banner */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#1e293b] bg-[#0f172a] select-none">
          <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
            V
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-wider text-white uppercase leading-tight select-all">SSA VASAVI</h1>
            <span className="text-[9px] font-bold text-teal-500 block tracking-widest uppercase leading-tight">ENTERPRISES</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((menu) => {
            const Icon = menu.icon;
            const isActive = activeTab === menu.id;

            return (
              <button
                key={menu.id}
                onClick={() => handleNavigate(menu.id)}
                id={`sidebar-tab-${menu.id.toLowerCase()}`}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs transition cursor-pointer border-l-4 ${
                  isActive 
                    ? 'border-teal-500 bg-slate-800 text-white font-extrabold' 
                    : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white font-medium'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-teal-400' : 'text-slate-500'} />
                <span>{menu.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile Operator info block */}
        <div className="p-4 border-t border-[#1e293b] bg-[#0f172a] text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-705 flex items-center justify-center">
              <User size={14} className="text-slate-400" />
            </div>
            <div>
              <span className="text-[10px] bg-slate-850 px-1.5 py-0.2 rounded text-slate-450 uppercase block font-bold font-mono">
                {user.role} Account
              </span>
              <p className="font-extrabold text-slate-200 mt-0.5">{user.name}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]/80 flex flex-col items-center">
            <span className="text-[9px] text-teal-500 uppercase tracking-widest font-bold mb-1">Ideation & Design By</span>
            <div className="px-3 py-1.5 bg-slate-800 rounded border border-slate-700 font-bold tracking-widest text-[#f8fafc] text-[10px] uppercase">
              Shyam Yadav
            </div>
          </div>
        </div>
      </div>

      {/* Background shadow mask for mobile tray */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden print:hidden"
        ></div>
      )}

      {/* 2. BODY CONTAINER */}
      <div className="flex-1 lg:pl-64 print:pl-0 flex flex-col min-h-screen">
        {/* Top Header Row Panel */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-655 hover:bg-slate-100 rounded-lg transition"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-450 font-bold uppercase tracking-wider font-mono">
              <Building2 size={13} />
              <span>Plant operations cabin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs hidden sm:block">
              <span className="font-bold text-slate-800 block">SSA Vasavi Enterprises Portal</span>
              <p className="text-[10px] text-slate-450 mt-0.5 uppercase tracking-wide">Live Database LocalStorage Sync</p>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-xs bg-teal-50 text-teal-700 font-bold border border-teal-100 px-3 py-1.5 rounded-lg shadow-2xs">
              <UserCheck size={14} className="text-teal-600" />
              <span>Operator Office</span>
            </div>
          </div>
        </header>

        {/* Core dynamic content chassis view */}
        <main className="flex-grow p-6 md:p-8 print:p-0 space-y-6">
          {activeTab === 'DASHBOARD' && (
            <DashboardView 
              items={items}
              openingBalances={openingBalances}
              purchaseOrders={purchaseOrders}
              grns={grns}
              salesOrders={salesOrders}
              productions={productions}
              dispatches={dispatches}
              samplings={samplings}
              itemStockMap={currentStock}
              navigate={(tab) => handleNavigate(tab as any)}
            />
          )}

          {activeTab === 'ITEMS' && (
            <ItemsMasterView 
              items={items}
              setItems={setItems}
            />
          )}

          {activeTab === 'BOM' && (
            <BOMView 
              items={items}
              boms={boms}
              setBoms={setBoms}
            />
          )}

          {activeTab === 'OPENING_BALANCE' && (
            <OpeningBalanceView 
              items={items}
              openingBalances={openingBalances}
              setOpeningBalances={setOpeningBalances}
            />
          )}

          {activeTab === 'PO' && (
            <PurchaseOrdersView 
              items={items}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
            />
          )}

          {activeTab === 'GRN' && (
            <GRNView 
              items={items}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              grns={grns}
              setGrns={setGrns}
              setSamplings={setSamplings}
            />
          )}

          {activeTab === 'SO' && (
            <SalesOrdersView 
              items={items}
              salesOrders={salesOrders}
              setSalesOrders={setSalesOrders}
            />
          )}

          {activeTab === 'PRODUCTION' && (
            <ProductionView 
              items={items}
              productions={productions}
              setProductions={setProductions}
              setSamplings={setSamplings}
            />
          )}

          {activeTab === 'SAMPLING' && (
            <SamplingView 
              items={items}
              samplings={samplings}
              setSamplings={setSamplings}
            />
          )}

          {activeTab === 'DISPATCH' && (
            <DispatchView 
              items={items}
              salesOrders={salesOrders}
              setSalesOrders={setSalesOrders}
              dispatches={dispatches}
              setDispatches={setDispatches}
            />
          )}

          {activeTab === 'LEDGER' && (
            <StockLedgerView 
              items={items}
              ledger={ledger}
            />
          )}

          {activeTab === 'REPORTS' && (
            <ReportsView 
              items={items}
              purchaseOrders={purchaseOrders}
              grns={grns}
              salesOrders={salesOrders}
              productions={productions}
              dispatches={dispatches}
              samplings={samplings}
              ledger={ledger}
              currentStock={currentStock}
            />
          )}
        </main>
      </div>
    </div>
  );
}
