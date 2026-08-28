import { useEffect, useState } from "react";
import { useCouple } from "@/lib/couple";

function computeLuminance(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 32;
        const h = 32;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(0.5);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // perceptual luminance
          const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          total += l;
          count++;
        }
        resolve(total / count);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function BackgroundLayer() {
  const { couple } = useCouple();
  const bgUrl = couple?.bg_url ?? null;
  const blur = couple?.bg_blur ?? 0;
  const dim = couple?.bg_dim ?? 30;
  const theme = couple?.bg_text_theme ?? "auto";

  const [autoTheme, setAutoTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!bgUrl) {
      root.classList.remove("dark");
      setAutoTheme(null);
      return;
    }
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // auto — compute luminance of (dimmed) bg
      computeLuminance(bgUrl)
        .then((lum) => {
          // dim darkens the image; effective lum lowers with dim%
          const eff = lum * (1 - dim / 100);
          const isDark = eff < 0.5;
          setAutoTheme(isDark ? "dark" : "light");
          root.classList.toggle("dark", isDark);
        })
        .catch(() => {
          root.classList.remove("dark");
        });
    }
  }, [bgUrl, theme, dim]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    if (bgUrl) {
      body.style.backgroundImage = "none";
      body.style.backgroundColor = "transparent";
      html.style.backgroundColor = "transparent";
    } else {
      body.style.backgroundImage = "";
      body.style.backgroundColor = "";
      html.style.backgroundColor = "";
    }
    return () => {
      body.style.backgroundImage = "";
      body.style.backgroundColor = "";
      html.style.backgroundColor = "";
    };
  }, [bgUrl]);

  if (!bgUrl) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        transform: blur > 0 ? "scale(1.1)" : undefined,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: (autoTheme === "dark" || theme === "dark")
            ? `rgba(0,0,0,${dim / 100})`
            : `rgba(255,255,255,${dim / 100})`,
        }}
      />
    </div>
  );
}
