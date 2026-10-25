/** Short syntax reminder shown under long-form textareas (rendered by RichText). */
export default function FormattingHint({ headings = true }: { headings?: boolean }) {
  return (
    <details className="mt-2 text-xs text-paper-muted">
      <summary className="cursor-pointer select-none text-paper-muted/80 hover:text-paper">
        Formatting help
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Leave a blank line between paragraphs. A single line break stays a line break.</li>
        {headings && (
          <li>
            Headings: start a line with <code># </code>, <code>## </code> or <code>### </code>.
          </li>
        )}
        <li>
          <code>**bold**</code> and <code>*italic*</code>.
        </li>
        <li>
          Lists: start lines with <code>- </code> (bullets) or <code>1. </code> (numbers).
        </li>
        <li>
          Links: <code>[link text](https://example.com)</code>. Only http, https, mailto and site
          paths such as <code>/knowledge</code> work.
        </li>
        <li>HTML is not supported and is shown as plain text.</li>
      </ul>
    </details>
  );
}
