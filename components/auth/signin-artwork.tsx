export function SignInArtwork({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src={src} alt="" className="size-full object-cover brightness-[0.58]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(6_79_112_/_0.72),rgb(6_35_53_/_0.82))]" />
      <div className="absolute -left-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
    </div>
  )
}
