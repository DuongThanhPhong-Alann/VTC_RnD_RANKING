"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError("Mat khau moi phai toi thieu 6 ky tu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mat khau xac nhan khong khop");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Đổi mật khẩu thất bại");
      setLoading(false);
      return;
    }

    setMessage("Đổi mật khẩu thành công");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
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
          Mật khẩu hiện tại
        </label>
        <input
          className="control"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Mật khẩu mới
        </label>
        <input
          className="control"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Xác nhận mật khẩu mới
        </label>
        <input
          className="control"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Đang đổi" : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
