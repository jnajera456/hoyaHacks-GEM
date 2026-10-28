import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Interface',
  description: 'Review flashcards, quizzes, and matching games generated from your materials.',
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return only the children without wrapping in html/body
  return children;
}