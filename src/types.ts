export interface ParsedDataset {
  fileId: 'autocount' | 'opencart';
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, any>[];
  rowCount: number;
  sheetNames?: string[];
  selectedSheet?: string;
  detectedIsbnCol?: string;
  detectedQtyCol?: string;
  delimiter?: string;
  isExcel?: boolean;
}

export interface ColumnMappingConfig {
  autocountIsbnCol: string;
  autocountQtyCol: string;
  opencartIsbnCol: string;
  opencartQtyCol: string;
}

export type ItemReconciliationStatus =
  | 'matched_updated'
  | 'matched_identical'
  | 'unmatched_retained';

export interface ReconciliationItem {
  index: number;
  cleanIsbn: string;
  rawIsbn: string;
  productName?: string;
  productId?: string;
  originalQty: number;
  newQty: number;
  delta: number;
  status: ItemReconciliationStatus;
  autocountFound: boolean;
  notes: string;
  originalRow: Record<string, any>;
}

export interface UnmatchedWarehouseItem {
  cleanIsbn: string;
  rawIsbn: string;
  quantity: number;
  productName?: string;
  rawRow: Record<string, any>;
}

export interface ReconciliationSummary {
  totalOpenCartRows: number;
  totalFinalRows?: number;
  matchedCount: number;
  updatedCount: number;
  identicalCount: number;
  unmatchedOpenCartCount: number;
  unmatchedAutocountCount: number;
  netQuantityDelta: number;
  totalOriginalStock: number;
  totalUpdatedStock: number;
  totalAutocountWarehouseStock: number;
  processedAt: string;
  openCartFileName: string;
}

export interface ReconciliationResult {
  items: ReconciliationItem[];
  unmatchedWarehouseItems: UnmatchedWarehouseItem[];
  processedOpenCartRows: Record<string, any>[];
  openCartHeaders: string[];
  summary: ReconciliationSummary;
  isExcel: boolean;
  delimiter?: string;
}
