import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import { addMonths, endOfMonth, format, parse, startOfMonth, startOfWeek } from "date-fns";
import StatisticsChart from "@/app/(app)/statistics/StatisticsChart";

function toMonthString(date: Date) {
  return format(date, "yyyy-MM");
}

export default async function StatisticsPage({
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
  const monthEndExclusive = addMonths(monthStart, 1);

  const employees = await prisma.employee.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, hourlyWage: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      employee: { userId: session.userId, isActive: true },
      workDate: { gte: monthStart, lt: monthEndExclusive },
    },
    select: { employeeId: true, workDate: true, hoursWorked: true },
  });

  const perEmployee = new Map<
    string,
    { totalHours: number; workDates: Set<string>; hourlyWage: number | null }
  >();
  for (const e of employees) perEmployee.set(e.id, { totalHours: 0, workDates: new Set(), hourlyWage: e.hourlyWage });

  for (const a of attendances) {
    const bucket = perEmployee.get(a.employeeId);
    if (!bucket) continue;
    bucket.totalHours += Number(a.hoursWorked);
    bucket.workDates.add(format(a.workDate, "yyyy-MM-dd"));
  }

  // 주차별(월~일) 총 근무시간
  const monthEnd = endOfMonth(monthStart);
  let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weekStarts: Date[] = [];
  cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
  while (cursor <= monthEnd) {
    weekStarts.push(cursor);
    cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const weekTotals = weekStarts.map((ws) => ({
    start: ws,
    label: format(ws, "MM/dd"),
    hours: 0,
  }));

  for (const a of attendances) {
    const ws = startOfWeek(a.workDate, { weekStartsOn: 1 });
    const label = format(ws, "MM/dd");
    const point = weekTotals.find((p) => p.label === label);
    if (point) point.hours += Number(a.hoursWorked);
  }

  const csvMonth = toMonthString(monthStart);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">월별 통계</h1>
        <p className="mt-1 text-sm text-zinc-600">월 총 근무시간/근무일수/주차별 추이/예상 인건비를 확인하세요.</p>
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

          <Link
            href={`/api/statistics/monthly-csv?month=${csvMonth}`}
            className="ml-auto rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            CSV 다운로드
          </Link>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-4">
        <h2 className="text-base font-semibold">주차별 근무시간 추이</h2>
        <p className="mt-1 text-sm text-zinc-600">해당 월에 걸친 주차(월~일)별 총 근무시간입니다.</p>
        <div className="mt-4">
          <StatisticsChart data={weekTotals.map((p) => ({ label: p.label, hours: Number(p.hours.toFixed(1)) }))} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-700">
            <tr>
              <th className="px-4 py-3 font-medium">직원</th>
              <th className="px-4 py-3 font-medium">월 총 근무시간</th>
              <th className="px-4 py-3 font-medium">근무일수</th>
              <th className="px-4 py-3 font-medium">시급</th>
              <th className="px-4 py-3 font-medium">예상 인건비</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {employees.map((e) => {
              const bucket = perEmployee.get(e.id) ?? { totalHours: 0, workDates: new Set<string>(), hourlyWage: null };
              const hourlyWage = bucket.hourlyWage;
              const estimatedWage = hourlyWage ? bucket.totalHours * hourlyWage : null;
              return (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">{bucket.totalHours.toFixed(1)}h</td>
                  <td className="px-4 py-3">{bucket.workDates.size}일</td>
                  <td className="px-4 py-3">{hourlyWage ? `${hourlyWage.toLocaleString()}원` : "-"}</td>
                  <td className="px-4 py-3">
                    {estimatedWage === null ? "-" : `${Math.round(estimatedWage).toLocaleString()}원`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

