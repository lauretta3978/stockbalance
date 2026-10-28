import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ReconciliationResult } from '../types';

export function downloadFile(content: BlobPart, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the updated OpenCart file in the EXACT same format as uploaded
 */
export function downloadUpdatedOpenCartFile(result: ReconciliationResult) {
  const originalName = result.summary.openCartFileName || 'OpenCart_Products.csv';
  const cleanBase = originalName.replace(/\.[^/.]+$/, '');

  if (result.isExcel) {
    // Export as Excel preserving exact headers and row order
    const outputFileName = `${cleanBase}_UPDATED.xlsx`;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.processedOpenCartRows, {
      header: result.openCartHeaders,
    });
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, outputFileName);
  } else {
    // Export as CSV with exact delimiter and field order
    const outputFileName = `${cleanBase}_UPDATED.csv`;
    const csvString = Papa.unparse({
      fields: result.openCartHeaders,
      data: result.processedOpenCartRows,
    }, {
      delimiter: result.delimiter || ',',
    });

    downloadFile(csvString, outputFileName, 'text/csv;charset=utf-8;');
  }
}

/**
 * Downloads Discrepancy & Audit Log as a clean CSV file
 */
export function downloadAuditCsv(result: ReconciliationResult) {
  const rows = result.items.map((item) => ({
    'Audit Status':
      item.status === 'matched_updated'
        ? 'QUANTITY UPDATED'
        : item.status === 'matched_identical'
        ? 'IN SYNC (IDENTICAL)'
        : 'UNMATCHED (EXISTING QTY RETAINED)',
    'ISBN (Normalized)': item.cleanIsbn,
    'Raw ISBN': item.rawIsbn,
    'Product ID': item.productId || 'N/A',
    'Product Name': item.productName || 'N/A',
    'Original OpenCart Qty': item.originalQty,
    'AutoCount Warehouse Qty': item.autocountFound ? item.newQty : 'NOT FOUND',
    'Final Updated Qty': item.newQty,
    'Quantity Delta': item.delta,
    'AutoCount Match Found': item.autocountFound ? 'YES' : 'NO',
    'Audit Notes': item.notes,
  }));

  const csvString = Papa.unparse(rows);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  downloadFile(
    csvString,
    `Inventory_Reconciliation_Audit_${timestamp}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * Downloads Comprehensive Multi-Sheet Excel Report (.xlsx)
 */
export function downloadAuditXlsx(result: ReconciliationResult) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const summaryData = [
    ['INVENTORY RECONCILIATION AUDIT REPORT', ''],
    ['Generated At', new Date().toLocaleString()],
    ['Target OpenCart File', result.summary.openCartFileName],
    ['', ''],
    ['METRIC', 'VALUE'],
    ['Total OpenCart Products in File', result.summary.totalOpenCartRows],
    ['Successfully Matched with AutoCount', result.summary.matchedCount],
    ['Quantities Updated (Discrepancies Resolved)', result.summary.updatedCount],
    ['Already In Sync (Identical Quantities)', result.summary.identicalCount],
    ['Unmatched in OpenCart (Retained Existing)', result.summary.unmatchedOpenCartCount],
    ['Warehouse Items Not In OpenCart File', result.summary.unmatchedAutocountCount],
    ['Net Quantity Delta Across Catalog', result.summary.netQuantityDelta],
    ['Total Catalog Stock Before Update', result.summary.totalOriginalStock],
    ['Total Catalog Stock After Update', result.summary.totalUpdatedStock],
    ['Total Physical Warehouse Stock in AutoCount', result.summary.totalAutocountWarehouseStock],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  // Sheet 2: Updated Items (Deltas)
  const updatedItems = result.items
    .filter((item) => item.status === 'matched_updated')
    .map((item) => ({
      'Row #': item.index,
      'ISBN (Normalized)': item.cleanIsbn,
      'Product ID': item.productId || '',
      'Product Name': item.productName || '',
      'Original Qty': item.originalQty,
      'New Warehouse Qty': item.newQty,
      'Variance (Delta)': item.delta,
      'Status': item.delta > 0 ? 'Surplus (+)' : 'Deficit (-)',
    }));
  if (updatedItems.length > 0) {
    const updatedSheet = XLSX.utils.json_to_sheet(updatedItems);
    XLSX.utils.book_append_sheet(wb, updatedSheet, 'Quantity Updates');
  }

  // Sheet 3: Unmatched in OpenCart
  const unmatchedOpenCart = result.items
    .filter((item) => item.status === 'unmatched_retained')
    .map((item) => ({
      'Row #': item.index,
      'ISBN': item.cleanIsbn,
      'Product ID': item.productId || '',
      'Product Name': item.productName || '',
      'Retained Qty': item.originalQty,
      'Reason': 'ISBN not present in AutoCount warehouse file',
    }));
  if (unmatchedOpenCart.length > 0) {
    const unmatchedSheet = XLSX.utils.json_to_sheet(unmatchedOpenCart);
    XLSX.utils.book_append_sheet(wb, unmatchedSheet, 'Unmatched in Warehouse');
  }

  // Sheet 4: AutoCount Warehouse Items Not in OpenCart File
  if (result.unmatchedWarehouseItems.length > 0) {
    const warehouseOnly = result.unmatchedWarehouseItems.map((item) => ({
      'Warehouse ISBN': item.cleanIsbn,
      'Raw ISBN': item.rawIsbn,
      'Item Description': item.productName || '',
      'Warehouse Balance': item.quantity,
      'Notice': 'Present in AutoCount ERP, missing in OpenCart product file',
    }));
    const warehouseSheet = XLSX.utils.json_to_sheet(warehouseOnly);
    XLSX.utils.book_append_sheet(wb, warehouseSheet, 'Warehouse-Only Items');
  }

  // Sheet 5: Full Product Audit Trail
  const fullAudit = result.items.map((item) => ({
    'Row #': item.index,
    'Status':
      item.status === 'matched_updated'
        ? 'Updated'
        : item.status === 'matched_identical'
        ? 'Identical'
        : 'Unmatched',
    'ISBN': item.cleanIsbn,
    'Product ID': item.productId || '',
    'Product Name': item.productName || '',
    'Original Qty': item.originalQty,
    'New Qty': item.newQty,
    'Delta': item.delta,
    'Notes': item.notes,
  }));
  const fullSheet = XLSX.utils.json_to_sheet(fullAudit);
  XLSX.utils.book_append_sheet(wb, fullSheet, 'Complete Catalog Audit');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  XLSX.writeFile(wb, `Reconciliation_Report_${timestamp}.xlsx`);
}
