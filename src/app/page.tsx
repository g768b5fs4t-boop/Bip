import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(15,92,92,0.18), transparent 40%), linear-gradient(0deg, rgba(11,31,36,0.55), rgba(11,31,36,0.25)), url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-end px-6 pb-16 pt-10 sm:justify-center sm:pb-24">
        <p className="fade-in font-display text-4xl text-white sm:text-6xl md:text-7xl">
          DevisRapide IA
        </p>
        <h1 className="slide-up mt-4 max-w-xl text-lg text-white/90 sm:text-2xl">
          Créez vos devis artisans en conversant — à partir de votre catalogue
          fournisseurs.
        </h1>
        <p className="slide-up mt-3 max-w-lg text-sm text-white/75 sm:text-base">
          Démo locale gratuite, sans carte bancaire. Les calculs HT / TVA / TTC
          sont déterministes.
        </p>
        <div className="slide-up mt-8 flex flex-wrap gap-3">
          <Link href="/connexion" className="btn-primary bg-accent px-6 py-3">
            Essayer la démo
          </Link>
        </div>
      </div>
    </main>
  );
}
