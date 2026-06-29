import { Minus, Plus, Trash2, ShoppingBag, FileDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/products";
import { generateCartPdf } from "@/lib/cart-pdf";

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    cartOpen,
    setCartOpen,
    cartCount,
    cartTotal,
    increment,
    decrement,
    removeFromCart,
  } = useStore();

  const goToCheckout = () => {
    setCartOpen(false);
    navigate({ to: "/checkout" });
  };

  const downloadPdf = () =>
    generateCartPdf({ items: cart, subtotal: cartTotal });


  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="text-base font-semibold uppercase tracking-wider">
            Carrinho ({cartCount})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ul className="divide-y divide-border">
              {cart.map((item) => (
                <li key={item.cartKey} className="flex gap-4 py-4">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-24 w-20 shrink-0 object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium leading-snug">{item.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.size} · {item.color}
                        </p>
                      </div>
                      <button
                        aria-label="Remover item"
                        onClick={() => removeFromCart(item.cartKey)}
                        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
                    <div className="mt-auto flex items-center gap-3">
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
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {cart.length > 0 && (
          <SheetFooter className="border-t border-border px-6 py-5">
            <div className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold">{formatPrice(cartTotal)}</span>
              </div>
              <button
                onClick={goToCheckout}
                className="w-full bg-primary py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:tracking-widest"
              >
                Finalizar Compra
              </button>
              <button
                onClick={downloadPdf}
                className="mt-2 flex w-full items-center justify-center gap-2 border border-border py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <FileDown className="h-4 w-4" />
                Baixar resumo em PDF
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
