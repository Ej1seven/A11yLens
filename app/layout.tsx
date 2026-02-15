import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import AuthMenu from "@/components/AuthMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A11yLens - Accessibility & Content Quality",
  description: "Monitor and improve website accessibility with automated scans and detailed reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen w-full relative bg-[#FFFFFF]">
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e7e5e4 1px, transparent 1px),
                linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 0",
              maskImage: `
                repeating-linear-gradient(
                  to right,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                repeating-linear-gradient(
                  to bottom,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)
              `,
              WebkitMaskImage: `
                repeating-linear-gradient(
                  to right,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                repeating-linear-gradient(
                  to bottom,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)
              `,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />

          <div className="relative z-10">
          <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-28">
                <Link href="/" className="group">
                  <Image
                    src="/A11yLens_logo_trimmed.png"
                    alt="A11yLens logo"
                    width={1200}
                    height={360}
                    priority
                    className="h-24 w-auto transition-opacity group-hover:opacity-90"
                  />
                </Link>
                <div className="flex items-center gap-4">
                  <Link href="/about-us" className="text-base font-medium text-primary-700 hover:text-primary-800">
                    About Us
                  </Link>
                  <AuthMenu />
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="mt-auto py-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
              <p>Built with Next.js, TypeScript, Prisma & Recharts</p>
            </div>
          </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
