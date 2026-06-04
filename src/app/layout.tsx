import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { QuestProvider } from "@/contexts/QuestContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClientLayout } from "@/components/ClientLayout";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KiiHub | Build on KiiChain Testnet",
  description: "The ultimate developer onboarding and builder experience for KiiChain. Faucet, contract deployments, smart contract playground, and testnet developer quests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'light' || (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-brand-dark text-zinc-100 flex font-sans selection:bg-kii-purple/30 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <WalletProvider>
            <QuestProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </QuestProvider>
          </WalletProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
