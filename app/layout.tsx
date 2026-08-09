import type { Metadata } from "next"
import { Toaster } from "sonner"

import { SessionProvider } from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gym Management Admin",
  description: "Protected gym management admin panel.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
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
