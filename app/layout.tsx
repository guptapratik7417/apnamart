import type { Metadata } from "next";
import Script from "next/script";
import { connection } from "next/server";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAnalyticsRuntimeProperties } from "@/config/app-properties";
import { getSiteConfig } from "@/lib/site-config";
import { getCompanyReviews } from "@/lib/store";

export const metadata: Metadata = {
  title: "apnaMart",
  description: "Shop everything online",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const config = await getSiteConfig();
  const companyReviews = await getCompanyReviews({
    minRating: config.reviews.footerMinRating,
    limit: config.reviews.footerLimit,
  });
  const { googleAnalyticsMeasurementId } = getAnalyticsRuntimeProperties();

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <Header config={config} />
        <main className="min-h-screen">{children}</main>
        <Footer config={config} companyReviews={companyReviews} />
      </body>
      {googleAnalyticsMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsMeasurementId}');
            `}
          </Script>
        </>
      )}
    </html>
  );
}
