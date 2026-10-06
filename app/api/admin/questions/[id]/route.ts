import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { getQuestionById, updateQuestionAnswer } from "@/lib/questions/queries";
import { QUESTION_STATUSES } from "@/lib/questions/types";
import { clean } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = getQuestionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const status = clean(body.status, 20);
  const answerBody = clean(body.answerBody, 20000);

  if (!QUESTION_STATUSES.includes(status as (typeof QUESTION_STATUSES)[number])) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { status: "Choose a valid status." } },
      { status: 400 }
    );
  }
  if (status === "published" && !answerBody) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { answerBody: "Write an answer before publishing." } },
      { status: 400 }
    );
  }

  const question = updateQuestionAnswer(id, {
    answer_body: answerBody || null,
    status: status as (typeof QUESTION_STATUSES)[number],
  });

  return NextResponse.json({ success: true, question });
}
