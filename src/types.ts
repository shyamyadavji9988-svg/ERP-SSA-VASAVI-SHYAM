/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  gst: number; // Percentage, e.g. 18
  minStock: number;
  barcodeValue: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
}

export interface OpeningBalance {
  id: string;
  date: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  barcode: string;
  qty: number;
  rate?: number;
  lotBatch?: string;
  remarks?: string;
}

export interface POItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  barcode: string;
  qty: number;
  rate: number;
  receivedQty: number; // quantity already received via GRN
  taxPercent: number; // GST%
  amount: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  vendor: string;
  date: string;
  status: 'Pending' | 'Partial' | 'Completed' | 'Cancelled';
  items: POItem[];
  remarks?: string;
}

export interface GRNItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  barcode: string;
  qty: number; // received qty in this GRN
  lotBatch: string;
  remarks?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNo: string;
  poId: string | null; // linked PO Id or null if direct GRN
  poNo: string | null;
  vendor: string;
  invoiceNo: string;
  date: string;
  items: GRNItem[];
  remarks?: string;
}

export interface SOItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  barcode: string;
  qty: number;
  rate: number;
  dispatchedQty: number; // qty dispatched so far
  taxPercent: number; // GST%
  amount: number;
}

export interface SalesOrder {
  id: string;
  soNo: string;
  customer: string;
  date: string;
  status: 'Open' | 'Partial' | 'Completed' | 'Cancelled';
  items: SOItem[];
  remarks?: string;
}

export interface ProductionEntry {
  id: string;
  productionNo: string;
  date: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  barcode: string;
  unit: string;
  qty: number;
  lotNo: string;
  remarks?: string;
}

export interface SamplingRecord {
  id: string;
  samplingNo: string;
  date: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  barcode: string;
  unit: string;
  qty: number;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  sourceType: 'GRN' | 'Production' | 'Manual';
  sourceNo: string; // The invoice lot or batch number
  remarks?: string;
}

export interface DispatchItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  barcode: string;
  qty: number;
  packingDescription?: string;
}

export interface DispatchRecord {
  id: string;
  dispatchNo: string;
  soId: string | null; // linked Sales Order id or null
  soNo: string | null;
  date: string;
  customer: string;
  transporter: string;
  vehicleNo: string;
  items: DispatchItem[];
  remarks?: string;
}

export interface StockLedgerEntry {
  id: string;
  date: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  barcode: string;
  transactionType: 'Opening Balance' | 'GRN' | 'Production' | 'Dispatch' | 'Sampling In' | 'Sampling Out';
  referenceNo: string; // GRN Number, Production No, Dispatch No, SO No, etc.
  qtyIn: number;
  qtyOut: number;
  runningBalance: number;
  lotBatch: string;
  remarks?: string;
}

// Keep permission roles ready for future expansion
export interface BOMMaterial {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  qty: number;
}

export interface BillOfMaterials {
  id: string;
  bomNo: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string; // usually this is just 1 unit of product
  date: string;
  materials: BOMMaterial[];
  remarks?: string;
}

export interface UserProfile {
  name: string;
  role: 'Admin' | 'Manager' | 'Operator';
  email: string;
}
