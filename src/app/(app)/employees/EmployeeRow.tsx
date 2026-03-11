"use client";

import { useActionState, useState } from "react";
import { buildHalfHourOptions } from "@/lib/timeOnly";
import { deleteEmployeeAction, updateEmployeeAction, type EmployeeActionState } from "@/app/(app)/employees/actions";

type Props = {
  employeeId: string;
  name: string;
  defaultStart: string | null;
  color: string | null;
  hourlyWage: number | null;
  restDayHours: number | null;
};

const initialState: EmployeeActionState = { ok: true };
const timeOptions = buildHalfHourOptions();

export default function EmployeeRow({
  employeeId,
  name,
  defaultStart,
  color,
  hourlyWage,
  restDayHours,
}: Props) {
  const [state, formAction, pending] = useActionState(updateEmployeeAction, initialState);
  const [selectedColorValue, setSelectedColorValue] = useState<string>(color ?? "");
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
          <div className="text-sm font-semibold">{name}</div>
        </div>

        <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 shrink-0 rounded-xl border border-zinc-200"
              style={{ backgroundColor: selectedColorValue || "#e4e4e7" }}
              aria-hidden
            />
            <input
              id={`color-${employeeId}`}
              type="color"
              className="h-9 w-16 cursor-pointer rounded-md border border-zinc-200 bg-white px-1 py-1"
              value={selectedColorValue || "#22c55e"}
              onChange={(e) => setSelectedColorValue(e.target.value)}
            />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
            <input
              id={`color-none-${employeeId}`}
              type="checkbox"
              className="h-3 w-3 rounded border-zinc-300"
              checked={!selectedColorValue}
              onChange={(e) => {
                setSelectedColorValue(e.target.checked ? "" : "#22c55e");
              }}
            />
            <label htmlFor={`color-none-${employeeId}`} className="cursor-pointer select-none">
              색상 사용 안 함
            </label>
          </div>
          <input type="hidden" name="color" value={selectedColorValue} />
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

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={`restDayHours-${employeeId}`}>
            주휴수당 기준 시간(선택)
          </label>
          <input
            id={`restDayHours-${employeeId}`}
            name="restDayHours"
            type="number"
            min={0}
            max={24}
            step={1}
            defaultValue={restDayHours ?? ""}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="8"
          />
          <p className="text-xs text-zinc-500">주 15시간 이상 시 하루 일당으로 지급할 시간 수</p>
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

