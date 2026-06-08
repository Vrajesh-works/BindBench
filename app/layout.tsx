import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { PendoInitializer } from "@/components/pendo-initializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BindBench — AI binding-affinity screening",
  description:
    "Rank and prioritize small-molecule candidates by predicted binding affinity. Powered by Boltz-2 on Amazon Aurora PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="pendo-install" strategy="beforeInteractive">
          {`(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('196d1de0-8ce0-4c03-9286-bc7b320b7e95');`}
        </Script>
      </head>
      <body className={inter.className}>
        <PendoInitializer />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
