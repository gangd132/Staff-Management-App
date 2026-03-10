"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EmployeeOption = { id: string; name: string };

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
};

export default function CalendarClient({ employees }: { employees: EmployeeOption[] }) {
  const router = useRouter();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  const queryString = useMemo(() => {
    if (!range) return null;
    const params = new URLSearchParams({ start: range.start, end: range.end });
    if (selectedEmployeeId) params.set("employeeId", selectedEmployeeId);
    return params.toString();
  }, [range, selectedEmployeeId]);

  useEffect(() => {
    if (!queryString) return;
    const controller = new AbortController();

    fetch(`/api/attendances?${queryString}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("근무기록을 불러오지 못했습니다.");
        return (await res.json()) as CalendarEvent[];
      })
      .then((data) => setEvents(data))
      .catch(() => setEvents([]));

    return () => controller.abort();
  }, [queryString]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">직원 필터</div>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="">전체 직원</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-zinc-500">
          날짜를 클릭하면 해당 날짜의 <span className="font-semibold">근무 입력</span>으로 이동합니다.
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          events={events}
          datesSet={(arg) => {
            setRange({
              start: arg.startStr,
              end: arg.endStr,
            });
          }}
          dateClick={(arg) => {
            router.push(`/attendance?date=${arg.dateStr}`);
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
        />
      </div>
    </div>
  );
}

