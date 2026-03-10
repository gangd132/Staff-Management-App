import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/(auth)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/calendar", label: "달력" },
  { href: "/employees", label: "직원 관리" },
  { href: "/attendance", label: "근무 입력" },
  { href: "/biweekly", label: "2주 집계" },
  { href: "/statistics", label: "월별 통계" },
  { href: "/settings", label: "설정" },
] as const;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { bizName: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl gap-6 px-4 py-6">
        <aside className="w-64 shrink-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-zinc-500">사업장</div>
            <div className="mt-1 text-base font-semibold">{user.bizName}</div>
            <div className="mt-1 text-xs text-zinc-500">{user.email}</div>

            <nav className="mt-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action={logoutAction} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                로그아웃
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

