import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import { addDays, addWeeks, format, parseISO, startOfWeek } from "date-fns";

function toYyyyMmDd(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default async function BiweeklyPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { start } = await searchParams;
  const baseDate =
    start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? parseISO(start) : new Date();

  const week1Start = startOfWeek(baseDate, { weekStartsOn: 1 });
  const week2Start = addWeeks(week1Start, 1);
  const rangeEnd = addWeeks(week1Start, 2);

  const employees = await prisma.employee.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      employee: { userId: session.userId, isActive: true },
      workDate: { gte: week1Start, lt: rangeEnd },
    },
    select: { employeeId: true, workDate: true, hoursWorked: true },
  });

  const byEmployee = new Map<
    string,
    { week1Hours: number; week2Hours: number; totalHours: number }
  >();

  for (const e of employees) {
    byEmployee.set(e.id, { week1Hours: 0, week2Hours: 0, totalHours: 0 });
  }

  for (const a of attendances) {
    const bucket = byEmployee.get(a.employeeId);
    if (!bucket) continue;
    const hours = Number(a.hoursWorked);
    if (a.workDate < week2Start) bucket.week1Hours += hours;
    else bucket.week2Hours += hours;
    bucket.totalHours += hours;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">2주 집계</h1>
        <p className="mt-1 text-sm text-zinc-600">월~일 기준으로 2주 근무시간과 주 15시간 여부를 확인합니다.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="start">
              기준 날짜(아무 날이나 선택)
            </label>
            <input
              id="start"
              name="start"
              type="date"
              defaultValue={toYyyyMmDd(baseDate)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            조회
          </button>

          <div className="text-xs text-zinc-500">
            집계 구간:{" "}
            <span className="font-medium">
              {toYyyyMmDd(week1Start)} ~ {toYyyyMmDd(addDays(rangeEnd, -1))}
            </span>{" "}
            (2주)
          </div>
        </form>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          먼저 <span className="font-semibold">직원 관리</span>에서 직원을 추가해주세요.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-4 py-3 font-medium">직원</th>
                <th className="px-4 py-3 font-medium">
                  1주차 ({toYyyyMmDd(week1Start)}~{toYyyyMmDd(addDays(week2Start, -1))})
                </th>
                <th className="px-4 py-3 font-medium">
                  2주차 ({toYyyyMmDd(week2Start)}~{toYyyyMmDd(addDays(rangeEnd, -1))})
                </th>
                <th className="px-4 py-3 font-medium">2주 합산</th>
                <th className="px-4 py-3 font-medium">주휴수당(15h+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {employees.map((e: any) => {
                const agg = byEmployee.get(e.id) ?? { week1Hours: 0, week2Hours: 0, totalHours: 0 };
                const week1Ok = agg.week1Hours >= 15;
                const week2Ok = agg.week2Hours >= 15;
                const anyOk = week1Ok || week2Ok;
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3">{agg.week1Hours.toFixed(1)}h</td>
                    <td className="px-4 py-3">{agg.week2Hours.toFixed(1)}h</td>
                    <td className="px-4 py-3">{agg.totalHours.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      {anyOk ? (
                        <div className="inline-flex flex-wrap gap-2">
                          {week1Ok && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                              1주차 발생
                            </span>
                          )}
                          {week2Ok && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                              2주차 발생
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

