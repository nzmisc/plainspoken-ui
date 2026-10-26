"use client";

// Syntax highlighting for code in answers and documents: one Shiki highlighter for the whole page
// (Streamdown's code plugin makes one per language, and Shiki warns once there are ten), with
// GitHub's light and dark colours, grammars loaded the first time a language is seen, and finished
// blocks cached. Shiki is what the code plugin uses; it is fetched with the first code block.
import { useEffect, useState } from "react";

type Shiki = typeof import("shiki");
type Highlighter = Awaited<ReturnType<Shiki["createHighlighter"]>>;

/** A run of text in one colour: the light theme's colour and the dark theme's */
export interface CodeToken {
  content: string;
  light?: string;
  dark?: string;
  italic?: boolean;
  bold?: boolean;
}

const THEMES = ["github-light", "github-dark"] as const;

let shiki: Promise<{ highlighter: Highlighter; aliases: Record<string, string>; known: Set<string> }> | null = null;
const loadShiki = () =>
  (shiki ??= Promise.all([import("shiki"), import("shiki/engine/javascript")]).then(async ([s, engine]) => {
    const highlighter = await s.createHighlighter({ themes: [...THEMES], langs: [], engine: engine.createJavaScriptRegexEngine({ forgiving: true }) });
    const aliases = Object.fromEntries(s.bundledLanguagesInfo.flatMap((l) => (l.aliases ?? []).map((a) => [a, l.id])));
    return { highlighter, aliases, known: new Set(Object.keys(s.bundledLanguages)) };
  }));

const loading = new Map<string, Promise<void>>();
const cache = new Map<string, CodeToken[][]>();
const MAX_CACHED = 300;

/** Tokens for code in a language, or null for a language Shiki doesn't know ("text") */
export async function highlightCode(code: string, language: string): Promise<CodeToken[][] | null> {
  const key = `${language}\n${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { highlighter, aliases, known } = await loadShiki();
  const lang = aliases[language] ?? language;
  if (!known.has(lang)) return null;
  if (!highlighter.getLoadedLanguages().includes(lang)) {
    if (!loading.has(lang)) loading.set(lang, highlighter.loadLanguage(lang as Parameters<Highlighter["loadLanguage"]>[0]));
    await loading.get(lang);
  }
  const { tokens } = highlighter.codeToTokens(code, { lang: lang as Parameters<Highlighter["codeToTokens"]>[1]["lang"], themes: { light: THEMES[0], dark: THEMES[1] }, defaultColor: "light" });
  const lines = tokens.map((line) =>
    line.map((t) => ({
      content: t.content,
      light: t.htmlStyle?.color ?? t.color,
      dark: t.htmlStyle?.["--shiki-dark"] ?? t.htmlStyle?.color ?? t.color,
      italic: t.htmlStyle?.["font-style"] === "italic" || undefined,
      bold: t.htmlStyle?.["font-weight"] === "bold" || undefined,
    })),
  );
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
  cache.set(key, lines);
  return lines;
}

/**
 * The code's tokens once highlighted, for the code as far as it goes: while it streams, only its
 * finished lines are highlighted (the line being written shows plain until it ends), so each
 * update only redoes what changed. `code` is what they are tokens of.
 */
export function useHighlight(code: string, language: string, streaming: boolean): { code: string; lines: CodeToken[][] } | null {
  const done = streaming ? code.slice(0, code.lastIndexOf("\n") + 1) : code;
  const [result, setResult] = useState<{ code: string; lines: CodeToken[][] } | null>(null);
  useEffect(() => {
    if (!language || !done) return;
    let live = true;
    void highlightCode(done, language).then(
      (lines) => live && lines && setResult({ code: done, lines }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [done, language]);
  return result && code.startsWith(result.code) ? result : null;
}
