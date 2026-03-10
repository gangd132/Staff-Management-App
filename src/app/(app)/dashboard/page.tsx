import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const today = new Date();
  const yyyyMmDd = today.toISOString().slice(0, 10);

  const [employeeCount, todayAttendances] = await Promise.all([
    prisma.employee.count({ where: { userId: session.userId, isActive: true } }),
    prisma.attendance.findMany({
      where: { employee: { userId: session.userId }, workDate: new Date(yyyyMmDd) },
      select: {
        hoursWorked: true,
        employee: { select: { name: true } },
        startTime: true,
        endTime: true,
      },
      orderBy: { employee: { name: "asc" } },
    }),
  ]);

  const totalHours = todayAttendances.reduce((acc: number, a: any) => acc + Number(a.hoursWorked), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-600">오늘 근무 요약과 알림을 확인하세요.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm text-zinc-600">등록된 직원(활성)</div>
          <div className="mt-1 text-2xl font-semibold">{employeeCount}명</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm text-zinc-600">오늘 총 근무시간</div>
          <div className="mt-1 text-2xl font-semibold">{totalHours.toFixed(1)}시간</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">오늘 근무자</h2>
          <div className="text-xs text-zinc-500">{yyyyMmDd}</div>
        </div>

        {todayAttendances.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-600">오늘 등록된 근무기록이 없습니다.</div>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200">
            {todayAttendances.map((a) => (
              <li key={`${a.employee.name}-${a.startTime.toISOString()}`} className="py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.employee.name}</div>
                  <div className="text-zinc-600">{Number(a.hoursWorked).toFixed(1)}시간</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

