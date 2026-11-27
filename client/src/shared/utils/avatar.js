/** Stable 0-359 hue derived from a username, so every person keeps their colour. */
export function avatarHue(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}
