"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginResponse {
  error?: string;
}

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data: LoginResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Đăng nhập thất bại. Vui lòng thử lại.");
        setLoading(false);
        return;
      }

      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 600);
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label
          htmlFor="identifier"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
        >
          Tên đăng nhập hoặc email
        </label>
        <input
          id="identifier"
          className="control"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="abc123 hoặc abc123@gmail.com"
          autoComplete="username"
          disabled={loading}
          required
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
        >
          Mật khẩu
        </label>
        <input
          id="password"
          className="control"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !identifier || !password}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}