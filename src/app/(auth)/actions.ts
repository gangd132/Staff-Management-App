"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { validatePasswordPolicy } from "@/lib/passwordPolicy";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { redirect } from "next/navigation";

const RegisterSchema = z
  .object({
    bizName: z.string().min(1, "사업장명을 입력해주세요."),
    email: z.string().email("이메일 형식이 올바르지 않습니다."),
    password: z.string().min(1, "비밀번호를 입력해주세요."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    const policyResult = validatePasswordPolicy(password);
    if (!policyResult.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: policyResult.message,
        path: ["password"],
      });
    }

    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
        path: ["confirmPassword"],
      });
    }
  });

const LoginSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type ActionState = {
  ok: boolean;
  message?: string;
};

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = RegisterSchema.safeParse({
    bizName: formData.get("bizName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { bizName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "이미 가입된 이메일입니다." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { bizName, email, passwordHash },
    select: { id: true, email: true },
  });

  await setSessionCookie({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await setSessionCookie({ userId: user.id, email: user.email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

