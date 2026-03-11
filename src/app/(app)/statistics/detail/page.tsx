import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import { addDays, addMonths, format, parse, startOfMonth, startOfWeek } from "date-fns";

function toMonthString(date: Date) {
  return format(date, "yyyy-MM");
}

type WeekRow = {
  weekStart: Date;
  weekLabel: string;
  hours: number;
  basePay: number;
  restPay: number;
  total: number;
  hasRest: boolean;
};

export default async function StatisticsDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; employeeId?: string }>;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { month, employeeId } = await searchParams;
  if (!month || !/^\d{4}-\d{2}$/.test(month) || !employeeId) {
    redirect("/statistics");
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId: session.userId },
    select: { id: true, name: true, hourlyWage: true, restDayHours: true },
  });
  if (!employee) redirect("/statistics");

  const monthStart = startOfMonth(parse(month, "yyyy-MM", new Date()));
  const monthEndExclusive = addMonths(monthStart, 1);

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      workDate: { gte: monthStart, lt: monthEndExclusive },
    },
    select: { workDate: true, hoursWorked: true },
    orderBy: { workDate: "asc" },
  });

  const hourlyWage = employee.hourlyWage ?? 0;
  const restDayHours = employee.restDayHours ?? 8;

  // 해당 월에 걸친 모든 주(월요일 시작) 구하기
  const weekStartSet = new Set<string>();
  for (const a of attendances) {
    weekStartSet.add(format(startOfWeek(a.workDate, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  }
  const weekStarts = Array.from(weekStartSet)
    .map((s) => parse(s, "yyyy-MM-dd", new Date()))
    .sort((a, b) => a.getTime() - b.getTime());

  const rows: WeekRow[] = weekStarts.map((weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    let hours = 0;
    for (const a of attendances) {
      const d = a.workDate;
      if (d >= weekStart && d <= weekEnd) hours += Number(a.hoursWorked);
    }
    const basePay = hourlyWage ? hours * hourlyWage : 0;
    const hasRest = hours >= 15;
    const restPay = hourlyWage && hasRest ? restDayHours * hourlyWage : 0;
    const total = basePay + restPay;
    return {
      weekStart,
      weekLabel: `${format(weekStart, "M/d")} ~ ${format(weekEnd, "M/d")}`,
      hours,
      basePay,
      restPay,
      total,
      hasRest,
    };
  });

  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
  const totalBasePay = rows.reduce((sum, r) => sum + r.basePay, 0);
  const totalRestPay = rows.reduce((sum, r) => sum + r.restPay, 0);
  const grandTotal = totalBasePay + totalRestPay;
  const csvMonth = toMonthString(monthStart);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">인건비 상세 · {employee.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {format(monthStart, "yyyy년 M월")} 주차별 근무시간·기본급·주휴수당 내역입니다. (4시간 이상 0.5시간·8시간 이상 1시간 휴게 공제 반영)
          </p>
        </div>
        <Link
          href={`/statistics?month=${csvMonth}`}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          ← 월별 통계로
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">시급</dt>
            <dd className="font-medium">{hourlyWage ? `${hourlyWage.toLocaleString()}원` : "미설정"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">주휴수당 기준(하루 일당 시간)</dt>
            <dd className="font-medium">{restDayHours}시간</dd>
          </div>
        </dl>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
          이 달에 근무 기록이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-4 py-3 font-medium">주차 (기간)</th>
                <th className="px-4 py-3 font-medium">근무시간</th>
                <th className="px-4 py-3 font-medium">기본급</th>
                <th className="px-4 py-3 font-medium">주휴수당</th>
                <th className="px-4 py-3 font-medium">소계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rows.map((r) => (
                <tr key={r.weekLabel}>
                  <td className="px-4 py-3 font-medium">{r.weekLabel}</td>
                  <td className="px-4 py-3">{r.hours.toFixed(1)}h</td>
                  <td className="px-4 py-3">{Math.round(r.basePay).toLocaleString()}원</td>
                  <td className="px-4 py-3">
                    {r.hasRest ? (
                      <span>{Math.round(r.restPay).toLocaleString()}원</span>
                    ) : (
                      <span className="text-zinc-500">- (15h 미만)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{Math.round(r.total).toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 font-medium text-zinc-800">
              <tr>
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3">{totalHours.toFixed(1)}h</td>
                <td className="px-4 py-3">{Math.round(totalBasePay).toLocaleString()}원</td>
                <td className="px-4 py-3">{Math.round(totalRestPay).toLocaleString()}원</td>
                <td className="px-4 py-3">{Math.round(grandTotal).toLocaleString()}원</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
