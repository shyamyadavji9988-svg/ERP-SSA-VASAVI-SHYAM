/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Item,
  OpeningBalance,
  PurchaseOrder,
  GoodsReceiptNote,
  SalesOrder,
  ProductionEntry,
  SamplingRecord,
  DispatchRecord,
  StockLedgerEntry,
  UserProfile,
  BillOfMaterials
} from '../types';
import { generateBarcodeValue } from './barcode';

// Default seeded Items for "SSA Vasavi Enterprises" (Pouch, Bag, Zip Lock, Tempered Bag, Garbage Bag, Container, Bottle, Tubes, Cartoon, Powder, Antiscalant, Ribbon, Cool Pack)
const RAW_ITEMS_DATA = [
  { code: "PR-01", name: "6X8 INDOVEX LAMINATED", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "PR-02", name: "6X8", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "PR-03", name: "6X6", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "PR-04", name: "4X6", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "PR-05", name: "3X5 INDOVAXLAMINATED", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "PR-06", name: "3X5", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "T-001", name: "TUBES POLY", category: "COOL PACK POUCH (PRINTED)", unit: "BAG" },
  { code: "PP-01", name: "8X12", category: "PLAIN POUCH", unit: "BAG" },
  { code: "PP-02", name: "6X16", category: "PLAIN POUCH", unit: "BAG" },
  { code: "PP-03", name: "6X8", category: "PLAIN POUCH", unit: "BAG" },
  { code: "PP-04", name: "6X6", category: "PLAIN POUCH", unit: "BAG" },
  { code: "PP-05", name: "4X6", category: "PLAIN POUCH", unit: "BAG" },
  { code: "PP-06", name: "3X5", category: "PLAIN POUCH", unit: "BAG" },
  { code: "PBP-01", name: "4X6 CRL", category: "PARTY BRAND NAME (POUCH)", unit: "BAG" },
  { code: "PBP-02", name: "4X6 ACCUPROBE", category: "PARTY BRAND NAME (POUCH)", unit: "BAG" },
  { code: "PBP-03", name: "6X8 ACCUPROBE", category: "PARTY BRAND NAME (POUCH)", unit: "BAG" },
  { code: "PBP-04", name: "6X6 LABEX", category: "PARTY BRAND NAME (POUCH)", unit: "BAG" },
  { code: "PBP-05", name: "4X6 ONQUEST", category: "PARTY BRAND NAME (POUCH)", unit: "BAG" },
  { code: "ZL-01", name: "MULTICOLOUR 5X9 REDCLIFF", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-02", name: "5X8 REDCLIFF TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-03", name: "5x9 GENSTRING TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-04", name: "5x9 ONCQUEST TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-05", name: "5X9 LABCORP", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-06", name: "5X9 HEALTHFIRST TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-07", name: "5X9 CORE TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-08", name: "4X6 CORE TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-09", name: "5x9 METROPOLIS TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-10", name: "4x6 METROPOLIS TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-11", name: "10x12 METROPOLIS TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-12", name: "5x9  BAG DR LAL TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-13", name: "5x9  ACCUPROBE TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-14", name: "5x9 PLAIN", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-15", name: "5x9 BIOHAZARD  LOGO TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-16", name: "4x6 HITECH TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-17", name: "10x12 HITECH TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-18", name: "4X6 ZIPLOCK PLAIN TRANSPARENT", category: "ZIP LOCK", unit: "PCS" },
  { code: "ZL-19", name: "5X9 BIOGENE ZIPLOCK", category: "ZIP LOCK", unit: "PCS" },
  { code: "TB-01", name: "5X9 PATHKIND TEMPERED BAG", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-02", name: "5X9 PATHKIND RED TEMPERED BAG", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-03", name: "5X7 PATHKIND  TEMPERED BAG", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-04", name: "5X9 SUBURBAN", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-05", name: "5X9 CRL TEMPERED BAG", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-06", name: "5X9 DR LAL", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-07", name: "5X9 DR LAL SAFE COLLACTION", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-08", name: "8X10 DR LAL COURIER COVER", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-09", name: "19X26 COURIER COVER", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-10", name: "5X9 SRL AGILIS", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-11", name: "5X9 BIOHAZARD LOGO WITHOUT BAR CODE", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-12", name: "5X9 TEMP BAG TORRENT", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-13", name: "10X22 TEMP BAG TORRENT", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "TB-14", name: "5X9 METROPATH", category: "TEMEPERD BAG", unit: "PCS" },
  { code: "GB-01", name: "20X24 BLACK", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-02", name: "20X24 BLUE", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-03", name: "20X24 YELLOW", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-04", name: "20X24 RED", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-05", name: "32X42 BLUE", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-06", name: "32X42 RED", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-07", name: "32X42 BLACK", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-08", name: "32X42 YELLOW", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-09", name: "28X32 BLUE", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-10", name: "28X32 RED", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-11", name: "28X32 YELLOW", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-12", name: "28X32 BLACK", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-13", name: "24X36 RED", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-14", name: "24X36 YELLOW", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-15", name: "24X36 BLACK", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-16", name: "24X36 GREEN", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-17", name: "18X22 BLACK", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-18", name: "18X22 YELLOW", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-19", name: "18X22 RED", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-20", name: "40X42 YELLOW", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-21", name: "40X42 RED", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-22", name: "40X42 BLUE", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-23", name: "4042 BLACK", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-24", name: "40X42 GREEN", category: "GARBAGE BAG", unit: "KGS" },
  { code: "GB-25", name: "16X16 BLUE", category: "GARBAGE BAG", unit: "KGS" },
  { code: "UC-01", name: "30ML CRL", category: "URINE CONTAINER", unit: "PCS" },
  { code: "UC-02", name: "30 ML LABCORP", category: "URINE CONTAINER", unit: "PCS" },
  { code: "UC-03", name: "50 ML GENSTRING", category: "URINE CONTAINER", unit: "PCS" },
  { code: "UC-04", name: "50 ML RAGULAR NON BRAND NAME", category: "URINE CONTAINER", unit: "PCS" },
  { code: "UC-05", name: "30 ML RAGULAR NON BRAND NAME", category: "URINE CONTAINER", unit: "PCS" },
  { code: "UC-06", name: "50 ML WITHOPUT STICKER", category: "URINE CONTAINER", unit: "PCS" },
  { code: "HB-01", name: "6X8", category: "HDPE BOTTEL", unit: "PCS" },
  { code: "HB-02", name: "4X6", category: "HDPE BOTTEL", unit: "PCS" },
  { code: "HB-03", name: "TOURNIQUET", category: "HDPE BOTTEL", unit: "PCS" },
  { code: "BT-01", name: "BIG TUBES", category: "TUBES", unit: "PCS" },
  { code: "ST-01", name: "SMAL TUBES", category: "TUBES", unit: "PCS" },
  { code: "BB-01", name: "BIG BOX", category: "CARTOON BAG", unit: "PCS" },
  { code: "SB-01", name: "SMALL BOX", category: "CARTOON BAG", unit: "PCS" },
  { code: "SS-01", name: "SAP", category: "POWDER", unit: "PCS" },
  { code: "AA-01", name: "ANTISCALANT", category: "ANTISCALANT", unit: "BOX" },
  { code: "AG-01-B1", name: "ANTISCALANT BATCH 1", category: "ANTISCALANT", unit: "BOX" },
  { code: "AG-01-B2", name: "ANTISCALANT BATCH 2", category: "ANTISCALANT", unit: "BOX" },
  { code: "AG-01-B3", name: "ANTISCALANT BATCH 3", category: "ANTISCALANT", unit: "BOX" },
  { code: "AG-01-B4", name: "ANTISCALANT BATCH 4", category: "ANTISCALANT", unit: "BOX" },
  { code: "DR-01", name: "DONINO RIBBON", category: "RIBBON", unit: "PCS" },
  { code: "6I-01", name: "6X8 500 GRAM INDOVAX", category: "COOL PACK", unit: "PCS" },
  { code: "TS-01", name: "TUBES SMALL", category: "ANTISCALANT", unit: "BOX" },
  { code: "ATS-01", name: "TUBES SMALL GOLI", category: "ANTISCALANT", unit: "BOX" },
  { code: "ATC-01", name: "TUBES CRUSH SMALL", category: "ANTISCALANT", unit: "BOX" },
  { code: "CPF-01", name: "6X6 250 GRAM PLAIN", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-02", name: "6X8 450 GRAM PLAIN", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-03", name: "4X6 150 GRAM  CRL", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-04", name: "4X6 150 GRAM (PRINTED)", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-05", name: "6X6 250 GRAM LABEX", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-06", name: "6X8 450 GRAM ACCUPROBE", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-07", name: "6X16 450 GRAM PLAIN", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-08", name: "6X6 250 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-09", name: "6X8 450 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-10", name: "4X6 150 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-11", name: "3X5 100 GRAM  PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-12", name: "4X6 150 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-13", name: "6X8 700 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-14", name: "3X5 100 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-15", name: "4X6 200 GRAM ACCUPROBE", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-16", name: "6X8 325 GRAM PRINTED", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-17", name: "4X6 200 GRAM PLAIN", category: "COOL PACK", unit: "PCS" },
  { code: "CPF-18", name: "4X6 200 GRAM ONQUEST", category: "COOL PACK", unit: "PCS" }
];

const INITIAL_ITEMS: Item[] = RAW_ITEMS_DATA.map((item, idx) => ({
  id: `item-${item.code.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
  code: item.code,
  name: item.name,
  category: item.category,
  unit: item.unit,
  gst: 18,
  minStock: 50,
  barcodeValue: generateBarcodeValue(item.code, item.name),
  status: "Active",
  remarks: `Standard operational stock item for Vasavi Enterprises.`
}));

// LocalStorage Helper keys
const STY_KEYS = {
  items: 'ssa_erp_items',
  openingBalances: 'ssa_erp_opening',
  purchaseOrders: 'ssa_erp_po',
  grns: 'ssa_erp_grn',
  salesOrders: 'ssa_erp_so',
  productions: 'ssa_erp_production',
  samplings: 'ssa_erp_sampling',
  dispatches: 'ssa_erp_dispatch',
  user: 'ssa_erp_user',
  boms: 'ssa_erp_boms'
};

export const defaultUser: UserProfile = {
  name: "S. S. Agarwal",
  role: "Admin",
  email: "admin@ssavasavi.com"
};

export function loadERPState() {
  const itemsStr = localStorage.getItem(STY_KEYS.items);
  let items: Item[] = itemsStr ? JSON.parse(itemsStr) : INITIAL_ITEMS;

  // Check if we need to purge the old 6 items from local storage to ensure the new list is populated immediately
  const hasOldItems = items.some(it => it.code === "SSA-RM-001" || it.id === "item-1");
  if (hasOldItems || items.length < 15) {
    items = INITIAL_ITEMS;
    localStorage.setItem(STY_KEYS.items, JSON.stringify(INITIAL_ITEMS));
    // Clear opening balances as well since they were linked to old items
    localStorage.removeItem(STY_KEYS.openingBalances);
    localStorage.removeItem(STY_KEYS.purchaseOrders);
    localStorage.removeItem(STY_KEYS.grns);
    localStorage.removeItem(STY_KEYS.salesOrders);
    localStorage.removeItem(STY_KEYS.productions);
    localStorage.removeItem(STY_KEYS.dispatches);
    localStorage.removeItem(STY_KEYS.samplings);
    localStorage.removeItem(STY_KEYS.boms);
  }

  const openingStr = localStorage.getItem(STY_KEYS.openingBalances);
  const poStr = localStorage.getItem(STY_KEYS.purchaseOrders);
  const grnStr = localStorage.getItem(STY_KEYS.grns);
  const soStr = localStorage.getItem(STY_KEYS.salesOrders);
  const prodStr = localStorage.getItem(STY_KEYS.productions);
  const sampleStr = localStorage.getItem(STY_KEYS.samplings);
  const dispatchStr = localStorage.getItem(STY_KEYS.dispatches);
  const userStr = localStorage.getItem(STY_KEYS.user);
  const bomsStr = localStorage.getItem(STY_KEYS.boms);

  const openingBalances: OpeningBalance[] = openingStr ? JSON.parse(openingStr) : [];
  const purchaseOrders: PurchaseOrder[] = poStr ? JSON.parse(poStr) : [];
  const grns: GoodsReceiptNote[] = grnStr ? JSON.parse(grnStr) : [];
  const salesOrders: SalesOrder[] = soStr ? JSON.parse(soStr) : [];
  const productions: ProductionEntry[] = prodStr ? JSON.parse(prodStr) : [];
  const samplings: SamplingRecord[] = sampleStr ? JSON.parse(sampleStr) : [];
  const dispatches: DispatchRecord[] = dispatchStr ? JSON.parse(dispatchStr) : [];
  const user: UserProfile = userStr ? JSON.parse(userStr) : defaultUser;
  const boms: BillOfMaterials[] = bomsStr ? JSON.parse(bomsStr) : [];

  return {
    items,
    openingBalances,
    purchaseOrders,
    grns,
    salesOrders,
    productions,
    samplings,
    dispatches,
    user,
    boms
  };
}

export function saveERPState(state: {
  items: Item[];
  openingBalances: OpeningBalance[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  salesOrders: SalesOrder[];
  productions: ProductionEntry[];
  samplings: SamplingRecord[];
  dispatches: DispatchRecord[];
  user: UserProfile;
  boms?: BillOfMaterials[];
}) {
  localStorage.setItem(STY_KEYS.items, JSON.stringify(state.items));
  localStorage.setItem(STY_KEYS.openingBalances, JSON.stringify(state.openingBalances));
  localStorage.setItem(STY_KEYS.purchaseOrders, JSON.stringify(state.purchaseOrders));
  localStorage.setItem(STY_KEYS.grns, JSON.stringify(state.grns));
  localStorage.setItem(STY_KEYS.salesOrders, JSON.stringify(state.salesOrders));
  localStorage.setItem(STY_KEYS.productions, JSON.stringify(state.productions));
  localStorage.setItem(STY_KEYS.samplings, JSON.stringify(state.samplings));
  localStorage.setItem(STY_KEYS.dispatches, JSON.stringify(state.dispatches));
  localStorage.setItem(STY_KEYS.user, JSON.stringify(state.user));
  if (state.boms) {
    localStorage.setItem(STY_KEYS.boms, JSON.stringify(state.boms));
  }
}

/**
 * Recalculate Stock Ledger
 * This function processes opening stocks, GRNs (+), Production (+), and Dispatch (-)
 * to create a chronological transaction ledger and compute physical stock levels.
 */
export function calculateStockLedger(
  items: Item[],
  openingBalances: OpeningBalance[],
  grns: GoodsReceiptNote[],
  productions: ProductionEntry[],
  dispatches: DispatchRecord[]
): { ledger: StockLedgerEntry[]; itemStockMap: { [itemId: string]: number } } {
  const ledger: StockLedgerEntry[] = [];
  const itemStockMap: { [itemId: string]: number } = {};

  // Initialize stock for all items at 0
  items.forEach(item => {
    itemStockMap[item.id] = 0;
  });

  interface RawTx {
    id: string;
    date: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    barcode: string;
    type: 'Opening Balance' | 'GRN' | 'Production' | 'Dispatch';
    refNo: string;
    qtyIn: number;
    qtyOut: number;
    lotBatch: string;
    remarks: string;
  }

  const rawTxs: RawTx[] = [];

  // Add Opening Balances
  openingBalances.forEach(ob => {
    rawTxs.push({
      id: ob.id,
      date: ob.date,
      itemId: ob.itemId,
      itemCode: ob.itemCode,
      itemName: ob.itemName,
      barcode: ob.barcode,
      type: 'Opening Balance',
      refNo: 'OPENING',
      qtyIn: ob.qty,
      qtyOut: 0,
      lotBatch: ob.lotBatch || 'N/A',
      remarks: ob.remarks || 'Opening stock intake'
    });
  });

  // Add Good Receipt Notes (GRN Increases balance)
  grns.forEach(grn => {
    grn.items.forEach(gi => {
      rawTxs.push({
        id: `${grn.id}-${gi.id}`,
        date: grn.date,
        itemId: gi.itemId,
        itemCode: gi.itemCode,
        itemName: gi.itemName,
        barcode: gi.barcode,
        type: 'GRN',
        refNo: grn.grnNo,
        qtyIn: gi.qty,
        qtyOut: 0,
        lotBatch: gi.lotBatch || 'N/A',
        remarks: gi.remarks || `Inward GRN, Vendor: ${grn.vendor}`
      });
    });
  });

  // Add Production Entries (Production Increases balance of finished/raw items)
  productions.forEach(prod => {
    rawTxs.push({
      id: prod.id,
      date: prod.date,
      itemId: prod.itemId,
      itemCode: prod.itemCode,
      itemName: prod.itemName,
      barcode: prod.barcode,
      type: 'Production',
      refNo: prod.productionNo,
      qtyIn: prod.qty,
      qtyOut: 0,
      lotBatch: prod.lotNo || 'N/A',
      remarks: prod.remarks || 'In-house manufacturing run'
    });
  });

  // Add Dispatch Records (Dispatch Decreases balance)
  dispatches.forEach(disp => {
    disp.items.forEach(di => {
      rawTxs.push({
        id: `${disp.id}-${di.id}`,
        date: disp.date,
        itemId: di.itemId,
        itemCode: di.itemCode,
        itemName: di.itemName,
        barcode: di.barcode,
        type: 'Dispatch',
        refNo: disp.dispatchNo,
        qtyIn: 0,
        qtyOut: di.qty,
        lotBatch: 'N/A',
        remarks: disp.remarks || `Stock Outflow to ${disp.customer}`
      });
    });
  });

  // Sort chronological: date ascending. If same date, Opening balances first, then GRN/Prod, then Dispatch.
  rawTxs.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;

    const typeWeight = {
      'Opening Balance': 1,
      'GRN': 2,
      'Production': 3,
      'Dispatch': 4
    };

    return (typeWeight[a.type] || 5) - (typeWeight[b.type] || 5);
  });

  // Multi-item balance tracker for tracking running balance
  const runningBalances: { [itemId: string]: number } = {};
  items.forEach(item => {
    runningBalances[item.id] = 0;
  });

  rawTxs.forEach((tx) => {
    const currentBal = runningBalances[tx.itemId] || 0;
    const nextBal = currentBal + tx.qtyIn - tx.qtyOut;
    runningBalances[tx.itemId] = nextBal;
    itemStockMap[tx.itemId] = nextBal;

    ledger.push({
      id: tx.id,
      date: tx.date,
      itemId: tx.itemId,
      itemCode: tx.itemCode,
      itemName: tx.itemName,
      barcode: tx.barcode,
      transactionType: tx.type === 'GRN' ? 'GRN' :
                       tx.type === 'Production' ? 'Production' :
                       tx.type === 'Dispatch' ? 'Dispatch' : 'Opening Balance',
      referenceNo: tx.refNo,
      qtyIn: tx.qtyIn,
      qtyOut: tx.qtyOut,
      runningBalance: nextBal,
      lotBatch: tx.lotBatch,
      remarks: tx.remarks
    });
  });

  return {
    ledger,
    itemStockMap
  };
}
