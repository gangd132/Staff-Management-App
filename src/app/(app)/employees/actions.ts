"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import { isValidHalfHourTimeString, timeStringToDate } from "@/lib/timeOnly";
import { revalidatePath } from "next/cache";

export type EmployeeActionState = { ok: boolean; message?: string };

const CreateEmployeeSchema = z.object({
  name: z.string().min(1, "직원 이름을 입력해주세요."),
  defaultStart: z
    .string()
    .optional()
    .refine((v) => !v || isValidHalfHourTimeString(v), "기본 출근시간은 30분 단위만 가능합니다."),
  color: z
    .string()
    .optional()
    .refine((v) => !v || /^#([0-9a-fA-F]{6})$/.test(v), "색상은 #RRGGBB 형식이어야 합니다."),
  hourlyWage: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0), "시급은 0 이상의 숫자여야 합니다."),
});

export async function createEmployeeAction(
  _: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const parsed = CreateEmployeeSchema.safeParse({
    name: formData.get("name"),
    defaultStart: formData.get("defaultStart") || undefined,
    color: formData.get("color") || undefined,
    hourlyWage: formData.get("hourlyWage") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { name, defaultStart, color, hourlyWage } = parsed.data;

  await prisma.employee.create({
    data: {
      userId: session.userId,
      name,
      defaultStart: defaultStart ? timeStringToDate(defaultStart) : null,
      color: color || null,
      hourlyWage: hourlyWage ? Number(hourlyWage) : null,
    },
  });

  revalidatePath("/employees");
  return { ok: true };
}

const UpdateEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1, "직원 이름을 입력해주세요."),
  defaultStart: z
    .string()
    .optional()
    .refine((v) => !v || isValidHalfHourTimeString(v), "기본 출근시간은 30분 단위만 가능합니다."),
  color: z
    .string()
    .optional()
    .refine((v) => !v || /^#([0-9a-fA-F]{6})$/.test(v), "색상은 #RRGGBB 형식이어야 합니다."),
  hourlyWage: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0), "시급은 0 이상의 숫자여야 합니다."),
});

export async function updateEmployeeAction(
  _: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const parsed = UpdateEmployeeSchema.safeParse({
    employeeId: formData.get("employeeId"),
    name: formData.get("name"),
    defaultStart: formData.get("defaultStart") || undefined,
    color: formData.get("color") || undefined,
    hourlyWage: formData.get("hourlyWage") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { employeeId, name, defaultStart, color, hourlyWage } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId: session.userId },
    select: { id: true },
  });
  if (!employee) return { ok: false, message: "직원을 찾을 수 없습니다." };

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      name,
      defaultStart: defaultStart ? timeStringToDate(defaultStart) : null,
      color: color || null,
      hourlyWage: hourlyWage ? Number(hourlyWage) : null,
    },
  });

  revalidatePath("/employees");
  return { ok: true };
}

export async function toggleEmployeeActiveAction(employeeId: string) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId: session.userId },
    select: { id: true, isActive: true },
  });
  if (!employee) return;

  await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive: !employee.isActive },
  });

  revalidatePath("/employees");
}

export async function deleteEmployeeAction(employeeId: string) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId: session.userId },
    select: { id: true },
  });
  if (!employee) {
    return;
  }

  await prisma.employee.delete({
    where: { id: employeeId },
  });

  revalidatePath("/employees");
}

