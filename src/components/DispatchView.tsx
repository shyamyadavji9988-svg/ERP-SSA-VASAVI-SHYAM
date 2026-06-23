/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item, SalesOrder, DispatchRecord, DispatchItem } from '../types';
import BarcodeScannerInput from './BarcodeScannerInput';
import { Plus, Trash2, Eye, Truck, Navigation, FileText, Calendar, CheckSquare, X } from 'lucide-react';

interface DispatchViewProps {
  items: Item[];
  salesOrders: SalesOrder[];
  setSalesOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
  dispatches: DispatchRecord[];
  setDispatches: React.Dispatch<React.SetStateAction<DispatchRecord[]>>;
}

export default function DispatchView({
  items,
  salesOrders,
  setSalesOrders,
  dispatches,
  setDispatches
}: DispatchViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchRecord | null>(null);

  // Form Fields
  const [searchQuery, setSearchQuery] = useState("");
  const [dispatchNo, setDispatchNo] = useState("");
  const [linkedSOId, setLinkedSOId] = useState("");
  const [customer, setCustomer] = useState("");
  const [transporter, setTransporter] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState("");

  // Dispatch item list builder
  const [dispatchLines, setDispatchLines] = useState<{
    item: Item;
    qty: number;
    packingDescription: string;
  }[]>([]);

  // Item selector states
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [lineQty, setLineQty] = useState<number>(0);
  const [packingDesc, setPackingDesc] = useState<string>("");

  const handleScanSuccess = (item: Item) => {
    setSelectedItem(item);
    setLineQty(1);
  };

  const handleManualItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const item = items.find(it => it.id === e.target.value);
    setSelectedItem(item || null);
    if (item) setLineQty(1);
  };

  // When SO linkage is changed, auto populate Customer and line drafts
  const handleSOSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const soId = e.target.value;
    setLinkedSOId(soId);

    if (soId === "DIRECT") {
      setCustomer("");
      setDispatchLines([]);
      return;
    }

    const matchedSO = salesOrders.find(so => so.id === soId);
    if (matchedSO) {
      setCustomer(matchedSO.customer);

      // Auto-load outstanding lines that have some ordered quantity remaining to dispatch
      const soLines = matchedSO.items
        .map(si => {
          const matchedItem = items.find(it => it.id === si.itemId);
          const outstandingQty = Math.max(0, si.qty - si.dispatchedQty);
          if (matchedItem && outstandingQty > 0) {
            return {
              item: matchedItem,
              qty: outstandingQty,
              packingDescription: ""
            };
          }
          return null;
        })
        .filter(Boolean) as { item: Item; qty: number; packingDescription: string }[];

      setDispatchLines(soLines);
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

    setDispatchLines(prev => [...prev, {
      item: selectedItem,
      qty: lineQty,
      packingDescription: packingDesc.trim()
    }]);

    setSelectedItem(null);
    setLineQty(0);
    setPackingDesc("");
  };

  const handleRemoveLineItem = (index: number) => {
    setDispatchLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchNo.trim()) {
      alert("Dispatch number is required.");
      return;
    }
    if (!customer.trim()) {
      alert("Customer / Consignee name is required.");
      return;
    }
    if (!transporter.trim() || !vehicleNo.trim()) {
      alert("Transporter and Vehicle boundaries are required.");
      return;
    }
    if (dispatchLines.length === 0) {
      alert("Please add at least one material line to ship.");
      return;
    }

    const uniqueDispatchNo = dispatchNo.trim();
    const isLinked = linkedSOId && linkedSOId !== "DIRECT";
    const soNo = isLinked ? salesOrders.find(so => so.id === linkedSOId)?.soNo || null : null;

    const finalItems: DispatchItem[] = dispatchLines.map((dl, idx) => ({
      id: `disp-item-${idx}-${Date.now()}`,
      itemId: dl.item.id,
      itemCode: dl.item.code,
      itemName: dl.item.name,
      unit: dl.item.unit,
      barcode: dl.item.barcodeValue,
      qty: dl.qty,
      packingDescription: dl.packingDescription ? dl.packingDescription : undefined
    }));

    const newDispatch: DispatchRecord = {
      id: `disp-${Date.now()}`,
      dispatchNo: uniqueDispatchNo,
      soId: isLinked ? linkedSOId : null,
      soNo,
      customer: customer.trim(),
      date,
      transporter: transporter.trim(),
      vehicleNo: vehicleNo.trim().toUpperCase(),
      items: finalItems,
      remarks: remarks.trim() ? remarks.trim() : undefined
    };

    // 1. Post Dispatch
    setDispatches(prev => [newDispatch, ...prev]);

    // 2. If Linked to SO, increase dispatched counters accordingly
    if (isLinked) {
      setSalesOrders(prevSOs => prevSOs.map(so => {
        if (so.id === linkedSOId) {
          const updatedLines = so.items.map(si => {
            const matchedDispItem = finalItems.find(dl => dl.itemId === si.itemId);
            if (matchedDispItem) {
              const nextDispatched = si.dispatchedQty + matchedDispItem.qty;
              return {
                ...si,
                dispatchedQty: nextDispatched
              };
            }
            return si;
          });

          // Check if SO is completely finished
          const allFinished = updatedLines.every(ul => ul.dispatchedQty >= ul.qty);

          return {
            ...so,
            status: allFinished ? 'Completed' : 'Partial',
            items: updatedLines
          };
        }
        return so;
      }));
    }

    // Reset Form
    setIsFormOpen(false);
    setDispatchNo("");
    setLinkedSOId("");
    setCustomer("");
    setTransporter("");
    setVehicleNo("");
    setDate(new Date().toISOString().substring(0, 10));
    setRemarks("");
    setDispatchLines([]);
  };

  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("");
  const uniqueCustomers = Array.from(new Set(dispatches.map(d => d.customer)));

  const filteredDispatches = dispatches.filter(disp => 
    ((disp.customer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (disp.dispatchNo || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCustomerFilter === "" || disp.customer === selectedCustomerFilter)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Outflow Logistics</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Dispatches & Gate Delivery</h2>
          <p className="text-xs text-slate-500">Record gate outs, log vehicle transports, and subtract physical inventory levels automatically upon delivery.</p>
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
            placeholder="Search Dispatch No..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
          />
          <button
            onClick={() => {
              setLinkedSOId("");
              setCustomer("");
              setDispatchLines([]);
              setIsFormOpen(true);
            }}
            id="btn-create-dispatch"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Post New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Dispatch List table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Dispatched Shipments Book</h3>
          <span className="font-mono text-xs bg-slate-100 border border-slate-250 text-slate-600 px-2 py-0.5 rounded font-bold">
            {dispatches.length} Dispatch Slips
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredDispatches.length === 0 ? (
            <div className="text-center py-16 bg-white" id="dispatch-empty-state">
              <Truck className="text-slate-350 mx-auto mb-2" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Dispatches Logged</h4>
              <p className="text-slate-500 text-xs mt-1">Post a new dispatch shipment to record logistics, reducing warehouse inventory automatically.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50 text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dispatch Pass</th>
                  <th className="py-3 px-4">Shipment Date</th>
                  <th className="py-3 px-4">Client / Consignee</th>
                  <th className="py-3 px-4">Transporter Carrier</th>
                  <th className="py-3 px-4 text-center">Vehicle Number</th>
                  <th className="py-3 px-4">Linked Contract (SO)</th>
                  <th className="py-3 px-4">Items Shipped</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                {filteredDispatches.map((disp) => (
                  <tr key={disp.id} id={`row-dispatch-${disp.id}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{disp.dispatchNo}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{disp.date}</td>
                    <td className="py-3 px-4 text-slate-950 font-bold">{disp.customer}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{disp.transporter}</td>
                    <td className="py-3 px-4 font-mono text-center font-bold text-slate-900">
                      <span className="bg-slate-100 border border-slate-250 px-2 py-0.5 rounded">
                        {disp.vehicleNo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700 uppercase">{disp.soNo || 'Direct Dispatch'}</td>
                    <td className="py-3 px-4 font-mono font-bold">{disp.items.length} items</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDispatch(disp)}
                        id={`btn-view-dispatch-${disp.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-semibold text-indigo-650 bg-indigo-50 border border-indigo-100 hover:bg-slate-100 transition cursor-pointer animate-pulse-none"
                      >
                        <Eye size={12} />
                        <span>View Pass</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Dispatch */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn" id="dispatch-form-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn my-8">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200 font-mono">Issue Dispatch delivery pass</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Decreases active stock quantities and generates tracking passes.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="p-6 space-y-5">
              {/* Linked parameters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/85">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dispatch Number *</label>
                  <input
                    type="text"
                    required
                    id="form-dispatch-no"
                    placeholder="E.g., DSP-4401"
                    value={dispatchNo}
                    onChange={(e) => setDispatchNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sales Order link (Optional)</label>
                  <select
                    id="select-so-linkage"
                    value={linkedSOId}
                    onChange={handleSOSelectChange}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm text-slate-700 font-mono"
                  >
                    <option value="">-- Choose Option --</option>
                    <option value="DIRECT">Direct Delivery / Standalone</option>
                    {salesOrders
                      .filter(so => so.status === 'Open' || so.status === 'Partial')
                      .map(so => (
                        <option key={so.id} value={so.id}>
                          {so.soNo} ({so.customer})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer / Consignee Name *</label>
                  <input
                    type="text"
                    required
                    id="form-dispatch-customer"
                    disabled={linkedSOId !== "DIRECT" && !!linkedSOId}
                    placeholder="E.g., Agarwal Construction"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm bg-white disabled:opacity-75 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Carrier / Transporter *</label>
                  <input
                    type="text"
                    required
                    id="form-dispatch-transporter"
                    placeholder="E.g., BlueDart Logistics"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none bg-white font-medium text-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle registration Number *</label>
                  <input
                    type="text"
                    required
                    id="form-dispatch-vehicle"
                    placeholder="E.g., MH-12-PQ-9081"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none uppercase font-mono font-bold"
                  />
                </div>
              </div>

              {/* Barcode Scanner block */}
              <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-4 space-y-3.5">
                <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider block">⚡ Scan Material Barcode to Dispatch</span>
                
                <BarcodeScannerInput
                  items={items}
                  onScanSuccess={handleScanSuccess}
                  label="Dispatch sweep scanner"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-1">
                  {/* Manual selector backup */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Catalogue Lookup</label>
                    <select
                      id="select-draft-dispatch-item"
                      value={selectedItem?.id || ""}
                      onChange={handleManualItemChange}
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Qty ({selectedItem?.unit || 'UoM'})
                    </label>
                    <input
                      type="number"
                      id="input-draft-dispatch-qty"
                      min={1}
                      placeholder="0"
                      value={lineQty === 0 ? "" : lineQty}
                      onChange={(e) => setLineQty(Number(e.target.value))}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    id="btn-add-draft-item-to-dispatch"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Add to dispatch Line
                  </button>
                </div>
                
                {selectedItem && (
                  <div className="mt-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Packing Description (Bags/Weight)</label>
                    <input
                      type="text"
                      placeholder="E.g., 2 Bags, 5000 pcs each, total weight 40kgs"
                      value={packingDesc}
                      onChange={(e) => setPackingDesc(e.target.value)}
                      className="w-full py-1.5 px-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                )}

                {selectedItem && (
                  <div className="bg-white p-2 border border-indigo-50/50 rounded flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-850 font-bold">{selectedItem.name} ({selectedItem.code})</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">{selectedItem.category}</span>
                  </div>
                )}
              </div>

              {/* Draft table lines */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Gate Dispatch Lines</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">UoM</th>
                        <th className="py-2.5 px-3">Unique Barcode Value</th>
                        <th className="py-2.5 px-3 text-right">Dispatch Out Qty</th>
                        <th className="py-2.5 px-3">Packing Description</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {dispatchLines.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 bg-white">
                            No items queued to dispatch. Scan material barcode tags to begin gate loading.
                          </td>
                        </tr>
                      ) : (
                        dispatchLines.map((dl, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-900 font-bold">{dl.item.code}</td>
                            <td className="py-2.5 px-3 text-slate-800 font-semibold">{dl.item.name}</td>
                            <td className="py-2.5 px-3 text-slate-500">{dl.item.unit}</td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{dl.item.barcodeValue}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">{dl.qty}</td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600">{dl.packingDescription || '-'}</td>
                            <td className="py-2.5 px-3 text-center animate-pulse-none">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Remarks */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dispatchremarks / trans pass (Optional)</label>
                  <textarea
                    id="form-dispatch-remarks"
                    placeholder="E.g., Sent under original challan, weight-verified on scale 2."
                    value={remarks}
                    rows={2}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Shipment Date</label>
                  <input
                    type="date"
                    required
                    id="form-dispatch-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs text-slate-850"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  id="btn-post-dispatch-final"
                  className="px-6 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
                >
                  Confirm Gate Pass dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Pass modal sheet */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="dispatch-detail-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded font-mono select-none">
                  SYSTEM SHIPPING GATE PASS
                </span>
                <h3 className="font-bold text-sm text-slate-200 mt-1 uppercase">PASS NO: {selectedDispatch.dispatchNo}</h3>
              </div>
              <button
                onClick={() => setSelectedDispatch(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 font-medium text-xs text-slate-600 mb-1">
                <div>
                  <span className="text-slate-400 block mb-0.5">Consignee Purchaser</span>
                  <span className="text-slate-950 font-extrabold text-sm block">{selectedDispatch.customer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Transporter Carrier</span>
                  <span className="text-slate-950 font-semibold block">{selectedDispatch.transporter}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Vehicle Plate No</span>
                  <span className="text-slate-950 font-mono text-indigo-700 block font-bold">{selectedDispatch.vehicleNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-right sm:text-left">Gate Release Date</span>
                  <span className="text-slate-900 font-mono text-sm block text-right sm:text-left">{selectedDispatch.date}</span>
                </div>
              </div>

              {/* Items Shipped */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Gate Release Lines</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f8fafc] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">Unit Of Measure</th>
                        <th className="py-2.5 px-3 font-semibold">Incline Label Barcode</th>
                        <th className="py-2.5 px-3 text-right">Shipped Qty</th>
                        <th className="py-2.5 px-3">Packing Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-705 font-medium">
                      {selectedDispatch.items.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono text-slate-900 font-bold">{line.itemCode}</td>
                          <td className="py-3 px-3 text-slate-800 font-semibold">{line.itemName}</td>
                          <td className="py-3 px-3 text-slate-500">{line.unit}</td>
                          <td className="py-3 px-3 font-mono text-slate-450 text-[10px]">{line.barcode}</td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">{line.qty} {line.unit}</td>
                          <td className="py-3 px-3 text-slate-600 text-xs">{line.packingDescription || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedDispatch.remarks && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <span className="font-bold text-slate-655 block mb-0.5">Scale Gate instructions:</span>
                  <p>{selectedDispatch.remarks}</p>
                </div>
              )}

              {/* Close footer */}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    import('../lib/pdfGenerator').then(({ generateDispatchPDF }) => {
                      generateDispatchPDF(selectedDispatch);
                    });
                  }}
                  className="px-4 py-1.5 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  <FileText size={14} />
                  Download Challan PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDispatch(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Close Shipping Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
