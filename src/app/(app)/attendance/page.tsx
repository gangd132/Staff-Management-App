import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import AttendanceEntryForm from "@/app/(app)/attendance/AttendanceEntryForm";
import { dateToTimeString } from "@/lib/timeOnly";
import { deleteAttendanceAction } from "@/app/(app)/attendance/actions";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { date } = await searchParams;
  const today = new Date();
  const workDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today.toISOString().slice(0, 10);

  const employees = await prisma.employee.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, defaultStart: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: { employee: { userId: session.userId }, workDate: new Date(workDate) },
    orderBy: [{ employee: { name: "asc" } }],
    select: {
      id: true,
      startTime: true,
      endTime: true,
      hoursWorked: true,
      employee: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">근무 입력</h1>
        <p className="mt-1 text-sm text-zinc-600">날짜/직원/출퇴근 시간을 30분 단위로 입력하세요.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="date">
              날짜 선택
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={workDate}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            조회
          </button>
        </form>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          먼저 <span className="font-semibold">직원 관리</span>에서 직원을 추가해주세요.
        </div>
      ) : (
        <AttendanceEntryForm
          workDate={workDate}
          employees={employees.map((e) => ({
            id: e.id,
            name: e.name,
            defaultStart: e.defaultStart ? dateToTimeString(e.defaultStart) : null,
          }))}
        />
      )}

      <div className="rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">해당 날짜 기록</h2>
          <div className="text-xs text-zinc-500">{workDate}</div>
        </div>

        {attendances.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-600">등록된 근무기록이 없습니다.</div>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200">
            {attendances.map((a) => (
              <li key={a.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">{a.employee.name}</span>{" "}
                    <span className="text-zinc-600">
                      {dateToTimeString(a.startTime)} ~ {dateToTimeString(a.endTime)}
                    </span>{" "}
                    <span className="text-zinc-600">({Number(a.hoursWorked).toFixed(1)}시간)</span>
                  </div>
                  <form action={deleteAttendanceAction.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs hover:bg-zinc-50"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

