type Health = {
  status: string;
  database: { state: string; name: string };
  timestamp: string;
};

async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();
  const dbOk = health?.database.state === "connected";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Weekly Report Generator
        </h1>
        <p className="mt-1 text-sm text-slate-500">Step 1 — foundation check</p>

        <div className="mt-6 space-y-3">
          <StatusRow label="Frontend (Next.js)" ok={true} />
          <StatusRow label="Backend (NestJS)" ok={health !== null} />
          <StatusRow label="Database (MongoDB)" ok={dbOk} />
        </div>

        {dbOk && (
          <p className="mt-6 text-xs text-slate-400">
            Connected to database: {health.database.name}
          </p>
        )}
      </div>
    </main>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        {ok ? "Connected" : "Down"}
      </span>
    </div>
  );
}
