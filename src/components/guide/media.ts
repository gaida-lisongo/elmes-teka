import fs from "node:fs";
import path from "node:path";

/* Médias du guide présents dans public/guide : on n'affiche que ce qui existe vraiment. */
const exists = (relative: string) => fs.existsSync(path.join(process.cwd(), "public", relative));

export function shotSrc(id?: string): string | null {
  if (!id) return null;
  const src = `/guide/shots/${id}.jpg`;
  return exists(src) ? src : null;
}

export function videoSrc(id?: string): { src: string; poster: string | null } | null {
  if (!id) return null;
  const src = `/guide/videos/${id}.mp4`;
  if (!exists(src)) return null;
  const poster = `/guide/videos/${id}.jpg`;
  return { src, poster: exists(poster) ? poster : null };
}
