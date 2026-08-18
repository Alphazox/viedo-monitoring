import { Reveal } from "./reveal";

const PHOTOS = [
  { src: "/media/photos/cam-430208.jpg", caption: "Camera hardware — bullet cameras" },
  { src: "/media/photos/cam-96612.jpg", caption: "Perimeter camera — mounted outdoor" },
  { src: "/media/photos/cam-30932198.jpg", caption: "Perimeter camera — concrete wall mount" },
  { src: "/media/photos/cam-37591155.jpg", caption: "Camera — modern building close-up" },
  { src: "/media/photos/control-room-person-30576172.jpg", caption: "Operator reviewing a flagged event" },
] as const;

const VIDEOS = [
  { src: "/media/videos/control-room-cctv-38779095.mp4", caption: "Reference — multi-feed monitoring wall" },
  { src: "/media/videos/control-room-ops-38779102.mp4", caption: "Reference — operator workstation" },
] as const;

export function Gallery() {
  return (
    <section className="sec" id="gallery">
      <div className="container">
        <Reveal className="sec-head">
          <div className="eyebrow">What&apos;s actually on screen</div>
          <h2>Camera feeds and control rooms, not clip art</h2>
          <p>
            Stock photography and reference footage standing in for real customer sites — swapped for actual site
            captures as pilots go live.
          </p>
        </Reveal>
        <Reveal className="home-gallery">
          {PHOTOS.map((p) => (
            <div className="media-tile" key={p.src}>
              <img src={p.src} alt={p.caption} loading="lazy" />
              <div className="media-caption">{p.caption}</div>
            </div>
          ))}
          {VIDEOS.map((v) => (
            <div className="media-tile" key={v.src}>
              <video src={v.src} autoPlay muted loop playsInline />
              <div className="media-caption">{v.caption}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
