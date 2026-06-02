import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@clerk/ui/themes/shadcn.css";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { Providers } from "@/components/providers";
import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'

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
        <ClerkProvider appearance={{ theme: shadcn }}>
          <Providers>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <SidebarTrigger />
                  <div className="font-semibold px-4 text-foreground/80">Admin Dashboard</div>
                </header>
                <div className="flex-1 overflow-auto bg-background p-6">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
