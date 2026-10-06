import ArticleForm from "@/app/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">New article</h1>
      <p className="mt-1 text-sm text-paper-muted">
        Add Knowledge Hub content and choose whether it&rsquo;s visible on the public site.
      </p>
      <div className="mt-8">
        <ArticleForm mode="create" />
      </div>
    </div>
  );
}
