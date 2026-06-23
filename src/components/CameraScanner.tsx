import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize the scanner on mount
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
        ],
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Stop scanning after successful read to prevent rapid fire
        if (scannerRef.current) {
            scannerRef.current.clear();
        }
        onScan(decodedText);
      },
      (error) => {
        // We usually ignore scanning errors as it fires constantly while searching
        console.log("Scanner searching...");
      }
    );

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Camera size={18} className="text-teal-600" />
            <span>Scan Product Barcode</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-1 bg-black relative">
          <div id="reader" className="w-full min-h-[300px] bg-slate-900 rounded-lg overflow-hidden border-0"></div>
        </div>

        {/* Footer/Instructions */}
        <div className="p-5 bg-white text-center">
            <p className="text-sm text-slate-500 mb-4">
              Point your camera at the barcode or QR code. The system will automatically detect the item.
            </p>
            <button 
                onClick={onClose}
                className="w-full py-2.5 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition"
            >
                Cancel Scanning
            </button>
        </div>
      </div>
    </div>
  );
}
