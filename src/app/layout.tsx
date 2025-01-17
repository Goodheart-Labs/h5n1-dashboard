import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CSPostHogProvider } from "./providers";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/ui/nav-bar";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  fallback: ["Geist Fallback"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: ["Geist Fallback"],
});

export const metadata: Metadata = {
  title: "H5N1 Risk Dashboard",
  description:
    "Real-time monitoring of avian influenza trends and risk assessment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <CSPostHogProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <TooltipProvider delayDuration={100}>
            <NavBar
              items={[
                { href: "/agi", label: "AGI timelines" },
                { href: "/bird-flu", label: "Bird flu" },
              ]}
            />
            {children}
          </TooltipProvider>
        </body>
      </CSPostHogProvider>
    </html>
  );
}
