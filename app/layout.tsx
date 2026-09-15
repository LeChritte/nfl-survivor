import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Survivor Pool Planner',
  description: 'NFL Survivor Pool — pick one team per week, never twice.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
