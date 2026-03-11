import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { dateToTimeString } from "@/lib/timeOnly";

const QuerySchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  employeeId: z.string().optional(),
});

function toYyyyMmDd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function combineDateAndTime(workDate: Date, timeOnly: Date) {
  const datePart = toYyyyMmDd(workDate);
  const timePart = dateToTimeString(timeOnly);
  return `${datePart}T${timePart}:00`;
}

/** 퇴근 시각이 출근 시각보다 이전이면 자정 넘김(다음날 퇴근)으로 간주 */
function isOvernightShift(startTime: Date, endTime: Date) {
  const startMs = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const endMs = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
  return endMs <= startMs;
}

function addOneDay(date: Date) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function GET(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    start: url.searchParams.get("start") ?? "",
    end: url.searchParams.get("end") ?? "",
    employeeId: url.searchParams.get("employeeId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "쿼리 파라미터가 올바르지 않습니다." }, { status: 400 });
  }

  const start = new Date(parsed.data.start);
  const end = new Date(parsed.data.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "날짜 범위가 올바르지 않습니다." }, { status: 400 });
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      employee: {
        userId: session.userId,
        ...(parsed.data.employeeId ? { id: parsed.data.employeeId } : {}),
      },
      workDate: { gte: start, lt: end },
    },
    select: {
      id: true,
      workDate: true,
      startTime: true,
      endTime: true,
      hoursWorked: true,
      employee: { select: { name: true, color: true } },
    },
  });

  const events = attendances.map((a) => {
    const endDate = isOvernightShift(a.startTime, a.endTime)
      ? addOneDay(a.workDate)
      : a.workDate;
    return {
      id: a.id,
      title: `${a.employee.name} ${dateToTimeString(a.startTime)}~${dateToTimeString(a.endTime)} (${Number(
        a.hoursWorked
      ).toFixed(1)}h)`,
      start: combineDateAndTime(a.workDate, a.startTime),
      end: combineDateAndTime(endDate, a.endTime),
      backgroundColor: a.employee.color ?? undefined,
      borderColor: a.employee.color ?? undefined,
    };
  });

  return NextResponse.json(events);
}

