"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type Status = "idle" | "loading" | "success" | "error";

export default function MobileAuthPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleSignIn = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      // The native app passes its own redirect URI as a query param so we
      // send it back to the right scheme:
      //   Expo Go build  → exp://192.168.x.x:8081/--/auth
      //   Production app → cannafriend://auth
      const params = new URLSearchParams(window.location.search);
      const redirectBase =
        params.get("redirect") ?? "cannafriend://auth";

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/mobile-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Token exchange failed");
      }

      const { customToken } = await res.json();

      setStatus("success");
      // Redirect back to the app. openAuthSessionAsync intercepts this on
      // iOS; on Android the Linking listener in _layout.tsx handles it.
      const sep = redirectBase.includes("?") ? "&" : "?";
      window.location.href = `${redirectBase}${sep}ct=${encodeURIComponent(customToken)}`;
    } catch (err: any) {
      console.error("[mobile-auth]", err);
      setErrorMsg(err.message ?? "Error al iniciar sesión");
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F5F5",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px",
      }}
    >
      {/* Card */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "40px 32px",
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <img
            src="/favicon.svg"
            alt="Cannafriend"
            style={{ width: "72px", height: "72px", objectFit: "contain" }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: "22px",
              color: "#2E7D32",
              letterSpacing: "-0.5px",
            }}
          >
            cannafriend
          </span>
        </div>

        {status === "idle" || status === "error" ? (
          <>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#212121",
                  margin: "0 0 8px",
                }}
              >
                Iniciar sesión
              </p>
              <p style={{ fontSize: "14px", color: "#757575", margin: 0 }}>
                Continúa con tu cuenta de Google para acceder a la app.
              </p>
            </div>

            {status === "error" && (
              <div
                style={{
                  backgroundColor: "#FFEBEE",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <p style={{ color: "#C62828", fontSize: "14px", margin: 0 }}>
                  {errorMsg}
                </p>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding: "13px 16px",
                borderRadius: "10px",
                border: "1px solid #E0E0E0",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: 600,
                color: "#212121",
                boxSizing: "border-box",
              }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>
          </>
        ) : status === "loading" ? (
          <div style={{ textAlign: "center", color: "#616161" }}>
            <Spinner />
            <p style={{ marginTop: "16px", fontSize: "15px" }}>
              Iniciando sesión…
            </p>
          </div>
        ) : (
          /* success */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
            <p
              style={{
                fontWeight: 600,
                fontSize: "16px",
                color: "#2E7D32",
                marginBottom: "8px",
              }}
            >
              ¡Listo!
            </p>
            <p style={{ fontSize: "14px", color: "#757575", margin: 0 }}>
              Volviendo a la app…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        border: "3px solid #E8F5E9",
        borderTop: "3px solid #2E7D32",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
