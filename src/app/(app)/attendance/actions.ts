"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  calculateHoursWorked,
  isValidHalfHourTimeString,
  timeStringToDate,
} from "@/lib/timeOnly";
import { revalidatePath } from "next/cache";

export type AttendanceActionState = { ok: boolean; message?: string };

const DateSchema = z
  .string()
  .min(1)
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)");

const UpsertAttendanceSchema = z.object({
  workDate: DateSchema,
  employeeId: z.string().min(1, "직원을 선택해주세요."),
  startTime: z.string().refine(isValidHalfHourTimeString, "출근시간은 30분 단위만 가능합니다."),
  endTime: z.string().refine(isValidHalfHourTimeString, "퇴근시간은 30분 단위만 가능합니다."),
});

export async function upsertAttendanceAction(
  _: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const parsed = UpsertAttendanceSchema.safeParse({
    workDate: formData.get("workDate"),
    employeeId: formData.get("employeeId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { workDate, employeeId, startTime, endTime } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId: session.userId },
    select: { id: true },
  });
  if (!employee) return { ok: false, message: "직원을 찾을 수 없습니다." };

  let hoursWorked: number;
  try {
    hoursWorked = calculateHoursWorked(startTime, endTime);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "근무시간 계산에 실패했습니다." };
  }

  try {
    await prisma.attendance.upsert({
      where: { employeeId_workDate: { employeeId, workDate: new Date(workDate) } },
      update: {
        startTime: timeStringToDate(startTime),
        endTime: timeStringToDate(endTime),
        hoursWorked,
      },
      create: {
        employeeId,
        workDate: new Date(workDate),
        startTime: timeStringToDate(startTime),
        endTime: timeStringToDate(endTime),
        hoursWorked,
      },
    });
  } catch {
    return { ok: false, message: "근무기록 저장에 실패했습니다." };
  }

  revalidatePath("/attendance");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deleteAttendanceAction(attendanceId: string) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId, employee: { userId: session.userId } },
    select: { id: true },
  });
  if (!attendance) return;

  await prisma.attendance.delete({ where: { id: attendanceId } });
  revalidatePath("/attendance");
  revalidatePath("/calendar");
}

