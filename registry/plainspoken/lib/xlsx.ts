// A small Excel (.xlsx) writer with no dependencies. An .xlsx file is a ZIP archive of a few XML
// parts; this writes them, and the ZIP around them, by hand: entries are stored (not compressed),
// each with its CRC-32. That keeps the code short; the price is a file two or three times bigger
// than Excel's own, which for a table exported from a browser is a few hundred kilobytes.
//
// What you get: one or more sheets, numbers as numbers, dates as real dates (Excel serial numbers
// with a date format), text as shared strings, a bold header row, column widths, the header row
// frozen and an autofilter on it. No formulas, merged cells, colours or hyperlinks.

/** What a cell can hold. Dates are written as local wall-clock time, as the browser shows them. */
export type XlsxCell = string | number | boolean | Date | null | undefined;

export interface XlsxColumn {
  header: string;
  /** Width in CSS pixels; Excel's character units are worked out from it. Default 100. */
  width?: number;
  /**
   * An Excel number format for the column's numbers and dates: "#,##0.00", "0.0%", "yyyy-mm-dd".
   * Dates without one get "yyyy-mm-dd", or "yyyy-mm-dd hh:mm" when any of them has a time of day.
   */
  format?: string;
}

export interface XlsxSheet {
  /** The tab's name. Cut to 31 characters, without the characters Excel forbids (: \ / ? * [ ]). */
  name: string;
  columns: XlsxColumn[];
  /** One array per row, a cell per column */
  rows: XlsxCell[][];
  /** Keep the header row in view when scrolling. Default true. */
  freezeHeader?: boolean;
  /** Filter buttons on the header row. Default true. */
  autoFilter?: boolean;
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// ---------------------------------------------------------------------------------------------
// ZIP

let crcTable: Uint32Array | null = null;

/** CRC-32 (the ZIP and PNG one: polynomial 0xEDB88320) of some bytes */
export function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  /** Path inside the archive, with forward slashes */
  name: string;
  data: Uint8Array | string;
}

/**
 * A ZIP archive of the entries, stored without compression. Names are UTF-8 (flag bit 11). Not
 * ZIP64, so the archive must stay under 4 GB and 65,535 entries; the time stamp is `date` in
 * local time (MS-DOS times have no zone and two-second steps).
 */
export function zip(entries: ZipEntry[], date: Date = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = (Math.max(0, date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const files = entries.map((e) => {
    const data = typeof e.data === "string" ? enc.encode(e.data) : e.data;
    return { name: enc.encode(e.name), data, crc: crc32(data) };
  });
  const localSize = files.reduce((s, f) => s + 30 + f.name.length + f.data.length, 0);
  const centralSize = files.reduce((s, f) => s + 46 + f.name.length, 0);
  const total = localSize + centralSize + 22;
  if (total > 0xffffffff || files.length > 0xffff) throw new Error("zip: too big for a ZIP without ZIP64");

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let p = 0;
  const u16 = (v: number) => {
    view.setUint16(p, v, true);
    p += 2;
  };
  const u32 = (v: number) => {
    view.setUint32(p, v >>> 0, true);
    p += 4;
  };
  const bytes = (b: Uint8Array) => {
    out.set(b, p);
    p += b.length;
  };

  const offsets: number[] = [];
  for (const f of files) {
    offsets.push(p);
    u32(0x04034b50); // local file header
    u16(20); // version needed: 2.0
    u16(0x0800); // UTF-8 names
    u16(0); // stored
    u16(time);
    u16(day);
    u32(f.crc);
    u32(f.data.length); // compressed size = size, since stored
    u32(f.data.length);
    u16(f.name.length);
    u16(0); // no extra field
    bytes(f.name);
    bytes(f.data);
  }
  const central = p;
  files.forEach((f, i) => {
    u32(0x02014b50); // central directory header
    u16(20); // made by: 2.0, MS-DOS attributes
    u16(20);
    u16(0x0800);
    u16(0);
    u16(time);
    u16(day);
    u32(f.crc);
    u32(f.data.length);
    u32(f.data.length);
    u16(f.name.length);
    u16(0); // extra
    u16(0); // comment
    u16(0); // disk
    u16(0); // internal attributes
    u32(0); // external attributes
    u32(offsets[i]);
    bytes(f.name);
  });
  const centralEnd = p;
  u32(0x06054b50); // end of central directory
  u16(0);
  u16(0);
  u16(files.length);
  u16(files.length);
  u32(centralEnd - central);
  u32(central);
  u16(0); // comment length
  return out;
}

// ---------------------------------------------------------------------------------------------
// XML parts

const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/** Text for XML: escaped, without the control characters XML 1.0 forbids, at most Excel's 32,767 characters */
function esc(s: string): string {
  return (
    s
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
      .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, "�")
      .slice(0, 32767)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  );
}

/** A1-style column letters: 0 → A, 25 → Z, 26 → AA */
export function columnLetters(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** A sheet name Excel accepts: no : \ / ? * [ ], not empty, at most 31 characters, unique in the book */
function sheetName(name: string, taken: Set<string>): string {
  const base = name.replace(/[:\\/?*[\]]/g, " ").replace(/\s+/g, " ").replace(/^'+|'+$/g, "").trim().slice(0, 31) || "Sheet";
  let n = base;
  for (let i = 2; taken.has(n.toLowerCase()); i++) n = `${base.slice(0, 31 - String(i).length - 1)} ${i}`;
  taken.add(n.toLowerCase());
  return n;
}

/** A date as an Excel serial number: days since 1899-12-30, from its local wall-clock time */
export function excelSerial(d: Date): number {
  const wall = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return wall / 86_400_000 + 25569;
}

const hasTime = (d: Date) => d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;

/** Excel's width unit is the width of a digit in the default font (7px for Calibri 11) */
const widthChars = (px: number) => Math.min(255, Math.max(2, Math.round((px / 7) * 256) / 256));

/**
 * The .xlsx file for one sheet or several, as bytes: wrap them in
 * `new Blob([bytes], { type: XLSX_MIME })` to download.
 */
export function writeXlsx(sheets: XlsxSheet | XlsxSheet[]): Uint8Array {
  const list = Array.isArray(sheets) ? sheets : [sheets];
  if (!list.length) throw new Error("writeXlsx: no sheets");

  // Shared strings, so a column of repeated values ("Shipped", "Paid") is stored once.
  const strings: string[] = [];
  const stringIndex = new Map<string, number>();
  let stringRefs = 0;
  const str = (s: string) => {
    stringRefs++;
    let i = stringIndex.get(s);
    if (i === undefined) {
      i = strings.length;
      strings.push(s);
      stringIndex.set(s, i);
    }
    return i;
  };

  // Cell styles: 0 plain, 1 the bold header, then one per number format in use.
  const formats: string[] = [];
  const styleFor = (format: string) => {
    let i = formats.indexOf(format);
    if (i < 0) i = formats.push(format) - 1;
    return 2 + i;
  };

  const taken = new Set<string>();
  const sheetXml = list.map((sheet, sheetIndex) => {
    const name = sheetName(sheet.name, taken);
    const cols = sheet.columns;
    // A date column's format: given, or worked out from whether any of its dates has a time
    const colStyle = cols.map((c, ci) => {
      if (c.format) return styleFor(c.format);
      const dates = sheet.rows.map((r) => r[ci]).filter((v): v is Date => v instanceof Date);
      return dates.length ? styleFor(dates.some(hasTime) ? "yyyy-mm-dd hh:mm" : "yyyy-mm-dd") : 0;
    });
    const last = `${columnLetters(Math.max(0, cols.length - 1))}${sheet.rows.length + 1}`;
    const freeze = sheet.freezeHeader !== false && sheet.rows.length > 0;
    const filter = sheet.autoFilter !== false && cols.length > 0;

    const rowXml = (cells: XlsxCell[], r: number, header: boolean) => {
      let s = `<row r="${r}">`;
      cells.forEach((v, ci) => {
        const ref = `${columnLetters(ci)}${r}`;
        if (v == null || v === "") return;
        if (header) s += `<c r="${ref}" s="1" t="s"><v>${str(String(v))}</v></c>`;
        else if (typeof v === "number") {
          if (Number.isFinite(v)) s += `<c r="${ref}"${colStyle[ci] ? ` s="${colStyle[ci]}"` : ""}><v>${v}</v></c>`;
        } else if (typeof v === "boolean") s += `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>`;
        else if (v instanceof Date) {
          if (!Number.isNaN(v.getTime())) s += `<c r="${ref}" s="${colStyle[ci] || styleFor("yyyy-mm-dd hh:mm")}"><v>${excelSerial(v)}</v></c>`;
        } else s += `<c r="${ref}" t="s"><v>${str(String(v))}</v></c>`;
      });
      return s + "</row>";
    };

    let data = rowXml(
      cols.map((c) => c.header),
      1,
      true,
    );
    sheet.rows.forEach((cells, i) => (data += rowXml(cells, i + 2, false)));

    const xml =
      XML_HEAD +
      `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
      `<dimension ref="A1:${last}"/>` +
      `<sheetViews><sheetView workbookViewId="0"${sheetIndex === 0 ? ' tabSelected="1"' : ""}>` +
      (freeze ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>' : "") +
      "</sheetView></sheetViews>" +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      (cols.length ? `<cols>${cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${widthChars(c.width ?? 100)}" customWidth="1"/>`).join("")}</cols>` : "") +
      `<sheetData>${data}</sheetData>` +
      (filter ? `<autoFilter ref="A1:${last}"/>` : "") +
      '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>' +
      "</worksheet>";
    return { name, xml, range: filter ? `$A$1:$${columnLetters(Math.max(0, cols.length - 1))}$${sheet.rows.length + 1}` : null };
  });

  const quoted = (n: string) => `'${n.replace(/'/g, "''")}'`;
  const workbook =
    XML_HEAD +
    `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
    '<bookViews><workbookView activeTab="0"/></bookViews>' +
    `<sheets>${sheetXml.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
    // Excel keeps an autofilter's range in this hidden name; it opens files without it, but adds it on save.
    (sheetXml.some((s) => s.range)
      ? `<definedNames>${sheetXml
          .map((s, i) => (s.range ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${esc(quoted(s.name))}!${s.range}</definedName>` : ""))
          .join("")}</definedNames>`
      : "") +
    "</workbook>";

  const font = (bold: boolean) => `<font>${bold ? "<b/>" : ""}<sz val="11"/><name val="Calibri"/><family val="2"/></font>`;
  const styles =
    XML_HEAD +
    `<styleSheet xmlns="${NS_MAIN}">` +
    (formats.length ? `<numFmts count="${formats.length}">${formats.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(f)}"/>`).join("")}</numFmts>` : "") +
    `<fonts count="2">${font(false)}${font(true)}</fonts>` +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${2 + formats.length}">` +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    formats.map((_, i) => `<xf numFmtId="${164 + i}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`).join("") +
    "</cellXfs>" +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>";

  const shared =
    XML_HEAD +
    `<sst xmlns="${NS_MAIN}" count="${stringRefs}" uniqueCount="${strings.length}">` +
    strings.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join("") +
    "</sst>";

  const n = sheetXml.length;
  const contentTypes =
    XML_HEAD +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheetXml.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
    "</Types>";

  const rootRels =
    XML_HEAD +
    `<Relationships xmlns="${NS_PKG_REL}">` +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>";

  const bookRels =
    XML_HEAD +
    `<Relationships xmlns="${NS_PKG_REL}">` +
    sheetXml.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
    `<Relationship Id="rId${n + 1}" Type="${NS_REL}/styles" Target="styles.xml"/>` +
    `<Relationship Id="rId${n + 2}" Type="${NS_REL}/sharedStrings" Target="sharedStrings.xml"/>` +
    "</Relationships>";

  return zip([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rootRels },
    { name: "xl/workbook.xml", data: workbook },
    { name: "xl/_rels/workbook.xml.rels", data: bookRels },
    ...sheetXml.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml })),
    { name: "xl/styles.xml", data: styles },
    { name: "xl/sharedStrings.xml", data: shared },
  ]);
}
