"use client";

import { toPng } from "html-to-image";

export function useDownloadPng() {
  return async function download(ref: HTMLDivElement | null, filename: string) {
    if (!ref) return;

    const dataUrl = await toPng(ref, {
      cacheBust: true,
      pixelRatio: 2,
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };
}
