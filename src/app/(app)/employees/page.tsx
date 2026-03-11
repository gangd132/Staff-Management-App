import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";
import EmployeeCreateForm from "@/app/(app)/employees/EmployeeCreateForm";
import EmployeeRow from "@/app/(app)/employees/EmployeeRow";
import { dateToTimeString } from "@/lib/timeOnly";

export default async function EmployeesPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const employees = await prisma.employee.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      defaultStart: true,
      color: true,
      hourlyWage: true,
      restDayHours: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">직원 관리</h1>
        <p className="mt-1 text-sm text-zinc-600">직원을 등록하고 기본 출근시간/색상/시급을 관리하세요.</p>
      </div>

      <EmployeeCreateForm />

      <div className="space-y-3">
        {employees.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            등록된 직원이 없습니다. 먼저 직원을 추가해주세요.
          </div>
        ) : (
          employees.map((e: any) => (
            <EmployeeRow
              key={e.id}
              employeeId={e.id}
              name={e.name}
              defaultStart={e.defaultStart ? dateToTimeString(e.defaultStart) : null}
              color={e.color}
              hourlyWage={e.hourlyWage}
              restDayHours={e.restDayHours}
            />
          ))
        )}
      </div>
    </div>
  );
}

