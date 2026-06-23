/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, ProductionEntry, SamplingRecord } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { Plus, Trash2, Calendar, ClipboardCheck, Play, Sparkles, ShieldCheck } from 'lucide-react';

interface ProductionViewProps {
  items: Item[];
  productions: ProductionEntry[];
  setProductions: React.Dispatch<React.SetStateAction<ProductionEntry[]>>;
  setSamplings: React.Dispatch<React.SetStateAction<SamplingRecord[]>>;
}

export default function ProductionView({
  items,
  productions,
  setProductions,
  setSamplings
}: ProductionViewProps) {
  // Form fields
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [qty, setQty] = useState<number>(0);
  const [lotNo, setLotNo] = useState("LOT-PROD-A");
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
      alert("Produced quantity must be greater than zero.");
      return;
    }

    const uniqueProdNo = `PRD-${Date.now().toString().substring(6)}`;

    // Create a new production run entry
    const newProduction: ProductionEntry = {
      id: `prod-${Date.now()}`,
      productionNo: uniqueProdNo,
      date,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      barcode: selectedItem.barcodeValue,
      unit: selectedItem.unit,
      qty,
      lotNo: lotNo.trim() ? lotNo.trim().toUpperCase() : "LOT-PROD-A",
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    // 1. Save production entry (automatically increases stock via ledger re-calculation)
    setProductions(prev => [newProduction, ...prev]);

    // 2. AUTOMATIC SAMPLING ROUTING
    // If the produced item is a Finished Good or Chemical, it must go through quality control approval
    const isFinishedGoodOrChem = selectedItem.category === "Finished Goods" || selectedItem.category === "Chemicals";
    
    if (isFinishedGoodOrChem) {
      const sampleRecord: SamplingRecord = {
        id: `sample-${uniqueProdNo}-${Date.now()}`,
        samplingNo: `QC-${Date.now().toString().substring(7)}`,
        date,
        itemId: selectedItem.id,
        itemCode: selectedItem.code,
        itemName: selectedItem.name,
        barcode: selectedItem.barcodeValue,
        unit: selectedItem.unit,
        qty: Number((qty * 0.02).toFixed(2)) || 1.00, // 2% Quality Inspection volume
        status: 'Pending Review',
        sourceType: 'Production',
        sourceNo: lotNo.trim().toUpperCase(),
        remarks: `QA sampling lot queued instantly from batch production run ${uniqueProdNo}.`
      };

      setSamplings(prev => [sampleRecord, ...prev]);
    }

    // Reset Form
    setQty(0);
    setLotNo("LOT-PROD-A");
    setRemarks("");
    setSelectedItem(null);
  };

  const handleDelete = (id: string, prodNo: string) => {
    if (confirm(`Are you sure you want to revert the production run journal No: "${prodNo}"?\nAll related ledger entries will be updated accordingly.`)) {
      setProductions(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Dry-Mix & Plant Manufacturing</span>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Manufacturing Production Entries</h2>
        <p className="text-xs text-slate-500">Record plant manufacturing sessions, track lot batches, and auto-route dry-mix samples to testing inspection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200/60 rounded-xl shadow-sm p-4 space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <Play size={14} className="text-indigo-600 animate-pulse" /> Create Production Log
          </h3>

          <BarcodeScannerInput
            items={items}
            onScanSuccess={handleScanSuccess}
            label="Finished Goods Scan Gun"
          />

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Manual Lookup */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Item Lookup (Manual)
              </label>
              <select
                id="select-production-item"
                value={selectedItem?.id || ""}
                onChange={handleManualItemChange}
                className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-705"
              >
                <option value="">-- Choose Catalogue Item --</option>
                {items
                  .filter(it => it.status === "Active" && (it.category === "Finished Goods" || it.category === "Chemicals"))
                  .map(it => (
                    <option key={it.id} value={it.id}>
                      {it.code} - {it.name} ({it.unit})
                    </option>
                  ))}
              </select>
            </div>

            {/* Display matched item */}
            {selectedItem && (
              <div className="bg-slate-50 border border-indigo-100 p-2.5 rounded-lg space-y-1 text-xs">
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Production Target Identified</span>
                <p className="font-bold text-slate-900">{selectedItem.name}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 font-mono font-medium">
                  <span>Code: {selectedItem.code}</span>
                  <span>Category: {selectedItem.category}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Production Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Run Date / Shift
                </label>
                <input
                  type="date"
                  required
                  id="form-production-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Produced Qty ({selectedItem?.unit || 'UoM'})
                </label>
                <input
                  type="number"
                  required
                  id="form-production-qty"
                  min={1}
                  placeholder="0"
                  value={qty === 0 ? "" : qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Lot / Batch Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Batch Run Lot Number
              </label>
              <input
                type="text"
                required
                id="form-production-lot"
                placeholder="LOT-PROD-A"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-800"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Batch notes / Formulation code
              </label>
              <textarea
                id="form-production-remarks"
                placeholder="E.g., Formula putty code XL-4; additive composite optimized."
                value={remarks}
                rows={2}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs text-slate-700"
              ></textarea>
            </div>

            <button
              type="submit"
              id="btn-save-production-run"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
            >
              Post Production Output
            </button>
          </form>
        </div>

        {/* List of executions */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 space-y-4 overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Manufacturing Logs Journal</h3>
            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
              {productions.length} Shift Runs
            </span>
          </div>

          <div className="overflow-x-auto">
            {productions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg" id="production-empty-state">
                <ClipboardCheck className="text-slate-400 mx-auto mb-2" size={30} />
                <h4 className="text-slate-700 font-bold text-xs">No Production Runs Output</h4>
                <p className="text-slate-500 text-[10px] mt-1">Scan dry-mix products to record in-house manufacturing, auto-creating stock records and laboratory sample queues.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Run Number</th>
                    <th className="py-2.5 px-3">Shift Date</th>
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Batch Lot</th>
                    <th className="py-2.5 px-3 text-right">Output Qty</th>
                    <th className="py-2.5 px-3">Formulation Notes</th>
                    <th className="py-2.5 px-3 text-center">Quality Lot</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {productions.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-705">{p.productionNo}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{p.date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.itemCode}</td>
                        <td className="py-3 px-3 truncate max-w-[125px] text-slate-800">{p.itemName}</td>
                        <td className="py-3 px-3 font-mono uppercase text-[11px] text-indigo-600 font-bold">{p.lotNo}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{p.qty} {p.unit}</td>
                        <td className="py-3 px-3 text-slate-500 text-[10px] max-w-[140px] truncate">{p.remarks || '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-705 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            <ShieldCheck size={9} />
                            QC Queue
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDelete(p.id, p.productionNo)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
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
    </div>
  );
}
