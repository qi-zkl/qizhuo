import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const safeHost = host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : null;
  const protocol = requestHeaders.get("x-forwarded-proto") || (safeHost?.startsWith("localhost") ? "http" : "https");
  const imageUrl = safeHost ? `${protocol}://${safeHost}/og.png` : undefined;

  return {
    title: {
      default: "创享不打烊｜嘉宾与工作人员招募",
      template: "%s｜创享不打烊",
    },
    description: "加入创享不打烊：报名成为出演嘉宾或幕后工作人员，把年轻人的创意变成现场。",
    openGraph: {
      title: "创享不打烊｜嘉宾与工作人员招募",
      description: "把创意变成现场。出演嘉宾与幕后工作人员持续招募中。",
      type: "website",
      images: imageUrl ? [{ url: imageUrl, width: 1536, height: 1024, alt: "创享不打烊嘉宾与工作人员招募" }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "创享不打烊｜嘉宾与工作人员招募",
      description: "把创意变成现场。出演嘉宾与幕后工作人员持续招募中。",
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
