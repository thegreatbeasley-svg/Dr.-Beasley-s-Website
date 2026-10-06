import BookForm from "@/app/components/admin/BookForm";

export default function NewBookPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">New book / body-of-work entry</h1>
      <p className="mt-1 text-sm text-paper-muted">
        Info and a call to action only — Stripe purchasing isn&rsquo;t connected yet.
      </p>
      <div className="mt-8">
        <BookForm mode="create" />
      </div>
    </div>
  );
}
