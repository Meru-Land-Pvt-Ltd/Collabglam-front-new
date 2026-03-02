import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CollabGlam',
  description: 'A platform for seamless collaborations between brands and influencers.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-base font-sans">
        {children}
      </body>
    </html>
  );
}
