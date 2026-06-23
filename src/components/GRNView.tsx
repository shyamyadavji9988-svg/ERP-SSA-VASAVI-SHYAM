/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, PurchaseOrder, GoodsReceiptNote, GRNItem, SamplingRecord } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { Plus, Trash2, Eye, FileSpreadsheet, Gift, ShieldAlert, Calendar, CheckCircle, ArrowRight, X } from 'lucide-react';

interface GRNViewProps {
  items: Item[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  grns: GoodsReceiptNote[];
  setGrns: React.Dispatch<React.SetStateAction<GoodsReceiptNote[]>>;
  setSamplings: React.Dispatch<React.SetStateAction<SamplingRecord[]>>;
}

export default function GRNView({
  items,
  purchaseOrders,
  setPurchaseOrders,
  grns,
  setGrns,
  setSamplings
}: GRNViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GoodsReceiptNote | null>(null);

  // Form Fields
  const [searchQuery, setSearchQuery] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [linkedPOId, setLinkedPOId] = useState<string>("");
  const [vendor, setVendor] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState("");

  // GRN items list builder
  const [grnItems, setGrnItems] = useState<{
    item: Item;
    qty: number;
    lotBatch: string;
    remarks: string;
  }[]>([]);

  // Item Selector states in the line builder
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [lineQty, setLineQty] = useState<number>(0);
  const [lineLot, setLineLot] = useState("LOT-A");
  const [lineRemarks, setLineRemarks] = useState("");

  const handleScanSuccess = (item: Item) => {
    setSelectedItem(item);
    setLineQty(1);
  };

  const handleManualItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = items.find(it => it.id === e.target.value);
    setSelectedItem(item || null);
    if (item) setLineQty(1);
  };

  // When PO is selected, auto-fill Vendor and populate items from that PO as potential entries
  const handlePOSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poId = e.target.value;
    setLinkedPOId(poId);
    
    if (poId === "DIRECT") {
      setVendor("");
      setGrnItems([]);
      return;
    }

    const matchedPO = purchaseOrders.find(po => po.id === poId);
    if (matchedPO) {
      setVendor(matchedPO.vendor);
      
      // Auto-fill GRN lines with items from the PO that are outstanding (qty > receivedQty)
      const poLines = matchedPO.items
        .map(pi => {
          const matchedItem = items.find(it => it.id === pi.itemId);
          const outstandingQty = Math.max(0, pi.qty - pi.receivedQty);
          if (matchedItem && outstandingQty > 0) {
            return {
              item: matchedItem,
              qty: outstandingQty,
              lotBatch: `LOT-${matchedPO.poNo.replace("PO-", "")}`,
              remarks: `Outstanding line from ${matchedPO.poNo}`
            };
          }
          return null;
        })
        .filter(Boolean) as { item: Item; qty: number; lotBatch: string; remarks: string }[];

      setGrnItems(poLines);
    }
  };

  const handleAddLineItem = () => {
    if (!selectedItem) {
      alert("Please select or scan an item first.");
      return;
    }
    if (lineQty <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    setGrnItems(prev => [...prev, {
      item: selectedItem,
      qty: lineQty,
      lotBatch: lineLot.trim() ? lineLot.trim().toUpperCase() : "LOT-A",
      remarks: lineRemarks.trim()
    }]);

    setSelectedItem(null);
    setLineQty(0);
    setLineLot("LOT-A");
    setLineRemarks("");
  };

  const handleRemoveLineItem = (index: number) => {
    setGrnItems(prev => prev.filter((_, i) => i !== index));
  };

  // Submit and log GRN
  const handleSaveGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnNo.trim()) {
      alert("GRN number is required.");
      return;
    }
    if (!vendor.trim()) {
      alert("Vendor name is required.");
      return;
    }
    if (!invoiceNo.trim()) {
      alert("Supplier Invoice Number is required.");
      return;
    }
    if (grnItems.length === 0) {
      alert("Please add at least one item to inward.");
      return;
    }

    const uniqueGrnNo = grnNo.trim();
    const isLinked = linkedPOId && linkedPOId !== "DIRECT";
    const poNo = isLinked ? purchaseOrders.find(po => po.id === linkedPOId)?.poNo || null : null;

    // Convert draft lines to full GRNItem objects
    const finalItems: GRNItem[] = grnItems.map((gi, idx) => ({
      id: `grn-item-${idx}-${Date.now()}`,
      itemId: gi.item.id,
      itemCode: gi.item.code,
      itemName: gi.item.name,
      unit: gi.item.unit,
      barcode: gi.item.barcodeValue,
      qty: gi.qty,
      lotBatch: gi.lotBatch,
      remarks: gi.remarks ? gi.remarks : undefined
    }));

    const newGRN: GoodsReceiptNote = {
      id: `grn-${Date.now()}`,
      grnNo: uniqueGrnNo,
      poId: isLinked ? linkedPOId : null,
      poNo,
      vendor: vendor.trim(),
      invoiceNo: invoiceNo.trim(),
      date,
      items: finalItems,
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    // 1. Save GRN
    setGrns(prev => [newGRN, ...prev]);

    // 2. If linked to PO, increase received quantity on matching PO lines
    if (isLinked) {
      setPurchaseOrders(prevPOs => prevPOs.map(po => {
        if (po.id === linkedPOId) {
          const updatedLines = po.items.map(pi => {
            const matchedGrnItem = finalItems.find(gi => gi.itemId === pi.itemId);
            if (matchedGrnItem) {
              const nextReceived = pi.receivedQty + matchedGrnItem.qty;
              return {
                ...pi,
                receivedQty: nextReceived
              };
            }
            return pi;
          });

          // Check if PO is completely fulfilled
          const allFulfilled = updatedLines.every(ul => ul.receivedQty >= ul.qty);

          return {
            ...po,
            status: allFulfilled ? 'Completed' : 'Partial',
            items: updatedLines
          };
        }
        return po;
      }));
    }

    // 3. AUTOMATIC ROUTING TO QUALITY INSPECTIONS (SAMPLING MODULE)
    const samplingRequirements: SamplingRecord[] = [];
    finalItems.forEach((gi) => {
      // Find core category
      const catalogItem = items.find(it => it.id === gi.itemId);
      if (catalogItem && (catalogItem.category === "Raw Material" || catalogItem.category === "Chemicals")) {
        samplingRequirements.push({
          id: `sample-${gi.itemId}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          samplingNo: `QC-${Date.now().toString().substring(7)}`,
          date,
          itemId: gi.itemId,
          itemCode: gi.itemCode,
          itemName: gi.itemName,
          barcode: gi.barcode,
          unit: gi.unit,
          qty: Number((gi.qty * 0.05).toFixed(2)) || 1, // sample default is 5% of weight
          status: 'Pending Review',
          sourceType: 'GRN',
          sourceNo: gi.lotBatch,
          remarks: `Inspection lot created automatically from GRN: ${uniqueGrnNo}, Invoice: ${invoiceNo.trim()}`
        });
      }
    });

    if (samplingRequirements.length > 0) {
      setSamplings(prev => [...samplingRequirements, ...prev]);
    }

    // Reset and close
    setIsFormOpen(false);
    setGrnNo("");
    setLinkedPOId("");
    setVendor("");
    setInvoiceNo("");
    setDate(new Date().toISOString().substring(0, 10));
    setRemarks("");
    setGrnItems([]);
  };

  const [selectedVendorFilter, setSelectedVendorFilter] = useState("");
  const uniqueVendors = Array.from(new Set(grns.map(g => g.vendor)));

  const filteredGRNs = grns.filter(grn => 
    ((grn.vendor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (grn.grnNo || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedVendorFilter === "" || grn.vendor === selectedVendorFilter)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Material Gate Receipt</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Goods Receipt Notes (GRN)</h2>
          <p className="text-xs text-slate-500">Log inward deliveries, allocate trackable batch codes, and auto-route inspectable lots to quality assurance.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedVendorFilter}
            onChange={(e) => setSelectedVendorFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">All Vendors</option>
            {uniqueVendors.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Search GRN No..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
          />
          <button
            onClick={() => {
              setLinkedPOId("");
              setVendor("");
              setGrnItems([]);
              setIsFormOpen(true);
            }}
            id="btn-create-grn"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Inward Shipment (GRN)</span>
          </button>
        </div>
      </div>

      {/* GRN Archives */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Goods Inflow Ledger</h3>
          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
            {grns.length} GRN Documents
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredGRNs.length === 0 ? (
            <div className="text-center py-16 bg-white" id="grn-empty-state">
              <FileSpreadsheet className="text-slate-300 mx-auto mb-2" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Goods Receipts Found</h4>
              <p className="text-slate-500 text-xs mt-1">Post a goods receipt note (GRN) to register inward stock from suppliers.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">GRN Number</th>
                  <th className="py-3 px-4">Receipt Date</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Supplier Invoice</th>
                  <th className="py-3 px-4">Linked PO</th>
                  <th className="py-3 px-4">Categorized Lines</th>
                  <th className="py-3 px-4 text-right">Inward Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredGRNs.map((grn) => (
                  <tr key={grn.id} id={`row-grn-${grn.id}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{grn.grnNo}</td>
                    <td className="py-3 px-4 text-slate-500">{grn.date}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{grn.vendor}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{grn.invoiceNo}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{grn.poNo || 'Direct Intake'}</td>
                    <td className="py-3 px-4 font-mono">{grn.items.length} items</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedGRN(grn)}
                        id={`btn-view-grn-${grn.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-semibold text-indigo-650 bg-indigo-50 hover:bg-slate-100 border border-indigo-100 transition cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>View GRN</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create GRN Slip */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" id="grn-form-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn my-8">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200 font-mono">Create Goods Receipt Note (GRN)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Increases physical stock layout and logs trace properties.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGRN} className="p-6 space-y-5">
              {/* Core selection link to PO */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/85">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">GRN Number *</label>
                  <input
                    type="text"
                    required
                    id="form-grn-no"
                    placeholder="E.g., GRN-5001"
                    value={grnNo}
                    onChange={(e) => setGrnNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Optional PO Linkage</label>
                  <select
                    id="select-po-linkage"
                    value={linkedPOId}
                    onChange={handlePOSelectChange}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700 font-mono"
                  >
                    <option value="">-- Choose Option --</option>
                    <option value="DIRECT">Direct GRN / Standalone</option>
                    {purchaseOrders
                      .filter(po => po.status === 'Pending' || po.status === 'Partial')
                      .map(po => (
                        <option key={po.id} value={po.id}>
                          {po.poNo} ({po.vendor})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor / Provider Name *</label>
                  <input
                    type="text"
                    required
                    id="form-grn-vendor"
                    disabled={linkedPOId !== "DIRECT" && !!linkedPOId}
                    placeholder="E.g., UltraTech Cement"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Supplier Invoice Number *</label>
                  <input
                    type="text"
                    required
                    id="form-grn-invoice"
                    placeholder="E.g., UT/9281-22"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gate Entry Date</label>
                  <input
                    type="date"
                    required
                    id="form-grn-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Barcode scanner row line addition */}
              <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 space-y-3.5">
                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">⚡ Add Materials line via Barcode Scan</span>
                
                <BarcodeScannerInput
                  items={items}
                  onScanSuccess={handleScanSuccess}
                  label="Inward Scanner Port"
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
                  {/* Manual selector backup */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Catalogue Lookup</label>
                    <select
                      id="select-draft-grn-item"
                      value={selectedItem?.id || ""}
                      onChange={handleManualItemChange}
                      className="w-full py-1.5 px-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none text-slate-700"
                    >
                      <option value="">-- Select Item --</option>
                      {items
                        .filter(i => i.status === "Active")
                        .map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Qty ({selectedItem?.unit || 'UoM'})
                    </label>
                    <input
                      type="number"
                      id="input-draft-grn-qty"
                      min={1}
                      placeholder="0"
                      value={lineQty === 0 ? "" : lineQty}
                      onChange={(e) => setLineQty(Number(e.target.value))}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>

                  {/* Lot / Batch */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inward Lot / Batch Code</label>
                    <input
                      type="text"
                      id="input-draft-grn-lot"
                      placeholder="LOT-A"
                      value={lineLot}
                      onChange={(e) => setLineLot(e.target.value)}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-800"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    id="btn-add-draft-item-to-grn"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Add to GRN Slip
                  </button>
                </div>

                {selectedItem && (
                  <div className="bg-white p-2 border border-indigo-50/50 rounded flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-bold">{selectedItem.name} ({selectedItem.code})</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">{selectedItem.category}</span>
                  </div>
                )}
              </div>

              {/* GRN lines table list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inward Receipt Lines</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">UoM</th>
                        <th className="py-2.5 px-3">Lot/Batch Number</th>
                        <th className="py-2.5 px-3 text-right">Inward Qty</th>
                        <th className="py-2.5 px-3">Remarks</th>
                        <th className="py-2.5 px-3 text-center">Quality Track</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {grnItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 bg-white">
                            No materials added to this GRN slip yet. Scan or select from PO.
                          </td>
                        </tr>
                      ) : (
                        grnItems.map((gi, idx) => {
                          const needsSample = gi.item.category === "Raw Material" || gi.item.category === "Chemicals";
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-slate-900 font-bold">{gi.item.code}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-semibold">{gi.item.name}</td>
                              <td className="py-2.5 px-3 text-slate-550">{gi.item.unit}</td>
                              <td className="py-2.5 px-3 font-mono text-indigo-700 uppercase">{gi.lotBatch}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">{gi.qty}</td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[150px] truncate">{gi.remarks || '—'}</td>
                              <td className="py-2.5 px-3 text-center">
                                {needsSample ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 animate-pulse">
                                    Sampling Mandatory
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-semibold">Direct Intake</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extra terms */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Invoice Ledger Remarks</label>
                <textarea
                  id="form-grn-remarks"
                  placeholder="E.g., Vehicle HR-26-BK-4091 entered gate at 10:15 AM."
                  value={remarks}
                  rows={2}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 px-2 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-705 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-post-grn-final"
                  className="px-6 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
                >
                  Post Goods Receipt Note (GRN)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN details sheet */}
      {selectedGRN && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="grn-detail-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded font-mono select-none">
                  SYSTEM STOCK INWARD RECEIPT
                </span>
                <h3 className="font-bold text-sm text-slate-200 mt-1 uppercase">GRN REference: {selectedGRN.grnNo}</h3>
              </div>
              <button
                onClick={() => setSelectedGRN(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Header block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 font-medium text-xs text-slate-600 mb-2">
                <div>
                  <span className="text-slate-400 block mb-0.5">Supplier / Vendor</span>
                  <span className="text-slate-950 font-extrabold text-sm block">{selectedGRN.vendor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Invoice Number</span>
                  <span className="text-slate-950 font-mono text-sm block font-bold">{selectedGRN.invoiceNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Inflow Date</span>
                  <span className="text-slate-900 font-mono text-sm block">{selectedGRN.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Linked Purchase order</span>
                  <span className="text-slate-900 font-mono text-sm block font-bold uppercase text-indigo-700">{selectedGRN.poNo || 'Direct Inward'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Receipt Lines</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">UoM</th>
                        <th className="py-2.5 px-3 font-semibold">Lot / Batch ID</th>
                        <th className="py-2.5 px-3 text-right">Receipt Quantity</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {selectedGRN.items.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-900 font-bold">{line.itemCode}</td>
                          <td className="py-3 px-3 text-slate-800 font-semibold">{line.itemName}</td>
                          <td className="py-3 px-3 text-slate-500">{line.unit}</td>
                          <td className="py-3 px-3 font-mono text-indigo-600 uppercase font-semibold">{line.lotBatch}</td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">{line.qty}</td>
                          <td className="py-3 px-3 text-slate-500 max-w-[180px] truncate">{line.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedGRN.remarks && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold text-slate-650 block mb-0.5">Gate Pass Entry instructions:</span>
                  <p>{selectedGRN.remarks}</p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    import('../lib/pdfGenerator').then(({ generateGRNPDF }) => {
                      generateGRNPDF(selectedGRN);
                    });
                  }}
                  className="px-4 py-1.5 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGRN(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Close Receipt Reference
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
