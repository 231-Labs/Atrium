import type { Metadata } from "next";
import "./globals.css";
import "./dapp-kit-overrides.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Atrium - Web3 Creator Platform",
  description: "A 3D interactive space for creators and fans on Sui blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

