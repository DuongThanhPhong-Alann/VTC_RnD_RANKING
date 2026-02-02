import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-hidden px-6 py-10 lg:px-10">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-40 -top-40 h-96 w-96 animate-blob rounded-full bg-purple-300 mix-blend-multiply blur-3xl filter"></div>
        <div className="animation-delay-2000 absolute -right-40 -top-40 h-96 w-96 animate-blob rounded-full bg-yellow-300 mix-blend-multiply blur-3xl filter"></div>
        <div className="animation-delay-4000 absolute -bottom-40 left-20 h-96 w-96 animate-blob rounded-full bg-pink-300 mix-blend-multiply blur-3xl filter"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="grid flex-1 items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 animate-fade-in-up">
            <p className="animate-shimmer bg-gradient-to-r from-zinc-400 via-zinc-500 to-zinc-400 bg-clip-text text-xs font-semibold uppercase tracking-[0.35em] text-transparent">
              Cổng đăng nhập
            </p>
            
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900 transition-all duration-300 hover:text-zinc-700">
              Truy cập bảng xếp hạng game{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  theo tuần, tháng.
                </span>
                <span className="absolute -bottom-1 left-0 h-3 w-full -skew-y-1 bg-gradient-to-r from-blue-200 to-purple-200 opacity-50"></span>
              </span>
            </h1>
            
            <p className="text-base text-zinc-600 leading-relaxed">
              Đăng nhập để tiếp tục theo dõi hiệu suất game và các báo cáo phân
              tích mới nhất từ hệ thống.
            </p>
            
            <div className="grid gap-3 text-sm text-zinc-500">
              {[
                "Thông tin luôn được đồng bộ theo thời gian thực.",
                "Chỉ hiển thị dữ liệu phù hợp với quyền truy cập.",
              ].map((text, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 transition-all duration-300 hover:translate-x-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-900 opacity-0 group-hover:opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-900 transition-colors group-hover:bg-blue-600"></span>
                  </span>
                  <span className="transition-colors group-hover:text-zinc-700">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="group relative animate-fade-in-up animation-delay-200">
            {/* Glowing effect */}
            <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 blur transition duration-500 group-hover:opacity-20"></div>
            
            {/* Main card */}
            <div className="relative rounded-[28px] border border-zinc-200 bg-white p-8 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_35px_80px_-50px_rgba(0,0,0,0.6)]">
              <header className="mb-6">
                <h2 className="text-2xl font-semibold text-zinc-900 transition-colors hover:text-blue-600">
                  Chào mừng bạn quay lại
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Vui lòng nhập thông tin đăng nhập để tiếp tục.
                </p>
              </header>

              <LoginForm />

              <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
                <span className="transition-colors hover:text-zinc-800">
                  Chỉ hỗ trợ đăng nhập nội bộ.
                </span>
                <Link 
                  className="group relative text-zinc-500 transition-colors hover:text-zinc-900" 
                  href="/account"
                >
                  <span className="relative z-10">Đổi mật khẩu</span>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </footer>
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
