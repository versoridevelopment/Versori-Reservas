"use client";

import type { ClubTheme } from "../lib/types";
import { bestTextOn, clampHexColor } from "../lib/color";

export function useFlyerTheme(clubTheme: ClubTheme) {
  const primary = clampHexColor(clubTheme.primary, "#0b214a");
  const secondary = clampHexColor(clubTheme.secondary, "#f7c600");
  const secondaryText = bestTextOn(secondary);

  return {
    primary,
    secondary,
    secondaryText,
    logoUrl: clubTheme.logoUrl,
  };
}
