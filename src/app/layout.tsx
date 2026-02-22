import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { CSPostHogProvider } from "./providers";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

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
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <CSPostHogProvider>
          <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
