import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/app/providers";
import AppLogoLink from "@/components/app-logo-link";
import HeaderActions from "@/components/header-actions";
import NavShell from "@/components/nav-shell";

const mtnBrighterSans = localFont({
  src: [
    {
      path: "../../public/fonts/MTNBrighterSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/MTNBrighterSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-mtn",
});

export const metadata: Metadata = {
  title: "MTN Community Shop",
  description: "Partner management platform",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="theme-dark" suppressHydrationWarning>
      <body className={`${mtnBrighterSans.variable} antialiased`} suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var stored = localStorage.getItem("mtn-theme");
                var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var theme = stored || (prefersDark ? "dark" : "light");
                document.documentElement.classList.toggle("theme-dark", theme === "dark");
                document.documentElement.classList.toggle("theme-light", theme === "light");
              } catch (e) {}
            })();
          `}
        </Script>
        <Providers>
          <div className="app-shell">
            <header className="app-header">
              <AppLogoLink />
              <HeaderActions />
            </header>
            <div className="app-content">
              <NavShell>{children}</NavShell>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
