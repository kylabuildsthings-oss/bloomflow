"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid rgba(135, 169, 107, 0.3)",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          },
          success: { iconTheme: { primary: "#87A96B", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#CC7357", secondary: "#ffffff" } },
        }}
      />
    </SessionProvider>
  );
}
