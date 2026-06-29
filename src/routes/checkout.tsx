import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  FileDown,
  CheckCircle2,
  ShoppingBag,
  Tag,
  Loader2,
  CreditCard,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/products";
import { generateCartPdf } from "@/lib/cart-pdf";
import { createOrder, confirmOrderPayment, validateCoupon } from "@/lib/orders.functions";
import type { CartItem } from "@/lib/store-context";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — FASHION" },
      {
        name: "description",
        content: "Revise os itens, informe seu endereço, aplique cupom e finalize a compra.",
      },
    ],
  }),
  component: CheckoutPage,
});

const FREE_SHIPPING_THRESHOLD = 300;
const SHIPPING_FEE = 24.9;

const maskCep = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
const maskPhone = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");

const addressSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  email: z.string().trim().email("E-mail inválido."),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone inválido."),
  cep: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length === 8, "CEP deve ter 8 dígitos."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().max(80).optional().default(""),
  neighborhood: z.string().trim().min(1, "Informe o bairro."),
  city: z.string().trim().min(1, "Informe a cidade."),
  state: z
    .string()
    .trim()
    .refine((v) => /^[A-Za-z]{2}$/.test(v), "UF deve ter 2 letras."),
});

type FormState = z.infer<typeof addressSchema>;
type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

interface AppliedCoupon {
  code: string;
  discount: number;
  shipping: number;
  total: number;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, increment, decrement, removeFromCart, clearCart } = useStore();

  const createOrderFn = useServerFn(createOrder);
  const confirmPaymentFn = useServerFn(confirmOrderPayment);
  const validateCouponFn = useServerFn(validateCoupon);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [cepLoading, setCepLoading] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [placing, setPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<{
    orderNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    shipping: number;
    couponCode: string | null;
  } | null>(null);
  const [order, setOrder] = useState<{
    orderNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    shipping: number;
    couponCode: string | null;
  } | null>(null);

  // Recalcula em tempo real: subtotal, desconto, frete, total.
  const discount = coupon ? Math.min(coupon.discount, cartTotal) : 0;
  const discounted = cartTotal - discount;
  const freeShippingFromCoupon = coupon?.shipping === 0 && coupon.discount === 0;
  const shippingCost =
    freeShippingFromCoupon || discounted >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = discounted + shippingCost;
  const shippingLabel = shippingCost === 0 ? "Grátis" : formatPrice(shippingCost);
  const shippingMessage =
    shippingCost === 0
      ? "Frete grátis aplicado ao pedido."
      : `Frete fixo calculado para o endereço: ${formatPrice(shippingCost)}.`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment") ?? params.get("status") ?? params.get("stripe");
    if (status === "cancelled" || status === "canceled" || status === "cancelado") {
      setPaymentError("Pagamento cancelado no Stripe. Revise o pedido e tente novamente.");
    }
    if (status === "failed" || status === "falhou" || status === "erro") {
      setPaymentError("O Stripe recusou ou interrompeu o pagamento. Tente novamente.");
    }
  }, []);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado." }));
        return;
      }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
      setErrors((prev) => ({ ...prev, cep: undefined }));
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const result = await validateCouponFn({ data: { code, subtotal: cartTotal } });
      if (!result.valid) {
        setCoupon(null);
        setCouponError(result.message);
        return;
      }
      setCoupon({
        code: result.code,
        discount: result.discount,
        shipping: result.shipping,
        total: result.total,
      });
      toast.success("Cupom aplicado!", { description: result.code });
    } catch {
      setCouponError("Não foi possível validar o cupom.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handlePay = async () => {
    setPaymentError("");
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Verifique os campos do endereço.");
      return;
    }

    setPlacing(true);
    try {
      const created = await createOrderFn({
        data: {
          items: cart.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          customer: {
            ...parsed.data,
            state: parsed.data.state.toUpperCase(),
          },
          couponCode: coupon?.code ?? "",
        },
      });

      const createdOrder = {
        orderNumber: created.orderNumber,
        items: cart,
        subtotal: created.subtotal,
        discount: created.discount,
        shipping: created.shipping,
        couponCode: coupon?.code ?? null,
      };
      setPendingPaymentOrder(createdOrder);

      // Confirmação do pagamento (ponto de integração do webhook Stripe).
      const payment = await confirmPaymentFn({ data: { orderNumber: created.orderNumber } });
      if (!payment.ok) throw new Error("Pagamento não confirmado. Tente novamente.");

      setOrder(createdOrder);
      setPendingPaymentOrder(null);
      clearCart();
      toast.success("Pagamento confirmado!", {
        description: `Pedido ${created.orderNumber}`,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Pagamento falhou ou foi cancelado. Tente novamente.";
      setPaymentError(message);
      toast.error("Não foi possível finalizar o pagamento.", {
        description: message,
      });
    } finally {
      setPlacing(false);
    }
  };

  const retryPayment = async () => {
    if (!pendingPaymentOrder) {
      await handlePay();
      return;
    }

    setPlacing(true);
    setPaymentError("");
    try {
      const payment = await confirmPaymentFn({
        data: { orderNumber: pendingPaymentOrder.orderNumber },
      });
      if (!payment.ok) throw new Error("Pagamento não confirmado. Tente novamente.");
      setOrder(pendingPaymentOrder);
      setPendingPaymentOrder(null);
      clearCart();
      toast.success("Pagamento confirmado!", {
        description: `Pedido ${pendingPaymentOrder.orderNumber}`,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Pagamento falhou ou foi cancelado. Tente novamente.";
      setPaymentError(message);
      toast.error("Pagamento não confirmado.", { description: message });
    } finally {
      setPlacing(false);
    }
  };

  // Tela de confirmação
  if (order) {
    const orderTotal = order.subtotal - order.discount + order.shipping;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center lg:py-28">
          <CheckCircle2 className="h-16 w-16 text-foreground" strokeWidth={1.25} />
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Pedido confirmado!</h1>
          <p className="mt-2 text-muted-foreground">
            Pagamento aprovado. O número do seu pedido é{" "}
            <span className="font-semibold text-foreground">{order.orderNumber}</span>.
          </p>

          <div className="mt-8 w-full border border-border bg-card p-6 text-left">
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.cartKey} className="flex justify-between py-3 text-sm">
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
                <span>{formatPrice(orderTotal)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={() =>
                generateCartPdf({
                  items: order.items,
                  subtotal: order.subtotal,
                  shipping: order.shipping,
                  discount: order.discount,
                  couponCode: order.couponCode ?? undefined,
                  orderId: order.orderNumber,
                })
              }
              className="flex flex-1 items-center justify-center gap-2 bg-primary py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:tracking-widest"
            >
              <FileDown className="h-4 w-4" />
              Baixar comprovante (PDF)
            </button>
            <Link
              to="/pedido/$numero"
              params={{ numero: order.orderNumber }}
              className="flex flex-1 items-center justify-center border border-border py-3.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Acompanhar pedido
            </Link>
          </div>
          <Link to="/" className="mt-4 text-sm text-muted-foreground hover:text-foreground">
            Voltar à loja
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const fieldClass = (key: keyof FormState) =>
    `w-full border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground ${
      errors[key] ? "border-destructive" : "border-border"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuar comprando
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Checkout</h1>

        {cart.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
            >
              Ver produtos
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Coluna esquerda: itens + endereço */}
            <div className="space-y-10">
              {/* Itens */}
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Revise seus itens
                </h2>
                <ul className="divide-y divide-border border-y border-border">
                  {cart.map((item) => (
                    <li key={item.cartKey} className="flex gap-4 py-5">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="h-28 shrink-0 object-cover"
                        style={{ width: "5.5rem" }}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              {item.category}
                            </p>
                            <h3 className="text-sm font-medium">{item.name}</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.size} · {item.color}
                            </p>
                          </div>
                          <button
                            aria-label="Remover item"
                            onClick={() => removeFromCart(item.cartKey)}
                            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-border">
                            <button
                              aria-label="Diminuir quantidade"
                              onClick={() => decrement(item.cartKey)}
                              className="grid h-8 w-8 place-items-center transition-colors hover:bg-accent"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              aria-label="Aumentar quantidade"
                              onClick={() => increment(item.cartKey)}
                              className="grid h-8 w-8 place-items-center transition-colors hover:bg-accent"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Endereço de entrega */}
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Endereço de entrega
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" error={errors.name} className="sm:col-span-2">
                    <input
                      className={fieldClass("name")}
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="Seu nome"
                    />
                  </Field>
                  <Field label="E-mail" error={errors.email}>
                    <input
                      className={fieldClass("email")}
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="voce@email.com"
                      inputMode="email"
                    />
                  </Field>
                  <Field label="Telefone" error={errors.phone}>
                    <input
                      className={fieldClass("phone")}
                      value={form.phone}
                      onChange={(e) => setField("phone", maskPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                    />
                  </Field>
                  <Field label="CEP" error={errors.cep}>
                    <div className="relative">
                      <input
                        className={fieldClass("cep")}
                        value={form.cep}
                        onChange={(e) => setField("cep", maskCep(e.target.value))}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        inputMode="numeric"
                      />
                      {cepLoading && (
                        <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </Field>
                  <Field label="Número" error={errors.number}>
                    <input
                      className={fieldClass("number")}
                      value={form.number}
                      onChange={(e) => setField("number", e.target.value)}
                      placeholder="123"
                    />
                  </Field>
                  <Field label="Rua" error={errors.street} className="sm:col-span-2">
                    <input
                      className={fieldClass("street")}
                      value={form.street}
                      onChange={(e) => setField("street", e.target.value)}
                      placeholder="Rua / Avenida"
                    />
                  </Field>
                  <Field label="Complemento (opcional)" error={errors.complement}>
                    <input
                      className={fieldClass("complement")}
                      value={form.complement}
                      onChange={(e) => setField("complement", e.target.value)}
                      placeholder="Apto, bloco…"
                    />
                  </Field>
                  <Field label="Bairro" error={errors.neighborhood}>
                    <input
                      className={fieldClass("neighborhood")}
                      value={form.neighborhood}
                      onChange={(e) => setField("neighborhood", e.target.value)}
                      placeholder="Bairro"
                    />
                  </Field>
                  <Field label="Cidade" error={errors.city}>
                    <input
                      className={fieldClass("city")}
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Cidade"
                    />
                  </Field>
                  <Field label="UF" error={errors.state}>
                    <input
                      className={fieldClass("state")}
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Resumo do pedido</h2>

              {paymentError && (
                <div className="mt-5 border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Pagamento não concluído</p>
                      <p className="mt-1 text-xs">{paymentError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={retryPayment}
                    disabled={placing}
                    className="mt-3 flex w-full items-center justify-center gap-2 border border-destructive/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-destructive/10 disabled:opacity-60"
                  >
                    {placing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Cupom */}
              <div className="mt-5">
                <label htmlFor="coupon" className="text-sm text-muted-foreground">
                  Cupom de desconto
                </label>
                {coupon ? (
                  <div className="mt-2 flex items-center justify-between border border-border bg-accent/40 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <Tag className="h-4 w-4" />
                      {coupon.code}
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="coupon"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Ex.: BEMVINDO10"
                        className="w-full border border-border bg-background px-3 py-2 text-sm uppercase outline-none transition-colors focus:border-foreground"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        className="shrink-0 border border-border px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1.5 text-xs text-destructive">{couponError}</p>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Desconto</span>
                    <span>- {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span>{shippingLabel}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-5 border border-border bg-background/60 p-4 text-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Revisão final
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Itens</span>
                    <span className="font-medium">{cart.length}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Entrega</span>
                    <span className="text-right font-medium">
                      {form.cep
                        ? `${form.cep}${form.city ? ` - ${form.city}/${form.state}` : ""}`
                        : "Informe o CEP"}
                    </span>
                  </div>
                  <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                    {shippingMessage}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={placing}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-primary py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:tracking-widest disabled:opacity-60"
              >
                {placing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {placing ? "Processando…" : "Pagar e finalizar"}
              </button>
              <button
                onClick={() =>
                  generateCartPdf({
                    items: cart,
                    subtotal: cartTotal,
                    shipping: shippingCost,
                    discount,
                    couponCode: coupon?.code,
                  })
                }
                className="mt-2 flex w-full items-center justify-center gap-2 border border-border py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <FileDown className="h-4 w-4" />
                Baixar resumo em PDF
              </button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
