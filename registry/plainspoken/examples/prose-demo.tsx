import { Prose } from "@/registry/plainspoken/ui/prose";

/** Plain elements inside <Prose>, as a Markdown renderer would produce them. size="lg" for reading at length. */
export default function ProseDemo() {
  return (
    <Prose as="article" size="lg">
      <h1>Why our tables have borders again</h1>
      <p>
        For a few years every table we shipped was a list of rows floating on white, separated by nothing but{" "}
        <em>space</em>. It looked calm. It was also <strong>hard to read</strong>: the eye slid from one column into the
        next, and numbers in the last column belonged to whichever row your finger was on.
      </p>
      <h2>What changed</h2>
      <p>We put the lines back. Every cell has a 1px border in the border colour, and numbers:</p>
      <ul>
        <li>are right-aligned, so the digits line up;</li>
        <li>
          use tabular figures (<code>font-variant-numeric: tabular-nums</code>);
        </li>
        <li>keep their header left-aligned, like every other column.</li>
      </ul>
      <blockquote>
        <p>A border costs one pixel. A misread invoice costs an afternoon.</p>
      </blockquote>
      <h3>Try it</h3>
      <p>
        Press <kbd>⌘</kbd> + <kbd>K</kbd> and type <q>table</q>, or read the <a href="#table">Table docs</a>.
      </p>
    </Prose>
  );
}
