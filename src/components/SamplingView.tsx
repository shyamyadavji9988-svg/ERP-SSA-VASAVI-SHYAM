/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, SamplingRecord } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertOctagon, 
  FlaskConical, 
  HelpCircle, 
  FileCheck 
} from 'lucide-react';

interface SamplingViewProps {
  items: Item[];
  samplings: SamplingRecord[];
  setSamplings: React.Dispatch<React.SetStateAction<SamplingRecord[]>>;
}

export default function SamplingView({
  items,
  samplings,
  setSamplings
}: SamplingViewProps) {
  // Manual creation form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [qty, setQty] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [sourceType, setSourceType] = useState<'GRN' | 'Production' | 'Manual'>('Manual');
  const [sourceNo, setSourceNo] = useState("LOT-N/A");

  const handleScanSuccess = (item: Item) => {
    setSelectedItem(item);
  };

  const handleManualItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = items.find(it => it.id === e.target.value);
    setSelectedItem(item || null);
  };

  // Create Manual QC sample
  const handleSubmitSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert("Please select or scan an item first.");
      return;
    }
    if (qty <= 0) {
      alert("Sample material quantity must be greater than zero.");
      return;
    }

    const uniqueSampleNo = `QC-${Date.now().toString().substring(6)}`;

    const newSample: SamplingRecord = {
      id: `sample-${Date.now()}`,
      samplingNo: uniqueSampleNo,
      date,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      barcode: selectedItem.barcodeValue,
      unit: selectedItem.unit,
      qty,
      status: 'Pending Review',
      sourceType,
      sourceNo: sourceNo.trim() ? sourceNo.trim().toUpperCase() : "LOT-N/A",
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    setSamplings(prev => [newSample, ...prev]);

    // Reset Form
    setQty(0);
    setRemarks("");
    setSourceNo("LOT-N/A");
    setSelectedItem(null);
    setIsFormOpen(false);
  };

  // Change QC Status
  const handleUpdateStatus = (id: string, nextStatus: 'Approved' | 'Rejected') => {
    setSamplings(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: nextStatus,
          remarks: s.remarks 
            ? `${s.remarks} [Inspected: Marked ${nextStatus} on ${new Date().toISOString().substring(0, 10)}]`
            : `Inspected: Marked ${nextStatus} on ${new Date().toISOString().substring(0, 10)}.`
        };
      }
      return s;
    }));
  };

  // Delete Sample Record
  const handleDeleteSample = (id: string, samplingNo: string) => {
    if (confirm(`Are you sure you want to delete quality inspection record: "${samplingNo}"?\nAll historic logs will be permanently deleted.`)) {
      setSamplings(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">QA Laboratory Desk</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Quality Inspection & Sampling</h2>
          <p className="text-xs text-slate-500">Track raw material and finished dry-mix aggregate sample states, audit testing lots, and issue quality certifications.</p>
        </div>
        <button
          onClick={() => {
            setSourceType('Manual');
            setSourceNo("LOT-MANUAL");
            setSelectedItem(null);
            setIsFormOpen(true);
          }}
          id="btn-register-sample"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
        >
          <Plus size={15} />
          <span>Manual Sample Registration</span>
        </button>
      </div>

      {/* Main Table Inspection Desk */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase font-mono text-xs">
            <FlaskConical size={14} className="text-indigo-600" /> Laboratory testing logs
          </h3>
          <span className="text-xs font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 rounded font-bold">
            {samplings.length} Lot Registrants
          </span>
        </div>

        <div className="overflow-x-auto">
          {samplings.length === 0 ? (
            <div className="text-center py-16 bg-white" id="sampling-empty-state">
              <FlaskConical className="text-slate-300 mx-auto mb-2 animate-bounce" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Quality Samples registered</h4>
              <p className="text-slate-500 text-xs mt-1">Inflow Raw Materials or Finished Goods to register tracking samples automatically.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">QC Reference</th>
                  <th className="py-3 px-4">Log Date</th>
                  <th className="py-3 px-4">Material Code</th>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Sample Qty</th>
                  <th className="py-3 px-4">Lot Source</th>
                  <th className="py-3 px-4">Cert status</th>
                  <th className="py-3 px-4 text-slate-500">Inspection remarks</th>
                  <th className="py-3 px-4 text-right">Approve / Reject Certifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                {samplings.map((sample) => {
                  return (
                    <tr key={sample.id} id={`row-sample-${sample.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-650">{sample.samplingNo}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{sample.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{sample.itemCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 truncate max-w-[150px]">{sample.itemName}</td>
                      <td className="py-3 px-4 font-mono font-bold">{sample.qty} {sample.unit}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-[10px]">
                          <span className="font-bold text-slate-900">Lot: {sample.sourceNo}</span>
                          <span className="text-slate-450 font-semibold text-[9px] uppercase">Src: {sample.sourceType}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                          sample.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          sample.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {sample.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[150px] truncate" title={sample.remarks}>
                        {sample.remarks || 'Pending audit...'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sample.status === 'Pending Review' ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(sample.id, 'Approved')}
                                title="Approve QA release"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 cursor-pointer"
                              >
                                <CheckCircle size={11} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(sample.id, 'Rejected')}
                                title="Reject QC lot"
                                className="inline-flex items-center gap-1 px-1.5 py-1 text-[10px] rounded font-bold text-red-700 bg-red-50 hover:bg-red-105 border border-red-250 cursor-pointer"
                              >
                                <XCircle size={11} />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Certified Done</span>
                          )}

                          <button
                            onClick={() => handleDeleteSample(sample.id, sample.samplingNo)}
                            title="Remove QC log record"
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Sample creation modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="sample-form-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">Register Manual Lab Sample</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Add standalone items laboratory registrations for quality inspection.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSample} className="p-5 space-y-4">
              <BarcodeScannerInput
                items={items}
                onScanSuccess={handleScanSuccess}
                label="Lab Gun Scanner"
              />

              {/* Item select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Custom Item</label>
                <select
                  id="select-sample-item"
                  value={selectedItem?.id || ""}
                  onChange={handleManualItemChange}
                  className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700"
                >
                  <option value="">-- Choose Item --</option>
                  {items
                    .filter(i => i.status === "Active")
                    .map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                </select>
              </div>

              {selectedItem && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-indigo-150 text-xs">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Inspected Material</span>
                  <p className="font-bold text-slate-900">{selectedItem.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Run Desk Date</label>
                  <input
                    type="date"
                    required
                    id="form-sample-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm bg-white text-slate-800"
                  />
                </div>

                {/* Qty */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sample Qty ({selectedItem?.unit || 'UoM'})</label>
                  <input
                    type="number"
                    required
                    id="form-sample-qty"
                    min={0.1}
                    step={0.1}
                    placeholder="0"
                    value={qty === 0 ? "" : qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Source Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Source origin</label>
                  <select
                    id="form-sample-source"
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700"
                  >
                    <option value="Manual">Manual Inspection</option>
                    <option value="GRN">GRN Invoice Lot</option>
                    <option value="Production">Dry-mix production shift</option>
                  </select>
                </div>

                {/* Source No */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Batch Lot ID Reference</label>
                  <input
                    type="text"
                    id="form-sample-source-no"
                    placeholder="LOT-MANUAL"
                    value={sourceNo}
                    onChange={(e) => setSourceNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-800"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inspection Checklist / Code</label>
                <textarea
                  id="form-sample-remarks"
                  placeholder="E.g., Special humidity retention density check requested."
                  value={remarks}
                  rows={2}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-custom-sample"
                  className="px-5 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
                >
                  Post Sample Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
