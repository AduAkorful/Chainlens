import type { Metadata } from "next"
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { Toaster } from "sonner"
import "./globals.css"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ChainLens — EVM Knowledge Hub",
  description:
    "Personal Ethereum developer knowledge hub with MCP-powered documentation endpoints for Cursor IDE.",
  icons: {
    icon: "/chainlens-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
