import {
  ColumnMappingConfig,
  ParsedDataset,
  ReconciliationItem,
  ReconciliationResult,
  ReconciliationSummary,
  UnmatchedWarehouseItem,
} from '../types';
import { normalizeIsbn, parseQuantity } from './isbnUtils';

export function runReconciliation(
  autocountDataset: ParsedDataset,
  opencartDataset: ParsedDataset,
  config: ColumnMappingConfig
): ReconciliationResult {
  const {
    autocountIsbnCol,
    autocountQtyCol,
    opencartIsbnCol,
    opencartQtyCol,
  } = config;

  // 1. Build AutoCount Warehouse Index: cleanIsbn -> { quantity, rawRow, rawIsbn }
  const warehouseMap = new Map<
    string,
    { quantity: number; rawIsbn: string; rawRow: Record<string, any>; hitCount: number }
  >();

  let totalAutocountWarehouseStock = 0;

  for (const row of autocountDataset.rows) {
    const rawVal = row[autocountIsbnCol];
    const clean = normalizeIsbn(rawVal);
    if (!clean) continue;

    const qty = parseQuantity(row[autocountQtyCol], 0);
    totalAutocountWarehouseStock += qty;

    if (warehouseMap.has(clean)) {
      // If multiple warehouse lines exist for the same ISBN, sum quantities
      const existing = warehouseMap.get(clean)!;
      existing.quantity += qty;
    } else {
      warehouseMap.set(clean, {
        quantity: qty,
        rawIsbn: String(rawVal ?? ''),
        rawRow: row,
        hitCount: 0,
      });
    }
  }

  // Detect potential product name or ID columns in the OpenCart file for friendly display
  const nameCol = opencartDataset.headers.find((h) =>
    /^(name|product_name|title|product_description|description)$/i.test(h.trim())
  );
  const idCol = opencartDataset.headers.find((h) =>
    /^(product_id|id|item_id|model)$/i.test(h.trim())
  );

  // 2. Process OpenCart file rows in exact order
  const reconciliationItems: ReconciliationItem[] = [];
  const processedOpenCartRows: Record<string, any>[] = [];

  let matchedCount = 0;
  let updatedCount = 0;
  let identicalCount = 0;
  let unmatchedOpenCartCount = 0;
  let netQuantityDelta = 0;
  let totalOriginalStock = 0;
  let totalUpdatedStock = 0;

  opencartDataset.rows.forEach((row, index) => {
    // Clone row to preserve every single column and value
    const updatedRow = { ...row };
    const rawIsbnVal = row[opencartIsbnCol];
    const cleanIsbn = normalizeIsbn(rawIsbnVal);

    const originalQty = parseQuantity(row[opencartQtyCol], 0);
    totalOriginalStock += originalQty;

    const productName = nameCol ? String(row[nameCol] ?? '') : undefined;
    const productId = idCol ? String(row[idCol] ?? '') : undefined;

    if (cleanIsbn && warehouseMap.has(cleanIsbn)) {
      const warehouseRecord = warehouseMap.get(cleanIsbn)!;
      warehouseRecord.hitCount++;
      matchedCount++;

      const newQty = warehouseRecord.quantity;
      const delta = newQty - originalQty;
      netQuantityDelta += delta;
      totalUpdatedStock += newQty;

      // Update the quantity in the OpenCart row
      updatedRow[opencartQtyCol] = newQty;

      const isUpdated = newQty !== originalQty;
      if (isUpdated) {
        updatedCount++;
      } else {
        identicalCount++;
      }

      reconciliationItems.push({
        index: index + 1,
        cleanIsbn,
        rawIsbn: String(rawIsbnVal ?? ''),
        productName,
        productId,
        originalQty,
        newQty,
        delta,
        status: isUpdated ? 'matched_updated' : 'matched_identical',
        autocountFound: true,
        notes: isUpdated
          ? `Quantity updated from ${originalQty} to ${newQty} (delta: ${delta > 0 ? '+' : ''}${delta})`
          : `Quantity in sync with AutoCount (${newQty})`,
        originalRow: row,
      });
    } else {
      // Unmatched item: Retain existing quantity in the OpenCart file as requested
      unmatchedOpenCartCount++;
      totalUpdatedStock += originalQty;
      updatedRow[opencartQtyCol] = originalQty;

      reconciliationItems.push({
        index: index + 1,
        cleanIsbn: cleanIsbn || 'N/A',
        rawIsbn: String(rawIsbnVal ?? ''),
        productName,
        productId,
        originalQty,
        newQty: originalQty,
        delta: 0,
        status: 'unmatched_retained',
        autocountFound: false,
        notes: cleanIsbn
          ? 'ISBN not found in AutoCount file. Retained existing OpenCart quantity.'
          : 'Missing or empty ISBN. Existing quantity retained.',
        originalRow: row,
      });
    }

    processedOpenCartRows.push(updatedRow);
  });

  // 3. Identify AutoCount warehouse items not present in OpenCart file
  const unmatchedWarehouseItems: UnmatchedWarehouseItem[] = [];
  for (const [cleanIsbn, record] of warehouseMap.entries()) {
    if (record.hitCount === 0) {
      const autoNameCol = autocountDataset.headers.find((h) =>
        /^(description|item_description|name|title|product_name)$/i.test(h.trim())
      );
      unmatchedWarehouseItems.push({
        cleanIsbn,
        rawIsbn: record.rawIsbn,
        quantity: record.quantity,
        productName: autoNameCol ? String(record.rawRow[autoNameCol] ?? '') : undefined,
        rawRow: record.rawRow,
      });
    }
  }

  const summary: ReconciliationSummary = {
    totalOpenCartRows: opencartDataset.rows.length,
    matchedCount,
    updatedCount,
    identicalCount,
    unmatchedOpenCartCount,
    unmatchedAutocountCount: unmatchedWarehouseItems.length,
    netQuantityDelta,
    totalOriginalStock,
    totalUpdatedStock,
    totalAutocountWarehouseStock,
    processedAt: new Date().toISOString(),
    openCartFileName: opencartDataset.fileName,
  };

  return {
    items: reconciliationItems,
    unmatchedWarehouseItems,
    processedOpenCartRows,
    openCartHeaders: opencartDataset.headers,
    summary,
    isExcel: Boolean(opencartDataset.isExcel),
    delimiter: opencartDataset.delimiter || ',',
  };
}
