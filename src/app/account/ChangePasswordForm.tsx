"use client";

import { useState, type FormEvent } from "react";

interface ChangePasswordResponse {
  error?: string;
}

export function ChangePasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    // Validation
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, currentPassword, newPassword }),
      });

      const data: ChangePasswordResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Đổi mật khẩu thất bại. Vui lòng thử lại.");
        setLoading(false);
        return;
      }

      setMessage("Đổi mật khẩu thành công!");
      setIdentifier("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    identifier && currentPassword && newPassword && confirmPassword;

  const inputClassName =
    "h-11 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-sm text-white shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-white/50 focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:bg-white/10 placeholder:text-white/50";

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <label
          htmlFor="identifier"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80"
        >
          Tên đăng nhập hoặc email
        </label>
        <input
          id="identifier"
          className={inputClassName}
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
          htmlFor="current-password"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80"
        >
          Mật khẩu hiện tại
        </label>
        <input
          id="current-password"
          className={inputClassName}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
          required
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="new-password"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80"
        >
          Mật khẩu mới
        </label>
        <input
          id="new-password"
          className={inputClassName}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={6}
          disabled={loading}
          required
        />
        <p className="text-xs text-white/70">Tối thiểu 6 ký tự</p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="confirm-password"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80"
        >
          Xác nhận mật khẩu mới
        </label>
        <input
          id="confirm-password"
          className={inputClassName}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-rose-300/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/40 disabled:shadow-none"
        disabled={loading || !isFormValid}
      >
        {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
