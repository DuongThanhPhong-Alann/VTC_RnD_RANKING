import { ChangePasswordForm } from "./ChangePasswordForm";

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="card p-6">
        <p className="section-title">Tài khoản</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Đổi mật khẩu
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Cập nhật mật khẩu để bảo mật tài khoản.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
