"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/(auth)/actions";

const initialState: ActionState = { ok: true };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">로그인</h1>
      <p className="mt-1 text-sm text-zinc-600">직원 시간관리 서비스를 사용하려면 로그인해주세요.</p>

      <form action={formAction} className="mt-6 space-y-4">
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
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="********"
          />
        </div>

        {state?.ok === false && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message ?? "로그인에 실패했습니다."}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div className="mt-6 text-sm text-zinc-700">
        계정이 없으신가요?{" "}
        <Link className="font-medium text-zinc-900 underline-offset-4 hover:underline" href="/register">
          회원가입
        </Link>
      </div>
    </div>
  );
}

