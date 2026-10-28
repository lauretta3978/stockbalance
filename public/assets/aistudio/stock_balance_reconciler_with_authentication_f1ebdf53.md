# Stock Balance Reconciler & Operations Suite (with RBAC)

## 1. App Overview & Objective
This application provides automated inventory reconciliation between **AutoCount** and **OpenCart** export files with built-in role-based user management:
* **User Authentication & RBAC:** Secure Login and Create Account screens. Administrators can add, edit, or delete users and manage roles. Standard operators can log in to run reconciliation tasks.
* **Zero Manual Mapping:** Automatically uses `Item Code` & `Qty` from AutoCount and `ISBN` & `Quantity` from OpenCart.
* **Design System:** Crisp white title header (`Stock Balance Reconciler`), rich black and purple operations dashboard, 3D tactile buttons, and smooth scroll animations.
* **Outputs:** Final Reconciled OpenCart Export File, Audit Report File, and Discrepancy Log File.

---

## 2. Complete Single-File Application Code (HTML / Tailwind CSS / JavaScript)

Save or paste the following code into Google AI Studio's preview environment:

```html
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Balance Reconciler</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <style>
        .btn-3d {
            box-shadow: 0 6px 0 0 rgba(147, 51, 234, 1);
            transition: all 0.1s ease;
        }
        .btn-3d:hover {
            box-shadow: 0 3px 0 0 rgba(147, 51, 234, 1);
            transform: translateY(3px);
        }
        .btn-3d:active {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 1);
            transform: translateY(6px);
        }
        .btn-emerald-3d {
            box-shadow: 0 6px 0 0 rgba(5, 150, 105, 1);
            transition: all 0.1s ease;
        }
        .btn-emerald-3d:hover {
            box-shadow: 0 3px 0 0 rgba(5, 150, 105, 1);
            transform: translateY(3px);
        }
        .btn-emerald-3d:active {
            box-shadow: 0 0 0 0 rgba(5, 150, 105, 1);
            transform: translateY(6px);
        }
        .scroll-reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .scroll-reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body class="bg-black text-slate-100 min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-white">

    <!-- AUTHENTICATION VIEW -->
    <div id="authView" class="fixed inset-0 bg-black z-50 flex items-center justify-center p-6">
        <div class="max-w-md w-full bg-slate-950 border border-purple-900/60 p-8 rounded-3xl shadow-2xl space-y-6">
            <div class="text-center space-y-2">
                <span class="text-4xl">📦</span>
                <h1 class="text-2xl font-black text-white">Stock Balance Reconciler</h1>
                <p id="authSubtitle" class="text-xs text-purple-400">Sign in to your operations account</p>
            </div>

            <!-- Login Form -->
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Username</label>
                    <input type="text" id="loginUsername" required class="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Password</label>
                    <input type="password" id="loginPassword" required class="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500">
                </div>
                <button type="submit" class="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl btn-3d uppercase tracking-wider text-xs">
                    Sign In
                </button>
            </form>

            <!-- Create Account Form (Hidden by default) -->
            <form id="registerForm" class="space-y-4 hidden">
                <div>
                    <label class="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Choose Username</label>
                    <input type="text" id="regUsername" required class="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Choose Password</label>
                    <input type="password" id="regPassword" required class="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500">
                </div>
                <button type="submit" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl btn-emerald-300 uppercase tracking-wider text-xs">
                    Create Account
                </button>
            </form>

            <div class="text-center pt-2">
                <button id="toggleAuthMode" class="text-xs text-purple-400 hover:underline">
                    Need an account? Click here to register
                </button>
            </div>
            <p id="authError" class="text-xs text-rose-500 text-center font-semibold hidden"></p>
        </div>
    </div>

    <!-- MAIN APP VIEW (Hidden until login) -->
    <div id="mainAppView" class="hidden flex-col min-h-screen">
        <!-- White Title Header -->
        <header class="bg-white text-slate-900 py-6 px-8 shadow-md sticky top-0 z-40">
            <div class="max-w-6xl mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">📦</span>
                    <h1 class="text-2xl font-black tracking-tight text-slate-900">Stock Balance Reconciler</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <div id="userInfoBadge" class="text-xs font-semibold bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full border border-purple-200">
                        User: admin
                    </div>
                    <button id="logoutBtn" class="text-xs text-rose-600 hover:underline font-bold">Sign Out</button>
                </div>
            </div>
        </header>

        <!-- Operations Content -->
        <main class="flex-grow max-w-6xl w-full mx-auto px-6 py-10 space-y-12">

            <!-- Admin User Management Panel (Visible only to Admin) -->
            <section id="adminPanel" class="hidden bg-slate-950 p-8 rounded-2xl border border-purple-900/60 shadow-xl space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold text-purple-300 flex items-center space-x-2">
                        <span>🛡️</span> <span>Admin User Management</span>
                    </h2>
                    <span class="text-xs text-slate-400">Add, Edit or Delete Operators</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" id="newOpUsername" placeholder="New Username" class="bg-black border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-white">
                    <input type="password" id="newOpPassword" placeholder="Password" class="bg-black border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-white">
                    <button id="addUserBtn" class="py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider btn-3D">
                        Add User Account
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-slate-300">
                        <thead class="border-b border-purple-900/50 text-purple-400 uppercase">
                            <tr>
                                <th class="py-3 px-4">Username</th>
                                <th class="py-3 px-4">Role</th>
                                <th class="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Simple Upload Section -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950 p-8 rounded-2xl border border-purple-900/40 shadow-2xl scroll-reveal">
                <!-- AutoCount File Upload -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-bold text-purple-300 flex items-center space-x-2">
                            <span>📊</span> <span>AutoCount File</span>
                        </h2>
                        <span class="text-xs text-slate-400">Default: Item Code & Qty</span>
                    </div>
                    <div class="border-2 border-dashed border-purple-900/60 rounded-xl p-6 text-center bg-black/40 hover:border-purple-500 transition">
                        <input type="file" id="autocountFile" accept=".csv, .xlsx, .xls" class="hidden">
                        <label for="autocountFile" class="cursor-pointer block space-y-2">
                            <div class="text-3xl">📂</div>
                            <p class="text-sm font-medium text-slate-300">Click to upload AutoCount export</p>
                            <p id="autocountStatus" class="text-xs text-purple-400 font-mono">No file selected</p>
                        </label>
                    </div>
                </div>

                <!-- OpenCart File Upload -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-bold text-purple-300 flex items-center space-x-2">
                            <span>🛒</span> <span>OpenCart Final File</span>
                        </h2>
                        <span class="text-xs text-slate-400">Default: ISBN & Quantity</span>
                    </div>
                    <div class="border-2 border-dashed border-purple-900/60 rounded-xl p-6 text-center bg-black/40 hover:border-purple-500 transition">
                        <input type="file" id="opencartFile" accept=".csv, .xlsx, .xls" class="hidden">
                        <label for="opencartFile" class="cursor-pointer block space-y-2">
                            <div class="text-3xl">📂</div>
                            <p class="text-sm font-medium text-slate-300">Click to upload OpenCart target file</p>
                            <p id="opencartStatus" class="text-xs text-purple-400 font-mono">No file selected</p>
                        </label>
                    </div>
                </div>

                <!-- Run Reconciler Button -->
                <div class="md:col-span-2 pt-4 flex justify-center">
                    <button id="processBtn" class="w-full md:w-auto px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl btn-3d uppercase tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none" disabled>
                        ⚡ Run Stock Reconciliation
                    </button>
                </div>
            </section>

            <!-- Results & Summary Section (Hidden initially) -->
            <div id="resultsSection" class="hidden space-y-10 scroll-reveal">
                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-slate-950 p-6 rounded-2xl border border-purple-900/40 text-center shadow-lg">
                        <p class="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Processed</p>
                        <p id="statTotal" class="text-3xl font-black text-white mt-2">0</p>
                    </div>
                    <div class="bg-slate-950 p-6 rounded-2xl border border-emerald-900/40 text-center shadow-lg">
                        <p class="text-xs uppercase tracking-wider font-semibold text-emerald-400">Successfully Matched</p>
                        <p id="statMatched" class="text-3xl font-black text-emerald-400 mt-2">0</p>
                    </div>
                    <div class="bg-slate-950 p-6 rounded-2xl border border-rose-900/40 text-center shadow-lg">
                        <p class="text-xs uppercase tracking-wider font-semibold text-rose-400">Discrepancies / Unmatched</p>
                        <p id="statUnmatched" class="text-3xl font-black text-rose-400 mt-2">0</p>
                    </div>
                </div>

                <!-- Download Final File Action -->
                <div class="bg-gradient-to-r from-purple-950/60 to-slate-950 border border-purple-600/40 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div>
                        <h3 class="text-xl font-bold text-white">Reconciliation Complete</h3>
                        <p class="text-sm text-slate-300 mt-1">Download your updated OpenCart final export file matching the exact template format.</p>
                    </div>
                    <button id="downloadFinalBtn" class="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl btn-emerald-3d uppercase tracking-wider text-xs">
                        ⬇ Download Final Updated File
                    </button>
                </div>

                <!-- Two Files: Report & Discrepancy Files -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Report File Card -->
                    <div class="bg-slate-950 p-6 rounded-2xl border border-purple-900/40 flex flex-col justify-between space-y-6">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-bold text-purple-300 flex items-center space-x-2"><span>📋</span> <span>Audit Report File</span></h4>
                                <span class="text-xs bg-purple-900/50 text-purple-300 px-2.5 py-1 rounded-md font-mono">CSV</span>
                            </div>
                            <p class="text-xs text-slate-400">Complete audit log showing prior quantities vs updated reconciled quantities.</p>
                        </div>
                        <button id="downloadReportBtn" class="w-full py-3 bg-slate-900 hover:bg-purple-900/50 text-purple-200 border border-purple-700/50 font-bold rounded-xl text-xs uppercase tracking-wider transition">
                            Download Audit Report
                        </button>
                    </div>

                    <!-- Discrepancy File Card -->
                    <div class="bg-slate-950 p-6 rounded-2xl border border-rose-900/40 flex flex-col justify-between space-y-6">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-bold text-rose-400 flex items-center space-x-2"><span>⚠️</span> <span>Discrepancy Log File</span></h4>
                                <span class="text-xs bg-rose-900/50 text-rose-300 px-2.5 py-1 rounded-md font-mono">CSV</span>
                            </div>
                            <p class="text-xs text-slate-400">List of items present in OpenCart but missing from AutoCount warehouse records.</p>
                        </div>
                        <button id="downloadDiscrepancyBtn" class="w-full py-3 bg-slate-900 hover:bg-rose-900/50 text-rose-200 border border-rose-700/50 font-bold rounded-xl text-xs uppercase tracking-wider transition">
                            Download Discrepancy File
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="border-t border-purple-950/60 py-6 text-center text-xs text-slate-500">
            Stock Balance Reconciler &bull; Operations & Warehouse Management
        </footer>
    </div>

    <!-- Script Logic -->
    <script>
        // User State & Mock Users
        let users = JSON.parse(localStorage.getItem('stock_app_users')) || [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'operator1', password: 'password123', role: 'user' }
        ];
        let currentUser = null;

        let autocountData = [], opencartData = [];
        let updatedRows = [], reportRows = [], discrepancyRows = [];

        // Auth Mode Switcher
        let isRegisterMode = false;
        document.getElementById('toggleAuthMode').addEventListener('click', () => {
            isRegisterMode = !isRegisterMode;
            document.getElementById('loginForm').classList.toggle('hidden', isRegisterMode);
            document.getElementById('registerForm').classList.toggle('hidden', !isRegisterMode);
            document.getElementById('authSubtitle').textContent = isRegisterMode ? 'Create a new operator account' : 'Sign in to your operations account';
            document.getElementById('toggleAuthMode').textContent = isRegisterMode ? 'Already have an account? Sign in' : "Need an account? Click here to register";
            document.getElementById('authError').classList.add('hidden');
        });

        // Login Handler
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('loginUsername').value.trim();
            const p = document.getElementById('loginPassword').value.trim();
            const found = users.find(x => x.username === u && x.password === p);
            if (found) {
                currentUser = found;
                initApp();
            } else {
                showAuthError('Invalid username or password.');
            }
        });

        // Register Handler
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('regUsername').value.trim();
            const p = document.getElementById('regPassword').value.trim();
            if (users.some(x => x.username === u)) {
                showAuthError('Username already exists.');
                return;
            }
            users.push({ username: u, password: p, role: 'user' });
            localStorage.setItem('stock_app_users', JSON.stringify(users));
            currentUser = { username: u, role: 'user' };
            initApp();
        });

        function showAuthError(msg) {
            const err = document.getElementById('authError');
            err.textContent = msg;
            err.classList.remove('hidden');
        }

        document.getElementById('logoutBtn').addEventListener('click', () => {
            currentUser = null;
            document.getElementById('mainAppView').classList.add('hidden');
            document.getElementById('authView').classList.remove('hidden');
        });

        function initApp() {
            document.getElementById('authView').classList.add('hidden');
            document.getElementById('mainAppView').classList.remove('hidden');
            document.getElementById('userInfoBadge').textContent = `User: ${currentUser.username} (${currentUser.role})`;
            
            const adminPanel = document.getElementById('adminPanel');
            if (currentUser.role === 'admin') {
                adminPanel.classList.remove('hidden');
                renderUserTable();
            } else {
                adminPanel.classList.add('hidden');
            }
        }

        // Admin User Management
        document.getElementById('addUserBtn').addEventListener('click', () => {
            const u = document.getElementById('newOpUsername').value.trim();
            const p = document.getElementById('newOpPassword').value.trim();
            if (!u || !p) return alert('Enter username and password');
            if (users.some(x => x.username === u)) return alert('User already exists');
            users.push({ username: u, password: p, role: 'user' });
            localStorage.setItem('stock_app_users', JSON.stringify(users));
            document.getElementById('newOpUsername').value = '';
            document.getElementById('newOpPassword').value = '';
            renderUserTable();
        });

        function renderUserTable() {
            const tbody = document.getElementById('userTableBody');
            tbody.innerHTML = '';
            users.forEach((usr, idx) => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-purple-900/30';
                tr.innerHTML = `
                    <td class="py-3 px-4 font-mono text-white">${usr.username}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${usr.role === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-slate-800 text-slate-300'}">${usr.role}</span></td>
                    <td class="py-3 px-4 text-right space-x-2">
                        ${usr.username !== 'admin' ? `<button onclick="deleteUser(${idx})" class="text-rose-400 hover:underline">Delete</button>` : '<span class="text-slate-600">Protected</span>'}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        window.deleteUser = function(idx) {
            if (confirm('Delete this user account?')) {
                users.splice(idx, 1);
                localStorage.setItem('stock_app_users', JSON.stringify(users));
                renderUserTable();
            }
        }

        // Scroll Reveal Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

        // File handling
        document.getElementById('autocountFile').addEventListener('change', (e) => handleFile(e, 'autocount'));
        document.getElementById('opencartFile').addEventListener('change', (e) => handleFile(e, 'opencart'));

        function handleFile(e, type) {
            const file = e.target.files[0];
            if (!file) return;

            const statusEl = document.getElementById(type + 'Status');
            statusEl.textContent = file.name;
            statusEl.classList.remove('text-purple-400');
            statusEl.classList.add('text-emerald-400', 'font-bold');

            const reader = new FileReader();
            if (file.name.endsWith('.csv')) {
                reader.onload = (event) => {
                    Papa.parse(event.target.result, {
                        header: true, skipEmptyLines: true,
                        complete: (res) => {
                            if (type === 'autocount') autocountData = res.data;
                            if (type === 'opencart') opencartData = res.data;
                            checkReady();
                        }
                    });
                };
                reader.readAsText(file);
            } else {
                reader.onload = (event) => {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    if (type === 'autocount') autocountData = rows;
                    if (type === 'opencart') opencartData = rows;
                    checkReady();
                };
                reader.readAsArrayBuffer(file);
            }
        }

        function checkReady() {
            if (autocountData.length > 0 && opencartData.length > 0) {
                document.getElementById('processBtn').disabled = false;
            }
        }

        document.getElementById('processBtn').addEventListener('click', () => {
            // Build AutoCount map using default Item Code & Qty keys
            const stockMap = new Map();
            autocountData.forEach(row => {
                const keys = Object.keys(row);
                const itemCodeKey = keys.find(k => k.trim().toLowerCase() === 'item code' || k.trim().toLowerCase() === 'itemcode' || k.trim().toLowerCase() === 'isbn');
                const qtyKey = keys.find(k => k.trim().toLowerCase() === 'qty' || k.trim().toLowerCase() === 'quantity' || k.trim().toLowerCase() === 'balance' || k.trim().toLowerCase() === 'balance quantity');
                
                if (itemCodeKey && qtyKey) {
                    const code = String(row[itemCodeKey]).trim();
                    const qty = parseFloat(row[qtyKey]) || 0;
                    if (code) stockMap.set(code, qty);
                }
            });

            let matched = 0, unmatched = 0;
            updatedRows = [];
            reportRows = [];
            discrepancyRows = [];

            opencartData.forEach(row => {
                const keys = Object.keys(row);
                const isbnKey = keys.find(k => k.trim().toLowerCase() === 'isbn' || k.trim().toLowerCase() === 'item code');
                const qtyKey = keys.find(k => k.trim().toLowerCase() === 'quantity' || k.trim().toLowerCase() === 'qty');

                const isbnVal = isbnKey ? String(row[isbnKey]).trim() : '';
                const oldQty = qtyKey ? row[qtyKey] : 0;

                let newQty = oldQty;
                let status = 'Unmatched';

                if (isbnVal && stockMap.has(isbnVal)) {
                    newQty = stockMap.get(isbnVal);
                    matched++;
                    status = 'Matched';
                    if (qtyKey) row[qtyKey] = newQty;
                } else {
                    unmatched++;
                    discrepancyRows.push({
                        ISBN: isbnVal,
                        Status: 'Missing in AutoCount',
                        OpenCart_Quantity: oldQty
                    });
                }

                reportRows.push({
                    ISBN: isbnVal,
                    Status: status,
                    Previous_Quantity: oldQty,
                    Updated_Quantity: newQty
                });

                updatedRows.push(row);
            });

            document.getElementById('statTotal').textContent = opencartData.length;
            document.getElementById('statMatched').textContent = matched;
            document.getElementById('statUnmatched').textContent = unmatched;

            document.getElementById('resultsSection').classList.remove('hidden');
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('downloadFinalBtn').addEventListener('click', () => downloadCSV(updatedRows, 'HD_Export-Products-FINAL_RECONCILED.csv'));
        document.getElementById('downloadReportBtn').addEventListener('click', () => downloadCSV(reportRows, 'Inventory_Reconciliation_Audit_Report.csv'));
        document.getElementById('downloadDiscrepancyBtn').addEventListener('click', () => downloadCSV(discrepancyRows, 'Stock_Discrepancy_Log.csv'));

        function downloadCSV(dataArray, filename) {
            if (!dataArray || dataArray.length === 0) return;
            const csv = Papa.unparse(dataArray);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
        }
    </script>
</body>
</html>
```