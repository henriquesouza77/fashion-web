import { jsPDF } from "jspdf";
import type { CartItem } from "@/lib/store-context";
import { formatPrice } from "@/lib/products";

interface ReceiptOptions {
  items: CartItem[];
  subtotal: number;
  shipping?: number;
  discount?: number;
  couponCode?: string;
  orderId?: string;
}

/**
 * Gera e baixa um resumo do carrinho/pedido em PDF.
 */
export function generateCartPdf({
  items,
  subtotal,
  shipping = 0,
  discount = 0,
  couponCode,
  orderId,
}: ReceiptOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 64;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FASHION", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Resumo do Pedido", marginX, y + 18);

  const dateStr = new Date().toLocaleString("pt-BR");
  doc.text(dateStr, pageWidth - marginX, y, { align: "right" });
  if (orderId) {
    doc.text(`Pedido ${orderId}`, pageWidth - marginX, y + 18, { align: "right" });
  }

  y += 48;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 28;

  // Cabeçalho da tabela
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Produto", marginX, y);
  doc.text("Qtd", pageWidth - marginX - 160, y, { align: "right" });
  doc.text("Preço", pageWidth - marginX - 80, y, { align: "right" });
  doc.text("Total", pageWidth - marginX, y, { align: "right" });
  y += 12;
  doc.setDrawColor(235);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  // Itens
  doc.setFont("helvetica", "normal");
  items.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    doc.setTextColor(40);
    const label = item.name.length > 38 ? `${item.name.slice(0, 38)}…` : item.name;
    doc.text(label, marginX, y);
    doc.text(String(item.quantity), pageWidth - marginX - 160, y, { align: "right" });
    doc.text(formatPrice(item.price), pageWidth - marginX - 80, y, { align: "right" });
    doc.text(formatPrice(lineTotal), pageWidth - marginX, y, { align: "right" });
    // Variação
    if (item.size || item.color) {
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(`${item.size ?? ""} · ${item.color ?? ""}`, marginX, y + 12);
      doc.setFontSize(10);
    }
    y += item.size || item.color ? 30 : 22;
  });

  y += 6;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 26;

  // Totais
  const total = subtotal - discount + shipping;
  const labelX = pageWidth - marginX - 130;
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text("Subtotal", labelX, y, { align: "right" });
  doc.setTextColor(40);
  doc.text(formatPrice(subtotal), pageWidth - marginX, y, { align: "right" });
  y += 18;

  if (discount > 0) {
    doc.setTextColor(110);
    doc.text(`Desconto${couponCode ? ` (${couponCode})` : ""}`, labelX, y, { align: "right" });
    doc.setTextColor(40);
    doc.text(`- ${formatPrice(discount)}`, pageWidth - marginX, y, { align: "right" });
    y += 18;
  }

  doc.setTextColor(110);
  doc.text("Frete", labelX, y, { align: "right" });
  doc.setTextColor(40);
  doc.text(shipping === 0 ? "Grátis" : formatPrice(shipping), pageWidth - marginX, y, {
    align: "right",
  });
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", labelX, y, { align: "right" });
  doc.text(formatPrice(total), pageWidth - marginX, y, { align: "right" });

  // Rodapé
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    "Obrigado pela sua compra! • FASHION Store",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 40,
    { align: "center" },
  );

  doc.save(`fashion-pedido${orderId ? `-${orderId}` : ""}.pdf`);
}
