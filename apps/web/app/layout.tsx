import React from "react";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";

export const metadata = {
  title: "AI Study Planner",
  description: "An elegant, AI-powered study scheduling assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <div className="main-content">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
