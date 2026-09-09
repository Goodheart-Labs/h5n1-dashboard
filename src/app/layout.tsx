import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CSPostHogProvider } from "./providers";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "H5N1 Risk Dashboard (archived)",
  description:
    "Bird flu risk index frozen at February 2025, plus what open prediction markets say now.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CSPostHogProvider>
          <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
