import { ReactNode } from "react";
import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookies();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}

