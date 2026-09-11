import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isManager = user.role === "MANAGER";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">Weekly Reports</span>
            <Link
              href="/reports"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              My Reports
            </Link>
            {isManager && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Projects
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
