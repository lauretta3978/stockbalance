import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedDataset } from '../types';

const ISBN_PATTERNS = [
  /^isbn$/i,
  /^isbn[-_]?13$/i,
  /^isbn[-_]?10$/i,
  /^barcode$/i,
  /^item[-_]?code$/i,
  /^product[-_]?code$/i,
  /^model$/i,
  /^code$/i,
  /^sku$/i,
  /isbn/i,
];

const QTY_PATTERNS = [
  /^balance[-_\s]?quantity$/i,
  /^balance[-_\s]?qty$/i,
  /^balance$/i,
  /^qty$/i,
  /^quantity$/i,
  /^stock$/i,
  /^physical[-_\s]?balance$/i,
  /^on[-_\s]?hand$/i,
  /^stock[-_\s]?balance$/i,
  /^current[-_\s]?balance$/i,
  /balance\s*quantity/i,
  /balance/i,
  /qty/i,
  /quantity/i,
];

export function detectColumn(headers: string[], patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = headers.find((h) => pattern.test(h.trim()));
    if (match) return match;
  }
  return undefined;
}

export async function parseFile(
  file: File,
  fileId: 'autocount' | 'opencart',
  targetSheetName?: string
): Promise<ParsedDataset> {
  const fileName = file.name;
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  if (isCsv) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, any>[];

          const detectedIsbnCol = detectColumn(headers, ISBN_PATTERNS);
          const detectedQtyCol = detectColumn(headers, QTY_PATTERNS);

          resolve({
            fileId,
            fileName: file.name,
            fileSize: file.size,
            headers,
            rows,
            rowCount: rows.length,
            detectedIsbnCol,
            detectedQtyCol,
            delimiter: results.meta.delimiter || ',',
            isExcel: false,
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        },
      });
    });
  } else {
    // Excel file (.xlsx, .xls)
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    const selectedSheet = targetSheetName && sheetNames.includes(targetSheetName)
      ? targetSheetName
      : sheetNames[0];

    const worksheet = workbook.Sheets[selectedSheet];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      raw: false,
      defval: '',
    });

    let headers: string[] = [];
    if (rows.length > 0) {
      headers = Object.keys(rows[0]);
    } else {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        if (cell && cell.v) headers.push(String(cell.v));
      }
    }

    const detectedIsbnCol = detectColumn(headers, ISBN_PATTERNS);
    const detectedQtyCol = detectColumn(headers, QTY_PATTERNS);

    return {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      headers,
      rows,
      rowCount: rows.length,
      sheetNames,
      selectedSheet,
      detectedIsbnCol,
      detectedQtyCol,
      isExcel: true,
    };
  }
}
