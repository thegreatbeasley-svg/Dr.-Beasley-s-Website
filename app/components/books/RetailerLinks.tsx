import type { BookRetailer } from "@/lib/books/retailers";

/**
 * Retailer links, exactly as configured for this book: the name the admin
 * typed and the https link they pasted. Renders nothing when there are none,
 * and never generates or guesses a link.
 */
export default function RetailerLinks({ retailers }: { retailers: BookRetailer[] }) {
  if (retailers.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Find it at</p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {retailers.map((r, i) => (
          <li key={`${i}-${r.url}`} className="max-w-full">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-sm text-paper transition-colors hover:border-gold hover:bg-gold/10"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{r.name}</span>
              <span aria-hidden="true" className="shrink-0 text-gold">
                ↗
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
