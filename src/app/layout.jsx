import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

export const metadata = {
  title: "Barbearia Premium - Agendamento",
  description: "Sistema de agendamento da Barbearia Premium",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`bg-zinc-900 text-white ${inter.className}`}>{children}</body>
    </html>
  )
}
