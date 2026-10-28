# Stock Balance Update Application (Operations Management Suite)

## 1. App Overview & Objective
As an Operations Manager, maintaining inventory accuracy across multiple platforms (Autocount ERP and OpenCart e-commerce store) is critical. This application allows users to:
1. **Upload Autocount Stock File** (Source of truth for physical stock / balance quantities).
2. **Upload OpenCart Export File** (Existing catalog linking ISBN to OpenCart Product IDs).
3. **Upload OpenCart Final Export File (`HD_Export-Products-2026-10-14-170223_FINAL`)** (Target file to be updated).
4. **Perform VLOOKUP / Matching** using **ISBN numbers** from Autocount against the OpenCart catalog.
5. **Update Quantities** and instantly download the updated `_FINAL` export file ready for re-import into OpenCart.

---

## 2. Google AI Studio System Instructions
If you are deploying this as a prompt or application in **Google AI Studio**, use the following system instructions for the model:

```text
You are an expert Enterprise Operations Assistant and Data Processing Engineer. Your task is to process inventory reconciliation spreadsheets.
You will receive:
1. Autocount Stock Balance Data (containing ISBN and current physical quantity/balance).
2. OpenCart Product Data (containing ISBN and OpenCart Product ID / identifiers).
3. OpenCart Final Export File (HD_Export-Products-2026-10-14-170223_FINAL) which needs its quantity column updated.

Matching Rule: Match rows strictly using the ISBN number.
Update Rule: Take the quantity from the Autocount file for each matching ISBN and update the corresponding quantity field in the OpenCart Final Export file. Unmatched items should retain their existing quantities or be flagged in an audit log.
Output: Provide clean, downloadable CSV files and a reconciliation summary report (total items matched, unmatched items, stock discrepancies).
```

---

## 3. Complete Interactive Web Application Code (HTML / JavaScript)
Below is the complete, single-file client-side application code. You can paste this directly into Google AI Studio's code execution environment, save it as an HTML file, or run it in your browser. It runs 100% locally in your browser for maximum data privacy and speed.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Balance Update App - Operations Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-indigo-900 text-white shadow-md py-4 px-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold tracking-wide">📦 Stock Balance Update & VLOOKUP Engine</h1>
            <span class="text-xs bg-indigo-700 px-3 py-1 rounded-full font-medium">Operations Manager Suite</span>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: File Uploads & Configuration -->
        <div class="lg:col-span-1 space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 class="text-lg font-semibold text-slate-900 border-b pb-2">1. Upload Source Files</h2>
            
            <!-- Autocount File -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Autocount Stock File (.csv/.xlsx)</label>
                <input type="file" id="autocountFile" accept=".csv, .xlsx, .xls" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border rounded-lg">
                <p id="autocountStatus" class="text-xs text-slate-500 mt-1">Not uploaded</p>
            </div>

            <!-- OpenCart Map File -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">OpenCart Mapping File (.csv/.xlsx)</label>
                <input type="file" id="opencartFile" accept=".csv, .xlsx, .xls" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border rounded-lg">
                <p id="opencartStatus" class="text-xs text-slate-500 mt-1">Not uploaded</p>
            </div>

            <!-- OpenCart Final Export File -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">OpenCart Final Export File (.csv/.xlsx)</label>
                <p class="text-xs text-slate-400 mb-1">Target: HD_Export-Products-..._FINAL</p>
                <input type="file" id="finalFile" accept=".csv, .xlsx, .xls" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border rounded-lg">
                <p id="finalStatus" class="text-xs text-slate-500 mt-1">Not uploaded</p>
            </div>

            <hr class="border-slate-200">

            <!-- Column Mapping Settings -->
            <h2 class="text-lg font-semibold text-slate-900">2. Column Matching Keys</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Autocount ISBN Column Name</label>
                    <input type="text" id="autoIsbnCol" value="ISBN" class="w-full p-2 text-sm border rounded-lg bg-slate-50">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Autocount Quantity Column Name</label>
                    <input type="text" id="autoQtyCol" value="Balance" class="w-full p-2 text-sm border rounded-lg bg-slate-50">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">OpenCart Final ISBN Column Name</label>
                    <input type="text" id="finalIsbnCol" value="isbn" class="w-full p-2 text-sm border rounded-lg bg-slate-50">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">OpenCart Final Quantity Column Name</label>
                    <input type="text" id="finalQtyCol" value="quantity" class="w-full p-2 text-sm border rounded-lg bg-slate-50">
                </div>
            </div>

            <button id="processBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow transition duration-200 disabled:opacity-50" disabled>
                Run VLOOKUP & Update Stock
            </button>
        </div>

        <!-- Right Column: Results & Logs -->
        <div class="lg:col-span-2 space-y-6 flex flex-col">
            <!-- Stats Dashboard -->
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p class="text-xs font-medium text-slate-500 uppercase">Total Items Processed</p>
                    <p id="statTotal" class="text-2xl font-bold text-slate-900 mt-1">0</p>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p class="text-xs font-medium text-emerald-600 uppercase">Successfully Matched</p>
                    <p id="statMatched" class="text-2xl font-bold text-emerald-600 mt-1">0</p>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p class="text-xs font-medium text-amber-600 uppercase">Unmatched / Missing</p>
                    <p id="statUnmatched" class="text-2xl font-bold text-amber-600 mt-1">0</p>
                </div>
            </div>

            <!-- Action / Download Card -->
            <div id="downloadCard" class="bg-emerald-50 border border-emerald-200 p-6 rounded-xl hidden flex items-center justify-between">
                <div>
                    <h3 class="text-emerald-900 font-semibold text-lg">Update Complete!</h3>
                    <p class="text-emerald-700 text-sm">Your updated OpenCart final export file is ready for download.</p>
                </div>
                <button id="downloadBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow transition duration-200">
                    Download Updated Final CSV
                </button>
            </div>

            <!-- Log / Preview Table -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col overflow-hidden">
                <div class="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-sm text-slate-700">
                    Processing Audit & Match Log
                </div>
                <div class="p-6 flex-grow overflow-y-auto max-h-[450px]">
                    <div id="logArea" class="text-sm text-slate-600 space-y-2">
                        <p class="italic text-slate-400">Upload all three source files and click 'Run VLOOKUP & Update Stock' to begin reconciliation.</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Script Logic -->
    <script>
        let autocountData = [];
        let opencartData = [];
        let finalData = [];
        let processedFinalData = [];

        function handleFile(e, type) {
            const file = e.target.files[0];
            if (!file) return;

            const statusEl = document.getElementById(type + 'Status');
            statusEl.textContent = `Loaded: ${file.name}`;
            statusEl.classList.add('text-emerald-600', 'font-medium');

            const reader = new FileReader();
            if (file.name.endsWith('.csv')) {
                reader.onload = (event) => {
                    Papa.parse(event.target.result, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            storeData(type, results.data);
                        }
                    });
                };
                reader.readAsText(file);
            } else {
                reader.onload = (event) => {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.SheetNames[0];
                    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
                    storeData(type, rows);
                };
                reader.readAsArrayBuffer(file);
            }
        }

        function storeData(type, data) {
            if (type === 'autocount') autocountData = data;
            if (type === 'opencart') opencartData = data;
            if (type === 'final') finalData = data;

            if (autocountData.length > 0 && finalData.length > 0) {
                document.getElementById('processBtn').disabled = false;
            }
        }

        document.getElementById('autocountFile').addEventListener('change', (e) => handleFile(e, 'autocount'));
        document.getElementById('opencartFile').addEventListener('change', (e) => handleFile(e, 'opencart'));
        document.getElementById('finalFile').addEventListener('change', (e) => handleFile(e, 'final'));

        document.getElementById('processBtn').addEventListener('click', () => {
            const autoIsbnCol = document.getElementById('autoIsbnCol').value.trim();
            const autoQtyCol = document.getElementById('autoQtyCol').value.trim();
            const finalIsbnCol = document.getElementById('finalIsbnCol').value.trim();
            const finalQtyCol = document.getElementById('finalQtyCol').value.trim();

            const logArea = document.getElementById('logArea');
            logArea.innerHTML = '';

            // Build dictionary from autocount: ISBN -> Quantity
            const stockMap = new Map();
            autocountData.forEach(row => {
                const isbn = row[autoIsbnCol] !== undefined ? String(row[autoIsbnCol]).trim() : '';
                const qty = row[autoQtyCol] !== undefined ? row[autoQtyCol] : 0;
                if (isbn) {
                    stockMap.set(isbn, qty);
                }
            });

            let matchedCount = 0;
            let unmatchedCount = 0;

            processedFinalData = finalData.map(row => {
                const rowIsbn = row[finalIsbnCol] !== undefined ? String(row[finalIsbnCol]).trim() : '';
                if (rowIsbn && stockMap.has(rowIsbn)) {
                    matchedCount++;
                    row[finalQtyCol] = stockMap.get(rowIsbn);
                } else if (rowIsbn) {
                    unmatchedCount++;
                }
                return row;
            });

            document.getElementById('statTotal.textContent').textContent = finalData.length;
            document.getElementById('statTotal').textContent = finalData.length;
            document.getElementById('statMatched').textContent = matchedCount;
            document.getElementById('statUnmatched').textContent = unmatchedCount;

            logArea.innerHTML += `<p class="text-emerald-700 font-semibold">✓ VLOOKUP completed successfully.</p>`;
            logArea.innerHTML += `<p class="text-slate-600">Matched ${matchedCount} items using ISBN.</p>`;
            if (unmatchedCount > 0) {
                logArea.innerHTML += `<p class="text-amber-600">⚠ Warning: ${unmatchedCount} items in final export could not be found in Autocount.</p>`;
            }

            document.getElementById('downloadCard').classList.remove('hidden');
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            const csv = Papa.unparse(processedFinalData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'HD_Export-Products-2026-10-14-170223_FINAL_UPDATED.csv';
            a.click();
        });
    </script>
</body>
</html>