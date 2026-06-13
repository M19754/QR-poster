"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

type Props = {
  url: string;
  groupName: string;
};

export function BindingQRDisplay({ url, groupName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((QRCode) => {
        if (cancelled || !canvasRef.current) return;
        QRCode.toCanvas(canvasRef.current, url, {
          width: 260,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrReady(true);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [url]);

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
          <canvas ref={canvasRef} />
          {!qrReady && (
            <div className="flex h-64 w-64 items-center justify-center text-sm text-[var(--muted)]">
              Genererer…
            </div>
          )}
        </div>
        <p className="text-center text-xs text-[var(--muted)] break-all">{url}</p>
        <Button type="button" variant="accent" onClick={() => setFullscreen(true)}>
          Vis fuld skærm
        </Button>
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white"
          onClick={() => setFullscreen(false)}
        >
          <p className="text-2xl font-bold text-black">{groupName}</p>
          <canvas
            className="block"
            ref={(el) => {
              if (!el) return;
              import("qrcode").then((QRCode) => {
                QRCode.toCanvas(el, url, {
                  width: Math.min(window.innerWidth, window.innerHeight) - 80,
                  margin: 2,
                  color: { dark: "#000000", light: "#ffffff" },
                });
              });
            }}
          />
          <p className="text-sm text-gray-500">Tryk for at lukke</p>
        </div>
      )}
    </>
  );
}
