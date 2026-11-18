/** Pure helper, safe for both server rendering and client playback. */
export function youtubeEmbed(id:string) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error("Invalid video ID");
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
