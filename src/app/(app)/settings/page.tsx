import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import BreakDeductionToggle from "./BreakDeductionToggle";

export default async function SettingsPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const user = (await prisma.user.findUnique({
    where: { id: session.userId },
  })) as { bizName: string; email: string; autoBreakDeduction: boolean } | null;
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">설정</h1>
        <p className="mt-1 text-sm text-zinc-600">사업장 근무 정책을 설정합니다.</p>
      </div>

      {/* 사업장 정보 요약 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold">사업장 정보</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 text-zinc-500">사업장명</dt>
            <dd className="font-medium">{user.bizName}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-20 shrink-0 text-zinc-500">이메일</dt>
            <dd className="text-zinc-700">{user.email}</dd>
          </div>
        </dl>
      </div>

      {/* 휴게시간 자동 공제 토글 */}
      <BreakDeductionToggle autoBreakDeduction={user.autoBreakDeduction} />
    </div>
  );
}
