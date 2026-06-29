import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/store/Header";
import { Hero } from "@/components/store/Hero";
import { TrustBadges } from "@/components/store/TrustBadges";
import { Categories } from "@/components/store/Categories";
import { Products } from "@/components/store/Products";
import { PromoBanner } from "@/components/store/PromoBanner";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FASHION — Nova Coleção Outono/Inverno" },
      {
        name: "description",
        content:
          "Loja de moda premium e minimalista. Descubra a nova coleção Outono/Inverno com peças atemporais, frete grátis e troca facilitada.",
      },
      { property: "og:title", content: "FASHION — Nova Coleção Outono/Inverno" },
      {
        property: "og:description",
        content: "Moda premium e minimalista. Peças atemporais que definem o seu estilo.",
      },
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TrustBadges />
        <Categories />
        <Products />
        <PromoBanner />
      </main>
      <Footer />
    </div>
  );
}
