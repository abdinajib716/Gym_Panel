import type { Metadata } from "next"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import { Toaster } from "sonner"

import { SessionProvider } from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["700"],
})

export const metadata: Metadata = {
  title: "Startap Admin",
  description: "Frontend starter admin panel for launching any application.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${spaceGrotesk.variable} ${dmSans.variable}`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
            {children}
            <Toaster position="bottom-left" richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
