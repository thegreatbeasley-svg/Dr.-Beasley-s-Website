export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-paper-muted">
        <p className="text-base font-medium text-paper">Dr. Virgil Beasly</p>
        <p className="mt-1">The Resource Library</p>

        <div className="mt-6 rounded-2xl border border-gold/20 bg-ink-elevated/60 p-5 leading-relaxed">
          <p className="font-semibold text-gold">This is a local, working demo.</p>
          <p className="mt-2">
            Everything on this site — the resources, the request form, and the admin area — runs
            entirely on this computer for demonstration purposes. Requests are saved to a local
            database only. No email is sent, no data leaves this machine, and nothing here should
            be treated as a live, production website.
          </p>
          <p className="mt-2">
            Sample downloads are placeholder files clearly marked as demonstration content and are
            not authored by Dr. Virgil Beasly.
          </p>
        </div>

        <p className="mt-8 text-xs text-paper-muted/70">
          © {new Date().getFullYear()} Dr. Virgil Beasly. Demo build — no contact details or legal
          claims are represented here.
        </p>
      </div>
    </footer>
  );
}
