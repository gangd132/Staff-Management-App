"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type ActionState } from "@/app/(auth)/actions";

const initialState: ActionState = { ok: true };
const PASSWORD_MIN_LENGTH = 10;

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">회원가입</h1>
      <p className="mt-1 text-sm text-zinc-600">사업장 정보를 입력하고 계정을 생성하세요.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="bizName">
            사업장명
          </label>
          <input
            id="bizName"
            name="bizName"
            required
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="예: 별다방 카페"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="admin@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            pattern={`^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d])\\S{${PASSWORD_MIN_LENGTH},}$`}
            title="비밀번호는 10자 이상이며, 영문/숫자/특수문자를 각각 1자 이상 포함하고 공백이 없어야 합니다."
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="10자 이상 (영문/숫자/특수문자 포함)"
          />
          <p className="text-xs text-zinc-600">
            10자 이상, 영문/숫자/특수문자 각각 1자 이상 포함 (공백 불가)
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="비밀번호를 한 번 더 입력해주세요"
          />
        </div>

        {state?.ok === false && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message ?? "회원가입에 실패했습니다."}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "생성 중..." : "계정 생성"}
        </button>
      </form>

      <div className="mt-6 text-sm text-zinc-700">
        이미 계정이 있으신가요?{" "}
        <Link className="font-medium text-zinc-900 underline-offset-4 hover:underline" href="/login">
          로그인
        </Link>
      </div>
    </div>
  );
}

