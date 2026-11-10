function hashString(value) {
  const text = String(value || '');
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (h < 60) [red, green, blue] = [chroma, x, 0];
  else if (h < 120) [red, green, blue] = [x, chroma, 0];
  else if (h < 180) [red, green, blue] = [0, chroma, x];
  else if (h < 240) [red, green, blue] = [0, x, chroma];
  else if (h < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return [
    Math.round((red + m) * 255),
    Math.round((green + m) * 255),
    Math.round((blue + m) * 255),
  ];
}

function linearChannel(value) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([red, green, blue]) {
  return (
    0.2126 * linearChannel(red) +
    0.7152 * linearChannel(green) +
    0.0722 * linearChannel(blue)
  );
}

function contrastRatio(first, second) {
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hashMemberId(id) {
  return hashString(id);
}

/**
 * Stable per-member color derived from the immutable member UUID. The text
 * color is chosen for WCAG contrast instead of assuming that white always
 * works on a saturated hue.
 */
export function getMemberColor(id) {
  const hue = hashMemberId(id) % 360;
  const saturation = 62;
  const lightness = 42;
  const background = `hsl(${hue} ${saturation}% ${lightness}%)`;
  const rgb = hslToRgb(hue, saturation, lightness);
  const luminance = relativeLuminance(rgb);
  const whiteContrast = contrastRatio(luminance, 1);
  const blackContrast = contrastRatio(luminance, 0);
  const foreground = whiteContrast >= blackContrast ? '#ffffff' : '#171717';

  return {
    hue,
    background,
    foreground,
    contrast: Math.max(whiteContrast, blackContrast),
  };
}

export function getMemberInitial(displayName) {
  const characters = Array.from(String(displayName || '').trim());
  return (characters[0] || '?').toLocaleUpperCase();
}
