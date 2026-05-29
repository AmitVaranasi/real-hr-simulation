import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
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
      "Capsim-style HR business simulation for higher education.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
