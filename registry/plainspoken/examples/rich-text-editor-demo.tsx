import { RichTextEditor } from "@/registry/plainspoken/ui/rich-text-editor";

const NOTES = `## Release 4.2

This release brings **offline drafts** and a search that is *much* faster on big workspaces. Read the [full changelog](https://docs.quire.example/changelog) for the small things.

### What's new

- Drafts save on your device when the connection drops, and sync when it's back
- Search finds words in pictures' alt text
- Keyboard shortcuts for headings: \`Ctrl+Alt+1\` to \`3\`

### Before you upgrade

1. Publish or discard your open drafts
2. Check that the \`QUIRE_TOKEN\` variable is set:

   \`\`\`sh
   echo $QUIRE_TOKEN
   \`\`\`

> Self-hosted installs need version 4.1 of the sync service first.`;

/**
 * Release notes, in the formatted Write mode. Select text and use the toolbar or ⌘B, ⌘I, ⌘K; type
 * "## " or "- " at the start of a line; switch to Markdown to see the source, or to Preview.
 */
export default function RichTextEditorDemo() {
  return <RichTextEditor aria-label="Release notes" defaultValue={NOTES} className="max-w-2xl" />;
}
