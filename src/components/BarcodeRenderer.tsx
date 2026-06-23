/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { encodeCode128B } from '../lib/barcode';
import { Download, Printer } from 'lucide-react';

interface BarcodeRendererProps {
  id?: string;
  value: string;
  width?: number; // scale width
  height?: number; // barcode height
  showText?: boolean;
}

export default function BarcodeRenderer({
  id = "barcode",
  value,
  width = 2,
  height = 55,
  showText = true,
}: BarcodeRendererProps) {
  const binary = encodeCode128B(value);
  const scale = width;
  const svgTotalWidth = binary.length * scale;
  const padding = 15;
  const totalWidth = svgTotalWidth + padding * 2;
  const totalHeight = height + (showText ? 30 : 10) + padding * 2;

  // Render SVG bars
  const bars: React.ReactNode[] = [];
  let currentX = padding;

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      bars.push(
        <rect
          key={i}
          x={currentX}
          y={padding}
          width={scale}
          height={height}
          fill="#0f172a" // Deep slate color
        />
      );
    }
    currentX += scale;
  }

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById(`svg-${id}`);
    if (!svgElement) return;
    
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `Barcode_${value.replace(/[^A-Za-z0-9_-]/g, '_')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handlePrintLabel = () => {
    // Open a small print window
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;

    const svgElement = document.getElementById(`svg-${id}`);
    if (!svgElement) return;

    const svgHtml = svgElement.outerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>SSA Vasavi Enterprises - Barcode Label</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              margin: 0;
            }
            .label-card {
              border: 1px dashed #cbd5e1;
              padding: 15px;
              border-radius: 4px;
              text-align: center;
              width: fit-content;
            }
            .title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #334155;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label-card">
            <div class="title">SSA Vasavi Enterprises</div>
            ${svgHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center bg-slate-50 border border-slate-200/60 p-3 rounded-lg w-full max-w-xs transition hover:border-slate-300">
      <div className="bg-white p-2 rounded border border-slate-100 flex items-center justify-center w-full overflow-hidden">
        <svg
          id={`svg-${id}`}
          width="100%"
          height="100%"
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          className="max-w-full"
          style={{ height: 'auto' }}
        >
          {/* White background */}
          <rect width={totalWidth} height={totalHeight} fill="#ffffff" rx={4} />
          
          {/* Bars */}
          {bars}

          {/* Label text */}
          {showText && (
            <text
              x={totalWidth / 2}
              y={totalHeight - padding - 4}
              textAnchor="middle"
              fill="#334155"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.1em'
              }}
            >
              {value}
            </text>
          )}
        </svg>
      </div>

      <div className="flex items-center gap-2 mt-2 w-full justify-end">
        <button
          onClick={handleDownloadSVG}
          title="Download Label (SVG)"
          id={`btn-dl-${id}`}
          className="flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition cursor-pointer"
        >
          <Download size={13} />
          <span>SVG</span>
        </button>
        <button
          onClick={handlePrintLabel}
          title="Print Label"
          id={`btn-pt-${id}`}
          className="flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium text-white bg-slate-800 border border-slate-800 rounded hover:bg-slate-900 transition cursor-pointer"
        >
          <Printer size={13} />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
