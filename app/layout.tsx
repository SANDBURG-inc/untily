import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "오늘까지 - 제출 서류 관리, 리마인드 자동화 서비스",
  description: "\"오늘도 대표님 죄송하지만..\" 이라는 말로 서류 제출을 요청하고 계신가요? '오늘까지'가 대신해드릴게요.",
  verification: {
    google: 'y7JhQr1wtt0JgJHFtaXNMiim07NYarv5W00qi4Zurns',
  },

  other: {
    'naver-site-verification': '898d49fe362196ad7d451d483719bc92d03392af',
  },
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
