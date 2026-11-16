/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { findArtworkTemplate } from "@/lib/card-templates";

export type ArtworkCardProps = {
  theme: string;
  names?: string[];
  date?: string;
  venue?: string;
  message?: string;
  photo?: string;
  address?: string;
};
function getWhen(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})(?:\s*·\s*(\d{2}:\d{2}))?/.exec(value);
  if (!match) return { day: value, time: "" };
  const day = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(match[1] + "T12:00:00Z"));
  const hour = Number(match[2]?.slice(0, 2) ?? "0");
  const minute = match[2]?.slice(3, 5) ?? "00";
  return {
    day,
    time: match[2] ? `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"} IST` : "",
  };
}
function calcNameSize(value: string) {
  // Full character count matters as much as the longest word. Multi-word names
  // used to appear oversized because each individual word was short.
  const length = value.trim().length;
  const longestWord = Math.max(0, ...value.trim().split(/\s+/).map(word => word.length));
  if (length > 38 || longestWord > 24) return "3cqw";
  if (length > 28 || longestWord > 18) return "3.6cqw";
  if (length > 21 || longestWord > 15) return "4.3cqw";
  if (length > 16 || longestWord > 11) return "5.1cqw";
  if (length > 12 || longestWord > 9) return "6.2cqw";
  return "7.7cqw";
}
export function ArtworkCard({theme, names = ["Ananya", "Aarav"], date = "21 February 2027", venue = "The Rose Palace · Jaipur", message, photo = "", address = ""}: ArtworkCardProps) {
  const template = findArtworkTemplate(theme);
  if (!template) return null;
  const {day,time} = getWhen(date);
  const bride = names[0]?.trim() || "Bride";
  const groom = names[1]?.trim() || "Groom";
  const invitation = (message?.trim() || "Together with our families, we joyfully invite you to celebrate our wedding.").slice(0,140);
  const nameSize = calcNameSize(bride.length > groom.length ? bride : groom);
  const dense = Boolean(photo) || address.length > 25 || venue.length > 55 || invitation.length > 90 || bride.length + groom.length > 32;
  const venueSize = venue.length > 150 ? "1.6cqw" : venue.length > 100 ? "1.9cqw" : venue.length > 75 ? "2.5cqw" : "3.4cqw";
  const vars = {
    "--art-name-size": nameSize,
    "--art-venue-size": venueSize,
    "--art-address-size": address.length > 130 ? "1.5cqw" : address.length > 85 ? "1.9cqw" : "2.5cqw",
    "--art-message-size": invitation.length > 105 ? "1.9cqw" : invitation.length > 80 ? "2.3cqw" : invitation.length > 55 ? "2.6cqw" : "3.1cqw",
    "--art-names-font": template.font.names,
    "--art-supporting-font": template.font.supporting,
  } as CSSProperties;
  return (
    <article className={`artwork-card art-${template.layout} ${photo ? "art-has-photo" : ""} ${address ? "art-has-address" : ""} ${dense ? "art-dense" : ""}`}
      style={vars} data-testid={`art-${template.id}`} aria-label={template.name + " invitation"}>
      <img className="artwork-background" src={template.artwork} alt="" aria-hidden="true" draggable={false} />
      <div className="artwork-copy">
        <p className="artwork-kicker">{template.kicker ?? (template.layout === "palace" ? "A ROYAL WEDDING CELEBRATION" : "YOU ARE CORDIALLY INVITED")}</p>
        <p className="artwork-overline">{template.overline ?? (template.layout === "palace" ? "With the blessings of our families" : "A beautiful beginning...")}</p>
        <h2 className="artwork-names" data-testid="editable-names">
          <span>{bride}</span><em>&amp;</em><span>{groom}</span>
        </h2>
        {photo && template.textLayers.photo.enabled && (
          <img className="artwork-couple" src={photo} alt="Uploaded couple" />
        )}
        <p className="artwork-message" data-testid="editable-message">{invitation}</p>
        <span className="artwork-rule" aria-hidden="true">✦</span>
        <p className="artwork-date">{day}</p>
        {time && <p className="artwork-time">{time}</p>}
        <p className="artwork-venue" data-testid="editable-venue">{venue}</p>
        {address && <p className="artwork-address" data-testid="editable-address">{address}</p>}
      </div>
      <p className="artwork-footer" aria-hidden="true">{template.footer ?? (template.layout === "palace" ? "✧  LOVE • FAMILY • FOREVER  ✧" : "CELEBRATING LOVE  ·  TOGETHER FOREVER")}</p>
    </article>
  );
}
