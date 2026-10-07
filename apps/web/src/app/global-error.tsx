"use client";

import { useEffect, useRef } from "react";

export default function GlobalError({ reset }: { reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f8fafc", color: "#0a0a0a", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
          <section role="alert" style={{ width: "100%", maxWidth: "560px", border: "1px solid #e5e7eb", borderRadius: "24px", background: "#ffffff", padding: "48px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#c2410c", fontSize: "12px", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>
              Orderly Kitchen
            </p>
            <h1 ref={headingRef} tabIndex={-1} style={{ margin: "16px 0 0", fontSize: "32px" }}>
              We couldn’t load this page
            </h1>
            <p style={{ margin: "16px auto 0", maxWidth: "440px", color: "#525252", lineHeight: 1.6 }}>
              Something went wrong while loading this page. Try again.
            </p>
            <button type="button" onClick={reset} style={{ minHeight: "48px", marginTop: "28px", border: 0, borderRadius: "12px", background: "#c2410c", color: "#ffffff", padding: "0 24px", fontWeight: 700, cursor: "pointer" }}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
