import type { Metadata } from 'next';
import { Cinzel, Manrope, Noto_Sans_Kannada } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const notoSansKannada = Noto_Sans_Kannada({
  variable: '--font-kannada',
  subsets: ['kannada'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Kannada for Everyone | Learn the Language. Experience the Culture.',
  description:
    'An AI-powered multilingual Kannada learning platform. Learn Kannada from your first word to speaking with confidence through personalized lessons, conversational AI, and rich cultural heritage.',
  keywords: [
    'Learn Kannada',
    'Kannada for Everyone',
    'Kannada Kaliri',
    'Bangalore Kannada learning',
    'Kannada AI tutor',
    'Karnataka culture',
    'Spoken Kannada',
  ],
  authors: [{ name: 'Kannada Kaliri Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${manrope.variable} ${notoSansKannada.variable} scroll-smooth`}
    >
      <body className="bg-[#101D36] text-[#F8F5EE] font-sans antialiased selection:bg-[#D5A64A]/30 selection:text-[#F8F5EE] min-h-screen">
        {children}
      </body>
    </html>
  );
}
