import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Terminal - Trading Platform",
  description: "Professional DeFi trading interface on Ethereum Sepolia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        <Web3Provider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
