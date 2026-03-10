"use client";

import { useActionState, useMemo, useState } from "react";
import { upsertAttendanceAction, type AttendanceActionState } from "./actions";
import { buildHalfHourOptions, calculateHoursWorked } from "@/lib/timeOnly";

type EmployeeOption = {
  id: string;
  name: string;
  defaultStart: string | null;
};

const initialState: AttendanceActionState = { ok: true };
const HALF_HOUR_OPTIONS = buildHalfHourOptions();

export default function AttendanceEntryForm({
  workDate,
  employees,
}: {
  workDate: string;
  employees: EmployeeOption[];
}) {
  const [state, formAction, pending] = useActionState(upsertAttendanceAction, initialState);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id ?? "");
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const [startTime, setStartTime] = useState<string>(selectedEmployee?.defaultStart ?? "09:00");
  const [endTime, setEndTime] = useState<string>("18:00");

  const endOptions = useMemo(() => {
    const startIndex = HALF_HOUR_OPTIONS.indexOf(startTime);
    return startIndex === -1 ? HALF_HOUR_OPTIONS : HALF_HOUR_OPTIONS.slice(startIndex + 1);
  }, [startTime]);

  const hoursPreview = useMemo(() => {
    try {
      return calculateHoursWorked(startTime, endTime);
    } catch {
      return null;
    }
  }, [startTime, endTime]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <h2 className="text-base font-semibold">근무기록 입력/수정</h2>
      <p className="mt-1 text-sm text-zinc-600">같은 직원/같은 날짜는 저장 시 자동으로 “수정” 처리됩니다.</p>

      <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="workDate" value={workDate} />

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="employeeId">
            직원
          </label>
          <select
            id="employeeId"
            name="employeeId"
            required
            value={selectedEmployeeId}
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedEmployeeId(nextId);
              const emp = employees.find((x) => x.id === nextId);
              if (emp?.defaultStart) setStartTime(emp.defaultStart);
            }}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="startTime">
            출근 시간
          </label>
          <select
            id="startTime"
            name="startTime"
            required
            value={startTime}
            onChange={(e) => {
              const next = e.target.value;
              setStartTime(next);
              const nextEndOptions = (() => {
                const idx = HALF_HOUR_OPTIONS.indexOf(next);
                return idx === -1 ? HALF_HOUR_OPTIONS : HALF_HOUR_OPTIONS.slice(idx + 1);
              })();
              if (!nextEndOptions.includes(endTime)) setEndTime(nextEndOptions[0] ?? endTime);
            }}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            {HALF_HOUR_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="endTime">
            퇴근 시간
          </label>
          <select
            id="endTime"
            name="endTime"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <div className="text-sm text-zinc-700">
            {hoursPreview === null ? (
              <span className="text-red-700">근무시간 계산 불가</span>
            ) : (
              <span>
                예상 근무시간: <span className="font-semibold">{hoursPreview.toFixed(1)}</span>시간
              </span>
            )}
          </div>
        </div>

        {state?.ok === false && (
          <div className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message ?? "저장에 실패했습니다."}
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
          {selectedEmployee?.defaultStart && (
            <span className="ml-3 text-xs text-zinc-500">
              기본 출근시간 적용: {selectedEmployee.defaultStart}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

