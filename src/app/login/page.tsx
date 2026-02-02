import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="card p-6">
        <div className="mb-4">
          <p className="section-title">ĐĂNG NHẬP</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            CHÀO MỪNG BẠN QUAY LẠI
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Vui lòng đăng nhập để xem thông tin xếp hạng game.
          </p>
        </div>
        <LoginForm />
        <div className="mt-4 flex items-center justify-end text-sm">
          <a
            href="/account"
            className="font-semibold text-blue-700 hover:text-blue-800 dark:text-sky-300 dark:hover:text-sky-200"
          >
            Đổi mật khẩu
          </a>
        </div>
      </div>
    </div>
  );
}
