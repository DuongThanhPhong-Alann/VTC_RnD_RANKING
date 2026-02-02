import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="card p-6">
        <header className="mb-6">
          <p className="section-title">Đăng nhập</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Chào mừng bạn quay lại
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Vui lòng đăng nhập để xem thông tin xếp hạng game.
          </p>
        </header>

        <LoginForm />

        <footer className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
          <Link
            href="/register"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Chưa có tài khoản?
          </Link>
          <Link
            href="/forgot-password"
            className="font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Quên mật khẩu?
          </Link>
        </footer>
      </div>
    </div>
  );
}