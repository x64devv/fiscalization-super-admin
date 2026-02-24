import type { Metadata } from 'next';
import { DM_Sans, Space_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400','500','600','700'] });
const spaceMono = Space_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','700'] });

export const metadata: Metadata = {
  title: { default: 'ZIMRA Admin', template: '%s | ZIMRA Admin Portal' },
  description: 'ZIMRA Fiscalization System Owner Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${spaceMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
