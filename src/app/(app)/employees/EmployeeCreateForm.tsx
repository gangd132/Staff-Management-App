"use client";

import { useActionState } from "react";
import { useState } from "react";
import { buildHalfHourOptions } from "@/lib/timeOnly";
import { createEmployeeAction, type EmployeeActionState } from "@/app/(app)/employees/actions";

const initialState: EmployeeActionState = { ok: true };
const timeOptions = buildHalfHourOptions();

export default function EmployeeCreateForm() {
  const [state, formAction, pending] = useActionState(createEmployeeAction, initialState);
  const [selectedColorValue, setSelectedColorValue] = useState<string>("");

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
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 shrink-0 rounded-xl border border-zinc-200"
              style={{ backgroundColor: selectedColorValue || "#e4e4e7" }}
              aria-hidden
            />
            <input
              id="color"
              type="color"
              className="h-9 w-16 cursor-pointer rounded-md border border-zinc-200 bg-white px-1 py-1"
              value={selectedColorValue || "#22c55e"}
              onChange={(e) => setSelectedColorValue(e.target.value)}
            />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
            <input
              id="color-none"
              type="checkbox"
              className="h-3 w-3 rounded border-zinc-300"
              checked={!selectedColorValue}
              onChange={(e) => {
                setSelectedColorValue(e.target.checked ? "" : "#22c55e");
              }}
            />
            <label htmlFor="color-none" className="cursor-pointer select-none">
              색상 사용 안 함
            </label>
          </div>
          <input type="hidden" name="color" value={selectedColorValue} />
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

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="restDayHours">
            주휴수당 기준 시간(선택)
          </label>
          <input
            id="restDayHours"
            name="restDayHours"
            type="number"
            min={0}
            max={24}
            step={1}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="8"
          />
          <p className="text-xs text-zinc-500">주 15시간 이상 근무 시 하루 일당으로 지급할 시간 수 (예: 8 = 8시간분)</p>
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

