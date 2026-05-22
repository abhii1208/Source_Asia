import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroMint - Effortless Velocity",
  description: "Book smarter and fly smoother with AeroMint.",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#14B8A6"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col pt-[72px] pb-[64px] md:pb-0">
        <Header />
        <main className="flex-1 bg-[#d6e2de]">{children}</main>
        <InstallPrompt />
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
