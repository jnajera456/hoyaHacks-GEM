import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReelStudy - Study Interface',
  description: 'TikTok-style study interface for your generated materials',
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return only the children without wrapping in html/body
  return children;
}