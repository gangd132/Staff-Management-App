import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSessionFromCookies();
  redirect(session ? "/dashboard" : "/login");
}
