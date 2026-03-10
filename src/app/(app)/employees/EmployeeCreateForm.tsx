"use client";

import { useActionState } from "react";
import { buildHalfHourOptions } from "@/lib/timeOnly";
import { createEmployeeAction, type EmployeeActionState } from "@/app/(app)/employees/actions";

const initialState: EmployeeActionState = { ok: true };
const timeOptions = buildHalfHourOptions();

export default function EmployeeCreateForm() {
  const [state, formAction, pending] = useActionState(createEmployeeAction, initialState);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <h2 className="text-base font-semibold">직원 추가</h2>

      <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="name">
            이름
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="예: 김철수"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="defaultStart">
            기본 출근시간(선택)
          </label>
          <select
            id="defaultStart"
            name="defaultStart"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            defaultValue=""
          >
            <option value="">선택 안 함</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="color">
            색상 태그(선택)
          </label>
          <input
            id="color"
            name="color"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="#22c55e"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="hourlyWage">
            시급(선택)
          </label>
          <input
            id="hourlyWage"
            name="hourlyWage"
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="예: 12000"
          />
        </div>

        {state?.ok === false && (
          <div className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message ?? "직원 추가에 실패했습니다."}
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "추가 중..." : "직원 추가"}
          </button>
        </div>
      </form>
    </div>
  );
}

