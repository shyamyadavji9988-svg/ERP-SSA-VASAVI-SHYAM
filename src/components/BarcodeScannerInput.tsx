/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../types';
import { Scan, Sparkles, CheckCircle2, AlertTriangle, ChevronDown, ListFilter, Camera } from 'lucide-react';
import CameraScanner from './CameraScanner';

interface BarcodeScannerInputProps {
  items: Item[];
  onScanSuccess: (item: Item) => void;
  onScanError?: (msg: string) => void;
  className?: string;
  label?: string;
}

export default function BarcodeScannerInput({
  items,
  onScanSuccess,
  onScanError,
  className = "",
  label = "Fast Barcode Scan Entry"
}: BarcodeScannerInputProps) {
  const [scanInput, setScanInput] = useState("");
  const [lastScanned, setLastScanned] = useState<Item | null>(null);
  const [errorText, setErrorText] = useState("");
  const [showSimulator, setShowSimulator] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [successPulse, setSuccessPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Categories for the simulator filter
  const categories = ["All", ...Array.from(new Set(items.map(i => i.category)))];

  // Perform barcode lookup
  const handleBarcodeProcess = (barcodeVal: string) => {
    const trimmed = barcodeVal.trim().toLowerCase();
    if (!trimmed) return;

    const matchedItem = items.find(
      (item) =>
        item.status === "Active" &&
        (item.barcodeValue.toLowerCase() === trimmed ||
         item.code.toLowerCase() === trimmed ||
         item.name.toLowerCase() === trimmed)
    );

    if (matchedItem) {
      setLastScanned(matchedItem);
      setErrorText("");
      setSuccessPulse(true);
      setTimeout(() => setSuccessPulse(false), 800);
      onScanSuccess(matchedItem);
      setScanInput("");
    } else {
      const errMsg = `Item not found for barcode: "${barcodeVal}"`;
      setErrorText(errMsg);
      if (onScanError) onScanError(errMsg);
      setLastScanned(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeProcess(scanInput);
    }
  };

  // Simulate instant gun scan clicks
  const triggerSimulation = (item: Item) => {
    setScanInput(item.barcodeValue);
    handleBarcodeProcess(item.barcodeValue);
  };

  return (
    <div className={`bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-xl text-white shadow-lg border border-slate-700/50 ${className}`}>
      {showCamera && (
        <CameraScanner 
          onScan={(text) => {
            setShowCamera(false);
            setScanInput(text);
            handleBarcodeProcess(text);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
            <Scan id="scan-icon" size={18} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 block">{label}</span>
            <h4 className="text-sm font-medium text-slate-200">Phone Camera or Scanner Gun</h4>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="text-xs bg-teal-600 border border-teal-500 hover:bg-teal-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-white shadow-sm font-bold"
          >
            <Camera size={13} />
            <span>Open Phone Camera</span>
          </button>
          <button
            type="button"
            id="btn-toggle-simulator"
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-xs bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-slate-300"
          >
            <Sparkles size={13} className={showSimulator ? "text-emerald-400" : "text-amber-400"} />
            <span className="hidden md:inline">{showSimulator ? "Hide Simulator" : "Simulator"}</span>
            <ChevronDown size={12} className={`transition ${showSimulator ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="barcode-input-field"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode with reader gun or type here and press Enter..."
          className={`w-full py-2.5 pl-10 pr-24 bg-slate-950/90 text-white placeholder-slate-500 rounded-lg text-sm border font-mono tracking-wide focus:outline-none focus:ring-2 transition duration-200 ${
            successPulse
              ? "border-emerald-500 focus:ring-emerald-500/20"
              : errorText
              ? "border-red-500 focus:ring-red-500/20"
              : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20"
          }`}
        />
        <div className="absolute left-3 top-3 text-slate-500">
          <Scan size={16} />
        </div>
        <div className="absolute right-2 top-1.5 flex gap-1.5">
          <button
            type="button"
            id="btn-manual-scan-submit"
            onClick={() => handleBarcodeProcess(scanInput)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-1.5 rounded-md shadow transition"
          >
            Submit
          </button>
        </div>
      </div>

      {successPulse && (
        <div className="mt-2 text-emerald-400 text-xs flex items-center gap-1.5 animate-bounce">
          <CheckCircle2 size={13} />
          <span>Scan success! Auto-filled {lastScanned?.category || "item"}: <strong>{lastScanned?.name} ({lastScanned?.code})</strong></span>
        </div>
      )}

      {errorText && (
        <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5">
          <AlertTriangle size={13} />
          <span>{errorText}</span>
        </div>
      )}

      {showSimulator && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 animate-fadeIn" id="simulator-panel">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ListFilter size={11} /> Filter and Click below to simulate barcode sweep
            </span>
            <div className="flex gap-1">
              {categories.slice(0, 4).map((cat) => (
                <button
                  type="button"
                  id={`btn-filter-${cat}`}
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                    filterCat === cat
                      ? "bg-slate-700 text-emerald-400 border border-slate-600"
                      : "bg-slate-900 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
            {items
              .filter((item) => item.status === "Active" && (filterCat === "All" || item.category === filterCat))
              .map((item) => (
                <button
                  type="button"
                  id={`btn-simulate-scan-${item.id}`}
                  key={item.id}
                  onClick={() => triggerSimulation(item)}
                  className="flex flex-col items-start p-2 rounded bg-slate-950/50 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-950 transition text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-[10px] text-indigo-300 font-bold">{item.code}</span>
                    <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                      ⚡ Scan Code
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-300 truncate w-full mt-1">{item.name}</span>
                  <span className="font-mono text-[9px] text-slate-500 mt-0.5 truncate w-full">{item.barcodeValue}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
