/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Item, StockLedgerEntry } from '../types';
import { Calendar, Search, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, Ban, HelpCircle } from 'lucide-react';

interface StockLedgerViewProps {
  items: Item[];
  ledger: StockLedgerEntry[];
}

export default function StockLedgerView({
  items,
  ledger
}: StockLedgerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTxType, setSelectedTxType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filters the calculated state ledger
  const filteredLedger = useMemo(() => {
    let result = [...ledger];

    // Filter by search term (item name, code, barcode, or transaction document no)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(entry => 
        entry.itemCode.toLowerCase().includes(term) ||
        entry.itemName.toLowerCase().includes(term) ||
        entry.barcode.toLowerCase().includes(term) ||
        entry.referenceNo.toLowerCase().includes(term)
      );
    }

    // Filter by transaction type
    if (selectedTxType !== "ALL") {
      result = result.filter(entry => entry.transactionType === selectedTxType);
    }

    // Filter by date range
    if (startDate) {
      result = result.filter(entry => entry.date >= startDate);
    }
    if (endDate) {
      result = result.filter(entry => entry.date <= endDate);
    }

    // Sort chronologically (newest first for audit visibility)
    return result.reverse();
  }, [ledger, searchTerm, selectedTxType, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Audit & Traceability</span>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Inventory Stock Ledger</h2>
        <p className="text-xs text-slate-500">Chronological ledger recording opening, inward (GRN & Production), and outward (Dispatch) transactions with running warehouse balances.</p>
      </div>

      {/* Filter and Search board */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 mb-4 text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
          <SlidersHorizontal size={14} className="text-indigo-600" />
          <span>Ledger Filter Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search phrase */}
          <div className="relative md:col-span-2">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Material / Barcode / Doc No</span>
            <div className="relative">
              <input
                type="text"
                id="ledger-search-input"
                placeholder="E.g., Item Code, Name, Barcode, Doc #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-1.5 pl-9 pr-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 text-slate-800"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Category</span>
            <select
              id="ledger-type-filter"
              value={selectedTxType}
              onChange={(e) => setSelectedTxType(e.target.value)}
              className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Opening Balance">Opening Balance</option>
              <option value="GRN">Goods Receipt Inward (GRN)</option>
              <option value="Production">In-House Production</option>
              <option value="Dispatch">Gate Dispatch Shipping</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start date</span>
            <div className="relative">
              <input
                type="date"
                id="ledger-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-755 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">End date</span>
            <div className="relative">
              <input
                type="date"
                id="ledger-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-755 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Clear buttons */}
        {(searchTerm || selectedTxType !== "ALL" || startDate || endDate) && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTxType("ALL");
                setStartDate("");
                setEndDate("");
              }}
              id="btn-clear-ledger-filters"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-650 hover:text-rose-700 bg-rose-50 border border-rose-100 hover:border-rose-200 px-3 py-1 rounded-lg transition overflow-hidden cursor-pointer"
            >
              Clear Live Filters
            </button>
          </div>
        )}
      </div>

      {/* Ledger lists Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden animate-fadeIn">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Chronological Stock Audit</h3>
          <span className="text-xs font-mono bg-teal-50 border border-teal-150 text-teal-700 px-2.5 py-0.5 rounded font-bold">
            {filteredLedger.length} Transaction Journals
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredLedger.length === 0 ? (
            <div className="text-center py-16 bg-white" id="ledger-empty-state">
              <Calendar className="text-slate-300 mx-auto mb-2" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Ledger Entries Match</h4>
              <p className="text-slate-500 text-xs mt-1">Adjust search strings or parameters to load historical warehouse balances.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-[#f8fafc] text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction Doc No</th>
                  <th className="py-3 px-4">Posting Date</th>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Barcode tag</th>
                  <th className="py-3 px-4">Transaction Category</th>
                  <th className="py-3 px-4 text-right">Qty Change</th>
                  <th className="py-3 px-4 text-right pr-6 font-semibold text-slate-800">UoM</th>
                  <th className="py-3 px-4 text-right font-bold text-teal-950 bg-teal-50/40">Ledger balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLedger.map((entry, index) => {
                  const itemRef = items.find(i => i.id === entry.itemId);
                  const itemUnit = itemRef ? itemRef.unit : 'Unit';
                  const isPositive = entry.qtyIn > 0;
                  const qtyChange = isPositive ? entry.qtyIn : -entry.qtyOut;

                  return (
                    <tr key={`${entry.id}-${index}`} id={`ledger-row-${entry.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-905">{entry.referenceNo}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{entry.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{entry.itemCode}</td>
                      <td className="py-3 px-4 truncate max-w-[150px] font-semibold text-slate-800">{entry.itemName}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{entry.barcode}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          entry.transactionType === 'Opening Balance' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          entry.transactionType === 'GRN' ? 'bg-emerald-50 text-emerald-750 border border-emerald-150' :
                          entry.transactionType === 'Production' ? 'bg-purple-50 text-purple-750 border border-purple-150' :
                          'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {entry.transactionType === 'Opening Balance' && <span>Opening</span>}
                          {entry.transactionType === 'GRN' && <span>Inward (GRN)</span>}
                          {entry.transactionType === 'Production' && <span>Manufacturing</span>}
                          {entry.transactionType === 'Dispatch' && <span>Dispatch Gate</span>}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+${qtyChange}` : qtyChange}
                      </td>
                      <td className="py-3 px-4 text-right pr-6 font-semibold text-slate-500">{itemUnit}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-teal-950 bg-teal-50/15">
                        {entry.runningBalance} {itemUnit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
