import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CreditCard,
  PackageCheck,
  Truck,
  Home,
  XCircle,
  Loader2,
  SearchX,
} from "lucide-react";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { formatPrice } from "@/lib/products";
import { getOrderStatus } from "@/lib/orders.functions";

export const Route = createFileRoute("/pedido/$numero")({
  head: ({ params }) => ({
    meta: [
      { title: `Pedido ${params.numero} — FASHION` },
      { name: "description", content: "Status e andamento do seu pedido na FASHION." },
    ],
  }),
  component: OrderStatusPage,
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-muted-foreground">Não foi possível carregar o pedido.</p>
      </main>
      <Footer />
    </div>
  ),
});

const STEPS = [
  { key: "paid", label: "Pago", icon: CreditCard },
  { key: "separacao", label: "Em separação", icon: PackageCheck },
  { key: "enviado", label: "Enviado", icon: Truck },
  { key: "entregue", label: "Entregue", icon: Home },
] as const;

const statusLabel: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function OrderStatusPage() {
  const { numero } = Route.useParams();
  const router = useRouter();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["order", numero],
    queryFn: () => getOrderStatus({ data: { orderNumber: numero } }),
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        <Link
          to="/pedido"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Buscar outro pedido
        </Link>

        {isLoading ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando pedido…</p>
          </div>
        ) : !data?.found ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
            <h1 className="text-xl font-bold">Pedido não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              Verifique o número <span className="font-semibold">{numero}</span> e tente novamente.
            </p>
            <button
              onClick={() => router.invalidate()}
              className="mt-2 border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <OrderDetail order={data.order} isFetching={isFetching} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function OrderDetail({
  order,
  isFetching,
}: {
  order: NonNullable<Awaited<ReturnType<typeof getOrderStatus>>["order"]>;
  isFetching: boolean;
}) {
  const cancelado = order.status === "cancelado";
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);
  const date = new Date(order.createdAt).toLocaleString("pt-BR");

  return (
    <>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pedido {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Realizado em {date}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            cancelado ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-foreground"
          }`}
        >
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Circle className={`h-2.5 w-2.5 ${isFetching ? "animate-pulse" : ""}`} />
        Acompanhamento em tempo real ativo.
      </p>

      {/* Linha do tempo */}
      {cancelado ? (
        <div className="mt-8 flex items-center gap-3 border border-destructive/30 bg-destructive/5 p-5">
          <XCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm">Este pedido foi cancelado.</p>
        </div>
      ) : (
        <div className="mt-10">
          <ol className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STEPS.map((step, i) => {
              const done = currentIndex >= i && currentIndex >= 0;
              const Icon = done ? CheckCircle2 : step.icon;
              return (
                <li key={step.key} className="flex flex-col items-center gap-2 text-center">
                  <span className="relative flex w-full items-center justify-center">
                    {i > 0 && (
                      <span
                        className={`absolute right-1/2 top-1/2 h-px w-full -translate-y-1/2 ${
                          currentIndex >= i ? "bg-foreground" : "bg-border"
                        }`}
                      />
                    )}
                    <span
                      className={`relative grid h-11 w-11 place-items-center rounded-full border ${
                        done
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          {order.status === "pending" && (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Circle className="h-3 w-3 animate-pulse" />
              Aguardando confirmação do pagamento.
            </p>
          )}
        </div>
      )}

      {/* Itens */}
      <div className="mt-10 border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Itens
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((item, idx) => (
            <li key={`${item.id}-${idx}`} className="flex justify-between py-3 text-sm">
              <span>
                {item.name}{" "}
                <span className="text-muted-foreground">
                  ({item.size} · {item.color}) ×{item.quantity}
                </span>
              </span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Desconto {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>- {formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Frete</span>
            <span>{order.shipping === 0 ? "Grátis" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
        {(order.customerName || order.city) && (
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            Entrega para {order.customerName}
            {order.city ? ` — ${order.city}/${order.state}` : ""}
          </p>
        )}
      </div>
    </>
  );
}
