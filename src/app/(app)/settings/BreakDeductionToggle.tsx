"use client";

import { useActionState } from "react";
import { updateSettingsAction, type SettingsActionState } from "./actions";

const initialState: SettingsActionState = { ok: true };

export default function BreakDeductionToggle({
  autoBreakDeduction,
}: {
  autoBreakDeduction: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-semibold">근무 입력 설정</h2>
      <p className="mt-1 text-sm text-zinc-500">
        근무 기록 저장 시 휴게시간 자동 공제 여부를 설정합니다.
      </p>

      <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p className="font-medium text-zinc-800">현재 공제 기준 (켜져 있을 때 적용)</p>
        <ul className="mt-2 space-y-1 text-zinc-600">
          <li>· 4시간 이상 ~ 8시간 미만 근무 시 <span className="font-medium">0.5시간</span> 공제</li>
          <li>· 8시간 이상 근무 시 <span className="font-medium">1시간</span> 공제</li>
        </ul>
      </div>

      <form action={formAction} className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">자동 휴게시간 공제</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {autoBreakDeduction
                ? "현재 켜짐 — 근무 저장 시 휴게시간이 자동 공제됩니다."
                : "현재 꺼짐 — 입력한 시간 그대로 저장됩니다."}
            </p>
          </div>

          {/* 토글 스위치 */}
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              name="autoBreakDeductionToggle"
              defaultChecked={autoBreakDeduction}
              onChange={(e) => {
                const form = e.currentTarget.closest("form") as HTMLFormElement;
                const hidden = form.querySelector<HTMLInputElement>(
                  "input[name='autoBreakDeduction']"
                );
                if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
                form.requestSubmit();
              }}
            />
            <input type="hidden" name="autoBreakDeduction" defaultValue={autoBreakDeduction ? "true" : "false"} />
            <div className="h-6 w-11 rounded-full bg-zinc-200 peer-checked:bg-zinc-900 transition-colors" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        {state?.ok === false && (
          <p className="mt-3 text-sm text-red-600">{state.message}</p>
        )}
        {state?.ok === true && state?.message && (
          <p className="mt-3 text-sm text-green-700">{state.message}</p>
        )}
      </form>
    </div>
  );
}
