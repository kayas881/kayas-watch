"use client";

import { useState } from "react";
import { X, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { bulkImportWebsites } from "./actions";

interface ExcelImportModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<{ category?: string; url: string }[]>([]);
  const [createMonitors, setCreateMonitors] = useState(true);
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls") && !selectedFile.name.endsWith(".csv")) {
      setError("Please upload a valid Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    parseExcel(selectedFile);
  };

  const parseExcel = async (file: File) => {
    setParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to array of arrays
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      const parsedRows: { category?: string; url: string; notes?: string }[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const rowString = row.join(" ").toLowerCase();
          if (i === 0 && !rowString.includes("http") && !rowString.includes(".com")) {
            continue; 
          }

          let url = "";
          let category = "";
          let notes = "";

          if (row.length >= 2) {
            const col0 = String(row[0] || "").trim();
            const col1 = String(row[1] || "").trim();
            const col2 = String(row[2] || "").trim(); // Column C notes
            
            if (col1.startsWith("http") || col1.includes(".")) {
              category = col0;
              url = col1;
              notes = col2 !== "undefined" ? col2 : "";
            } else if (col0.startsWith("http") || col0.includes(".")) {
              url = col0;
              notes = col1 !== "undefined" ? col1 : "";
            }
          } else if (row.length === 1) {
            const col0 = String(row[0] || "").trim();
            if (col0.startsWith("http") || col0.includes(".")) {
              url = col0;
            }
          }

          if (url) {
            parsedRows.push({ category, url, notes });
          }
        }
      }

      setRows(parsedRows);
      if (parsedRows.length === 0) {
        setError("No valid URLs found in the file. Make sure URLs include .com or http://");
      }
    } catch (err: any) {
      setError("Failed to parse the file. " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setError("");

    try {
      const importedCount = await bulkImportWebsites(rows, createMonitors);
      onSuccess(importedCount);
    } catch (err: any) {
      setError(err.message || "An error occurred during import.");
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-medium text-white">Bulk Import via Excel</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-violet-500/50 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-3 bg-zinc-900 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-zinc-400 group-hover:text-violet-400" />
                </div>
                <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-zinc-500">.xlsx, .xls, or .csv files</p>
              </div>
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </label>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    {parsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {parsing ? "Analyzing file..." : `Found ${rows.length} valid URLs`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setRows([]); }}
                  className="text-xs font-medium text-zinc-400 hover:text-white underline"
                >
                  Change file
                </button>
              </div>

              {!parsing && rows.length > 0 && (
                <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-900/30 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={createMonitors}
                    onChange={(e) => setCreateMonitors(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 text-violet-600 focus:ring-violet-600 focus:ring-offset-zinc-950 bg-zinc-900"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Auto-create Monitors</p>
                    <p className="text-xs text-zinc-500">Instantly tell Uptime Kuma to start tracking these URLs</p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || parsing || rows.length === 0 || importing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {rows.length} Websites
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
