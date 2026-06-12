"use client";

import { Button } from "@/components/ui";

export function PrintButton({ label = "Print alle QR-koder" }: { label?: string }) {
  return (
    <Button type="button" variant="accent" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
