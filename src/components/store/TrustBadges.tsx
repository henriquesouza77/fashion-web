import { Truck, RefreshCw, ShieldCheck } from "lucide-react";

const badges = [
  { icon: Truck, title: "Frete Grátis", desc: "Acima de R$ 299" },
  { icon: RefreshCw, title: "Troca Facilitada", desc: "Até 30 dias" },
  { icon: ShieldCheck, title: "Pagamento Seguro", desc: "Compra protegida" },
];

export function TrustBadges() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {badges.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center justify-center gap-3 px-5 py-5">
            <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
