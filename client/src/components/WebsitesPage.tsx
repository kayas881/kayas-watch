import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileSpreadsheet, Globe, Loader2, Plus, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { api, message } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { createImportTemplateWorkbook, createWebsiteExportWorkbook, latestWebsiteMonitor, parseImportRows, websiteStatus, type ImportWebsiteRow, type WebsiteExportRecord } from "../lib/websiteWorkbooks";
import { Dialog, Empty, ErrorBox, PageHeader as Title, Spinner, StatusBadge as Status } from "./ui";

type Website = WebsiteExportRecord & { id: string };

function ListSearch({ value, onChange }: { value: string; onChange(value: string): void }) {
  return <label className="list-search"><Globe aria-hidden="true"/><input value={value} onChange={event => onChange(event.target.value)} placeholder="Search websites, domains, or clients…"/></label>;
}

function Pagination({ total, page, setPage, size }: { total: number; page: number; setPage(page: number): void; size: number }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (total <= size) return null;
  return <div className="list-pagination"><span>Showing {(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}</span><div><button className="icon-button" type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button><strong>{page} / {pages}</strong><button className="icon-button" type="button" aria-label="Next page" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button></div></div>;
}

export function WebsitesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Website[] | null>(null);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const size = 8;
  const isAdmin = user?.role !== "VIEWER";
  const load = async () => { setError(""); try { const response = await api.get<Website[]>("/websites"); setData(response.data); } catch (requestError) { setError(message(requestError)); } };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => (data || []).filter(website => {
    const needle = search.toLowerCase();
    return (!needle || [website.name, website.url, website.client.companyName].some(value => String(value || "").toLowerCase().includes(needle))) && (status === "ALL" || websiteStatus(website) === status);
  }), [data, search, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * size, currentPage * size);
  const selectedWebsites = (data || []).filter(website => selectedIds.has(website.id));
  const allCurrentSelected = visible.length > 0 && visible.every(website => selectedIds.has(website.id));

  const clearSelectionForNewQuery = () => setSelectedIds(new Set());
  const toggleWebsite = (id: string) => setSelectedIds(current => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleCurrentPage = () => setSelectedIds(current => {
    const next = new Set(current);
    if (allCurrentSelected) visible.forEach(website => next.delete(website.id));
    else visible.forEach(website => next.add(website.id));
    return next;
  });
  const sync = async () => { setSyncing(true); try { const response = await api.post<{ syncedCount: number }>("/websites/sync-monitors"); await load(); alert(response.data.syncedCount ? `${response.data.syncedCount} monitor(s) created.` : "Every website already has a monitor."); } catch (requestError) { alert(message(requestError)); } finally { setSyncing(false); } };
  const exportSelected = async () => {
    if (!selectedWebsites.length) { setExportError("Select at least one website before exporting."); return; }
    setExporting(true); setExportError("");
    try {
      const XLSX = await import("xlsx");
      XLSX.writeFile(createWebsiteExportWorkbook(XLSX, selectedWebsites), `saral-watch-websites-${format(new Date(), "yyyy-MM-dd")}.xlsx`, { compression: true });
    } catch (requestError) { setExportError(`Could not export the selected websites: ${message(requestError)}`); } finally { setExporting(false); }
  };

  if (!data) return error ? <ErrorBox text={error}/> : <Spinner/>;

  return <>
    <Title title="Websites" subtitle="Manage client domains and their current monitoring state." action={isAdmin && <div className="flex flex-wrap gap-2"><button onClick={sync} disabled={syncing} className="btn btn-ghost"><RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}/>Sync monitors</button><button onClick={() => setShowImport(true)} className="btn btn-ghost"><FileSpreadsheet className="w-4 h-4"/>Import Excel</button><Link className="btn btn-primary glow" to="/websites/new"><Plus className="w-4 h-4"/>Add Website</Link></div>}/>
    <div className="list-toolbar"><ListSearch value={search} onChange={value => { setSearch(value); setPage(1); clearSelectionForNewQuery(); }}/><select className="field list-filter" value={status} onChange={event => { setStatus(event.target.value); setPage(1); clearSelectionForNewQuery(); }} aria-label="Filter websites by status"><option value="ALL">All statuses</option><option value="UP">Up</option><option value="DOWN">Down</option><option value="DEGRADED">Degraded</option><option value="COMPROMISED">Compromised</option><option value="PAUSED">Paused / no active monitor</option></select></div>
    <div className="selection-toolbar"><span className="selection-summary">{selectedWebsites.length} website{selectedWebsites.length === 1 ? "" : "s"} selected{selectedWebsites.length ? " across all pages" : ""}</span><button type="button" onClick={exportSelected} disabled={!selectedWebsites.length || exporting} className="btn btn-ghost">{exporting ? <><Loader2 className="w-4 h-4 animate-spin"/>Exporting…</> : <><FileSpreadsheet className="w-4 h-4"/>Export Selected</>}</button></div>
    <ErrorBox text={exportError}/>
    <div className="table-shell">{data.length === 0 ? <Empty icon={<Globe className="w-8 h-8 text-zinc-500"/>} title="No websites found" text="Add websites to clients so you can begin tracking uptime."/> : filtered.length === 0 ? <Empty icon={<Globe className="w-8 h-8 text-zinc-500"/>} title="No matching websites" text="Try a broader search or select another monitoring status."/> : <><div className="table-scroll"><table className="entity-table website-table"><thead><tr><th className="table-select-column"><input type="checkbox" aria-label="Select all websites on this page" checked={allCurrentSelected} onChange={toggleCurrentPage}/></th><th>Website</th><th>Client</th><th>Status</th><th>Response</th><th>Last checked</th><th>Monitors</th><th aria-label="Actions"/></tr></thead><tbody>{visible.map(website => { const monitor = latestWebsiteMonitor(website); return <tr key={website.id}><td className="table-select-column"><input type="checkbox" aria-label={`Select ${website.name}`} checked={selectedIds.has(website.id)} onChange={() => toggleWebsite(website.id)}/></td><td><strong>{website.name}</strong><a href={website.url} target="_blank" rel="noreferrer" className="secondary-row website-url">{website.url}<ExternalLink/></a></td><td>{website.client.companyName}</td><td><Status value={websiteStatus(website)}/></td><td>{monitor?.responseTimeMs == null ? "—" : `${monitor.responseTimeMs} ms`}</td><td>{monitor?.lastCheckTime ? formatDistanceToNow(new Date(monitor.lastCheckTime), { addSuffix: true }) : "Not checked"}</td><td><span className="count-pill">{website._count.monitors}</span></td><td className="table-actions"><Link className="btn btn-ghost" to={`/websites/${website.id}`}>{isAdmin ? "Manage" : "View"}</Link></td></tr>; })}</tbody></table></div><Pagination total={filtered.length} page={currentPage} setPage={setPage} size={size}/></>}</div>
    {showImport && <ImportWebsitesModal close={() => setShowImport(false)} done={() => { void load(); setSelectedIds(new Set()); }}/>} 
  </>;
}

function ImportWebsitesModal({ close, done }: { close(): void; done(): void }) {
  const [rows, setRows] = useState<ImportWebsiteRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createMonitors, setCreateMonitors] = useState(true);
  const [result, setResult] = useState<{ importedCount: number; errors: { url: string; error: string }[] } | null>(null);
  const downloadTemplate = async () => {
    setError("");
    try { const XLSX = await import("xlsx"); XLSX.writeFile(createImportTemplateWorkbook(XLSX), "saral-watch-website-import-template.xlsx", { compression: true }); }
    catch (downloadError) { setError(`Could not download the sample template: ${message(downloadError)}`); }
  };
  const file = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const item = event.target.files?.[0];
    if (!item) return;
    setError(""); setResult(null);
    try {
      const XLSX = await import("xlsx");
      const book = XLSX.read(await item.arrayBuffer());
      const sheet = book.Sheets[book.SheetNames[0]];
      if (!sheet) throw new Error("The workbook does not contain a readable sheet.");
      const mapped = parseImportRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }));
      if (!mapped.length) throw new Error("No usable URL, Website, or Domain values were found in the first sheet.");
      setRows(mapped);
    } catch (fileError) { setRows([]); setError(message(fileError)); }
  };
  const submit = async () => {
    setBusy(true); setError("");
    try { const response = await api.post<{ importedCount: number; errors: { url: string; error: string }[] }>("/websites/bulk-import", { rows, createMonitors }); setResult(response.data); done(); }
    catch (submitError) { setError(message(submitError)); } finally { setBusy(false); }
  };
  return <Dialog title="Import websites from Excel" onClose={close}><div className="import-dialog"><p>Choose a workbook with a <b>URL</b>, <b>Website</b>, or <b>Domain</b> column. The first sheet is imported.</p><button type="button" onClick={downloadTemplate} className="btn btn-ghost"><FileSpreadsheet className="w-4 h-4"/>Download Sample Template</button><ErrorBox text={error}/><input type="file" accept=".xlsx,.xls,.csv" onChange={file} className="field"/><div className="import-summary"><strong>{rows.length}</strong><span>usable rows ready to import</span></div><label className="import-option"><input type="checkbox" checked={createMonitors} onChange={event => setCreateMonitors(event.target.checked)}/><span><b>Create monitors automatically</b><small>Creates an HTTP monitor for each website that does not already have one.</small></span></label>{result && <div className="import-result"><strong>{result.importedCount} row(s) imported.</strong>{result.errors.length > 0 ? <><p>{result.errors.length} row(s) could not be imported:</p><ul>{result.errors.slice(0, 5).map((item, index) => <li key={`${item.url}-${index}`}><b>{item.url}</b> — {item.error}</li>)}</ul>{result.errors.length > 5 && <p>And {result.errors.length - 5} more errors.</p>}</> : <p>Every submitted row was processed successfully.</p>}</div>}<div className="dialog-actions"><button onClick={close} className="btn btn-ghost">{result ? "Done" : "Cancel"}</button>{!result && <button disabled={!rows.length || busy} onClick={submit} className="btn btn-primary">{busy ? <><Loader2 className="w-4 h-4 animate-spin"/>Importing…</> : "Import websites"}</button>}</div></div></Dialog>;
}
