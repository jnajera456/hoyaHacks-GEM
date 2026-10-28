import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import Navbar from './components/Navbar';

export const metadata: Metadata = {
  title: {
    default: "ReelStudy",
    template: "%s | ReelStudy",
  },
  description: "Turn PDFs and notes into flashcards, quizzes, and matching games.",
  icons: {
    icon: "/favicon.ico",
    apple: {
      url: "/brand/open-reel-icon-180.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.najera.cc/gabarito.css" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}