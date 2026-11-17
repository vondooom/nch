/** Pull a video id out of a YouTube watch, share, shorts, or embed URL. */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const id = /^[A-Za-z0-9_-]{11}$/;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let found = "";
    if (host === "youtu.be") found = url.pathname.split("/").filter(Boolean)[0] ?? "";
    else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
        found = url.pathname.split("/").filter(Boolean)[1] ?? "";
      } else {
        found = url.searchParams.get("v") ?? "";
      }
    }
    return id.test(found) ? found : null;
  } catch {
    return id.test(value) ? value : null;
  }
}
