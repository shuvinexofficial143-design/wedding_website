/** Pure helper, safe for both server rendering and client playback. */
export function youtubeEmbed(id:string) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error("Invalid video ID");
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function parseYouTubeId(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Use a YouTube video URL"); }
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("YouTube must use HTTPS");
  const host = url.hostname.toLowerCase();
  let id = "";
  if (host === "youtu.be") id = url.pathname.split("/")[1] || "";
  else if (["youtube.com","www.youtube.com","m.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(host)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
    else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
  }
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error("Invalid YouTube video ID");
  return id;
}
