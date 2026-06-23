/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, OpeningBalance } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { Plus, Trash2, Calendar, Clipboard, Layers, FileSpreadsheet } from 'lucide-react';

interface OpeningBalanceViewProps {
  items: Item[];
  openingBalances: OpeningBalance[];
  setOpeningBalances: React.Dispatch<React.SetStateAction<OpeningBalance[]>>;
}

export default function OpeningBalanceView({
  items,
  openingBalances,
  setOpeningBalances
}: OpeningBalanceViewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Form fields
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [qty, setQty] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [lotBatch, setLotBatch] = useState("LOT-INIT");
  const [remarks, setRemarks] = useState("");

  const handleScanSuccess = (item: Item) => {
    setSelectedItem(item);
  };

  const handleManualItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = items.find(it => it.id === e.target.value);
    setSelectedItem(item || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert("Please select or scan an item first.");
      return;
    }
    if (qty <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    const newOpening: OpeningBalance = {
      id: `ob-${Date.now()}`,
      date,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      barcode: selectedItem.barcodeValue,
      qty,
      rate: rate > 0 ? rate : undefined,
      lotBatch: lotBatch.trim() ? lotBatch.trim() : undefined,
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    setOpeningBalances(prev => [newOpening, ...prev]);

    // Reset Form (Keeping date)
    setQty(0);
    setRate(0);
    setLotBatch("LOT-INIT");
    setRemarks("");
    setSelectedItem(null);
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Are you sure you want to revert the opening stock entry for item: "${code}"?`)) {
      setOpeningBalances(prev => prev.filter(ob => ob.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Inventory Intake Setup</span>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Opening Stock Intake</h2>
        <p className="text-xs text-slate-500">Log the initial physical warehouse stock. Recorded quantities are treating as opening balances in the stock ledger.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5">
            Log New Opening Stock
          </h3>

          {/* Unified Scanner */}
          <BarcodeScannerInput
            items={items}
            onScanSuccess={handleScanSuccess}
            label="Inward Scanner Gun"
          />

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Manual Selector Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Item Lookup (Manual)
              </label>
              <select
                id="select-manual-ob-item"
                value={selectedItem?.id || ""}
                onChange={handleManualItemChange}
                className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
              >
                <option value="">-- Choose Catalogue Item --</option>
                {items
                  .filter(it => it.status === "Active")
                  .map(it => (
                    <option key={it.id} value={it.id}>
                      {it.code} - {it.name} ({it.unit})
                    </option>
                  ))}
              </select>
            </div>

            {/* Display Auto-filled scan card */}
            {selectedItem && (
              <div className="bg-slate-50 border border-indigo-100/80 p-3 rounded-lg space-y-1" id="scan-feedback-box">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Linked Item Details (Match Success!)</span>
                <p className="text-xs font-bold text-slate-900">{selectedItem.name}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-medium text-slate-500 font-mono">
                  <span>Code: {selectedItem.code}</span>
                  <span>UoM: {selectedItem.unit}</span>
                  <span>Group: {selectedItem.category}</span>
                  <span>GST: {selectedItem.gst}%</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Intake Date
                </label>
                <input
                  type="date"
                  required
                  id="form-ob-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Quantity ({selectedItem?.unit || 'UoM'})
                </label>
                <input
                  type="number"
                  required
                  id="form-ob-qty"
                  min={1}
                  placeholder="0"
                  value={qty === 0 ? "" : qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rate */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Unit Cost Rate (Optional)
                </label>
                <input
                  type="number"
                  id="form-ob-rate"
                  min={0}
                  placeholder="0.00"
                  value={rate === 0 ? "" : rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              {/* Lot / Batch Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Lot / Batch Code
                </label>
                <input
                  type="text"
                  id="form-ob-lot"
                  placeholder="LOT-INIT"
                  value={lotBatch}
                  onChange={(e) => setLotBatch(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Remarks
              </label>
              <textarea
                id="form-ob-remarks"
                placeholder="E.g., Warehouse shelf A, physical verification done."
                value={remarks}
                rows={2}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs text-slate-700"
              ></textarea>
            </div>

            <button
              type="submit"
              id="btn-save-opening-balance"
              className="w-full py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
            >
              Post Initial Stock
            </button>
          </form>
        </div>

        {/* List of opening balances */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Opening Balance Records History</h3>
            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
              {openingBalances.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            {openingBalances.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg" id="ob-empty-state">
                <FileSpreadsheet className="text-slate-400 mx-auto mb-2" size={30} />
                <h4 className="text-slate-700 font-bold text-xs">No Opening Balances Found</h4>
                <p className="text-slate-500 text-[10px] mt-1">Scan items to post opening balances, establishing initial active raw materials and stock levels.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Lot/Batch</th>
                    <th className="py-2.5 px-3 text-right">Inward Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (INR)</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-right">Revert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {openingBalances.map((ob) => (
                    <tr key={ob.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{ob.date}</td>
                      <td className="py-3 px-3 font-mono text-slate-900 font-bold">{ob.itemCode}</td>
                      <td className="py-3 px-3 truncate max-w-[120px] text-slate-800">{ob.itemName}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-indigo-600">{ob.lotBatch || 'N/A'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{ob.qty}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{ob.rate ? `₹${ob.rate.toFixed(2)}` : '—'}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate text-[11px]">{ob.remarks || '—'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(ob.id, ob.itemCode)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
