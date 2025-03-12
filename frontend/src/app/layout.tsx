import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/components/PrivyProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChainSocial",
  description: "A 100% Monad Social Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
