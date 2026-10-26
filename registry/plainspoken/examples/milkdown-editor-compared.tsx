import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";

const ROWS: [string, string, string][] = [
  ["Built on", "contenteditable and the library's own Markdown reader and writer (lib/markdown)", "Milkdown: ProseMirror for editing, remark for Markdown"],
  ["npm dependencies", "None", "@milkdown/kit and remark-math; katex, which the AI chat already uses"],
  ["Size in the browser", "About 47 KB gzipped, with the components it uses", "About 39 KB gzipped up front, then a 234 KB chunk loaded after the page (158 KB of it Milkdown, ProseMirror and remark, 77 KB KaTeX)"],
  ["First paint", "The formatted text, rendered on the server", "The text laid out roughly, until Milkdown has loaded and takes over"],
  ["Beyond the toolbar", "Markdown shortcuts as you type", "A slash menu, a bubble on selected words, block handles to drag and a block menu, table and link popovers"],
  ["Tables", "Shown, edited as text in cells", "Insert at a size, add and remove rows and columns, align columns, Tab between cells"],
  ["Math", "Shown as its source", "KaTeX, inline and as blocks, with the TeX editable when selected"],
  ["Undo, and changes from outside", "Its own history of snapshots", "ProseMirror's history; a new value changes only what differs and stays out of it"],
];

/**
 * How this editor differs from RichTextEditor. The props, modes and editorRef are the same, so one
 * can be swapped for the other. Sizes were measured with esbuild, minified and gzipped.
 */
export default function MilkdownEditorCompared() {
  return (
    <Table className="max-w-4xl">
      <TableHeader>
        <TableRow>
          <TableHead className="w-40" />
          <TableHead>RichTextEditor</TableHead>
          <TableHead>MilkdownEditor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map(([what, first, second]) => (
          <TableRow key={what}>
            <TableHead scope="row">{what}</TableHead>
            <TableCell>{first}</TableCell>
            <TableCell>{second}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
