/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Item } from '../types';
import { generateBarcodeValue } from '../lib/barcode';
import BarcodeRenderer from './BarcodeRenderer';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCcw, 
  X, 
  Check, 
  AlertCircle,
  Printer
} from 'lucide-react';

interface ItemsMasterViewProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

export default function ItemsMasterView({ items, setItems }: ItemsMasterViewProps) {
  // UI states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Raw Material");
  const [unit, setUnit] = useState("Bag (50kg)");
  const [gst, setGst] = useState(18);
  const [minStock, setMinStock] = useState(100);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [remarks, setRemarks] = useState("");

  const [importFieldError, setImportFieldError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Available Category Options
  const categories = ["Raw Material", "Finished Goods", "Packaging Materials", "Chemicals", "Spare Parts", "Consumables"];
  const units = ["Bag (50kg)", "Bag (20kg)", "Bag (25kg)", "MT", "Kg", "Pcs", "Litre", "Bndl"];

  // Open form for adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setCode("");
    setName("");
    setCategory("Raw Material");
    setUnit("Bag (50kg)");
    setGst(18);
    setMinStock(100);
    setStatus("Active");
    setRemarks("");
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setGst(item.gst);
    setMinStock(item.minStock);
    setStatus(item.status);
    setRemarks(item.remarks || "");
    setIsFormOpen(true);
  };

  // Save Item (Add or Edit)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    // Check code duplication (excluding current editing item)
    const exists = items.some(it => it.code.toLowerCase() === code.trim().toLowerCase() && (!editingItem || it.id !== editingItem.id));
    if (exists) {
      alert("Error: An item with this Item Code already exists!");
      return;
    }

    // Auto-generate unique barcode
    const barVal = generateBarcodeValue(code, name);

    if (editingItem) {
      // Edit
      setItems(prev => prev.map(it => it.id === editingItem.id ? {
        ...it,
        code: code.trim(),
        name: name.trim(),
        category,
        unit,
        gst,
        minStock,
        barcodeValue: barVal,
        status,
        remarks: remarks.trim() || undefined
      } : it));
    } else {
      // Add
      const newItem: Item = {
        id: `item-${Date.now()}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit,
        gst,
        minStock,
        barcodeValue: barVal,
        status,
        remarks: remarks.trim() || undefined
      };
      setItems(prev => [newItem, ...prev]);
    }

    setIsFormOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string, itemCode: string) => {
    if (confirm(`Are you sure you want to delete item "${itemCode}" from the master catalogue?\nThis will not delete historic ledger entries but may make auditing difficult.`)) {
      setItems(prev => prev.filter(it => it.id !== itemId));
    }
  };

  // Admin-only regenerate all barcodes logic
  const handleRegenerateAllBarcodes = () => {
    if (confirm("ADMIN PERMISSION REQ:\nAre you sure you want to RE-GENERATE barcode values for ALL items in the master catalogue?\nNew barcode values will be computed using current Item Code + Item Name logic.")) {
      setItems(prev => prev.map(item => ({
        ...item,
        barcodeValue: generateBarcodeValue(item.code, item.name)
      })));
      alert("Successfully re-calculated and synchronized all item barcodes in database.");
    }
  };

  const handlePrintAllBarcodes = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) return;

    let svgsHtml = items.filter(it => it.barcodeValue).map(item => {
      // Find the SVG element from the current DOM rendering, or we can manually invoke the SVG logic.
      // Since BarcodeRenderer has fixed IDs, we can just grab them:
      const el = document.getElementById(`svg-itm-${item.id}`);
      if (!el) return '';
      return `
        <div style="border: 1px dashed #cbd5e1; padding: 15px; border-radius: 4px; text-align: center; width: 220px; page-break-inside: avoid; margin-bottom: 10px;">
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; margin-bottom: 5px;">SSA Vasavi Enterprises</div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">${item.name}</div>
          <div style="width: 100%; display: flex; justify-content: center; overflow: hidden; background: white; padding: 5px;">
            ${el.outerHTML}
          </div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>SSA Vasavi Enterprises - Barcode Sheet</title>
          <style>
            @media print {
              @page { margin: 10mm; }
            }
            body {
              font-family: 'Inter', sans-serif;
              padding: 20px;
              margin: 0;
            }
            .grid {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              justify-content: flex-start;
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div style="margin-bottom: 20px; text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase;">
            Barcode Label Master Sheet
          </div>
          <div class="grid">
            ${svgsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export items to JSON file
  const handleExportItems = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "SSA_Vasavi_Enterprises_ItemsMaster.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import items from JSON file
  const handleImportItems = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setImportFieldError("");
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          setImportFieldError("Invalid JSON: File must be an array of items.");
          return;
        }

        // Basic verification
        const validItems: Item[] = [];
        parsed.forEach((obj: any, idx) => {
          if (obj.code && obj.name) {
            validItems.push({
              id: obj.id || `item-imported-${idx}-${Date.now()}`,
              code: String(obj.code).toUpperCase().trim(),
              name: String(obj.name).trim(),
              category: obj.category || "Raw Material",
              unit: obj.unit || "Bag (50kg)",
              gst: Number(obj.gst) || 18,
              minStock: Number(obj.minStock) || 0,
              barcodeValue: obj.barcodeValue || generateBarcodeValue(obj.code, obj.name),
              status: obj.status === "Inactive" ? "Inactive" : "Active",
              remarks: obj.remarks || undefined
            });
          }
        });

        if (validItems.length === 0) {
          setImportFieldError("No valid items with Item Code and Name were found in the uploaded file.");
          return;
        }

        // Merge keeping imported files priority, overriding duplicate codes
        setItems(prev => {
          const merged = [...prev];
          validItems.forEach(vit => {
            const index = merged.findIndex(p => p.code.toLowerCase() === vit.code.toLowerCase());
            if (index >= 0) {
              merged[index] = vit; // overwrite
            } else {
              merged.unshift(vit); // append new
            }
          });
          return merged;
        });

        alert(`Successfully imported/merged ${validItems.length} items from server backup.`);
        setFileInputKey(Date.now()); // Reset file input
      } catch (err) {
        setImportFieldError("Error reading JSON file. Ensure file is structured properly.");
      }
    };
    reader.readAsText(file);
  };

  // Filter items match query
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    const queryMatch = 
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      item.barcodeValue.toLowerCase().includes(query);

    const categoryMatch = filterCategory === "All" || item.category === filterCategory;
    const statusMatch = filterStatus === "All" || item.status === filterStatus;

    return queryMatch && categoryMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Procurement & Product Registry</span>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Core Items Master Database</h2>
          <p className="text-xs text-slate-500">Manage global materials catalogue, system parameters, and barcode tags registration.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Barcode Regeneration */}
          <button
            onClick={handleRegenerateAllBarcodes}
            title="Regenerate all system barcodes"
            id="btn-admin-regenerate-barcodes"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100/80 transition cursor-pointer"
          >
            <RefreshCcw size={14} />
            <span className="hidden md:inline">Regenerate Barcodes</span>
          </button>

          {/* Print All Barcodes */}
          <button
            onClick={handlePrintAllBarcodes}
            title="Print entire catalog barcode labels"
            id="btn-print-all-barcodes"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer size={14} />
            <span className="hidden md:inline">Print Barcodes Sheet</span>
          </button>

          {/* Export items */}
          <button
            onClick={handleExportItems}
            title="Export items to JSON backup file"
            id="btn-export-items"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Import items */}
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
            <Upload size={14} />
            <span className="hidden md:inline">Import</span>
            <input 
              key={fileInputKey}
              type="file" 
              accept=".json" 
              onChange={handleImportItems} 
              className="hidden" 
              id="input-import-items"
            />
          </label>

          {/* Add Item Button */}
          <button
            onClick={handleOpenAdd}
            id="btn-add-item-master"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Add Registry Item</span>
          </button>
        </div>
      </div>

      {importFieldError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{importFieldError}</span>
        </div>
      )}

      {/* Grid containing filters + Table list */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              id="search-items-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Code, Name, or Barcode..."
              className="w-full py-1.5 py-1.5 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Group</span>
              <select
                id="filter-category-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="py-1 px-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <select
                id="filter-status-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-1 px-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white" id="items-empty-state">
              <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search size={20} />
              </div>
              <h3 className="text-slate-800 font-bold text-sm">No Catalog Items Found</h3>
              <p className="text-slate-500 text-xs mt-1">Try relaxing filters or add your first master item to begin registry.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200/60 text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">GST %</th>
                  <th className="py-3 px-4">Min. Level</th>
                  <th className="py-3 px-4">Barcode Unique Tag</th>
                  <th className="py-3 px-4 text-center">Barcode Preview / Print</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} id={`row-item-${item.id}`} className="hover:bg-slate-50 border-b border-slate-100/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">{item.code}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{item.unit}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.gst}%</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.minStock}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{item.barcodeValue}</td>
                    <td className="py-1.5 px-4 flex items-center justify-center">
                      {/* Live Barcode Renderer */}
                      <BarcodeRenderer value={item.barcodeValue} id={`itm-${item.id}`} showText={false} height={24} width={1.5} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Registry item properties"
                          id={`btn-edit-item-${item.id}`}
                          className="p-1 px-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition rounded text-xs cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.code)}
                          title="Remove item"
                          id={`btn-delete-item-${item.id}`}
                          className="p-1 px-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition rounded text-xs cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Registry Modal slideover/dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="item-form-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">
                  {editingItem ? 'Edit Master Registry' : 'Add Item Master Register'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Define structured identifiers and regulatory properties.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                id="btn-close-item-modal"
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Item Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Item Code *</label>
                  <input
                    type="text"
                    id="form-item-code"
                    required
                    disabled={!!editingItem} // typically codes are immutable to protect database joins
                    placeholder="E.g., SSA-RM-101"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-slate-50 disabled:opacity-75 disabled:cursor-not-allowed font-mono uppercase"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Active Status</label>
                  <select
                    id="form-item-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  type="text"
                  id="form-item-name"
                  required
                  placeholder="E.g., White Quartz Aggregate Granules"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Material Group</label>
                  <select
                    id="form-item-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Primary Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Stock Unit (UoM)</label>
                  <select
                    id="form-item-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* GST Rate */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tax Bracket (GST %)</label>
                  <select
                    id="form-item-gst"
                    value={gst}
                    onChange={(e) => setGst(Number(e.target.value))}
                    className="w-full py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>0% (Nil)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28% (Luxury/Cement)</option>
                  </select>
                </div>

                {/* Minimum Stock */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Reorder Point Min</label>
                  <input
                    type="number"
                    id="form-item-minstock"
                    min={0}
                    placeholder="100"
                    value={minStock === 0 ? "" : minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Technical Remarks (Optional)</label>
                <textarea
                  id="form-item-remarks"
                  placeholder="E.g., Special temperature controlled storage required."
                  value={remarks}
                  rows={2}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Visual projection for the generated barcode */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Barcode Logic projection</span>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-950 mt-1">
                  <span>Barcode tag output:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1 rounded">
                    {code && name ? generateBarcodeValue(code, name) : "REGISTRY-OUTPUT"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  id="btn-form-cancel"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-form-submit"
                  className="px-5 py-2 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer text-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
