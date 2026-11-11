import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(15,92,92,0.35), transparent 42%), linear-gradient(0deg, rgba(11,31,36,0.72), rgba(11,31,36,0.28)), url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-end px-6 pb-16 pt-10 sm:justify-center sm:pb-24">
        <p className="fade-in font-display text-4xl text-white sm:text-6xl md:text-7xl">
          DevisRapide IA
        </p>
        <h1 className="slide-up mt-4 max-w-xl text-lg text-white/90 sm:text-2xl">
          Un devis artisan en moins de deux minutes — dictée, catalogue, PDF.
        </h1>
        <p className="slide-up mt-3 max-w-lg text-sm text-white/75 sm:text-base">
          Mobile-first. Calculs HT/TVA/TTC déterministes. L’IA n’invente jamais un
          prix.
        </p>
        <div className="slide-up mt-8 flex flex-wrap gap-3">
          <Link href="/connexion" className="btn-primary bg-accent px-6 py-3 text-base">
            Créer un devis
          </Link>
          <Link
            href="/inscription"
            className="btn-secondary border-white/30 bg-white/10 text-white backdrop-blur"
          >
            Compte SaaS
          </Link>
        </div>
      </div>
    </main>
  );
}
