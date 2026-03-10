import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import CalendarClient from "@/app/(app)/calendar/CalendarClient";

export default async function CalendarPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const employees = await prisma.employee.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">달력</h1>
        <p className="mt-1 text-sm text-zinc-600">월간 달력에서 직원별 근무기록을 확인하세요.</p>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          먼저 <span className="font-semibold">직원 관리</span>에서 직원을 추가해주세요.
        </div>
      ) : (
        <CalendarClient employees={employees} />
      )}
    </div>
  );
}

