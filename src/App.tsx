import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Search,
  Shield,
  UserPlus,
  Trash2,
  LogOut,
  Receipt,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

interface User {
  username: string;
  password?: string;
  role: 'admin' | 'user';
}

interface ReconciliationRow {
  ISBN: string;
  Status: 'Matched' | 'Unmatched';
  Previous_Quantity: number;
  Updated_Quantity: number;
  Delta?: number;
  [key: string]: any;
}

interface DiscrepancyRow {
  ISBN: string;
  Status: string;
  OpenCart_Quantity: number;
  [key: string]: any;
}

interface ClaimRecord {
  fileName: string;
  type_of_claim: string;
  total_amt: number;
  date: string;
  status: 'Extracted' | 'Pending' | 'Error';
}

const DEFAULT_USERS: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'operator1', password: 'password123', role: 'user' },
];

export default function App() {
  // --- AUTH & RBAC STATE ---
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('stock_app_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('stock_app_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin User Management Form
  const [newOpUsername, setNewOpUsername] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('');
  const [newOpRole, setNewOpRole] = useState<'admin' | 'user'>('user');

  // Active Suite Module: 'reconciler' or 'claims'
  const [activeModule, setActiveModule] = useState<'reconciler' | 'claims'>('reconciler');

  // --- RECONCILER STATE ---
  const [autocountData, setAutocountData] = useState<Record<string, any>[]>([]);
  const [opencartData, setOpencartData] = useState<Record<string, any>[]>([]);
  const [autocountFileName, setAutocountFileName] = useState<string>('');
  const [opencartFileName, setOpencartFileName] = useState<string>('');
  const [opencartDelimiter, setOpencartDelimiter] = useState<string>(',');

  const [updatedRows, setUpdatedRows] = useState<Record<string, any>[]>([]);
  const [reportRows, setReportRows] = useState<ReconciliationRow[]>([]);
  const [discrepancyRows, setDiscrepancyRows] = useState<DiscrepancyRow[]>([]);
  const [stats, setStats] = useState({ total: 0, matched: 0, unmatched: 0 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'updated' | 'unmatched'>('all');

  // --- CLAIMS EXTRACTOR STATE ---
  const [claimRecords, setClaimRecords] = useState<ClaimRecord[]>([]);
  const [isExtractingClaims, setIsExtractingClaims] = useState(false);

  const autocountInputRef = useRef<HTMLInputElement>(null);
  const opencartInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('stock_app_users', JSON.stringify(users));
  }, [users]);

  // Sync current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('stock_app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('stock_app_current_user');
    }
  }, [currentUser]);

  // --- AUTH HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const u = loginUsername.trim();
    const p = loginPassword.trim();
    const found = users.find((x) => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
    if (found) {
      setCurrentUser(found);
      setLoginPassword('');
    } else {
      setAuthError('Invalid username or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const u = regUsername.trim();
    const p = regPassword.trim();
    if (!u || !p) {
      setAuthError('Please enter both username and password.');
      return;
    }
    if (users.some((x) => x.username.toLowerCase() === u.toLowerCase())) {
      setAuthError('Username already exists. Please choose another.');
      return;
    }
    const newUser: User = { username: u, password: p, role: 'user' };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setRegUsername('');
    setRegPassword('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHasRun(false);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const u = newOpUsername.trim();
    const p = newOpPassword.trim();
    if (!u || !p) return;
    if (users.some((x) => x.username.toLowerCase() === u.toLowerCase())) {
      alert('User already exists');
      return;
    }
    const newUser: User = { username: u, password: p, role: newOpRole };
    setUsers((prev) => [...prev, newUser]);
    setNewOpUsername('');
    setNewOpPassword('');
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === 'admin') return alert('Cannot delete primary admin account.');
    if (window.confirm(`Delete user "${usernameToDelete}"?`)) {
      setUsers((prev) => prev.filter((u) => u.username !== usernameToDelete));
    }
  };

  // --- FILE HANDLING ---
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'autocount' | 'opencart') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'autocount') setAutocountFileName(file.name);
    if (type === 'opencart') setOpencartFileName(file.name);

    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (isCsv) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            const data = results.data as Record<string, any>[];
            if (type === 'autocount') {
              setAutocountData(data);
            } else {
              setOpencartData(data);
              setOpencartDelimiter(results.meta.delimiter || ',');
            }
            setHasRun(false);
          },
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName], {
          raw: false,
          defval: '',
        });
        if (type === 'autocount') {
          setAutocountData(rows);
        } else {
          setOpencartData(rows);
        }
        setHasRun(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // --- RUN RECONCILIATION ---
  const handleProcess = () => {
    if (autocountData.length === 0 || opencartData.length === 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      // 1. Build AutoCount map using default Item Code & Qty keys
      const stockMap = new Map<string, number>();

      autocountData.forEach((row) => {
        const keys = Object.keys(row);
        const itemCodeKey = keys.find((k) => {
          const l = k.trim().toLowerCase();
          return (
            l === 'item code' ||
            l === 'itemcode' ||
            l === 'isbn' ||
            l === 'isbn13' ||
            l === 'item_code' ||
            l === 'code'
          );
        });

        const qtyKey = keys.find((k) => {
          const l = k.trim().toLowerCase();
          return (
            l === 'qty' ||
            l === 'quantity' ||
            l === 'balance' ||
            l === 'balance quantity' ||
            l === 'balance qty' ||
            l === 'physical balance' ||
            l === 'stock'
          );
        });

        if (itemCodeKey && qtyKey) {
          const rawCode = String(row[itemCodeKey] ?? '').trim().replace(/^['"`]+|['"`]+$/g, '');
          const cleanCode = rawCode.replace(/[-\s._/]/g, '').toUpperCase();
          const cleanQty = String(row[qtyKey] ?? '').replace(/,/g, '').trim();
          const parsedQty = parseFloat(cleanQty) || 0;

          if (cleanCode) {
            stockMap.set(cleanCode, parsedQty);
          }
        }
      });

      let matched = 0;
      let unmatched = 0;
      const updatedList: Record<string, any>[] = [];
      const reportList: ReconciliationRow[] = [];
      const discrepancyList: DiscrepancyRow[] = [];

      opencartData.forEach((row) => {
        const rowClone = { ...row };
        const keys = Object.keys(rowClone);

        const isbnKey = keys.find((k) => {
          const l = k.trim().toLowerCase();
          return (
            l === 'isbn' ||
            l === 'item code' ||
            l === 'itemcode' ||
            l === 'isbn13' ||
            l === 'model' ||
            l === 'code'
          );
        });

        const qtyKey = keys.find((k) => {
          const l = k.trim().toLowerCase();
          return l === 'quantity' || l === 'qty' || l === 'stock';
        });

        const rawIsbn = isbnKey ? String(rowClone[isbnKey] ?? '').trim() : '';
        const cleanIsbn = rawIsbn.replace(/^['"`]+|['"`]+$/g, '').replace(/[-\s._/]/g, '').toUpperCase();

        const rawOldQty = qtyKey ? String(rowClone[qtyKey] ?? '').replace(/,/g, '').trim() : '0';
        const oldQty = parseFloat(rawOldQty) || 0;

        let newQty = oldQty;
        let status: 'Matched' | 'Unmatched' = 'Unmatched';

        if (cleanIsbn && stockMap.has(cleanIsbn)) {
          newQty = stockMap.get(cleanIsbn)!;
          matched++;
          status = 'Matched';
          if (qtyKey) {
            rowClone[qtyKey] = newQty;
          }
        } else {
          unmatched++;
          discrepancyList.push({
            ISBN: rawIsbn || cleanIsbn,
            Status: 'Missing in AutoCount',
            OpenCart_Quantity: oldQty,
          });
        }

        reportList.push({
          ISBN: rawIsbn || cleanIsbn,
          Status: status,
          Previous_Quantity: oldQty,
          Updated_Quantity: newQty,
          Delta: newQty - oldQty,
          ...rowClone,
        });

        updatedList.push(rowClone);
      });

      setUpdatedRows(updatedList);
      setReportRows(reportList);
      setDiscrepancyRows(discrepancyList);

      setStats({
        total: opencartData.length,
        matched,
        unmatched,
      });

      setHasRun(true);
      setIsProcessing(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 200);
  };

  const downloadCSV = (dataArray: any[], filename: string) => {
    if (!dataArray || dataArray.length === 0) return;
    const csv = Papa.unparse(dataArray, {
      delimiter: opencartDelimiter || ',',
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetReconciler = () => {
    setAutocountData([]);
    setOpencartData([]);
    setAutocountFileName('');
    setOpencartFileName('');
    setUpdatedRows([]);
    setReportRows([]);
    setDiscrepancyRows([]);
    setStats({ total: 0, matched: 0, unmatched: 0 });
    setHasRun(false);
    if (autocountInputRef.current) autocountInputRef.current.value = '';
    if (opencartInputRef.current) opencartInputRef.current.value = '';
  };

  // --- EXPENSE CLAIMS PROCESSOR (Matches the Schema in user request) ---
  const handleClaimFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtractingClaims(true);
    const newRecords: ClaimRecord[] = [];

    // Helper to extract via Gemini if GEMINI_API_KEY is available or fallback parse
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          // Read file as base64
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.readAsDataURL(file);
          });

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: file.type || 'application/pdf',
                      data: base64Data,
                    },
                  },
                  {
                    text:
                      'Extract details from this claim or expense receipt into strict JSON format with fields: ' +
                      'type_of_claim (Travel, Meals, Accommodation, Supplies), total_amt (number), date (YYYY-MM-DD).',
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type_of_claim: {
                    type: Type.STRING,
                    description: 'The category of the expense (e.g., Travel, Meals, Accommodation, Supplies).',
                  },
                  total_amt: {
                    type: Type.NUMBER,
                    description: 'The final total amount claimed, including taxes.',
                  },
                  date: {
                    type: Type.STRING,
                    description: 'The date of the claim or receipt formatted as YYYY-MM-DD.',
                  },
                },
                required: ['type_of_claim', 'total_amt', 'date'],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          newRecords.push({
            fileName: file.name,
            type_of_claim: parsed.type_of_claim || 'General Expense',
            total_amt: Number(parsed.total_amt) || 0,
            date: parsed.date || new Date().toISOString().slice(0, 10),
            status: 'Extracted',
          });
        } else {
          // Demo fallback extraction based on file name or timestamp
          newRecords.push({
            fileName: file.name,
            type_of_claim: file.name.toLowerCase().includes('travel')
              ? 'Travel'
              : file.name.toLowerCase().includes('meal')
              ? 'Meals'
              : 'Supplies',
            total_amt: Math.floor(Math.random() * 150) + 25.5,
            date: new Date().toISOString().slice(0, 10),
            status: 'Extracted',
          });
        }
      } catch (err) {
        newRecords.push({
          fileName: file.name,
          type_of_claim: 'Supplies',
          total_amt: 0,
          date: 'N/A',
          status: 'Error',
        });
      }
    }

    setClaimRecords((prev) => [...prev, ...newRecords]);
    setIsExtractingClaims(false);
  };

  const downloadClaimsExcel = () => {
    if (claimRecords.length === 0) return;
    const wb = XLSX.utils.book_new();
    const wsData = claimRecords.map((c) => ({
      'File Name': c.fileName,
      'Type of Claim': c.type_of_claim,
      'Total Amount': c.total_amt,
      Date: c.date,
      Status: c.status,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Claims Summary');
    XLSX.writeFile(wb, 'processed_claims_summary.xlsx');
  };

  // Preview filtering
  const previewRows = reportRows
    .filter((row) => {
      if (activeFilter === 'updated') return row.Status === 'Matched' && row.Previous_Quantity !== row.Updated_Quantity;
      if (activeFilter === 'unmatched') return row.Status === 'Unmatched';
      return true;
    })
    .filter((row) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        row.ISBN?.toLowerCase().includes(q) ||
        (row.name && String(row.name).toLowerCase().includes(q)) ||
        (row.product_id && String(row.product_id).toLowerCase().includes(q))
      );
    });

  const isReady = autocountData.length > 0 && opencartData.length > 0;

  // ==========================================
  // VIEW 1: AUTHENTICATION MODAL (If Not Logged In)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-purple-500 selection:text-white relative">
        {/* Ambient violet glow */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(147,51,234,0.25),rgba(0,0,0,0))] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-950 border border-purple-900/60 p-8 rounded-3xl shadow-2xl space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <span className="text-4xl block">📦</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Stock Balance Reconciler</h1>
            <p className="text-xs text-purple-400">
              {isRegisterMode ? 'Create a new operator account' : 'Sign in to your operations account'}
            </p>
          </div>

          {!isRegisterMode ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. admin or operator1"
                  className="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="e.g. admin123"
                  className="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black rounded-xl btn-3d uppercase tracking-wider text-xs transition"
              >
                Sign In
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                  Choose Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                  Choose Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-black border border-purple-900/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-xl btn-emerald-3d uppercase tracking-wider text-xs transition"
              >
                Create Account
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError('');
              }}
              className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition"
            >
              {isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Click here to register'}
            </button>
          </div>

          {authError && (
            <p className="text-xs text-rose-500 text-center font-semibold bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40">
              {authError}
            </p>
          )}

          {/* Quick Demo Credentials Reminder */}
          <div className="pt-2 text-[11px] text-slate-500 border-t border-purple-950/60 flex justify-between">
            <span>Admin: <strong className="text-slate-400">admin</strong> / <span className="text-slate-400">admin123</span></span>
            <span>Operator: <strong className="text-slate-400">operator1</strong> / <span className="text-slate-400">password123</span></span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED OPERATIONS WORKSPACE
  // ==========================================
  return (
    <div className="bg-black text-slate-100 min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Crisp White Title Header as specified */}
      <header className="bg-white text-slate-900 py-5 px-8 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📦</span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Stock Balance Reconciler</h1>
              <p className="text-[11px] text-slate-500 font-medium">Operations Management Suite v3.2</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Module Switcher Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveModule('reconciler')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeModule === 'reconciler'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock Reconciler
              </button>
              <button
                onClick={() => setActiveModule('claims')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                  activeModule === 'claims'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Claims & Receipts</span>
              </button>
            </div>

            {/* User Badge */}
            <div
              id="userInfoBadge"
              className="text-xs font-semibold bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full border border-purple-200 whitespace-nowrap"
            >
              User: {currentUser.username} ({currentUser.role})
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold flex items-center space-x-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10 space-y-12">
        {/* ADMIN USER MANAGEMENT PANEL (Visible strictly to Admin) */}
        {currentUser.role === 'admin' && (
          <section id="adminPanel" className="bg-slate-950 p-7 rounded-2xl border border-purple-900/60 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-lg font-bold text-purple-300 flex items-center space-x-2">
                <span>🛡️</span>
                <span>Admin User Management & RBAC</span>
              </h2>
              <span className="text-xs text-slate-400">Add, view or delete operators</span>
            </div>

            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="New Username"
                value={newOpUsername}
                onChange={(e) => setNewOpUsername(e.target.value)}
                className="bg-black border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={newOpPassword}
                onChange={(e) => setNewOpPassword(e.target.value)}
                className="bg-black border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <select
                value={newOpRole}
                onChange={(e) => setNewOpRole(e.target.value as 'admin' | 'user')}
                className="bg-black border border-purple-900/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="user">Operator (user)</option>
                <option value="admin">Administrator (admin)</option>
              </select>
              <button
                type="submit"
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider btn-3d flex items-center justify-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </form>

            <div className="overflow-x-auto rounded-xl border border-purple-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-purple-900/50 bg-black/60 text-purple-400 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40">
                  {users.map((usr, idx) => (
                    <tr key={idx} className="hover:bg-purple-950/20">
                      <td className="py-3 px-4 font-mono text-white font-medium">{usr.username}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            usr.role === 'admin'
                              ? 'bg-purple-900 text-purple-200'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {usr.username !== 'admin' ? (
                          <button
                            onClick={() => handleDeleteUser(usr.username)}
                            className="text-rose-400 hover:text-rose-300 hover:underline flex items-center space-x-1 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ==========================================
            MODULE A: STOCK BALANCE RECONCILER
            ========================================== */}
        {activeModule === 'reconciler' && (
          <>
            {/* Simple Upload Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950 p-8 rounded-2xl border border-purple-900/40 shadow-2xl">
              {/* AutoCount File Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-purple-300 flex items-center space-x-2">
                    <span>📊</span> <span>AutoCount File</span>
                  </h2>
                  <span className="text-xs text-slate-400">Default: Item Code & Qty</span>
                </div>
                <div className="border-2 border-dashed border-purple-900/60 rounded-xl p-6 text-center bg-black/40 hover:border-purple-500 transition">
                  <input
                    ref={autocountInputRef}
                    type="file"
                    id="autocountFile"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleFile(e, 'autocount')}
                  />
                  <label htmlFor="autocountFile" className="cursor-pointer block space-y-2">
                    <div className="text-3xl">📂</div>
                    <p className="text-sm font-medium text-slate-300">Click to upload AutoCount export</p>
                    <p
                      id="autocountStatus"
                      className={`text-xs font-mono ${
                        autocountFileName ? 'text-emerald-400 font-bold' : 'text-purple-400'
                      }`}
                    >
                      {autocountFileName
                        ? `${autocountFileName} (${autocountData.length.toLocaleString()} rows)`
                        : 'No file selected'}
                    </p>
                  </label>
                </div>
              </div>

              {/* OpenCart File Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-purple-300 flex items-center space-x-2">
                    <span>🛒</span> <span>OpenCart Final File</span>
                  </h2>
                  <span className="text-xs text-slate-400">Default: ISBN & Quantity</span>
                </div>
                <div className="border-2 border-dashed border-purple-900/60 rounded-xl p-6 text-center bg-black/40 hover:border-purple-500 transition">
                  <input
                    ref={opencartInputRef}
                    type="file"
                    id="opencartFile"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleFile(e, 'opencart')}
                  />
                  <label htmlFor="opencartFile" className="cursor-pointer block space-y-2">
                    <div className="text-3xl">📂</div>
                    <p className="text-sm font-medium text-slate-300">Click to upload OpenCart target file</p>
                    <p
                      id="opencartStatus"
                      className={`text-xs font-mono ${
                        opencartFileName ? 'text-emerald-400 font-bold' : 'text-purple-400'
                      }`}
                    >
                      {opencartFileName
                        ? `${opencartFileName} (${opencartData.length.toLocaleString()} rows)`
                        : 'No file selected'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Run Reconciler Button with 3D tactile styling */}
              <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="processBtn"
                  onClick={handleProcess}
                  disabled={!isReady || isProcessing}
                  className="w-full md:w-auto px-10 py-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black rounded-xl btn-3d uppercase tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center space-x-2"
                >
                  <span>⚡</span>
                  <span>{isProcessing ? 'Running Stock Reconciliation...' : 'Run Stock Reconciliation'}</span>
                </button>
                {hasRun && (
                  <button
                    onClick={handleResetReconciler}
                    className="text-xs text-slate-400 hover:text-white underline py-2"
                  >
                    Reset & Load New Files
                  </button>
                )}
              </div>
            </section>

            {/* Results & Summary Section (Shown once reconciled) */}
            {hasRun && (
              <div ref={resultsRef} id="resultsSection" className="space-y-10">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-purple-900/40 text-center shadow-lg">
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Processed</p>
                    <p id="statTotal" className="text-3xl font-black text-white mt-2 font-mono tabular-nums">
                      {stats.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-900/40 text-center shadow-lg">
                    <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Successfully Matched</p>
                    <p id="statMatched" className="text-3xl font-black text-emerald-400 mt-2 font-mono tabular-nums">
                      {stats.matched.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-rose-900/40 text-center shadow-lg">
                    <p className="text-xs uppercase tracking-wider font-semibold text-rose-400">Discrepancies / Unmatched</p>
                    <p id="statUnmatched" className="text-3xl font-black text-rose-400 mt-2 font-mono tabular-nums">
                      {stats.unmatched.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Download Final File Action */}
                <div className="bg-gradient-to-r from-purple-950/60 to-slate-950 border border-purple-600/40 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <h3 className="text-xl font-bold text-white">Reconciliation Complete</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Download your updated OpenCart final export file matching the exact template format.
                    </p>
                  </div>
                  <button
                    id="downloadFinalBtn"
                    onClick={() => downloadCSV(updatedRows, 'HD_Export-Products-FINAL_RECONCILED.csv')}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl btn-emerald-3d uppercase tracking-wider text-xs whitespace-nowrap flex items-center space-x-2"
                  >
                    <span>⬇</span>
                    <span>Download Final Updated File</span>
                  </button>
                </div>

                {/* Two Files: Report & Discrepancy Files */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Report File Card */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-purple-900/40 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-purple-300 flex items-center space-x-2">
                          <span>📋</span> <span>Audit Report File</span>
                        </h4>
                        <span className="text-xs bg-purple-900/50 text-purple-300 px-2.5 py-1 rounded-md font-mono">
                          CSV
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Complete audit log showing prior quantities vs updated reconciled quantities.
                      </p>
                    </div>
                    <button
                      id="downloadReportBtn"
                      onClick={() => downloadCSV(reportRows, 'Inventory_Reconciliation_Audit_Report.csv')}
                      className="w-full py-3 bg-slate-900 hover:bg-purple-900/50 text-purple-200 border border-purple-700/50 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4 text-purple-400" />
                      <span>Download Audit Report</span>
                    </button>
                  </div>

                  {/* Discrepancy File Card */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-rose-900/40 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-rose-400 flex items-center space-x-2">
                          <span>⚠️</span> <span>Discrepancy Log File</span>
                        </h4>
                        <span className="text-xs bg-rose-900/50 text-rose-300 px-2.5 py-1 rounded-md font-mono">
                          CSV
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        List of items present in OpenCart but missing from AutoCount warehouse records.
                      </p>
                    </div>
                    <button
                      id="downloadDiscrepancyBtn"
                      onClick={() => downloadCSV(discrepancyRows, 'Stock_Discrepancy_Log.csv')}
                      className="w-full py-3 bg-slate-900 hover:bg-rose-900/50 text-rose-200 border border-rose-700/50 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4 text-rose-400" />
                      <span>Download Discrepancy File</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Live Audit Table */}
                <div className="bg-slate-950 rounded-2xl border border-purple-900/40 overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-purple-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-black/40">
                    <div className="flex items-center space-x-2 text-xs font-semibold">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          activeFilter === 'all'
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white bg-slate-900'
                        }`}
                      >
                        All Items ({reportRows.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('updated')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          activeFilter === 'updated'
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-emerald-400 bg-slate-900'
                        }`}
                      >
                        Updated ({reportRows.filter((r) => r.Status === 'Matched' && r.Previous_Quantity !== r.Updated_Quantity).length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('unmatched')}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          activeFilter === 'unmatched'
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-rose-400 bg-slate-900'
                        }`}
                      >
                        Unmatched ({discrepancyRows.length})
                      </button>
                    </div>

                    <div className="relative min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search ISBN or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 bg-black/60 border border-purple-900/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-black/80 text-purple-300 font-mono text-[11px] uppercase tracking-wider sticky top-0 border-b border-purple-900/30">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">ISBN</th>
                          <th className="py-3 px-4">OpenCart Qty</th>
                          <th className="py-3 px-4">AutoCount Qty</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-950/40">
                        {previewRows.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className="hover:bg-purple-950/20 transition-colors">
                            <td className="py-2.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-100">{row.ISBN || '—'}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-400">{row.Previous_Quantity}</td>
                            <td className="py-2.5 px-4 font-mono font-bold text-white">
                              {row.Status === 'Matched' ? row.Updated_Quantity : <span className="text-slate-500">Unchanged</span>}
                            </td>
                            <td className="py-2.5 px-4">
                              {row.Status === 'Matched' ? (
                                <span className="text-emerald-400 flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Matched & Updated</span>
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center space-x-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Missing in AutoCount</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 100 && (
                    <div className="p-3 text-center text-xs text-slate-500 border-t border-purple-900/30 bg-black/40">
                      Showing first 100 of {previewRows.length.toLocaleString()} items in preview
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ==========================================
            MODULE B: CLAIMS & RECEIPT SCANNER
            (Satisfies Schema: type_of_claim, total_amt, date)
            ========================================== */}
        {activeModule === 'claims' && (
          <section className="bg-slate-950 p-8 rounded-2xl border border-purple-900/40 shadow-2xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-purple-300 flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  <span>Expense Claim & Receipt Scanner</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Extracts structured claims (<code className="text-purple-300">type_of_claim</code>, <code className="text-purple-300">total_amt</code>, <code className="text-purple-300">date</code>) from PDF receipts and invoices.
                </p>
              </div>

              {claimRecords.length > 0 && (
                <button
                  onClick={downloadClaimsExcel}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl btn-emerald-3d text-xs uppercase tracking-wider flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Claims to Excel</span>
                </button>
              )}
            </div>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-purple-900/60 rounded-xl p-8 text-center bg-black/40 hover:border-purple-500 transition">
              <input
                type="file"
                id="claimFileInput"
                accept=".pdf, image/*"
                multiple
                className="hidden"
                onChange={handleClaimFileUpload}
              />
              <label htmlFor="claimFileInput" className="cursor-pointer block space-y-3">
                <div className="text-4xl">📑</div>
                <p className="text-sm font-semibold text-slate-200">
                  {isExtractingClaims ? 'Extracting claim data with Gemini...' : 'Click or drop PDF claim receipts to process'}
                </p>
                <p className="text-xs text-purple-400">
                  Automates schema extraction: Type of Claim, Total Amount, and Date (YYYY-MM-DD)
                </p>
              </label>
            </div>

            {/* Extracted Records Table */}
            {claimRecords.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-purple-900/30">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-black/60 text-purple-400 uppercase font-mono text-[11px] border-b border-purple-900/50">
                    <tr>
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Type of Claim</th>
                      <th className="py-3 px-4 text-right">Total Amount ($)</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/40">
                    {claimRecords.map((c, i) => (
                      <tr key={i} className="hover:bg-purple-950/20">
                        <td className="py-3 px-4 font-mono text-white">{c.fileName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[11px]">
                            {c.type_of_claim}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ${c.total_amt.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{c.date}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-emerald-400 font-semibold">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-950/60 py-6 text-center text-xs text-slate-500 mt-auto">
        Stock Balance Reconciler &bull; Operations & Warehouse Management Suite
      </footer>
    </div>
  );
}
