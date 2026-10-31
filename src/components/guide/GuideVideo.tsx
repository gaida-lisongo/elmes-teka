/** Démonstration vidéo enregistrée sur la plateforme réelle. */
export default function GuideVideo({ src, poster, title }: { src: string; poster: string | null; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: "#0B1E39", border: "1px solid rgba(57,136,255,0.3)" }}>
      <video
        className="aspect-[16/10] w-full"
        controls
        playsInline
        preload="metadata"
        poster={poster ?? undefined}
        aria-label={`Démonstration vidéo : ${title}`}
      >
        <source src={src} type="video/mp4" />
        Votre navigateur ne lit pas les vidéos.
      </video>
    </div>
  );
}
