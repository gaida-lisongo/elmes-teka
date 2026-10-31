import Image from "next/image";

/** Capture réelle de l'application dans un cadre de navigateur. */
export default function ScreenFrame({ src, alt, url = "elmes-teka.vercel.app" }: { src: string; alt: string; url?: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl shadow-xl" style={{ border: "1px solid #DCE6F5", background: "#fff" }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#F2F6FC", borderBottom: "1px solid #DCE6F5" }}>
        <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-0.5 text-[11px] text-gray-500">{url}</span>
      </div>
      <a href={src} target="_blank" rel="noopener noreferrer" title="Agrandir la capture">
        <Image src={src} alt={alt} width={1366} height={860} sizes="(min-width: 1024px) 760px, 100vw" className="h-auto w-full" />
      </a>
    </figure>
  );
}
