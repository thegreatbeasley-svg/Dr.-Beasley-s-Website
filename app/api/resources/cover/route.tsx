import { ImageResponse } from "next/og";

/**
 * Auto-generated typographic cover for any resource without an uploaded
 * cover image. Rendered on demand from the title and type — no
 * PDF-first-page rendering step, no native image dependency, always
 * renders, and matches the site's palette.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.slice(0, 140) || "Untitled Resource";
  const resourceType = searchParams.get("type")?.slice(0, 40) || "Guide";

  const initial = resourceType.trim().charAt(0).toUpperCase() || "R";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b1628",
          backgroundImage:
            "radial-gradient(circle at 85% -10%, rgba(226,121,58,0.32), transparent 55%), radial-gradient(circle at -10% 110%, rgba(201,163,90,0.2), transparent 55%)",
          color: "#f4ecdf",
          padding: "52px 44px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#cdc3b2",
            }}
          >
            Dr. Virgil Beasly
          </div>
          <div
            style={{
              display: "flex",
              width: 11,
              height: 11,
              borderRadius: 999,
              backgroundColor: "#e2793a",
            }}
          />
        </div>

        {/* Large watermark monogram — gives the cover a designed, non-empty
            center without pretending to depict real book art. */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 320,
              fontWeight: 700,
              color: "rgba(244,236,223,0.06)",
              lineHeight: 1,
            }}
          >
            {initial}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", width: 48, height: 3, backgroundColor: "#e2793a" }} />
          <div
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#e2793a",
              fontWeight: 700,
            }}
          >
            {resourceType}
          </div>
          <div style={{ display: "flex", fontSize: 40, lineHeight: 1.2, fontWeight: 600 }}>
            {title}
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 1200 }
  );
}
