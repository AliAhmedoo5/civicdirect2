import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicDirect Admin",
  description: "Web Admin Dashboard for CivicDirect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 w-full flex flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger />
              <div className="font-semibold px-4 text-foreground/80">Admin Dashboard</div>
            </header>
            <div className="flex-1 overflow-auto bg-background p-6">
              {children}
            </div>
          </main>
        </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
