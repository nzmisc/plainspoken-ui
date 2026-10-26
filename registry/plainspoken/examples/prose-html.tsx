import { Prose } from "@/registry/plainspoken/ui/prose";

// What marked or markdown-it hand over: an HTML string. Sanitize it first if it comes from users.
const HTML = `<h2>Changelog</h2>
<p>Version <strong>1.4</strong> adds a slider and fixes the toast timer.</p>
<div class="markdown-alert markdown-alert-warning"><p class="markdown-alert-title">Warning</p><p>The <code>Tabs</code> prop <code>onSelect</code> is now <code>onChange</code>.</p></div>
<pre><code class="language-sh">npx shadcn@latest add https://plainspoken.dev/r/slider.json
</code></pre>
<table>
<thead><tr><th style="text-align:left">Component</th><th style="text-align:right">Size (kB)</th></tr></thead>
<tbody>
<tr><td style="text-align:left">Slider</td><td style="text-align:right">2.1</td></tr>
<tr><td style="text-align:left">Toast</td><td style="text-align:right">4.8</td></tr>
</tbody>
</table>
<ul class="contains-task-list">
<li class="task-list-item"><input type="checkbox" checked disabled> Slider</li>
<li class="task-list-item"><input type="checkbox" disabled> Date range picker</li>
</ul>`;

/**
 * An HTML string from a Markdown renderer, passed as html. Code blocks get their language
 * label, GitHub alerts and task lists are styled, and table headers stay left-aligned even where
 * the renderer aligned the column.
 */
export default function ProseHtml() {
  return <Prose html={HTML} />;
}
