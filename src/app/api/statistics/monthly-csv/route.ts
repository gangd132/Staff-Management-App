import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { addMonths, format, parse, startOfMonth } from "date-fns";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "month는 YYYY-MM 형식이어야 합니다."),
});

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ month: url.searchParams.get("month") });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "잘못된 요청" }, { status: 400 });

  const baseMonth = parse(parsed.data.month, "yyyy-MM", new Date());
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

  const perEmployee = new Map<string, { totalHours: number; workDates: Set<string> }>();
  for (const e of employees) perEmployee.set(e.id, { totalHours: 0, workDates: new Set() });

  for (const a of attendances) {
    const bucket = perEmployee.get(a.employeeId);
    if (!bucket) continue;
    bucket.totalHours += Number(a.hoursWorked);
    bucket.workDates.add(format(a.workDate, "yyyy-MM-dd"));
  }

  const rows: string[] = [];
  rows.push(["month", "employeeName", "totalHours", "workDays", "hourlyWage", "estimatedWage"].join(","));

  for (const e of employees) {
    const bucket = perEmployee.get(e.id) ?? { totalHours: 0, workDates: new Set<string>() };
    const hourlyWage = e.hourlyWage ?? 0;
    const estimatedWage = e.hourlyWage ? bucket.totalHours * hourlyWage : 0;
    rows.push(
      [
        parsed.data.month,
        csvEscape(e.name),
        bucket.totalHours.toFixed(1),
        String(bucket.workDates.size),
        e.hourlyWage ? String(hourlyWage) : "",
        e.hourlyWage ? String(Math.round(estimatedWage)) : "",
      ].join(",")
    );
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-statistics-${parsed.data.month}.csv"`,
    },
  });
}

