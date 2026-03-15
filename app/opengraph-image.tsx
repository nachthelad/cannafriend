import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cannafriend - Seguimiento de Plantas y Diario de Cultivo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Radial glow background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16,185,129,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Icon container */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "rgba(16,185,129,0.12)",
            border: "2px solid rgba(16,185,129,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 525.77 525.86"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#10b981"
              stroke="#10b981"
              strokeMiterlimit="10"
              strokeWidth="8"
              transform="translate(-34.84 -31.77)"
              d="M390.51,536.89a244.21,244.21,0,0,1-63.5,15.3,275.6,275.6,0,0,1-60.9-.5,259,259,0,0,1-94.2-30.6q-59.85-32.85-95.3-91.2a257.71,257.71,0,0,1-34.4-92c-3.9-22.6-4.1-45.4-2.2-68.3,2.7-34.3,12.5-66.4,28.5-96.8a255.81,255.81,0,0,1,193.1-134.5c61.6-8.1,119.5,3.2,172.3,35.7,61.5,37.9,100.4,92.6,116.6,163.3a250.13,250.13,0,0,1,5.2,76.6c-6.2,76-39.1,138.4-98.9,186-20,15.8-42.2,27.8-66.3,37M165.81,94.59c-13.2,9-25.8,18.7-37,30.1-50.4,51.6-74.3,113.3-70.3,185.6,1.1,19,4.2,37.6,10.3,55.5,29,85.7,87.9,139.4,175.4,161.8,20.3,5.2,41,6.7,61.9,6.1,1.8-.1,3.8.5,5.2-1.8-10.6-12-17.4-26.2-22.4-41.3a230.27,230.27,0,0,1-11.1-56.3c-1.7-22.9-1.5-45.6,1.8-68.4a14.89,14.89,0,0,0-.3-4.2c-2.3-14.9-11.3-25.4-23.1-33.8s-25.2-13.6-38.6-18.8c-28.3-11-50.2-29.3-64.6-56.3-9.6-18.1-15.5-37.2-15.2-57.9.1-6.7,3.3-9.8,9.9-9.9a151.35,151.35,0,0,1,32.9,2.8c45.5,8.5,77.4,34.2,97,75.7,7.4,15.8,11.5,32.6,15.6,50.2,1-17.5,2.4-34.3,6.6-50.6,8.8-33.8,26.4-61.6,55.9-81,27-17.7,56.9-24,88.8-22.6,5.7.2,9.1,4,9.4,9.8a170,170,0,0,1-.9,31.1c-2.5,20.7-8.8,40.1-20.8,57.2-27.8,39.4-66,60.2-114.3,62.5a5.67,5.67,0,0,0-5.5,3.5,157.18,157.18,0,0,0-9.2,24.8c-7.3,27.1-8.8,54.6-6.8,82.4a220.83,220.83,0,0,0,8.7,49.1c4.5,14.7,10.4,28.8,21.3,40.1,6.7,7,14.9,10.5,24.8,8,58.3-14.7,106-45.5,141.3-94.4,29.1-40.3,43.4-85.7,44.8-135.2a234,234,0,0,0-4.7-52.1c-10.6-53.2-37-97.3-77.6-132.7-36-31.4-78.1-49.9-125.5-56.1a251.59,251.59,0,0,0-68.8.5,234.5,234.5,0,0,0-94.9,36.6M352,268.49a155.34,155.34,0,0,0-25.8,31.8c3.3-.2,5.4-.3,7.6-.5.8-.1,1.5-.3,2.3-.4,30-6.3,54.8-21.4,74.1-45,16.8-20.6,25-44.6,25.1-71.2,0-3.7-1.3-5.3-5-4.8-5.1.6-10.3,1-15.4,1.8-39.5,6.6-69.8,26.1-87.7,62.8a133.73,133.73,0,0,0-11.9,38.7,207.52,207.52,0,0,1,36.9-38c7.5-6,14.9-12.2,23.5-16.6a8.33,8.33,0,0,1,10.8,1.9c3,3.3,2.6,7.3.5,11-1.3,2.4-3.6,3.9-5.8,5.5-9.8,7.2-19.7,14.3-29.2,23m-115.2-31.8a108.13,108.13,0,0,0-17.9-13.8c-17.7-11.1-37.1-17-57.8-18.9-2.9-.3-5.5-.1-4.5,4.2,8.9,39.9,29.8,69.7,69.7,83.8,16,5.6,31.1,13,44.6,23.4.7.5,1.4,1.4,2.4.7a30.06,30.06,0,0,0-.5-4.2c-.2-1.2-.6-2.4-.9-3.7C265.41,282.09,255.91,257.39,236.81,236.69Z"
            />
          </svg>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-3px",
            marginBottom: 20,
            display: "flex",
          }}
        >
          Cannafriend
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 34,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 720,
            lineHeight: 1.3,
            display: "flex",
          }}
        >
          Seguimiento de Plantas y Diario de Cultivo
        </div>

        {/* URL pill */}
        <div
          style={{
            marginTop: 52,
            padding: "14px 32px",
            borderRadius: 999,
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.4)",
            color: "#10b981",
            fontSize: 26,
            letterSpacing: "0.5px",
            display: "flex",
          }}
        >
          cannafriend.app
        </div>
      </div>
    ),
    { ...size }
  );
}
