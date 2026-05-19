import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { WebVitalsReporter } from "@/components/providers/web-vitals-reporter";

export const metadata: Metadata = {
    title: {
        default: "NexusFlow — Project Management for Modern Teams",
        template: "%s | NexusFlow",
    },
    description:
        "NexusFlow is a real-time collaborative project management platform built for teams that move fast. Kanban boards, sprints, AI-powered task generation, and more.",
    keywords: ["project management", "kanban", "scrum", "team collaboration", "task tracking"],
    authors: [{ name: "NexusFlow Team" }],
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    openGraph: {
        title: "NexusFlow — Project Management for Modern Teams",
        description: "Real-time collaborative project management platform",
        type: "website",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "NexusFlow",
        description: "Real-time collaborative project management platform",
    },
    robots: { index: true, follow: true },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
                <Providers>{children}</Providers>
                <WebVitalsReporter />
            </body>
        </html>
    );
}
