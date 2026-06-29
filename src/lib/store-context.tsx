import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product, Category } from "@/lib/products";

export interface CartVariation {
  size: string;
  color: string;
}

export interface CartItem extends Product {
  quantity: number;
  /** Variação escolhida (tamanho/cor). */
  size: string;
  color: string;
  /** Chave única no carrinho: id + variação. */
  cartKey: string;
}

export const makeCartKey = (id: string, size: string, color: string) =>
  `${id}__${size}__${color}`;

interface StoreContextValue {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  favoritesCount: number;

  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, variation: CartVariation) => void;
  increment: (cartKey: string) => void;
  decrement: (cartKey: string) => void;
  removeFromCart: (cartKey: string) => void;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  search: string;
  setSearch: (value: string) => void;

  category: Category | "Todos";
  setCategory: (value: Category | "Todos") => void;

  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;

  clearCart: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const FAV_KEY = "fashion.favorites";
const CART_KEY = "fashion.cart";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "Todos">("Todos");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (client only).
  useEffect(() => {
    setFavorites(readStorage<string[]>(FAV_KEY, []));
    // Migra itens antigos sem cartKey/variação.
    const storedCart = readStorage<CartItem[]>(CART_KEY, []).map((i) => {
      const size = i.size ?? "Único";
      const color = i.color ?? "Padrão";
      return { ...i, size, color, cartKey: i.cartKey ?? makeCartKey(i.id, size, color) };
    });
    setCart(storedCart);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const value = useMemo<StoreContextValue>(() => {
    const toggleFavorite = (id: string) =>
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
      );

    const addToCart = (product: Product, variation: CartVariation) =>
      setCart((prev) => {
        const cartKey = makeCartKey(product.id, variation.size, variation.color);
        const existing = prev.find((i) => i.cartKey === cartKey);
        if (existing) {
          return prev.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [
          ...prev,
          { ...product, quantity: 1, size: variation.size, color: variation.color, cartKey },
        ];
      });

    const increment = (cartKey: string) =>
      setCart((prev) =>
        prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i)),
      );

    const decrement = (cartKey: string) =>
      setCart((prev) =>
        prev
          .map((i) => (i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      );

    const removeFromCart = (cartKey: string) =>
      setCart((prev) => prev.filter((i) => i.cartKey !== cartKey));

    const clearCart = () => setCart([]);

    return {
      favorites,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite,
      favoritesCount: favorites.length,
      cart,
      cartCount: cart.reduce((sum, i) => sum + i.quantity, 0),
      cartTotal: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      addToCart,
      increment,
      decrement,
      removeFromCart,
      clearCart,
      cartOpen,
      setCartOpen,
      search,
      setSearch,
      category,
      setCategory,
      favoritesOnly,
      setFavoritesOnly,
    };
  }, [favorites, cart, cartOpen, search, category, favoritesOnly]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
