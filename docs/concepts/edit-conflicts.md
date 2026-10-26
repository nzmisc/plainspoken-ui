# Edit conflicts

What to show when two people change the same text at once, for a text box and for a rich text
document. The approaches are prototyped side by side at [/demos/conflicts](<../../app/(demos)/demos/conflicts>)
with simulated collaborators, so they can be tried rather than imagined. See
[the concepts README](README.md) for what the statuses mean.

Written 2026-10-25, alongside the prototypes.

## Summary

| Concept | Status |
|---|---|
| [Default for a text box: automatic three-way merge](#default-for-a-text-box-automatic-three-way-merge) | open |
| [Default for a document: merge by blocks, history always](#default-for-a-document-merge-by-blocks-history-always) | open |
| [Real-time co-editing (OT or CRDTs) in the library](#real-time-co-editing-ot-or-crdts-in-the-library) | set aside |
| [Soft locks as a default](#soft-locks-as-a-default) | set aside |
| [The prototypes and their building blocks](#the-prototypes-and-their-building-blocks) | built |

## The problem in four scenarios

Every approach is judged against the same four situations, which are the Simulate buttons on the
demo page:

1. **Both editing live, different places.** No conflict. The baseline: is the other person visible,
   and do their changes arrive without disturbing yours (your caret above all)?
2. **Both editing live, the same words.** A real clash.
3. **Saving over a newer version.** Optimistic concurrency: a form saved after someone else saved.
4. **Offline edits** that meet changes made meanwhile.

## The approaches

### Text box

| | Approach | Suits | Costs |
|---|---|---|---|
| A | Presence + soft lock | Short fields one person edits at a time, everyone online | Blocks people; stale locks; nothing offline; a blunt two-way choice when it fails |
| B | Warn while typing | Forms with a Save button, edited for minutes | An interruption to decide on; needs a live channel |
| C | Conflict on save | Plain forms and APIs (a version number, `If-Match`) | You find out last, in a modal, and merge by hand |
| D | Automatic three-way merge | Fields that save as you type, a few editors, offline | A clean merge can still read wrong: it must say what it did and offer Undo |

### Rich text document

| | Approach | Suits | Costs |
|---|---|---|---|
| A | Live presence | Documents written together at the same moment | Needs real-time merging behind it; when two type in one spot, both edits land mangled |
| B | Inline conflict blocks | Documents edited over hours, saved as they type | The document waits until the clash is settled; block choices are coarse |
| C | Compare dialog on save | Long documents saved by hand and reviewed | Heavy; too much for a one-word change |
| D | Offline review list | Offline-first apps and long sessions | One step removed from the text; with many clashes, a chore |
| E | Version history | A safety net under all of the others | Repairs after the fact; restoring a whole version drops good changes too |

## What others do

Roughly, as of writing; these products change, and the details below are from their public
behaviour and write-ups rather than their code.

- **Google Docs**: live presence (A) on operational transformation run by the server: every
  keystroke is merged, nobody is ever asked. Offline edits merge the same way on reconnecting.
  Version history (E) is the safety net, with named versions and restore. Suggestion mode turns
  edits into proposals, which is B's "both versions, pick one" by choice rather than by accident.
- **Figma**: live cursors and selections for everyone in the file; the server settles concurrent
  changes per property with the last write winning, which is fine for "moved this frame" but means
  two people retyping one text layer don't merge. Version history as the safety net.
- **Notion**: presence per block (avatars beside the block someone is in, like the "is editing"
  marks here) on a document made of blocks, with page history to restore. The block is the unit,
  as in approaches B and D here.
- **git**: three-way merge (diff3) on lines: everything that doesn't overlap merges, the rest is a
  conflict with both versions and the base, settled by a person. Merge tools show base, theirs and
  yours in panes (C). The model the merge code here follows, with words and blocks for lines.
- **Jira**: fields edited one at a time and saved on their own, so most clashes never happen; a
  save after someone else's simply wins, with at most a note that the issue was updated. Closest
  to C without the dialog. Confluence pages are co-edited live, as in Google Docs.

## Default for a text box: automatic three-way merge

**Status: open**

Recommend **D** wherever a field saves as you type: the common case (two people changing different
sentences) merges without anyone noticing, the merge says what it did and can be undone, and a
real clash is marked only where it is. Add the facepile from presence, so people see who else is
there; carets in a text box are a nice extra, not needed.

Where there is no live connection (a form posted to an API), **C** is the honest minimum: one
version number, and the refusal shown with both versions marked against the one you started from
(not against each other: that makes the other person's additions look like your deletions).
Prefer **B** over C when there is a live channel anyway: knowing early is cheaper than knowing late.

## Default for a document: merge by blocks, history always

**Status: open**

Real-time co-editing (A) is what people expect from a document app, and the best answer when
everyone is online. It needs merging on every keystroke and a server to run it (see below). Without
that:

- **B** (merge by blocks, then by words inside a block both changed; clashes in place) as the
  everyday behaviour, with the "Merged Jonas's change in …" note and Undo.
- **D**'s report when coming back online, because offline sessions produce several changes at once
  and a list reads better than a document full of marks.
- **E** under everything, always: whatever the merge does, nothing is lost.
- **C** only for documents that are reviewed and saved deliberately (policies, contracts).

## Real-time co-editing (OT or CRDTs) in the library

**Status: set aside**

Approach A in the prototype merges three-way a few times a second, which looks live but isn't real
co-editing: two people typing in the same spot get both edits mangled together, as they do in the
real thing, and the "server" is pretend. A production version needs Yjs, Automerge or an OT server,
which is a dependency and a backend, outside what a copy-in component library should carry. The
presence pieces and the editor's `applyRemote` are the parts the library can offer; an app wires
them to its own sync.

## Soft locks as a default

**Status: set aside**

A (presence + soft lock) is easy to understand and to build, but locks block people, go stale when
someone leaves a tab open, and mean nothing offline; and when they are overridden, all that is
left is a choice of two with no merge. Worth it only where edits truly must be one at a time.

## Built

### The prototypes and their building blocks

**Status: built**

- [/demos/conflicts](<../../app/(demos)/demos/conflicts>): four text box approaches and five document
  approaches in tabs, each with the four scenarios, your screen and (with a switch) Jonas's, and a
  log; tables comparing them. The blocks are in `registry/plainspoken/blocks/conflicts/`.
- `lib/diff.ts` (item `diff`): Myers diff on characters, words and lines; a three-way merge (diff3)
  returning clean and conflict chunks, conflicts trimmed to what really differs; caret mapping
  through a change; Markdown split into blocks (paragraphs, headings, list items) and merged by
  blocks, then by words inside a block both changed. No dependencies; tested with
  `node --test scripts/diff.test.ts`.
- `ui/diff.tsx` (item `diff`): a diff inline or side by side. Insertions underlined, deletions
  struck through, both spelled out to screen readers.
- `ui/presence.tsx` (item `presence`): facepile, a ring and tag around a field, remote carets and
  selections over a textarea or HTML text, "is editing" marks beside blocks, throttled polite
  announcements. Person colours are the chart colours.
- `ui/merge-conflict.tsx` (item `merge-conflict`): one conflict as a block or inline, with Keep
  mine, Keep theirs, Keep both and Edit; a whole merge with its clashes in place.
- The simulation (`blocks/conflicts/sim.ts`): a server with numbered versions that refuses a save
  based on an old one, two clients each following one approach's policy, presence, a network that
  can be slow or cut, and scripts that type the edits out.

What the prototypes taught:

- **Keep the caret.** Every approach that changes your text from outside must carry your selection
  through the change (`mapSelection`); otherwise live merging is unusable. The rich text editor
  now does this for its own blocks (`applyRemote`); a character diff does it inside a block.
- **Mark changes against the base, not against each other.** Comparing their version with yours
  shows their additions as your deletions.
- **Say what was merged, and offer Undo.** A silent merge that reads wrong is worse than a question.
- **Announce politely and rarely.** Remote changes go to a polite live region at most every few
  seconds, the latest only; focus never moves on its own.
