// A conversation's other versions, as plain functions: every message ever sent or answered in it
// sits in a tree, and the conversation's messages are the path through it that is open. Editing a
// question or regenerating an answer keeps the old one as a sibling, so ‹ 1/2 › can go back to it,
// and the path below it comes back as it was left.
import type { ChatMessage, ChatTree } from "@/registry/plainspoken/blocks/chat/data";

const ROOT = "";
const empty = (): ChatTree => ({ children: {}, chosen: {}, stash: {} });

/** The tree with the open path in it: every message under the one before it, and chosen there */
export function syncTree(tree: ChatTree | undefined, path: ChatMessage[]): ChatTree {
  const t = tree ?? empty();
  const children = { ...t.children };
  const chosen = { ...t.chosen };
  let stash = t.stash;
  let changed = !tree;
  path.forEach((m, i) => {
    const parent = i === 0 ? ROOT : path[i - 1].id;
    const list = children[parent] ?? [];
    if (!list.includes(m.id)) {
      children[parent] = [...list, m.id];
      changed = true;
    }
    if (chosen[parent] !== m.id) {
      chosen[parent] = m.id;
      changed = true;
    }
    if (stash[m.id]) {
      stash = { ...stash };
      delete stash[m.id];
      changed = true;
    }
  });
  return changed ? { children, chosen, stash } : t;
}

/** Whether the tree holds anything beyond the open path: when it doesn't, it needn't be kept */
export const hasBranches = (tree: ChatTree | undefined) => !!tree && Object.keys(tree.stash).length > 0;

/** The tree with the path from `from` on put aside, before it is replaced by an edit or a new answer */
export function stashFrom(tree: ChatTree | undefined, path: ChatMessage[], from: number): ChatTree {
  const t = syncTree(tree, path);
  if (from >= path.length) return t;
  const stash = { ...t.stash };
  for (const m of path.slice(from)) stash[m.id] = m;
  return { ...t, stash };
}

/** Other answers to the same question (from a comparison), put beside the one on the path */
export function addSiblings(tree: ChatTree | undefined, path: ChatMessage[], parentId: string, messages: ChatMessage[]): ChatTree {
  const t = syncTree(tree, path);
  const children = { ...t.children, [parentId]: [...(t.children[parentId] ?? [])] };
  const stash = { ...t.stash };
  for (const m of messages) {
    if (!children[parentId].includes(m.id)) children[parentId].push(m.id);
    if (!path.some((p) => p.id === m.id)) stash[m.id] = m;
  }
  return { ...t, children, stash };
}

/** The versions at a place in the path: the message there and its siblings, and which one it is */
export function versionsAt(tree: ChatTree | undefined, path: ChatMessage[], index: number): { ids: string[]; index: number } {
  const m = path[index];
  if (!tree || !m) return { ids: m ? [m.id] : [], index: 0 };
  const parent = index === 0 ? ROOT : path[index - 1].id;
  // Only the siblings that can still be shown (a stashed message, or the one on the path)
  const ids = (tree.children[parent] ?? [m.id]).filter((id) => id === m.id || tree.stash[id]);
  return { ids: ids.length ? ids : [m.id], index: Math.max(0, ids.indexOf(m.id)) };
}

/**
 * The path with another version at `index`, and below it the branch as it was last left; the
 * versions that were open move into the stash.
 */
export function switchVersion(tree: ChatTree | undefined, path: ChatMessage[], index: number, toId: string): { path: ChatMessage[]; tree: ChatTree } {
  const t = stashFrom(tree, path, index);
  const next: ChatMessage[] = path.slice(0, index);
  let id: string | undefined = toId;
  const seen = new Set<string>();
  while (id && t.stash[id] && !seen.has(id)) {
    seen.add(id);
    next.push(t.stash[id]);
    const kids: string[] = t.children[id] ?? [];
    const pick: string | undefined = t.chosen[id];
    id = pick && t.stash[pick] ? pick : kids.filter((k) => t.stash[k]).at(-1);
  }
  return { path: next, tree: syncTree(t, next) };
}
