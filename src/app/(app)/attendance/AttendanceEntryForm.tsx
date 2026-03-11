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

  // 자정 넘김 근무(예: 18:00~02:00)를 허용하므로 퇴근 시간은 전체 옵션 제공
  const endOptions = HALF_HOUR_OPTIONS;

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
          <div className="flex gap-2">
            <input
              id="startTime"
              name="startTime"
              type="text"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="09:00"
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <select
              aria-label="출근 시간 빠른 선택"
              value={HALF_HOUR_OPTIONS.includes(startTime) ? startTime : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setStartTime(v);
              }}
              className="w-24 shrink-0 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              <option value="">선택</option>
              {HALF_HOUR_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500">직접 입력 또는 선택 (30분 단위, 예: 09:00, 18:30)</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="endTime">
            퇴근 시간
          </label>
          <div className="flex gap-2">
            <input
              id="endTime"
              name="endTime"
              type="text"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="18:00"
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <select
              aria-label="퇴근 시간 빠른 선택"
              value={endOptions.includes(endTime) ? endTime : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setEndTime(v);
              }}
              className="w-24 shrink-0 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              <option value="">선택</option>
              {endOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500">직접 입력 또는 선택 (30분 단위, 자정 넘김 가능 예: 02:00)</p>
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

