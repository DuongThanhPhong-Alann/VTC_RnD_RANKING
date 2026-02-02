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
          htmlFor="current-password"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
        >
          Mật khẩu hiện tại
        </label>
        <input
          id="current-password"
          className="control"
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
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
        >
          Mật khẩu mới
        </label>
        <input
          id="new-password"
          className="control"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={6}
          disabled={loading}
          required
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Tối thiểu 6 ký tự
        </p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="confirm-password"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
        >
          Xác nhận mật khẩu mới
        </label>
        <input
          id="confirm-password"
          className="control"
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
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !isFormValid}
      >
        {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}