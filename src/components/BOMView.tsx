import React, { useState } from 'react';
import { Item, BillOfMaterials, BOMMaterial } from '../types';
import { Plus, Trash2, Layers, Search, Eye, X } from 'lucide-react';
import BarcodeScannerInput from './BarcodeScannerInput';

interface BOMViewProps {
  items: Item[];
  boms: BillOfMaterials[];
  setBoms: React.Dispatch<React.SetStateAction<BillOfMaterials[]>>;
}

export default function BOMView({ items, boms, setBoms }: BOMViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterials | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [bomNo, setBomNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState("");
  
  // Product configuration
  const [productId, setProductId] = useState("");
  const [productUnit, setProductUnit] = useState("1"); // Usually 1 unit

  // Materials configuration
  const [materials, setMaterials] = useState<BOMMaterial[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [materialQty, setMaterialQty] = useState<number>(0);

  const fgItems = items.filter(i => i.category === 'Finished Goods' && i.status === 'Active');

  const filteredBOMs = boms.filter(b => 
    (b.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.bomNo || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScanSuccess = (it: Item) => {
    setSelectedItem(it);
    setMaterialQty(1);
  };

  const handleAddMaterial = () => {
    if (!selectedItem || materialQty <= 0) return;
    
    // Check if already in materials
    if (materials.some(m => m.itemId === selectedItem.id)) {
      alert("Material already added to BOM.");
      return;
    }

    setMaterials(prev => [...prev, {
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      unit: selectedItem.unit,
      qty: materialQty
    }]);

    setSelectedItem(null);
    setMaterialQty(0);
  };

  const removeMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveBOM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomNo.trim()) {
      alert("BOM Number is required.");
      return;
    }
    if (!productId) {
      alert("Please select a finished product.");
      return;
    }
    if (materials.length === 0) {
      alert("Please add at least one raw material / packaging item.");
      return;
    }

    const prd = items.find(i => i.id === productId);
    if (!prd) return;

    const uniqueId = `BOM-${Date.now().toString().substring(6)}`;

    const newBom: BillOfMaterials = {
      id: uniqueId,
      bomNo: bomNo.trim(),
      productId: prd.id,
      productCode: prd.code,
      productName: prd.name,
      unit: productUnit,
      date,
      materials,
      remarks: remarks.trim() || undefined
    };

    setBoms(prev => [newBom, ...prev]);

    // Reset Form
    setIsFormOpen(false);
    setBomNo("");
    setProductId("");
    setMaterials([]);
    setRemarks("");
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Bill of Materials (BOM)</h2>
          <p className="text-xs text-slate-500">Define manufacturing formulas, raw material inputs, and production yield expectations.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Search Product or BOM No..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
          />
          <button
            onClick={() => {
              setBomNo("");
              setProductId("");
              setMaterials([]);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Create BOM</span>
          </button>
        </div>
      </div>

      {/* BOM Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers size={16} className="text-indigo-500" />
            Active BOMs / Formulas
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{filteredBOMs.length} formulas</span>
        </div>

        <div className="overflow-x-auto">
          {filteredBOMs.length === 0 ? (
            <div className="text-center py-16 bg-white">
              <Layers className="text-slate-300 mx-auto mb-2" size={34} />
              <h4 className="text-slate-800 font-bold text-sm">No Bill of Materials configured</h4>
              <p className="text-slate-500 text-xs mt-1">Create a BOM to standardize your manufacturing process.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold border-b border-slate-200">BOM No</th>
                  <th className="py-3 px-4 font-semibold border-b border-slate-200">Date</th>
                  <th className="py-3 px-4 font-semibold border-b border-slate-200">Finished Product</th>
                  <th className="py-3 px-4 font-semibold border-b border-slate-200">Output Unit</th>
                  <th className="py-3 px-4 font-semibold border-b border-slate-200 text-right">Items Required</th>
                  <th className="py-3 px-4 font-semibold border-b border-slate-200 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBOMs.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.bomNo}</td>
                    <td className="py-3 px-4 text-slate-500">{b.date}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold text-sm">
                      {b.productName} <span className="text-xs font-mono text-slate-400 block">{b.productCode}</span>
                    </td>
                    <td className="py-3 px-4">{b.unit}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono text-xs">{b.materials.length} mats</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedBOM(b)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition inline-flex"
                        title="View Full BOM Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE BOM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Layers className="text-indigo-600" size={18} />
                Define New Bill of Materials (BOM)
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBOM} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/85">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">BOM Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., BOM-100"
                    value={bomNo}
                    onChange={(e) => setBomNo(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Formulation Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Finished Product *</label>
                  <select
                    required
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-800"
                  >
                    <option value="">-- Select Product --</option>
                    {fgItems.map(fg => (
                      <option key={fg.id} value={fg.id}>{fg.name} ({fg.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-step process to add materials */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-indigo-50/30 flex items-start gap-4">
                  <div className="flex-1">
                    <BarcodeScannerInput
                      items={items}
                      onScanSuccess={handleScanSuccess}
                      label="SCAN RAW MATERIAL"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Material Manually</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1.5 text-slate-400" size={14} />
                      <select
                        className="w-full py-1.5 pl-8 pr-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                        value={selectedItem?.id || ""}
                        onChange={(e) => {
                          const it = items.find(i => i.id === e.target.value);
                          if (it) handleScanSuccess(it);
                        }}
                      >
                        <option value="">Search material catalogue...</option>
                        {items.filter(i => i.category !== 'Finished Goods' && i.status === 'Active').map(it => (
                          <option key={it.id} value={it.id}>{it.name} ({it.code})</option>
                        ))}
                      </select>
                    </div>
                    {selectedItem && (
                      <div className="bg-white p-2 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-slate-800">{selectedItem.name}</span>
                          <span className="text-[10px] text-slate-500">{selectedItem.unit}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            placeholder="Qty needed"
                            value={materialQty || ''}
                            onChange={e => setMaterialQty(parseFloat(e.target.value) || 0)}
                            className="flex-1 py-1.5 px-2 border border-slate-200 rounded text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddMaterial}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 flex items-center justify-center shrink-0"
                          >
                            <Plus size={14} /> Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-4 border-b border-slate-200 w-16">#</th>
                      <th className="py-2 px-4 border-b border-slate-200">Material Name</th>
                      <th className="py-2 px-4 border-b border-slate-200">Code</th>
                      <th className="py-2 px-4 border-b border-slate-200">Unit</th>
                      <th className="py-2 px-4 border-b border-slate-200 text-right w-24">Req Qty</th>
                      <th className="py-2 px-4 border-b border-slate-200 text-center w-16">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-sm">
                    {materials.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 bg-white">
                          No resources added to BOM yet.
                        </td>
                      </tr>
                    ) : (
                      materials.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-4 text-xs font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-4 font-semibold text-slate-800 text-xs">{m.itemName}</td>
                          <td className="py-2 px-4 font-mono text-xs text-slate-500">{m.itemCode}</td>
                          <td className="py-2 px-4 text-xs text-slate-500">{m.unit}</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 text-xs">{m.qty}</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeMaterial(idx)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Process / Routing Remarks</label>
                 <textarea
                   value={remarks}
                   onChange={e => setRemarks(e.target.value)}
                   rows={2}
                   className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
                   placeholder="Describe blending instructions, temperature requirements, etc."
                 />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-md"
                >
                  Save BOM Formula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW BOM MODAL */}
      {selectedBOM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Layers className="text-indigo-600" size={18} />
                BOM Details
              </h3>
              <button onClick={() => setSelectedBOM(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">BOM No</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBOM.bomNo}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Final Product Output</span>
                  <span className="font-semibold text-slate-800">{selectedBOM.productName} ({selectedBOM.unit})</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Material Requirements</h4>
                <div className="bg-white border text-sm border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3 text-right">Standard Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBOM.materials.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-800 font-semibold text-xs">{m.itemName} <span className="text-[10px] text-slate-500 font-mono block">{m.itemCode}</span></td>
                          <td className="py-2 px-3 text-slate-500 text-xs">{m.unit}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-xs">{m.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedBOM.remarks && (
                 <div>
                   <h4 className="text-sm font-bold text-slate-800 mb-1">Formulation Instructions</h4>
                   <p className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs italic border border-yellow-100">{selectedBOM.remarks}</p>
                 </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBOM(null)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
