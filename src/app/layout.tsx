import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { QuestProvider } from "@/contexts/QuestContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Sidebar } from "@/components/Sidebar";
import { LiveNetworkWidget } from "@/components/LiveNetworkWidget";
import { WalletGuard } from "@/components/WalletGuard";

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
              {/* Sidebar */}
              <Sidebar />

              {/* Main Area */}
              <div className="flex-1 min-h-screen pl-64 flex flex-col relative">
                {/* Background Glows and Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
                
                {/* Purple Ambient Blob top-left */}
                <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] rounded-full bg-kii-purple/10 blur-[120px] pointer-events-none" />
                {/* Blue Ambient Blob bottom-right */}
                <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full bg-kii-blue/5 blur-[150px] pointer-events-none" />

                {/* Floating Live Widget */}
                <LiveNetworkWidget />

                {/* Page Contents */}
                <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-10 relative z-10">
                  <WalletGuard>
                    {children}
                  </WalletGuard>
                </main>
              </div>
            </QuestProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
