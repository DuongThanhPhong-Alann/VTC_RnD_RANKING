"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserInfo = {
  id: string;
  username: string;
  name?: string | null;
};

export function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.user) setUser(data.user);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Link className="btn btn-ghost" href="/account">
        {user.name ? `Xin chào, ${user.name}` : `@${user.username}`}
      </Link>
      <button className="btn btn-primary" onClick={handleLogout}>
        ĐĂNG XUẤT
      </button>
    </div>
  );
}
