import { youtubeEmbed } from "@/lib/animated/repository";
export function AnimatedVideoPreview({videoId,title}:{videoId:string;title:string}){
  return <div className="animated-video"><iframe title={title+" sample YouTube invitation"} src={youtubeEmbed(videoId)}
    loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
    sandbox="allow-scripts allow-same-origin allow-presentation"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
    <p><small>Sample video hosted on YouTube. The finished invitation is prepared individually.</small></p>
  </div>;
}
