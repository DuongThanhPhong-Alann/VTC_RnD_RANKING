import Image from "next/image";
import Link from "next/link";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default function AccountPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
      <div className="mt-10 grid flex-1 items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white">
            Bảo mật tài khoản
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white">
            Cập nhật mật khẩu để bảo vệ dữ liệu nội bộ.
          </h1>
          <p className="text-base text-white">
            Xác thực thông tin hiện tại và đặt mật khẩu mới để tiếp tục làm
            việc an toàn.
          </p>
          <div className="grid gap-3 text-sm text-white">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span>Khuyến nghị thay đổi mật khẩu định kỳ.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span>Không chia sẻ mật khẩu cho bất kỳ ai.</span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_25px_60px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logowweb.png"
              alt="Game Ranking"
              width={340}
              height={192}
              priority
              unoptimized
              className="h-24 w-auto select-none object-contain"
            />
          </div>
          <header className="mb-6">
            <h2 className="text-center text-2xl font-semibold text-white">
              Đổi mật khẩu
            </h2>
          </header>

          <ChangePasswordForm />

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/80">
            <span>Đã nhớ lại mật khẩu?</span>
            <Link className="font-semibold text-white" href="/login">
              Quay lại đăng nhập
            </Link>
          </footer>
        </section>
      </div>
    </div>
  );
}
