import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import AppLogoLink from "@/components/app-logo-link";
import HeaderActions from "@/components/header-actions";
import NavShell from "@/components/nav-shell";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MTN Community Shop",
  description: "Partner management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="theme-dark" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var stored = localStorage.getItem("mtn-theme");
                var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var theme = stored || (prefersDark ? "dark" : "dark");
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
