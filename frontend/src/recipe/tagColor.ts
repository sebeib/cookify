export function getPastelTagColor(tagName: string) {
  const normalizedTagName = tagName.trim().toLowerCase();

  let hue = 0;
  let saturationOffset = 0;
  let lightnessOffset = 0;

  for (const character of normalizedTagName) {
    const characterCode = character.charCodeAt(0);
    hue = (hue * 31 + characterCode) % 360;
    saturationOffset = (saturationOffset * 17 + characterCode) % 15;
    lightnessOffset = (lightnessOffset * 13 + characterCode) % 7;
  }

  const saturation = 58 + saturationOffset;
  const lightness = 82 + lightnessOffset;

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
