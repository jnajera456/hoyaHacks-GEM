import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import Navbar from './components/Navbar';
export const metadata: Metadata = {
  title: "HoyaHacks GEM",
  description: "Class Notes → Shorts",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}