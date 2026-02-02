"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/";
  const redirectPath = nextPath === "/login" ? "/" : nextPath;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "ĐĂNG NHẬP that bai");
      setLoading(false);
      return;
    }

    setSuccess("ĐĂNG NHẬP thanh cong. Dang chuyen huong...");
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Tên đăng nhập hoặc email
        </label>
        <input
          className="control"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="abc123 hoặc abc123@gmail.com "
          autoComplete="username"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Mat khau
        </label>
        <input
          className="control"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {success}
        </p>
      ) : null}

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
      </button>
    </form>
  );
}
