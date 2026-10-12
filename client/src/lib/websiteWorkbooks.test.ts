import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { createImportTemplateWorkbook, createWebsiteExportWorkbook, importTemplateRows, parseImportRows } from "./websiteWorkbooks";

function reopen(workbook: XLSX.WorkBook) {
  return XLSX.read(XLSX.write(workbook, { type: "array", bookType: "xlsx" }), { type: "array" });
}

describe("website workbooks", () => {
  it("creates an import template that the existing import parser accepts", () => {
    const workbook = reopen(createImportTemplateWorkbook(XLSX));
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Websites, { defval: "" });

    expect(workbook.SheetNames).toEqual(["Websites"]);
    expect(rows).toHaveLength(2);
    expect(parseImportRows(rows)).toEqual(importTemplateRows);
  });

  it("creates an export workbook with the selected website data", () => {
    const workbook = reopen(createWebsiteExportWorkbook(XLSX, [{
      name: "Example website",
      url: "https://example.com",
      description: "Customer landing page",
      client: { companyName: "Example Client" },
      monitors: [
        { isActive: true, status: "UP", responseTimeMs: 154, lastCheckTime: "2026-10-12T12:00:00.000Z" },
        { isActive: false, status: "DOWN", responseTimeMs: 300, lastCheckTime: "2026-10-11T12:00:00.000Z" },
      ],
      _count: { monitors: 2 },
    }]));
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Websites, { defval: "" });

    expect(rows).toEqual([expect.objectContaining({
      "Website Name": "Example website",
      URL: "https://example.com",
      Client: "Example Client",
      Description: "Customer landing page",
      Status: "UP",
      "Response Time (ms)": 154,
      "Monitor Count": 2,
      "Active Monitor Count": 1,
    })]);
  });
});
