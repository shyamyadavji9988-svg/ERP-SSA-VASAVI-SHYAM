/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, PurchaseOrder, POItem } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { Plus, Trash2, Eye, FileText, ShoppingCart, Calendar, CheckCircle, ChevronDown, RefreshCw, X } from 'lucide-react';

interface PurchaseOrdersViewProps {
  items: Item[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
}

export default function PurchaseOrdersView({
  items,
  purchaseOrders,
  setPurchaseOrders
}: PurchaseOrdersViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form main states
  const [poNo, setPoNo] = useState("");
  const [vendor, setVendor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));

  const [selectedVendorFilter, setSelectedVendorFilter] = useState("");
  const uniqueVendors = Array.from(new Set(purchaseOrders.map(po => po.vendor)));

  const filteredPOs = purchaseOrders.filter(po => 
    ((po.vendor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (po.poNo || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedVendorFilter === "" || po.vendor === selectedVendorFilter)
  );
  const [remarks, setRemarks] = useState("");
  const [poStatus, setPoStatus] = useState<'Pending' | 'Partial' | 'Completed' | 'Cancelled'>('Pending');

  // Draft Items (POItems list during creation)
  const [draftItems, setDraftItems] = useState<{
    item: Item;
    qty: number;
    rate: number;
    tax: number; // GST%
  }[]>([]);

  // Individual item currently being drafted inside the draft selector
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [draftQty, setDraftQty] = useState<number>(0);
  const [draftRate, setDraftRate] = useState<number>(0);
  const [draftTax, setDraftTax] = useState<number>(18);

  const handleScanSuccess = (item: Item) => {
    setSelectedItem(item);
    setDraftQty(1);
    setDraftRate(0);
    setDraftTax(item.gst);
  };

  const handleAddItemToDraft = () => {
    if (!selectedItem) {
      alert("Please select or scan an item first.");
      return;
    }
    if (draftQty <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    // Check if already in draft, then combine or add
    const alreadyIdx = draftItems.findIndex(di => di.item.id === selectedItem.id);
    if (alreadyIdx >= 0) {
      const updated = [...draftItems];
      updated[alreadyIdx].qty += draftQty;
      if (draftRate > 0) updated[alreadyIdx].rate = draftRate;
      setDraftItems(updated);
    } else {
      setDraftItems(prev => [...prev, {
        item: selectedItem,
        qty: draftQty,
        rate: draftRate,
        tax: draftTax
      }]);
    }

    // Reset item picker
    setSelectedItem(null);
    setDraftQty(0);
    setDraftRate(0);
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  };

  // Record completed PO
  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNo.trim()) {
      alert("PO Number is required.");
      return;
    }
    if (!vendor.trim()) {
      alert("Vendor name is required.");
      return;
    }
    if (draftItems.length === 0) {
      alert("Please add at least one item to the Purchase Order.");
      return;
    }

    const uniquePoNo = poNo.trim();

    const finalItems: POItem[] = draftItems.map((di, idx) => {
      const taxableVal = di.qty * di.rate;
      const gstAmt = taxableVal * (di.tax / 100);
      return {
        id: `po-item-${idx}-${Date.now()}`,
        itemId: di.item.id,
        itemCode: di.item.code,
        itemName: di.item.name,
        unit: di.item.unit,
        barcode: di.item.barcodeValue,
        qty: di.qty,
        rate: di.rate,
        receivedQty: 0, // initially zero
        taxPercent: di.tax,
        amount: taxableVal + gstAmt
      };
    });

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNo: uniquePoNo,
      vendor: vendor.trim(),
      date,
      status: poStatus,
      items: finalItems,
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    setPurchaseOrders(prev => [newPO, ...prev]);

    // Close and reset
    setIsFormOpen(false);
    setPoNo("");
    setVendor("");
    setDate(new Date().toISOString().substring(0, 10));
    setRemarks("");
    setPoStatus("Pending");
    setDraftItems([]);
  };

  // Change PO status manually
  const updatePOStatus = (poId: string, newStatus: any) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        return { ...po, status: newStatus };
      }
      return po;
    }));
    if (selectedPO && selectedPO.id === poId) {
      setSelectedPO(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleManualItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = items.find(it => it.id === e.target.value);
    if (item) {
      setSelectedItem(item);
      setDraftQty(1);
      setDraftRate(0);
      setDraftTax(item.gst);
    } else {
      setSelectedItem(null);
    }
  };

  // Calculate drafts totals
  const draftSubtotal = draftItems.reduce((sum, di) => sum + (di.qty * di.rate), 0);
  const draftTaxTotal = draftItems.reduce((sum, di) => sum + (di.qty * di.rate * (di.tax / 100)), 0);
  const draftGrandTotal = draftSubtotal + draftTaxTotal;

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Inbound Procurement</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Purchase Orders Manager</h2>
          <p className="text-xs text-slate-500">Record structured PO specifications, calculate taxes, and track pending receipt backlogs.</p>
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
            placeholder="Search PO No..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
          />
          <button
            onClick={() => setIsFormOpen(true)}
            id="btn-create-po"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Raise New PO</span>
          </button>
        </div>
      </div>

      {/* Main PO Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Purchase Order Journals</h3>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 rounded font-bold">
            {purchaseOrders.length} Journal Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredPOs.length === 0 ? (
            <div className="text-center py-16 bg-white" id="po-empty-state">
              <ShoppingCart className="text-slate-300 mx-auto mb-2" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Purchase Orders Raised</h4>
              <p className="text-slate-500 text-xs mt-1">Raise a new purchase order with materials to track supplier shipments.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">No. of Items</th>
                  <th className="py-3 px-4 text-right">Estimated Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Fulfill Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPOs.map((po) => {
                  const itemsCount = po.items.length;
                  const poTotal = po.items.reduce((sum, item) => sum + item.amount, 0);
                  
                  // Compute fulfillment ratio
                  const totalOrdered = po.items.reduce((sum, i) => sum + i.qty, 0);
                  const totalRecd = po.items.reduce((sum, i) => sum + i.receivedQty, 0);
                  const fulfillPercent = totalOrdered > 0 ? Math.round((totalRecd / totalOrdered) * 100) : 0;

                  return (
                    <tr key={po.id} id={`row-po-${po.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-650">{po.poNo}</td>
                      <td className="py-3 px-4 text-slate-500">{po.date}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{po.vendor}</td>
                      <td className="py-3 px-4 font-mono">{itemsCount} categories</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">₹{poTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          po.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          po.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          po.status === 'Pending' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${fulfillPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.min(fulfillPercent, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[9px] text-slate-500 font-bold">{fulfillPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPO(po)}
                          id={`btn-view-po-${po.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium text-indigo-650 bg-indigo-50 hover:bg-slate-100 border border-indigo-100 hover:border-indigo-200 transition cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View Detail</span>
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

      {/* Raised PO form slideover modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" id="po-form-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn my-8">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">Raise New Purchase Order (PO)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Authorizes material allocations and links automatic tax configurations.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                id="btn-close-po-modal"
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="p-6 space-y-5">
              {/* Main Fields Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">PO Number *</label>
                  <input
                    type="text"
                    required
                    id="form-po-no"
                    placeholder="E.g., PO-1011"
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Supplier / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    id="form-po-vendor"
                    placeholder="E.g., UltraTech Cement Ltd."
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    id="form-po-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Status</label>
                  <select
                    id="form-po-status"
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value as any)}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700"
                  >
                    <option value="Pending">Pending (Unfulfilled)</option>
                    <option value="Partial">Partial (Approved Shipment)</option>
                    <option value="Completed">Completed (Settled)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* BARCODE SCANNER ADD SECTION (STRICT REQUIREMENT) */}
              <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 space-y-3.5">
                <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">⚡ Add Items to PO Line</span>
                
                <BarcodeScannerInput
                  items={items}
                  onScanSuccess={handleScanSuccess}
                  label="Line Entry scan gun"
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
                  {/* Manual Dropdown Selector as Fallback */}
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Catalogue Lookup</label>
                    <select
                      id="select-draft-po-item"
                      value={selectedItem?.id || ""}
                      onChange={handleManualItemSelect}
                      className="w-full py-1.5 px-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                    >
                      <option value="">-- Choose Item --</option>
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
                      id="input-draft-po-qty"
                      min={1}
                      placeholder="0"
                      value={draftQty === 0 ? "" : draftQty}
                      onChange={(e) => setDraftQty(Number(e.target.value))}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit Buying Rate (INR)</label>
                    <input
                      type="number"
                      id="input-draft-po-rate"
                      min={0}
                      placeholder="0.00"
                      value={draftRate === 0 ? "" : draftRate}
                      onChange={(e) => setDraftRate(Number(e.target.value))}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={handleAddItemToDraft}
                    id="btn-add-draft-item-to-po"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Add Item to PO
                  </button>
                </div>

                {selectedItem && (
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-indigo-950 font-bold">{selectedItem.name} ({selectedItem.code})</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">{selectedItem.category}</span>
                  </div>
                )}
              </div>

              {/* Draft Table display items */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Lines Draft</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3 text-right">Order Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">GST %</th>
                        <th className="py-2.5 px-3 text-right">Line Total (INC. GST)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {draftItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 bg-white">
                            No items added to this PO yet. Use search or scanner above.
                          </td>
                        </tr>
                      ) : (
                        draftItems.map((di, idx) => {
                          const taxable = di.qty * di.rate;
                          const taxableIncGst = taxable * (1 + di.tax / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-mono text-slate-900 font-bold">{di.item.code}</td>
                              <td className="py-2 px-3 text-slate-800">{di.item.name}</td>
                              <td className="py-2 px-3 text-slate-500">{di.item.unit}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{di.qty}</td>
                              <td className="py-2 px-3 text-right font-mono">₹{di.rate.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">{di.tax}%</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">₹{taxableIncGst.toFixed(2)}</td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDraftItem(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition"
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

                {/* Totals */}
                <div className="flex justify-end pt-2">
                  <div className="w-80 space-y-1.5 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div className="flex justify-between">
                      <span>Total Before Tax:</span>
                      <span className="font-mono text-slate-900">₹{draftSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Tax Total:</span>
                      <span className="font-mono text-slate-900">₹{draftTaxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/80 pt-2 text-sm font-bold text-indigo-950">
                      <span>PO Grand Total:</span>
                      <span className="font-mono text-indigo-700">₹{draftGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Procurement Instructions / Terms (Optional)</label>
                <textarea
                  id="form-po-remarks"
                  placeholder="E.g., Payment within 30 days after GRN physical quality inspection."
                  value={remarks}
                  rows={2}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 px-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-close-form-bottom"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-record-po-final"
                  className="px-6 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
                >
                  Post Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO View Detail Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="po-detail-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded font-mono select-none">
                  SYSTEM PURCHASE JOURNAL
                </span>
                <h3 className="font-bold text-sm text-slate-200 mt-1 uppercase">PO Reference: {selectedPO.poNo}</h3>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 font-medium text-xs text-slate-600 mb-2">
                <div>
                  <span className="text-slate-400 block mb-0.5">Supplier / Vendor</span>
                  <span className="text-slate-950 font-bold text-sm block">{selectedPO.vendor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Order Date</span>
                  <span className="text-slate-900 font-mono text-sm block">{selectedPO.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Fulfillment State</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      selectedPO.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      selectedPO.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      {selectedPO.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Override Status Option</span>
                  <select
                    id="select-override-po-status"
                    value={selectedPO.status}
                    onChange={(e) => updatePOStatus(selectedPO.id, e.target.value)}
                    className="mt-0.5 py-0.5 px-2 bg-white border border-slate-200 rounded text-[10px] focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Order Lines</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">UoM</th>
                        <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                        <th className="py-2.5 px-3 text-right">Received Qty</th>
                        <th className="py-2.5 px-3 text-right">Backlog Balance</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">GST %</th>
                        <th className="py-2.5 px-3 text-right">Total (INC. GST)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {selectedPO.items.map((line) => {
                        const balance = line.qty - line.receivedQty;
                        return (
                          <tr key={line.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-mono text-slate-900 font-bold">{line.itemCode}</td>
                            <td className="py-3 px-3 text-slate-800">{line.itemName}</td>
                            <td className="py-3 px-3 text-slate-500">{line.unit}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold">{line.qty}</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">{line.receivedQty}</td>
                            <td className={`py-3 px-3 text-right font-mono font-bold ${balance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              {balance > 0 ? balance : 0}
                            </td>
                            <td className="py-3 px-3 text-right font-mono">₹{line.rate.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-500">{line.taxPercent}%</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{line.amount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPO.remarks && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                  <span className="font-bold text-slate-600 block mb-0.5">Procurement Remarks / Terms:</span>
                  <p className="text-slate-700">{selectedPO.remarks}</p>
                </div>
              )}

              {/* Close Bottom button */}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    import('../lib/pdfGenerator').then(({ generatePurchaseOrderPDF }) => {
                      generatePurchaseOrderPDF(selectedPO);
                    });
                  }}
                  className="px-4 py-1.5 flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  <FileText size={14} />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
