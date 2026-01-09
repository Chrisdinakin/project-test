import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cyber Terminal - Web3 Trading dApp",
  description: "Next.js + Wagmi v2 + RainbowKit dApp on Ethereum Sepolia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#050505] font-mono">
        <Web3Provider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b',
                color: '#ededed',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                fontFamily: 'monospace',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
