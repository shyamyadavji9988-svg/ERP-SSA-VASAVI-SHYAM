/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, SalesOrder, SOItem } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { Plus, Trash2, Eye, Clipboard, DollarSign, Calendar, RefreshCw, X, FileText } from 'lucide-react';

interface SalesOrdersViewProps {
  items: Item[];
  salesOrders: SalesOrder[];
  setSalesOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
}

export default function SalesOrdersView({
  items,
  salesOrders,
  setSalesOrders
}: SalesOrdersViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);

  // Form states
  const [soNo, setSoNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState("");
  const [soStatus, setSoStatus] = useState<'Open' | 'Partial' | 'Completed' | 'Cancelled'>('Open');

  // Draft items in form
  const [draftItems, setDraftItems] = useState<{
    item: Item;
    qty: number;
    rate: number;
    tax: number; // GST%
  }[]>([]);

  // Item Selector states in form draft panel
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

  const handleAddDraftItem = () => {
    if (!selectedItem) {
      alert("Please select or scan an item first.");
      return;
    }
    if (draftQty <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

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

    setSelectedItem(null);
    setDraftQty(0);
    setDraftRate(0);
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!soNo.trim()) {
      alert("SO Number is required.");
      return;
    }
    if (!customer.trim()) {
      alert("Customer name is required.");
      return;
    }
    if (draftItems.length === 0) {
      alert("Please add at least one item to raise Sales Order.");
      return;
    }

    const uniqueSoNo = soNo.trim();

    const finalItems: SOItem[] = draftItems.map((di, idx) => {
      const taxable = di.qty * di.rate;
      const gstAmt = taxable * (di.tax / 100);
      return {
        id: `so-item-${idx}-${Date.now()}`,
        itemId: di.item.id,
        itemCode: di.item.code,
        itemName: di.item.name,
        unit: di.item.unit,
        barcode: di.item.barcodeValue,
        qty: di.qty,
        rate: di.rate,
        dispatchedQty: 0, // initially zero
        taxPercent: di.tax,
        amount: taxable + gstAmt
      };
    });

    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      soNo: uniqueSoNo,
      customer: customer.trim(),
      date,
      status: soStatus,
      items: finalItems,
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    setSalesOrders(prev => [newSO, ...prev]);

    // Reset and close
    setIsFormOpen(false);
    setSoNo("");
    setCustomer("");
    setDate(new Date().toISOString().substring(0, 10));
    setRemarks("");
    setSoStatus("Open");
    setDraftItems([]);
  };

  const updateSOStatus = (soId: string, newStatus: any) => {
    setSalesOrders(prev => prev.map(so => {
      if (so.id === soId) {
        return { ...so, status: newStatus };
      }
      return so;
    }));
    if (selectedSO && selectedSO.id === soId) {
      setSelectedSO(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Draft calculations
  const draftSubtotal = draftItems.reduce((sum, di) => sum + (di.qty * di.rate), 0);
  const draftTaxTotal = draftItems.reduce((sum, di) => sum + (di.qty * di.rate * (di.tax / 100)), 0);
  const draftGrandTotal = draftSubtotal + draftTaxTotal;

  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("");
  const uniqueCustomers = Array.from(new Set(salesOrders.map(so => so.customer)));

  const filteredSOs = salesOrders.filter(so => 
    ((so.customer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (so.soNo || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCustomerFilter === "" || so.customer === selectedCustomerFilter)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Outbound Sales Booking</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Sales Orders Book</h2>
          <p className="text-xs text-slate-500">Log customer sales contracts, compute commercial taxes, and track outward dispatch balances in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCustomerFilter}
            onChange={(e) => setSelectedCustomerFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">All Customers</option>
            {uniqueCustomers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Search SO No..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
          />
          <button
            onClick={() => setIsFormOpen(true)}
            id="btn-create-so"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Raise New Sales Order</span>
          </button>
        </div>
      </div>

      {/* SO Ledger List Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Contracted Sales Journals</h3>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 rounded font-bold">
            {salesOrders.length} Order Books
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredSOs.length === 0 ? (
            <div className="text-center py-16 bg-white" id="so-empty-state">
              <Clipboard className="text-slate-300 mx-auto mb-2" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Sales Orders Booked</h4>
              <p className="text-slate-500 text-xs mt-1">Raise a new sales order with customers to schedule warehousing dispatches.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SO Number</th>
                  <th className="py-3 px-4">Booking Date</th>
                  <th className="py-3 px-4">Client / Customer</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-right">Commercial Value</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-center">Dispatch Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSOs.map((so) => {
                  const itemsCount = so.items.length;
                  const soTotalValue = so.items.reduce((sum, item) => sum + item.amount, 0);

                  const totalOrdered = so.items.reduce((sum, i) => sum + i.qty, 0);
                  const totalDispatched = so.items.reduce((sum, i) => sum + i.dispatchedQty, 0);
                  const dispatchPercent = totalOrdered > 0 ? Math.round((totalDispatched / totalOrdered) * 100) : 0;

                  return (
                    <tr key={so.id} id={`row-so-${so.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{so.soNo}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{so.date}</td>
                      <td className="py-3 px-4 text-slate-950 font-bold">{so.customer}</td>
                      <td className="py-3 px-4 font-mono">{itemsCount} items</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-905">₹{soTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          so.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          so.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          so.status === 'Open' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {so.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${dispatchPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(dispatchPercent, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[9px] text-slate-500 font-bold">{dispatchPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right animate-pulse-none">
                        <button
                          onClick={() => setSelectedSO(so)}
                          id={`btn-view-so-${so.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium text-indigo-650 bg-indigo-50 hover:bg-slate-100 border border-indigo-100 hover:border-indigo-200 transition cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View SO</span>
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

      {/* Book SO slideover modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" id="so-form-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn my-8">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">Raise New Sales Order (SO)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Generates invoice contracts, specifies client parameters,-and hooks barcode values.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSO} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* SO Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">SO Number *</label>
                  <input
                    type="text"
                    required
                    id="form-so-no"
                    placeholder="E.g., SO-3001"
                    value={soNo}
                    onChange={(e) => setSoNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    id="form-so-customer"
                    placeholder="E.g., Agarwal Construction Group"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white text-slate-800"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">SO date</label>
                  <input
                    type="date"
                    required
                    id="form-so-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Order Status</label>
                  <select
                    id="form-so-status"
                    value={soStatus}
                    onChange={(e) => setSoStatus(e.target.value as any)}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700"
                  >
                    <option value="Open">Open (Pending Dispatch)</option>
                    <option value="Partial">Partial (In shipment)</option>
                    <option value="Completed">Completed (Settled)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Barcode scan addition line item */}
              <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 space-y-3.5 animate-fadeIn">
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">⚡ Add Sales Lines via Barcode scan</span>

                <BarcodeScannerInput
                  items={items}
                  onScanSuccess={handleScanSuccess}
                  label="Sales Gun scanner"
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
                  {/* Manual search lookup */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Catalogue Lookup</label>
                    <select
                      id="select-draft-so-item"
                      value={selectedItem?.id || ""}
                      onChange={handleManualItemSelect}
                      className="w-full py-1.5 px-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none text-slate-700 font-medium"
                    >
                      <option value="">-- Choose Item --</option>
                      {items
                        .filter(i => i.status === "Active")
                        .map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qty ({selectedItem?.unit || 'UoM'})</label>
                    <input
                      type="number"
                      id="input-draft-so-qty"
                      min={1}
                      placeholder="0"
                      value={draftQty === 0 ? "" : draftQty}
                      onChange={(e) => setDraftQty(Number(e.target.value))}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>

                  {/* Buying Rate */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Selling Price Rate (INR)</label>
                    <input
                      type="number"
                      id="input-draft-so-rate"
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
                    onClick={handleAddDraftItem}
                    id="btn-add-draft-item-to-so"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Add Sales Line
                  </button>
                </div>

                {selectedItem && (
                  <div className="bg-white p-2.5 rounded-lg border border-rose-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-rose-950 font-bold">{selectedItem.name} ({selectedItem.code})</span>
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 rounded">{selectedItem.category}</span>
                  </div>
                )}
              </div>

              {/* Draft list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sales Lines Draft</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3 text-right">Selling Qty</th>
                        <th className="py-2.5 px-3 text-right">Selling Price (₹)</th>
                        <th className="py-2.5 px-3 text-right">GST %</th>
                        <th className="py-2.5 px-3 text-right">Line Total (INC. GST)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                      {draftItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 bg-white">
                            No sales lines drafted. Scan material barcode tags above to begin invoicing.
                          </td>
                        </tr>
                      ) : (
                        draftItems.map((di, idx) => {
                          const lineTot = di.qty * di.rate;
                          const lineTotIncGst = lineTot * (1 + di.tax / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-mono text-slate-900 font-bold">{di.item.code}</td>
                              <td className="py-2 px-3 text-slate-800">{di.item.name}</td>
                              <td className="py-2 px-3 text-slate-500">{di.item.unit}</td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">{di.qty}</td>
                              <td className="py-2 px-3 text-right font-mono">₹{di.rate.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">{di.tax}%</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">₹{lineTotIncGst.toFixed(2)}</td>
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

                {/* Subtotals card */}
                <div className="flex justify-end pt-1">
                  <div className="w-80 space-y-1.5 text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div className="flex justify-between">
                      <span>Commercial Base total:</span>
                      <span className="font-mono text-slate-900 font-semibold">₹{draftSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contract Tax (GST):</span>
                      <span className="font-mono text-slate-900 font-semibold">₹{draftTaxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/80 pt-2 text-sm font-bold text-indigo-950">
                      <span>Contract Grand Total:</span>
                      <span className="font-mono text-indigo-700 font-extrabold">₹{draftGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contract terms / dispatch instructions (Optional)</label>
                <textarea
                  id="form-so-remarks"
                  placeholder="E.g., Delivery via Vasavi Cargo, fragile packaging required."
                  value={remarks}
                  rows={2}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              {/* Modal footer actions */}
              <div className="flex items-center justify-end gap-2 px-2 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-save-so"
                  className="px-6 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
                >
                  Raise Booking Order (SO)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SO Detail View */}
      {selectedSO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="so-detail-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded font-mono select-none">
                  SYSTEM CUSTOMER ORDER BOOK
                </span>
                <h3 className="font-bold text-sm text-slate-200 mt-1 uppercase">SO REFERENCE: {selectedSO.soNo}</h3>
              </div>
              <button
                onClick={() => setSelectedSO(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 font-medium text-xs text-slate-600 mb-1">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Purchaser / Customer</span>
                    <span className="text-slate-950 font-extrabold text-sm block">{selectedSO.customer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Booking Date</span>
                    <span className="text-slate-909 font-mono text-sm block">{selectedSO.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Order Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        selectedSO.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        selectedSO.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {selectedSO.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Manual Overrides</span>
                    <select
                      id="select-override-so-status"
                      value={selectedSO.status}
                      onChange={(e) => updateSOStatus(selectedSO.id, e.target.value)}
                      className="mt-0.5 py-0.5 px-2 bg-white border border-slate-200 rounded text-[10px] focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="Partial">Partial</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items detail list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contracted Items</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">UoM</th>
                          <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                          <th className="py-2.5 px-3 text-right font-semibold text-blue-700">Dispatched Out Qty</th>
                          <th className="py-2.5 px-3 text-right font-semibold text-amber-700">Contract Balance Qty</th>
                          <th className="py-2.5 px-3 text-right">Selling Rate</th>
                          <th className="py-2.5 px-3 text-right">GST %</th>
                          <th className="py-2.5 px-3 text-right">Grand Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {selectedSO.items.map((line) => {
                          const balance = line.qty - line.dispatchedQty;
                          return (
                            <tr key={line.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-mono text-slate-900 font-bold">{line.itemCode}</td>
                              <td className="py-3 px-3 text-slate-800 font-semibold">{line.itemName}</td>
                              <td className="py-3 px-3 text-slate-500">{line.unit}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{line.qty}</td>
                              <td className="py-3 px-3 text-right font-mono text-blue-600 font-bold">{line.dispatchedQty}</td>
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

                {selectedSO.remarks && (
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-600 block mb-0.5">Booking contracted instructions:</span>
                    <p>{selectedSO.remarks}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    import('../lib/pdfGenerator').then(({ generateSalesOrderPDF }) => {
                      generateSalesOrderPDF(selectedSO);
                    });
                  }}
                  className="px-4 py-1.5 flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  <FileText size={14} />
                  Download Order PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSO(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Close Document Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
