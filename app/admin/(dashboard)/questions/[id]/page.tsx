import { notFound } from "next/navigation";
import { getQuestionById } from "@/lib/questions/queries";
import QuestionAnswerForm from "@/app/components/admin/QuestionAnswerForm";

export default async function AdminQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = getQuestionById(id);
  if (!question) notFound();

  return (
    <div>
      <h1 className="text-2xl font-medium text-paper">Review question</h1>
      <p className="mt-1 max-w-2xl text-sm text-paper-muted">{question.question_text}</p>
      <div className="mt-8">
        <QuestionAnswerForm question={question} />
      </div>
    </div>
  );
}
