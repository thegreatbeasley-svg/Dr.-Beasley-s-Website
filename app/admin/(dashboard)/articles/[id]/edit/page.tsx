import DangerZone from "@/app/components/admin/DangerZone";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/articles/queries";
import ArticleForm from "@/app/components/admin/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">Edit article</h1>
      <p className="mt-1 text-sm text-paper-muted">{article.title}</p>
      <div className="mt-8">
        <ArticleForm mode="edit" articleId={article.id} initial={article} />
      </div>
      <DangerZone
        apiPath={`/api/admin/articles/${article.id}`}
        listPath="/admin/articles"
        itemLabel="article"
        itemName={article.title}
        consequence="Its cover image is removed from storage too."
      />
    </div>
  );
}
