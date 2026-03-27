import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import { Suspense } from "react";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import AchievementToast from "@/components/AchievementToast";

export const metadata: Metadata = {
  title: "QuestLog",
  description: "Seu RPG Solo de Produtividade",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuestLog",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <Shell>{children}</Shell>
        <Suspense fallback={null}>
          <LevelUpCelebration />
        </Suspense>
        <Suspense fallback={null}>
          <AchievementToast />
        </Suspense>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
