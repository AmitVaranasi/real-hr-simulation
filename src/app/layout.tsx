import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Real HR Simulation",
    template: "%s | Real HR Simulation",
  },
  description:
    "Educational HR business simulation for university courses. Teams make recruitment, compensation, training, and DEI decisions with Balanced Scorecard scoring.",
  applicationName: "Real HR Simulation",
  keywords: [
    "HR simulation",
    "human resources",
    "business education",
    "balanced scorecard",
    "university",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Real HR Simulation",
    description:
      "HR business simulation for higher education.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d6ef5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--portal-page)] text-[var(--portal-ink)] antialiased`}
      >
        <ImpersonationBanner />
        <Navbar />
        <main className="min-h-screen w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
