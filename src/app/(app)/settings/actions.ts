"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type SettingsActionState = { ok: boolean; message?: string };

const UpdateSettingsSchema = z.object({
  autoBreakDeduction: z.enum(["true", "false"]),
});

export async function updateSettingsAction(
  _: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const parsed = UpdateSettingsSchema.safeParse({
    autoBreakDeduction: formData.get("autoBreakDeduction"),
  });

  if (!parsed.success) {
    return { ok: false, message: "입력값이 올바르지 않습니다." };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      autoBreakDeduction: parsed.data.autoBreakDeduction === "true",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/attendance");
  return { ok: true, message: "설정이 저장되었습니다." };
}
