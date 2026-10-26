// Runs JavaScript (and TypeScript, once its types are stripped) from a code document, in the
// browser, out of the page's reach: inside a sandboxed iframe with scripts only and no
// same-origin (so no cookies, storage or page to touch), whose content security policy allows no
// network, and inside a worker there, so a loop that never ends can't freeze the page. Whatever
// the code writes to the console comes back as lines; after the time limit the frame is removed,
// which stops everything in it.
import type { ChatConsoleLine, ChatCodeRun } from "@/registry/plainspoken/blocks/chat/data";

// ---------------------------------------------------------------------------------------------
// TypeScript to JavaScript, by deleting the types. Not a compiler: the common forms (annotations,
// interfaces, type aliases, generics, casts, non-null marks, access modifiers) go; enums,
// namespaces and decorators are refused with a note.

const ID = /[\w$]/;
/** Stands in for the inside of strings, comments and regular expressions while scanning */
const FILL = "\u0001";

/** The code with every string, comment, template and regular expression filled with FILL (same length, line breaks kept) */
function mask(src: string): string {
  let out = "";
  let i = 0;
  let prev = ""; // the last significant character outside literals
  const fill = (s: string) => s.replace(/[^\n]/g, FILL);
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "/" && n === "/") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? src.length : end;
      out += fill(src.slice(i, stop));
      i = stop;
    } else if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out += fill(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      let depth = 0;
      while (j < src.length) {
        if (src[j] === "\\") j += 2;
        else if (c === "`" && src[j] === "$" && src[j + 1] === "{") {
          depth++;
          j += 2;
        } else if (c === "`" && depth > 0 && src[j] === "}") {
          depth--;
          j++;
        } else if (src[j] === c && depth === 0) break;
        else if (src[j] === "\n" && c !== "`") break;
        else j++;
      }
      out += fill(src.slice(i, j + 1));
      i = j + 1;
      prev = "S";
    } else if (c === "/" && (prev === "" || /[(,=:[!&|?{};+\-*%<>~^]/.test(prev) || /\b(return|typeof|case|do|else|in|of|void|yield|await)$/.test(out.trimEnd()))) {
      let j = i + 1;
      let cls = false;
      while (j < src.length && src[j] !== "\n") {
        if (src[j] === "\\") j++;
        else if (src[j] === "[") cls = true;
        else if (src[j] === "]") cls = false;
        else if (src[j] === "/" && !cls) break;
        j++;
      }
      j++;
      while (j < src.length && /[a-z]/i.test(src[j])) j++;
      out += fill(src.slice(i, j));
      i = j;
      prev = "S";
    } else {
      out += c;
      if (!/\s/.test(c)) prev = c;
      i++;
    }
  }
  return out;
}

const OPEN: Record<string, string> = { "(": ")", "[": "]", "{": "}", "<": ">" };

/** Index just past the bracket that closes the one at `i` */
function close(m: string, i: number): number {
  const open = m[i];
  const shut = OPEN[open];
  let depth = 0;
  for (let j = i; j < m.length; j++) {
    const c = m[j];
    // An arrow inside angle brackets isn't a closing bracket
    if (open === "<" && c === ">" && m[j - 1] === "=") continue;
    if (c === open) depth++;
    else if (c === shut && --depth === 0) return j + 1;
    else if (open !== "<" && (c === "(" || c === "[" || c === "{") && c !== open) j = close(m, j) - 1;
  }
  return m.length;
}

const skipSpace = (m: string, i: number, lines = true) => {
  while (i < m.length && (lines ? /\s/.test(m[i]) : m[i] === " " || m[i] === "\t")) i++;
  return i;
};

/** Index just past a type that starts at `i` */
function skipType(m: string, i: number): number {
  i = skipSpace(m, i);
  if (m[i] === "|" || m[i] === "&") i = skipSpace(m, i + 1);
  for (;;) {
    // Prefix words
    let word = /^(keyof|typeof|readonly|unique|infer|new|asserts)\b\s*/.exec(m.slice(i, i + 12));
    while (word) {
      i += word[0].length;
      word = /^(keyof|typeof|readonly|unique|infer|new|asserts)\b\s*/.exec(m.slice(i, i + 12));
    }
    let grouped = false;
    if (m[i] === "(" || m[i] === "[" || m[i] === "{") {
      grouped = m[i] === "(";
      i = close(m, i);
    } else if (m[i] === "<") {
      // A generic function type: <T>(x: T) => T
      i = skipSpace(m, close(m, i));
      if (m[i] === "(") {
        i = close(m, i);
        grouped = true;
      }
    } else if (m[i] === "-" && /\d/.test(m[i + 1] ?? "")) {
      i++;
      while (/[\w.]/.test(m[i] ?? "")) i++;
    } else if (ID.test(m[i] ?? "") || m[i] === FILL) {
      while (i < m.length && (ID.test(m[i]) || m[i] === "." || m[i] === FILL)) i++;
    } else return i;
    // Type arguments and array or indexed types
    for (;;) {
      const j = skipSpace(m, i, false);
      if (m[j] === "<") i = close(m, j);
      else if (m[j] === "[") i = close(m, j);
      else break;
    }
    const j = skipSpace(m, i, false);
    if (m[j] === "=" && m[j + 1] === ">" && grouped) {
      i = j + 2;
      continue;
    }
    // A union or intersection may go on to the next line, if that line starts with | or &
    const k = skipSpace(m, i);
    if ((m[k] === "|" && m[k + 1] !== "|") || (m[k] === "&" && m[k + 1] !== "&")) {
      i = skipSpace(m, k + 1);
      continue;
    }
    const rest = m.slice(j, j + 8);
    if (/^(extends|is)\b/.test(rest)) {
      i = skipType(m, j + rest.indexOf(" ") + 1);
      const q = skipSpace(m, i);
      if (rest.startsWith("extends") && m[q] === "?") {
        i = skipType(m, q + 1);
        const c = skipSpace(m, i);
        if (m[c] === ":") i = skipType(m, c + 1);
      }
      return i;
    }
    return i;
  }
}

/** Index just past a statement that starts at `i`: to its ; or the end of its line, brackets kept whole */
function skipStatement(m: string, i: number): number {
  for (let j = i; j < m.length; j++) {
    const c = m[j];
    if (c === "(" || c === "[" || c === "{") j = close(m, j) - 1;
    else if (c === ";") return j + 1;
    else if (c === "\n") {
      const next = m.slice(j + 1).match(/^\s*(\S)/)?.[1];
      const last = m.slice(i, j).trimEnd().at(-1) ?? "";
      if (!/[|&=,<(:?]/.test(last) && !/[|&]/.test(next ?? "")) return j;
    }
  }
  return m.length;
}

const KEYWORDS_BEFORE_PARENS = /\b(if|for|while|switch|with)\s*$/;

/** TypeScript with its types deleted, or an error for what can't be done that way */
export function stripTypes(src: string): { code: string } | { error: string } {
  const m = mask(src);
  if (/(^|[;\n{}])\s*(export\s+)?(const\s+)?enum\s+[A-Za-z_$]/.test(m)) return { error: "Enums can't be run here: write them as an object instead." };
  if (/(^|[;\n{}])\s*(export\s+)?(namespace|module)\s+[A-Za-z_$][\w$.]*\s*\{/.test(m)) return { error: "Namespaces can't be run here." };
  if (/(^|\s)@[A-Za-z_$][\w$]*/.test(m.replace(/\u0001+/g, ""))) return { error: "Decorators can't be run here." };
  // constructor(private x: number) would quietly lose its "this.x = x"
  if (/\bconstructor\s*\([^)]*\b(public|private|protected|readonly)\s+[A-Za-z_$]/.test(m))
    return { error: "Parameter properties (constructor(private x: T)) can't be run here: declare the field and assign it in the constructor." };

  const cuts: [number, number][] = [];
  const cut = (a: number, b: number) => b > a && cuts.push([a, b]);

  // Whole statements that are only types
  for (const s of m.matchAll(/(^|[;\n{}])([ \t]*)((?:export\s+)?(?:declare\s+)?(?:interface\s+[A-Za-z_$]|type\s+[A-Za-z_$][\w$]*\s*(?:<[^\n=]*>)?\s*=|abstract\s+class\b(?=[^{]*;)|import\s+type\b|export\s+type\s*\{))/g)) {
    const start = s.index! + s[1].length;
    const at = start + s[2].length;
    const kind = s[3];
    if (/interface/.test(kind)) {
      const brace = m.indexOf("{", at);
      cut(start, brace < 0 ? m.length : close(m, brace));
    } else cut(start, skipStatement(m, at));
  }
  for (const s of m.matchAll(/(^|[;\n{}])([ \t]*)declare\s+(?!global)/g)) cut(s.index! + s[1].length, skipStatement(m, s.index! + s[0].length));

  // Words that are only for the type checker
  for (const s of m.matchAll(/\b(public|private|protected|readonly|override|abstract|declare)\s+(?=[#A-Za-z_$[])/g)) cut(s.index!, s.index! + s[0].length);
  for (const s of m.matchAll(/\bimplements\s+[^{]+(?=\{)/g)) cut(s.index!, s.index! + s[0].length);

  // Generic parameters and arguments: f<T>(…), class Box<T> {, = <T,>(x: T) =>
  for (const s of m.matchAll(/[\w$=(,]\s*(<)/g)) {
    const lt = s.index! + s[0].length - 1;
    const prev = m.slice(0, lt).trimEnd();
    const gt = close(m, lt);
    const inner = m.slice(lt + 1, gt - 1);
    if (!/^[\w$\s,.|&[\]{}:;?'"()=>\u0001-]*$/.test(inner) || /&&|\|\||^\s*\d|^\s*$/.test(inner)) continue;
    const after = m.slice(skipSpace(m, gt), skipSpace(m, gt) + 12);
    const isDecl = /\b(function\s*[\w$]*|class\s+[\w$]+|interface\s+[\w$]+)$/.test(prev);
    if (after.startsWith("(") || (isDecl && /^(\{|extends\b|implements\b)/.test(after)) || (/=$/.test(prev) && after.startsWith("("))) cut(lt, gt);
  }

  // Parameter lists: ( … ) followed by an optional return type and then { or =>
  for (let i = 0; i < m.length; i++) {
    if (m[i] !== "(") continue;
    const end = close(m, i);
    let j = skipSpace(m, end);
    let returnType: [number, number] | null = null;
    if (m[j] === ":") {
      const t = skipType(m, j + 1);
      const k = skipSpace(m, t);
      if (m[k] === "{" || (m[k] === "=" && m[k + 1] === ">")) {
        returnType = [end, t];
        j = k;
      }
    }
    const isParams = (m[j] === "{" || (m[j] === "=" && m[j + 1] === ">")) && !KEYWORDS_BEFORE_PARENS.test(m.slice(Math.max(0, i - 12), i));
    if (!isParams) continue;
    if (returnType) cut(returnType[0], returnType[1]);
    // Each parameter: [...]name or a pattern, ?, : Type, = default
    let k = i + 1;
    while (k < end - 1) {
      k = skipSpace(m, k);
      const first = k;
      if (m.startsWith("...", k)) k += 3;
      if (m[k] === "{" || m[k] === "[") k = close(m, k);
      else while (k < end && (ID.test(m[k]) || m[k] === "#")) k++;
      let q = skipSpace(m, k);
      if (m[q] === "?" && m[q + 1] !== ".") {
        cut(q, q + 1);
        q = skipSpace(m, q + 1);
      }
      if (m[q] === ":") {
        const t = skipType(m, q + 1);
        // function f(this: Window, …): a type for "this", not a parameter, so it goes with its comma
        if (m.slice(first, k) === "this") {
          const comma = skipSpace(m, t);
          cut(first, m[comma] === "," ? skipSpace(m, comma + 1) : t);
        } else cut(k, t);
        q = t;
      }
      // On to the next parameter, past a default value
      while (q < end - 1) {
        const c = m[q];
        if (c === "(" || c === "[" || c === "{") q = close(m, q);
        else if (c === ",") break;
        else q++;
      }
      k = q + 1;
    }
  }

  // let x: T, const { a }: T, let x!: T
  for (const s of m.matchAll(/\b(const|let|var)\s+/g)) {
    let k = s.index! + s[0].length;
    if (m[k] === "{" || m[k] === "[") k = close(m, k);
    else while (k < m.length && ID.test(m[k])) k++;
    let q = k;
    if (m[q] === "!") q++;
    q = skipSpace(m, q, false);
    if (m[q] === ":") cut(k, skipType(m, q + 1));
  }

  // Class fields: name: T; name?: T = …; #name!: T
  for (const s of m.matchAll(/\bclass\b[^{;]*\{/g)) {
    const open = s.index! + s[0].length - 1;
    const end = close(m, open);
    let k = open + 1;
    while (k < end - 1) {
      k = skipSpace(m, k);
      const head = /^((?:(?:static|public|private|protected|readonly|override|declare|abstract|accessor)\s+)*)(#?[A-Za-z_$][\w$]*)\s*([?!])?\s*:/.exec(m.slice(k, k + 120));
      if (head) {
        const nameEnd = k + head[1].length + head[2].length;
        const colon = k + head[0].length - 1;
        cut(nameEnd, skipType(m, colon + 1));
      }
      // To the next member
      while (k < end - 1 && m[k] !== ";" && m[k] !== "\n") {
        if (m[k] === "(" || m[k] === "[" || m[k] === "{") k = close(m, k);
        else k++;
      }
      k++;
    }
  }

  // x as T, x satisfies T
  for (const s of m.matchAll(/(?<=[\w$)\]}\u0001])(\s+)(as|satisfies)\s+/g)) {
    const at = s.index!;
    if (/\bimport\b[^;]*$|\bexport\s*\{[^}]*$/.test(m.slice(Math.max(0, at - 80), at))) continue;
    cut(at, skipType(m, at + s[0].length));
  }

  // Non-null marks: x!.y, f()!, a[i]!
  for (const s of m.matchAll(/(?<=[\w$)\]])!(?=[.[),;:\s])/g)) {
    const next = m.slice(s.index! + 1).match(/^\s*(\S)/)?.[1];
    if (next !== "=") cut(s.index!, s.index! + 1);
  }

  // Apply the cuts from the end, inner ones folded into the outer
  cuts.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: [number, number][] = [];
  for (const c of cuts) {
    const last = merged.at(-1);
    if (last && c[0] < last[1]) last[1] = Math.max(last[1], c[1]);
    else merged.push([...c]);
  }
  let code = src;
  for (const [a, b] of merged.reverse()) {
    // Keep line breaks, so error line numbers still match
    code = code.slice(0, a) + src.slice(a, b).replace(/[^\n]/g, "") + code.slice(b);
  }
  return { code };
}

// ---------------------------------------------------------------------------------------------
// Running

/** The worker's prelude: console lines, timers counted, and "done" once nothing is left to run */
const PRELUDE = String.raw`
const post = (m) => self.postMessage(m);
const seen = new WeakSet();
const show = (v, depth = 0) => {
  if (typeof v === "string") return depth ? JSON.stringify(v) : v;
  if (v === undefined) return "undefined";
  if (typeof v === "function") return "[Function " + (v.name || "anonymous") + "]";
  if (typeof v === "bigint") return v + "n";
  if (typeof v === "symbol") return v.toString();
  if (v instanceof Error) return v.stack && depth === 0 ? String(v.stack).split("\n").slice(0, 4).join("\n") : v.name + ": " + v.message;
  if (v === null || typeof v !== "object") return String(v);
  if (seen.has(v) || depth > 3) return "[…]";
  seen.add(v);
  try {
    if (Array.isArray(v)) return "[" + v.slice(0, 100).map((x) => show(x, depth + 1)).join(", ") + (v.length > 100 ? ", …" : "") + "]";
    if (v instanceof Map) return "Map(" + v.size + ") {" + [...v].slice(0, 50).map(([k, x]) => show(k, depth + 1) + " => " + show(x, depth + 1)).join(", ") + "}";
    if (v instanceof Set) return "Set(" + v.size + ") {" + [...v].slice(0, 50).map((x) => show(x, depth + 1)).join(", ") + "}";
    if (v instanceof Date) return v.toISOString();
    const name = v.constructor && v.constructor !== Object ? v.constructor.name + " " : "";
    return name + "{ " + Object.keys(v).slice(0, 50).map((k) => k + ": " + show(v[k], depth + 1)).join(", ") + " }";
  } finally {
    seen.delete(v);
  }
};
let lines = 0;
for (const level of ["log", "info", "warn", "error", "debug", "table"]) {
  console[level] = (...args) => {
    if (++lines > 500) return;
    if (lines === 500) return post({ type: "line", level: "warn", text: "(More output was cut off.)" });
    post({ type: "line", level: level === "debug" || level === "table" ? "log" : level, text: args.map((a) => show(a)).join(" ").slice(0, 4000) });
  };
}
const timers = new Set();
let mainDone = false;
const _setTimeout = setTimeout, _clearTimeout = clearTimeout, _setInterval = setInterval, _clearInterval = clearInterval;
const check = () => _setTimeout(() => { if (mainDone && timers.size === 0) post({ type: "done" }); }, 0);
const report = (e) => post({ type: "line", level: "error", text: "Uncaught " + show(e) });
self.setTimeout = (fn, ms, ...a) => { const id = _setTimeout(() => { timers.delete(id); try { if (typeof fn === "function") fn(...a); } catch (e) { report(e); } check(); }, ms); timers.add(id); return id; };
self.clearTimeout = (id) => { timers.delete(id); _clearTimeout(id); check(); };
self.setInterval = (fn, ms, ...a) => { const id = _setInterval(() => { try { if (typeof fn === "function") fn(...a); } catch (e) { report(e); } }, ms); timers.add(id); return id; };
self.clearInterval = (id) => { timers.delete(id); _clearInterval(id); check(); };
self.addEventListener("unhandledrejection", (e) => { e.preventDefault(); report(e.reason); });
self.__finish = (error) => { if (error !== undefined) post({ type: "line", level: "error", text: "Uncaught " + show(error) }); mainDone = true; check(); };
`;

/** The frame's page: it runs each piece of code it is sent in a worker of its own and passes the messages on */
const FRAME = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:"></head><body><script>
const send = (m) => parent.postMessage(Object.assign({ parley: true }, m), "*");
addEventListener("message", (e) => {
  if (!e.data || e.data.parley !== "run") return;
  let worker;
  try {
    worker = new Worker(URL.createObjectURL(new Blob([e.data.source], { type: "text/javascript" })));
  } catch (err) {
    send({ type: "line", level: "error", text: "This browser won't run code here: " + err.message });
    return send({ type: "done" });
  }
  worker.onmessage = (m) => send(m.data);
  worker.onerror = (ev) => { ev.preventDefault(); send({ type: "line", level: "error", text: ev.message || "The code couldn't be run." }); send({ type: "done" }); };
});
send({ type: "ready" });
</script></body></html>`;

/** Code wrapped to run in the worker: imports refused, exports dropped, top-level await allowed */
function wrap(code: string): string | { error: string } {
  const m = mask(code);
  if (/(^|[;\n])\s*import\s*[\w{*'"\u0001]/.test(m)) return { error: "Imports can't be run here: the code runs on its own, without packages or the network." };
  let out = code;
  // export const x → const x; export default f → f
  const cuts = [...m.matchAll(/(^|[;\n])([ \t]*)(export\s+(default\s+)?)(?=[\w({[])/g)].map((s) => [s.index! + s[1].length + s[2].length, s[3].length] as const);
  for (const [at, len] of cuts.reverse()) out = out.slice(0, at) + out.slice(at + len);
  return `${PRELUDE}\n(async () => {\n${out}\n})().then(() => self.__finish(), (e) => self.__finish(e));`;
}

export interface RunOptions {
  /** Milliseconds before the run is stopped. Default 5000. */
  timeout?: number;
  /** Each console line as it comes */
  onLine?: (line: ChatConsoleLine) => void;
  signal?: AbortSignal;
}

/**
 * Runs code from a code document and resolves with its console output: "ok" once it has nothing
 * left to do (timers included), "error" when it threw or couldn't start, "timeout" when it was
 * stopped at the limit.
 */
export function runCode(code: string, language: "js" | "ts", { timeout = 5000, onLine, signal }: RunOptions = {}): Promise<Omit<ChatCodeRun, "version">> {
  const began = performance.now();
  const lines: ChatConsoleLine[] = [];
  const add = (l: ChatConsoleLine) => {
    lines.push(l);
    onLine?.(l);
  };
  const fail = (text: string) => {
    add({ level: "error", text });
    return Promise.resolve({ status: "error" as const, lines, ms: 0 });
  };
  const js = language === "ts" ? stripTypes(code) : { code };
  if ("error" in js) return fail(js.error);
  const source = wrap(js.code);
  if (typeof source !== "string") return fail(source.error);

  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
    let errored = false;
    const finish = (status: ChatCodeRun["status"]) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      frame.remove();
      resolve({ status: status === "ok" && errored ? "error" : status, lines, ms: Math.round(performance.now() - began) });
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow || !e.data?.parley) return;
      const d = e.data as { type: string; level?: ChatConsoleLine["level"]; text?: string };
      if (d.type === "ready") frame.contentWindow?.postMessage({ parley: "run", source }, "*");
      else if (d.type === "line") {
        if (d.level === "error") errored = true;
        add({ level: d.level ?? "log", text: String(d.text ?? "") });
      } else if (d.type === "done") finish("ok");
    };
    const onAbort = () => finish("error");
    const timer = setTimeout(() => {
      add({ level: "warn", text: `Stopped after ${timeout / 1000} s.` });
      finish("timeout");
    }, timeout);
    window.addEventListener("message", onMessage);
    signal?.addEventListener("abort", onAbort, { once: true });
    frame.srcdoc = FRAME;
    document.body.append(frame);
  });
}
