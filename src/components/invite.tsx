/* eslint-disable @next/next/no-img-element */
import { isPremiumTheme, PremiumCard } from "./premium-card";
import { findArtworkTemplate } from "@/lib/card-templates";
import { ArtworkCard } from "./artwork-card";
export function Invite({
  theme = "rose",
  animated = false,
  names = ["Ananya", "Aarav"],
  date = "21 February 2027",
  venue = "The Rose Palace · Jaipur",
  photo = "",
  message = "",
  address = "",
}: {
  theme?: string;
  animated?: boolean;
  names?: string[];
  date?: string;
  venue?: string;
  photo?: string;
  message?: string;
  address?: string;
}) {
  if (findArtworkTemplate(theme)) {
    return <ArtworkCard theme={theme} names={names} date={date} venue={venue} photo={photo} message={message} address={address} />;
  }
  if (isPremiumTheme(theme)) {
    return <PremiumCard theme={theme} names={names} date={date} venue={venue} photo={photo} />;
  }
  return (
    <div className={`invite ${theme} ${animated ? "animated" : ""}`}>
      <div className="invite-border">
        <div className="ornament">❦</div>
        <span className="invite-eyebrow">TOGETHER WITH OUR FAMILIES</span>
        <p className="invite-small">we invite you to celebrate</p>
        <h2>
          {names[0]}
          <em>&</em>
          {names[1]}
        </h2>
        {photo && <img className="invite-photo" src={photo} alt="The couple" />}
        <div className="invite-rule" />
        <p className="invite-date">{date}</p>
        <p className="invite-small">{venue}</p>
        <div className="ornament bottom">❦</div>
      </div>
    </div>
  );
}
