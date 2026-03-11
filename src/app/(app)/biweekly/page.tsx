import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import { addMonths, endOfMonth, format, parse, startOfMonth } from "date-fns";

function toMonthString(date: Date) {
  return format(date, "yyyy-MM");
}

/** 해당 날짜가 해당 월에서 몇 주차(1~4)인지 반환. 1주차=1~7일, 2주차=8~14일, 3주차=15~21일, 4주차=22~말일 */
function getWeekOfMonth(date: Date): 1 | 2 | 3 | 4 {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

export default async function BiweeklyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { month } = await searchParams;
  const baseMonth =
    month && /^\d{4}-\d{2}$/.test(month)
      ? parse(month, "yyyy-MM", new Date())
      : new Date();

  const monthStart = startOfMonth(baseMonth);
  const monthEnd = endOfMonth(monthStart);
  const monthEndExclusive = addMonths(monthStart, 1);

  /** 주차별 집계용 직원 타입 (Prisma select와 동일) */
  type BiweeklyEmployee = { id: string; name: string };
  const employees: BiweeklyEmployee[] = await prisma.employee.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      employee: { userId: session.userId },
      workDate: { gte: monthStart, lt: monthEndExclusive },
    },
    select: { employeeId: true, workDate: true, hoursWorked: true },
  });

  type WeekHours = { week1: number; week2: number; week3: number; week4: number; total: number };
  const byEmployee = new Map<string, WeekHours>();

  for (const e of employees) {
    byEmployee.set(e.id, { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 });
  }

  for (const a of attendances) {
    const bucket = byEmployee.get(a.employeeId);
    if (!bucket) continue;
    const hours = Number(a.hoursWorked);
    const week = getWeekOfMonth(a.workDate);
    if (week === 1) bucket.week1 += hours;
    else if (week === 2) bucket.week2 += hours;
    else if (week === 3) bucket.week3 += hours;
    else bucket.week4 += hours;
    bucket.total += hours;
  }

  const csvMonth = toMonthString(monthStart);
  const lastDay = monthEnd.getDate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">주차별 집계</h1>
        <p className="mt-1 text-sm text-zinc-600">
          월을 선택하면 해당 달의 1주차~4주차 근무시간을 확인할 수 있습니다. 주휴수당(주 15시간 이상) 여부를 확인하세요.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="month">
              월 선택
            </label>
            <input
              id="month"
              name="month"
              type="month"
              defaultValue={csvMonth}
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
            {format(monthStart, "yyyy년 M월")} · 1주차(1~7일) 2주차(8~14일) 3주차(15~21일) 4주차(22~{lastDay}일)
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
                <th className="px-4 py-3 font-medium">1주차 (1~7일)</th>
                <th className="px-4 py-3 font-medium">2주차 (8~14일)</th>
                <th className="px-4 py-3 font-medium">3주차 (15~21일)</th>
                <th className="px-4 py-3 font-medium">4주차 (22~{lastDay}일)</th>
                <th className="px-4 py-3 font-medium">합계</th>
                <th className="px-4 py-3 font-medium">주휴수당(15h+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {employees.map((e) => {
                const agg = byEmployee.get(e.id) ?? {
                  week1: 0,
                  week2: 0,
                  week3: 0,
                  week4: 0,
                  total: 0,
                };
                const week1Ok = agg.week1 >= 15;
                const week2Ok = agg.week2 >= 15;
                const week3Ok = agg.week3 >= 15;
                const week4Ok = agg.week4 >= 15;
                const okWeeks: string[] = [];
                if (week1Ok) okWeeks.push("1주차");
                if (week2Ok) okWeeks.push("2주차");
                if (week3Ok) okWeeks.push("3주차");
                if (week4Ok) okWeeks.push("4주차");
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3">{agg.week1.toFixed(1)}h</td>
                    <td className="px-4 py-3">{agg.week2.toFixed(1)}h</td>
                    <td className="px-4 py-3">{agg.week3.toFixed(1)}h</td>
                    <td className="px-4 py-3">{agg.week4.toFixed(1)}h</td>
                    <td className="px-4 py-3">{agg.total.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      {okWeeks.length > 0 ? (
                        <div className="inline-flex flex-wrap gap-2">
                          {okWeeks.map((w) => (
                            <span
                              key={w}
                              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                            >
                              {w} 발생
                            </span>
                          ))}
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
