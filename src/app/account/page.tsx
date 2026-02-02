import Link from "next/link";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default function AccountPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
      <div className="mt-10 grid flex-1 items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">
            Bảo mật tài khoản
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900">
            Cập nhật mật khẩu để bảo vệ dữ liệu nội bộ.
          </h1>
          <p className="text-base text-zinc-600">
            Xác thực thông tin hiện tại và đặt mật khẩu mới để tiếp tục làm
            việc an toàn.
          </p>
          <div className="grid gap-3 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-900" />
              <span>Khuyến nghị thay đổi mật khẩu định kỳ.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-900" />
              <span>Không chia sẻ mật khẩu cho bất kỳ ai.</span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-8 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.5)]">
          <header className="mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900">
              Đổi mật khẩu
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Nhập thông tin tài khoản để cập nhật mật khẩu mới.
            </p>
          </header>

          <ChangePasswordForm />

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
            <span>Đã nhớ lại mật khẩu?</span>
            <Link className="font-semibold text-zinc-900" href="/login">
              Quay lại đăng nhập
            </Link>
          </footer>
        </section>
      </div>
    </div>
  );
}
