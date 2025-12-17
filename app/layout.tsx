import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@neondatabase/neon-js/ui/tailwind";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "오늘까지 - 간편 파일 제출 플랫폼",
  description: "The all-in-one file submission platform for everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Analytics />
          {/* ChannelTalk */}
          <Script
            id="channel-talk"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(){var w=window;if(w.ChannelIO){return w.console.error("ChannelIO script included twice.");}var ch=function(){ch.c(arguments);};ch.q=[];ch.c=function(args){ch.q.push(args);};w.ChannelIO=ch;function l(){if(w.ChannelIOInitialized){return;}w.ChannelIOInitialized=true;var s=document.createElement("script");s.type="text/javascript";s.async=true;s.src="https://cdn.channel.io/plugin/ch-plugin-web.js";var x=document.getElementsByTagName("script")[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==="complete"){l();}else{w.addEventListener("DOMContentLoaded",l);w.addEventListener("load",l);}})();

                ChannelIO('boot', {
                  "pluginKey": "03d3d824-fef4-46f3-abaf-03a9f14b1bf9"
                });
              `,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
