import type { Metadata } from 'next';
import { Roboto_Slab, Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Toaster } from '@/components/ui/sonner';
import { cn } from "@/lib/utils";

const slab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-slab',
  display: 'swap',
});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vaultline — Account access',
  description: 'Secure account access, sessions, and identity settings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" 
    className={cn(slab.variable, mono.variable, "font-sans", inter.variable)} 
    suppressHydrationWarning
    >
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
            {children}
            <ModeToggle />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
