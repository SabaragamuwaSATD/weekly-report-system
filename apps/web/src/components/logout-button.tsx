"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-api";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-slate-500 hover:text-slate-900"
    >
      Log out
    </button>
  );
}
