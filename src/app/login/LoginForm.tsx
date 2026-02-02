"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

interface LoginResponse {
  error?: string;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="group grid gap-2">
          <label
            htmlFor="identifier"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition-colors group-focus-within:text-zinc-900"
          >
            Tên đăng nhập hoặc email
          </label>
          <div className="relative">
            <input
              id="identifier"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm text-zinc-900 shadow-[0_1px_0_rgba(0,0,0,0.06)] outline-none transition-all duration-300 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:bg-zinc-100"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="abc123 hoặc abc123@gmail.com"
              autoComplete="username"
              disabled={loading}
              required
            />
            {identifier && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5 animate-scale-in text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="group grid gap-2">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition-colors group-focus-within:text-zinc-900"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm text-zinc-900 shadow-[0_1px_0_rgba(0,0,0,0.06)] outline-none transition-all duration-300 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:bg-zinc-100"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="animate-shake-fade-in overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50">
            <div className="flex items-start gap-3 px-4 py-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="animate-slide-in-up overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-start gap-3 px-4 py-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 animate-bounce text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="group relative mt-2 inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-4 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] focus:outline-none focus:ring-4 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none disabled:hover:translate-y-0"
          disabled={loading || !identifier || !password}
        >
          <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-0"></span>
          <span className="relative flex items-center gap-2">
            {loading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </span>
        </button>
      </form>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake-fade-in {
          0% {
            opacity: 0;
            transform: translateX(0);
          }
          10% {
            transform: translateX(-10px);
          }
          20% {
            transform: translateX(10px);
          }
          30% {
            transform: translateX(-10px);
          }
          40% {
            transform: translateX(10px);
          }
          50% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.animate-scale-in) {
          animation: scale-in 0.3s ease-out;
        }

        :global(.animate-shake-fade-in) {
          animation: shake-fade-in 0.6s ease-out;
        }

        :global(.animate-slide-in-up) {
          animation: slide-in-up 0.4s ease-out;
        }
      `}</style>
    </>
  );
}