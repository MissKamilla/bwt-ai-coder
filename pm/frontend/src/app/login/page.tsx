export default function LoginPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="w-full rounded-3xl border border-[var(--stroke)] bg-white/90 p-10 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
          Sign in
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--navy-dark)]">
          Kanban Studio
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--gray-text)]">
          Use <code className="font-semibold">user</code> /{" "}
          <code className="font-semibold">password</code> for the MVP demo.
        </p>
        <form method="post" action="/login" className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Username
            </span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-base text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-base text-[var(--navy-dark)] outline-none focus:border-[var(--primary-blue)]"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-[var(--purple-secondary)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}