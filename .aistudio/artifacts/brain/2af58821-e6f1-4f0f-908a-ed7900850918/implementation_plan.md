# Stock Balance Update & Inventory Reconciliation Suite

An enterprise-grade operations workspace to reconcile physical stock balances from Autocount ERP with OpenCart e-commerce catalogs via strict ISBN VLOOKUP matching, generating production-ready updated export files and detailed visual discrepancy audit reports.

> [!IMPORTANT]
> **Confirmed Operational Decisions from Clarification:**
> - **Unmatched Item Policy**: Unmatched items in the OpenCart Final Export file will retain their existing catalog quantities and be prominently flagged in the Reconciliation Audit Log with discrepancy categorization.
> - **Data Mode**: Clean slate file upload mode (user uploads their own Autocount, OpenCart catalog, and Final Export `.csv` or `.xlsx` files without mock clutter).
> - **Deliverables**: Instant generation and download of both the updated OpenCart Final Export CSV (`HD_Export-Products-..._FINAL_UPDATED.csv`) and an in-depth Reconciliation Discrepancy & Audit Report (CSV and Excel formats) featuring visual side-by-side diffs.

---

## 1. Overview & Core Concept

Operations managers frequently struggle with inventory desynchronization between physical warehouse counts recorded in **Autocount ERP** and online store listings in **OpenCart**. This application automates the end-to-end reconciliation:

1. **Three-Source Ingestion**:
   - **Autocount Stock Balance File**: Source of truth for physical on-hand quantity (`Balance` / `Qty` indexed by `ISBN`).
   - **OpenCart Product Mapping File**: Catalog database referencing OpenCart Product IDs, models, and ISBNs.
   - **OpenCart Final Export File (`HD_Export-Products-..._FINAL`)**: The exact export spreadsheet destined for re-import into OpenCart.
2. **Deterministic VLOOKUP Engine**:
   - Normalizes ISBN strings (stripping hyphens, whitespace, and formatting anomalies) to perform exact, zero-collision cross-referencing.
   - Updates target quantity fields in the export file while preserving all other columns, headers, formatting, and row ordering intact.
3. **Discrepancy & Audit Intelligence**:
   - Categorizes records: **Exact Matches with Stock Shift** (surplus / deficit), **Exact Matches with Zero Delta** (verified in sync), **Unmatched in Autocount** (products in OpenCart missing from warehouse feed), and **Unmatched in OpenCart** (warehouse items missing from OpenCart catalog).
   - Generates downloadable CSV/XLSX audit trails for compliance and inventory accountability.

---

## 2. User Experience & Visual Design

Following the **SaaS & Enterprise Dashboard** guidelines (`references/3_saas_dashboard.md`), the interface emphasizes high data density, clear visual feedback, and zero decorative clutter:

### Visual Identity & Theme
- **Dominant Neutral Canvas (60%)**: Deep slate / crisp light background (`#0F172A` / `#F8FAFC`) with high-contrast text hierarchy.
- **Structural Surfaces (30%)**: Minimal hairline borders (`border-slate-200 / dark:border-slate-800`), flat cards without stacked elevations or heavy drop shadows.
- **Intent-Driven Accents (10%)**: Indigo primary actions (`#4F46E5`), Emerald for synchronized positive balances (`#16A34A`), Amber for deficits/warnings (`#D97706`), and Crimson for critical mismatches (`#DC2626`).
- **Typography & Tabular Discipline**: High-clarity sans (`Plus Jakarta Sans` / `Outfit`) paired with strict tabular monospace figures (`JetBrains Mono` / `tabular-nums`) across all numerical quantities, counts, differences, and ISBN codes.
- **Anti-Slop Discipline**: No decorative pulsing status dots, no fake system telemetry tickers, and no pill-sandwich badge clusters. Metadata presented as clean unboxed inline text with typographic bullet separators (`·`).

### Workflow & Screen Layout
1. **Header & Context Bar**:
   - Single-line wordmark `Stock Reconciliation Engine` with breadcrumb context `Operations / Inventory Sync`.
   - Right zone with quick reset / clear session action.
2. **Three-Source Upload Stage (Interactive Drag-and-Drop Cards)**:
   - File slot 1: **Autocount Stock Balance** (supports `.csv`, `.xlsx`, `.xls`).
   - File slot 2: **OpenCart Catalog Map** (optional link for secondary ID / SKU mapping).
   - File slot 3: **OpenCart Final Export File** (`HD_Export-Products-*-*_FINAL`).
   - Auto-detection and manual column-selector dropdowns for ISBN column and Quantity column with real-time column preview.
3. **Reconciliation Summary Strip (KPIs)**:
   - Four high-density KPI metrics with tabular numbers: Total Final Rows, Successfully Matched & Updated, Unchanged In-Sync Items, and Flagged Unmatched Items.
4. **Interactive Audit & Diff Table**:
   - Searchable, filterable data grid with row status tabs (`All (N)`, `Quantity Updated (N)`, `Unchanged (N)`, `Unmatched / Discrepancies (N)`).
   - Side-by-side diff highlighting: `Old OpenCart Qty` ➔ `New Autocount Qty` with colored delta indicator (`+5`, `-2`, `0`).
5. **Export & Download Center**:
   - Primary Action: **Download Updated Final CSV** (ready for instant re-import into OpenCart).
   - Secondary Action: **Download Reconciliation Audit Report** (CSV / Excel format with timestamps and variance explanations).

---

## 3. Key Product Decisions & Trade-Offs

- **Client-Side Parsing & Privacy-Preserving Processing**:
  - *Chosen Approach*: Execute file parsing (PapaParse for CSV, SheetJS `xlsx` for Excel) and VLOOKUP reconciliation 100% in-browser in Web Worker / memory.
  - *Why*: Immediate sub-second execution for spreadsheets with 50,000+ rows; zero risk of uploading proprietary ERP pricing and customer catalog data to remote cloud servers.
  - *Alternatives Considered*: Server-side Node/Express endpoint processing; rejected due to payload size limits, network latency, and unnecessary security overhead.
- **ISBN Strict Normalization vs Fuzzy Matching**:
  - *Chosen Approach*: Strict alphanumeric cleaning (e.g., removing spaces, hyphens, and leading/trailing quotes) while maintaining 10-digit and 13-digit exact parity.
  - *Why*: Books and SKU items have strict international standard book numbers. Fuzzy matching risks writing warehouse counts to the wrong book edition.
- **File Structure Preservation**:
  - *Chosen Approach*: Maintain exact column headers and row sequences of the user's `HD_Export-Products-..._FINAL` file, only mutating the specified quantity column in matching rows.
  - *Why*: OpenCart bulk import modules require strict column index integrity and will reject or corrupt imports if columns are reordered or stripped.

---

## 4. Technical Architecture & Data Strategy

### System & Component Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Stock Balance Update Suite                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Autocount Ingest    │  │  OpenCart Map Ingest │  │ OpenCart Final Ingest│
│  (.csv / .xlsx)      │  │  (.csv / .xlsx)      │  │ (.csv / .xlsx)       │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │  Column Mapping & Normalizer    │
                    │  - ISBN cleaner (ISBN-10/13)    │
                    │  - Numeric balance parser       │
                    └────────────────┬────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │    VLOOKUP Matching Engine      │
                    │  - O(1) Map lookup by clean ISBN│
                    │  - Preserve unmatched quantities│
                    │  - Calculate deltas & variances │
                    └────────────────┬────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│     Interactive Audit Grid      │         │         Export Center           │
│ - Live search & filter tabs     │         │ - Updated Final OpenCart CSV    │
│ - Quantity delta visual diff    │         │ - Discrepancy Audit Log (CSV)   │
│ - Discrepancy inspection        │         │ - Formatted Excel Report (XLSX) │
└─────────────────────────────────┘         └─────────────────────────────────┘
```

### Data Models & Type Contracts

```typescript
export interface StockRow {
  raw: Record<string, any>;
  cleanIsbn: string;
  quantity: number;
}

export interface FinalProductRow {
  raw: Record<string, any>;
  cleanIsbn: string;
  originalQty: number;
  newQty: number;
  status: 'matched_updated' | 'matched_identical' | 'unmatched_retained';
  delta: number;
}

export interface ReconciliationSummary {
  totalFinalRows: number;
  matchedCount: number;
  updatedCount: number;
  identicalCount: number;
  unmatchedFinalCount: number;
  unmatchedAutocountCount: number;
  netQuantityDelta: number;
  timestamp: string;
}
```

### Component Breakdown
1. `App.tsx`: Main application shell with Top Bar, state coordination, and responsive workspace container.
2. `FileUploadZone.tsx`: High-performance drag-and-drop file uploaders with file inspection, sheet selector, and detected column confirmation.
3. `ColumnMappingBar.tsx`: Auto-detects columns (`ISBN`, `isbn`, `Balance`, `quantity`, `Qty`) with overrides.
4. `ReconciliationStats.tsx`: Key metrics strip with clean tabular numerals.
5. `AuditDataGrid.tsx`: High-density virtualized / paginated table with status filter segmented tabs, search filter, and visual diff badges.
6. `ExportToolbar.tsx`: Direct CSV and XLSX download buttons with progress states.
