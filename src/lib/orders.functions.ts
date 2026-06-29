import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { products } from "@/lib/products";

const FREE_SHIPPING_THRESHOLD = 300;
const SHIPPING_FEE = 24.9;

const itemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1).max(99),
  size: z.string().max(20),
  color: z.string().max(40),
});

const customerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().max(30).optional().default(""),
  cep: z.string().max(12),
  street: z.string().min(2).max(160),
  number: z.string().min(1).max(20),
  complement: z.string().max(80).optional().default(""),
  neighborhood: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  state: z.string().min(2).max(2),
});

type PricedItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
};

function priceItems(items: z.infer<typeof itemSchema>[]): PricedItem[] {
  return items.map((i) => {
    const product = products.find((p) => p.id === i.id);
    if (!product) throw new Error(`Produto inválido: ${i.id}`);
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    };
  });
}

type CouponRow = {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  min_subtotal: number;
  active: boolean;
};

function computeTotals(subtotal: number, coupon: CouponRow | null) {
  let discount = 0;
  let freeShipping = false;

  if (coupon) {
    if (coupon.type === "percent") discount = (subtotal * coupon.value) / 100;
    else if (coupon.type === "fixed") discount = coupon.value;
    else if (coupon.type === "free_shipping") freeShipping = true;
  }
  discount = Math.min(discount, subtotal);
  const discounted = subtotal - discount;
  const shipping =
    freeShipping || discounted >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = discounted + shipping;

  return {
    discount: Math.round(discount * 100) / 100,
    shipping,
    total: Math.round(total * 100) / 100,
  };
}

async function fetchCoupon(code: string): Promise<CouponRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("coupons")
    .select("code, type, value, min_subtotal, active")
    .eq("code", code.trim().toUpperCase())
    .eq("active", true)
    .maybeSingle();
  return (data as CouponRow | null) ?? null;
}

/** Valida um cupom contra o subtotal e devolve o impacto no total. */
export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ code: z.string().min(1).max(40), subtotal: z.number().min(0) }).parse(input),
  )
  .handler(async ({ data }) => {
    const coupon = await fetchCoupon(data.code);
    if (!coupon) {
      return { valid: false as const, message: "Cupom inválido ou expirado." };
    }
    if (data.subtotal < coupon.min_subtotal) {
      return {
        valid: false as const,
        message: `Este cupom exige subtotal mínimo de R$ ${coupon.min_subtotal.toFixed(2)}.`,
      };
    }
    const totals = computeTotals(data.subtotal, coupon);
    return {
      valid: true as const,
      code: coupon.code,
      type: coupon.type,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
    };
  });

/** Cria o pedido (status pendente) e devolve o número do pedido. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        items: z.array(itemSchema).min(1),
        customer: customerSchema,
        couponCode: z.string().max(40).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const priced = priceItems(data.items);
    const subtotal = priced.reduce((s, i) => s + i.price * i.quantity, 0);

    let coupon: CouponRow | null = null;
    if (data.couponCode) {
      const c = await fetchCoupon(data.couponCode);
      if (c && subtotal >= c.min_subtotal) coupon = c;
    }
    const totals = computeTotals(subtotal, coupon);

    const orderNumber = `FSH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").insert({
      order_number: orderNumber,
      items: priced,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      coupon_code: coupon?.code ?? null,
      customer: data.customer,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    return {
      orderNumber,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
    };
  });

/**
 * Confirma o pagamento do pedido (marca como pago).
 * Ponto de integração do webhook Stripe — hoje confirma a compra concluída.
 */
export const confirmOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ orderNumber: z.string().min(3).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("order_number", data.orderNumber)
      .eq("status", "pending")
      .select("order_number, status")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return { ok: false as const };
    return { ok: true as const };
  });

/** Consulta pública do status do pedido pelo número. */
export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ orderNumber: z.string().min(3).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, items, subtotal, discount, shipping, total, coupon_code, status, customer, created_at",
      )
      .eq("order_number", data.orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (!order) return { found: false as const };

    const customer = (order.customer ?? {}) as Record<string, string>;
    return {
      found: true as const,
      order: {
        orderNumber: order.order_number,
        items: order.items as PricedItem[],
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping),
        total: Number(order.total),
        couponCode: order.coupon_code as string | null,
        status: order.status as string,
        createdAt: order.created_at as string,
        customerName: customer.name ?? "",
        city: customer.city ?? "",
        state: customer.state ?? "",
      },
    };
  });
