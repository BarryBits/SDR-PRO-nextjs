import "./globals.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import ThemeProvider from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SDR Pro | Plataforma Corporativa de Vendas",
  description: "Plataforma premium de automação de vendas e gestão de leads corporativa",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="pt-BR" 
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="font-sans text-foreground bg-background antialiased h-full">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster 
            richColors 
            position="bottom-right"
            theme="system"
            toastOptions={{
              classNames: {
                toast: 'glass-panel border-border/50 shadow-premium',
                title: 'font-heading font-semibold',
                description: 'text-muted-foreground',
              }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}


