import ContactForm from "@/app/components/contact/ContactForm";
import { buildMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Contact — Dr. Virgil Beasly",
  description: "Get in touch about speaking, collaboration, media, or a general enquiry.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Get in touch</p>
        <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">
          Work with Dr. Virgil Beasly
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-paper-muted">
          Speaking, collaboration, media, or a general question — use the form below.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-paper-muted/80">
          Direct contact details are being finalized. No email address or phone number is listed
          here yet — this form is the way to reach out for now.
        </p>
      </div>

      <div className="mt-12">
        <ContactForm isLocalDemo={!isSupabaseConfigured()} />
      </div>
    </div>
  );
}
