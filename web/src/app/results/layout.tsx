import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StudyToks - Study Interface',
  description: 'TikTok-style study interface for your generated materials',
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}