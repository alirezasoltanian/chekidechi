"use client";

import "./globals.css";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { fontBase, fontMedium } from "@/lib/fonts";
import { Toaster } from "sonner";
import { useMounted } from "@/hooks/use-mounted";
import { useEffect } from "react";
import { getUser } from "@/actions/user";
import { useChatStore } from "@/basketball/store/chat";
import { usePathname } from "next/navigation";
import Link from "next/link";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUserBaleInfo } = useChatStore();
  const mounted = useMounted();
  useEffect(() => {
    const fetchData = async () => {
      if (!mounted) return;
      if (
        typeof window !== "undefined" &&
        window?.Bale?.WebApp &&
        window.Bale.WebApp.initData
      ) {
        // We don't use initData directly but keep this for future reference
        const initDataUnsafe = window.Bale.WebApp.initDataUnsafe;
        const initData = window.Bale.WebApp.initData;
        // const isValid = await validateInitData(initData);

        // if (!isValid) {
        //   toast.error("داده‌های دریافتی معتبر نیستند");
        //   return;
        // }
        if (initDataUnsafe?.user?.id) {
          const userId = String(initDataUnsafe?.user?.id);

          const user = await getUser(userId);

          const baleUser = {
            username: initDataUnsafe.user.username || "",
            id: initDataUnsafe.user.id,
            first_name: initDataUnsafe.user.first_name || "",
            allows_write_to_pm: !!initDataUnsafe.user.allows_write_to_pm,
            token: user.token,
            initData: initData,
          };
          setUserBaleInfo(baleUser);
        }
      }
    };

    fetchData();
  }, [mounted, setUserBaleInfo]);
  const pathname = usePathname();
  return (
    <html lang="fa" dir="rtl">
      <Script src="https://tapi.bale.ai/miniapp.js?1" />
      <body
        className={cn(
          " font-base relative min-h-screen antialiased ",
          fontMedium.variable,
          fontBase.variable
        )}
      >
        {pathname !== "/" && (
          <Link
            className="absolute top-4 left-4 z-10  font-semibold   hover:underline"
            href="/"
          >
            صفحه اصلی
          </Link>
        )}
        <div className="texture" />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
