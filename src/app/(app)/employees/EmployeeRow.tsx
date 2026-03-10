"use client";

import { useActionState } from "react";
import { buildHalfHourOptions } from "@/lib/timeOnly";
import {
  toggleEmployeeActiveAction,
  deleteEmployeeAction,
  updateEmployeeAction,
  type EmployeeActionState,
} from "@/app/(app)/employees/actions";

type Props = {
  employeeId: string;
  name: string;
  defaultStart: string | null;
  color: string | null;
  hourlyWage: number | null;
  isActive: boolean;
};

const initialState: EmployeeActionState = { ok: true };
const timeOptions = buildHalfHourOptions();

export default function EmployeeRow({
  employeeId,
  name,
  defaultStart,
  color,
  hourlyWage,
  isActive,
}: Props) {
  const [state, formAction, pending] = useActionState(updateEmployeeAction, initialState);
  const toggleAction = toggleEmployeeActiveAction.bind(null, employeeId);
  const deleteAction = deleteEmployeeAction.bind(null, employeeId);

  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full border border-zinc-200"
            style={{ backgroundColor: color ?? "#e4e4e7" }}
            aria-hidden
          />
          <div className="text-sm font-semibold">
            {name}{" "}
            {!isActive && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">비활성</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form action={toggleAction}>
            <button
              type="submit"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs hover:bg-zinc-50"
            >
              {isActive ? "비활성화" : "활성화"}
            </button>
          </form>
          <form
            action={async () => {
              const isConfirmed = window.confirm("이 직원을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
              if (!isConfirmed) return;
              await deleteAction();
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              삭제
            </button>
          </form>
        </div>
      </div>

      <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="employeeId" value={employeeId} />

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`name-${employeeId}`}>
            이름
          </label>
          <input
            id={`name-${employeeId}`}
            name="name"
            required
            defaultValue={name}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`defaultStart-${employeeId}`}>
            기본 출근시간(선택)
          </label>
          <select
            id={`defaultStart-${employeeId}`}
            name="defaultStart"
            defaultValue={defaultStart ?? ""}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
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
          <label className="text-sm font-medium" htmlFor={`color-${employeeId}`}>
            색상 태그(선택)
          </label>
          <input
            id={`color-${employeeId}`}
            name="color"
            defaultValue={color ?? ""}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="#22c55e"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`hourlyWage-${employeeId}`}>
            시급(선택)
          </label>
          <input
            id={`hourlyWage-${employeeId}`}
            name="hourlyWage"
            defaultValue={hourlyWage ?? ""}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="예: 12000"
          />
        </div>

        {state?.ok === false && (
          <div className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message ?? "수정에 실패했습니다."}
          </div>
        )}

        <div className="sm:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
          <div className="text-xs text-zinc-500">시간은 30분 단위만 저장됩니다.</div>
        </div>
      </form>
    </div>
  );
}

