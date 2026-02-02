import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-hidden px-6 py-10 lg:px-10">
      {/* Content */}
      <div className="relative z-10">
        <div className="grid flex-1 items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 animate-fade-in-up">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white">
              Cổng đăng nhập
            </p>
            
            <h1 className="text-4xl font-semibold leading-tight text-white">
              Truy cập bảng xếp hạng game theo tuần, tháng.
            </h1>
            
            <p className="text-base text-white leading-relaxed">
              Đăng nhập để tiếp tục theo dõi hiệu suất game và các báo cáo phân
              tích mới nhất từ hệ thống.
            </p>
            
            <div className="grid gap-3 text-sm text-white">
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
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-0 group-hover:opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white transition-colors group-hover:bg-blue-200"></span>
                  </span>
                  <span className="transition-colors group-hover:text-white/80">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="group relative animate-fade-in-up animation-delay-200">
            <div className="absolute -inset-0.5 rounded-[28px] bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 blur transition duration-500 group-hover:opacity-20"></div>

            <div className="relative rounded-[28px] border border-white/10 bg-white/5 p-8 text-white shadow-[0_25px_60px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_35px_80px_-50px_rgba(0,0,0,0.8)]">
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
              <header className="mb-2" />

              <LoginForm />

              <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/80">
                <span className="transition-colors hover:text-white">
                  Chỉ hỗ trợ đăng nhập nội bộ.
                </span>
                <Link 
                  className="group relative text-white/80 transition-colors hover:text-white" 
                  href="/account"
                >
                  <span className="relative z-10">Đổi mật khẩu</span>
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </footer>
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
