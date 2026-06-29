import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Package } from "lucide-react";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/pedido/")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — FASHION" },
      {
        name: "description",
        content: "Consulte o status do seu pedido pelo número e acompanhe a entrega.",
      },
    ],
  }),
  component: OrderLookupPage,
});

function OrderLookupPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const numero = value.trim().toUpperCase();
    if (!numero) return;
    navigate({ to: "/pedido/$numero", params: { numero } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-xl px-5 py-20 lg:py-28">
        <div className="flex flex-col items-center text-center">
          <Package className="h-12 w-12 text-foreground" strokeWidth={1.25} />
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Acompanhar pedido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Digite o número do seu pedido (ex.: FSH-AB12CD) para ver o andamento.
          </p>
        </div>
        <form onSubmit={submit} className="mt-8 flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="FSH-XXXXXX"
            className="w-full border border-border bg-background px-4 py-3 text-sm uppercase outline-none transition-colors focus:border-foreground"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-2 bg-primary px-5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:tracking-widest"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
