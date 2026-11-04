export const FRAME_COUNT = 239;
export const frameSrc = (set: "d" | "m", i: number) => `/frames/${set}/${String(i + 1).padStart(4, "0")}.webp`;

export const SPECS: [string, string][] = [
  ["Fragrance name", "ZÄFIZZY"],
  ["Fragrance family", "[ To be confirmed ]"],
  ["Top notes", "[ To be confirmed ]"],
  ["Heart notes", "[ To be confirmed ]"],
  ["Base notes", "[ To be confirmed ]"],
  ["Concentration", "[ To be confirmed ]"],
  ["Bottle size", "[ To be confirmed ]"],
  ["Perfumer", "[ To be confirmed ]"],
];
