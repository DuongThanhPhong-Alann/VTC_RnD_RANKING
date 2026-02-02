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
    "h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-[0_1px_0_rgba(0,0,0,0.06)] outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <label
          htmlFor="identifier"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
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
          className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
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
          className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
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
        <p className="text-xs text-zinc-500">Tối thiểu 6 ký tự</p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="confirm-password"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
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
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
        disabled={loading || !isFormValid}
      >
        {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
