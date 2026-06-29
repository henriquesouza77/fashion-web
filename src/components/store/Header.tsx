import { useEffect, useRef, useState } from "react";
import { Search, Heart, ShoppingBag, Menu, X, Package } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore } from "@/lib/store-context";

import type { Category } from "@/lib/products";

const navLinks: { label: string; category: Category | "Todos" }[] = [
  { label: "Início", category: "Todos" },
  { label: "Feminino", category: "Feminino" },
  { label: "Masculino", category: "Masculino" },
  { label: "Acessórios", category: "Acessórios" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const {
    favoritesCount,
    cartCount,
    setCartOpen,
    search,
    setSearch,
    setCategory,
    setFavoritesOnly,
  } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";

  const scrollToProducts = () => {
    const el = document.getElementById("produtos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate({ to: "/", hash: "produtos" });
    }
  };

  const handleNav = (category: Category | "Todos") => {
    setCategory(category);
    setFavoritesOnly(false);
    setOpen(false);
    if (category === "Todos") {
      if (onHome) window.scrollTo({ top: 0, behavior: "smooth" });
      else navigate({ to: "/" });
    } else {
      scrollToProducts();
    }
  };

  const handleFavorites = () => {
    setFavoritesOnly(true);
    scrollToProducts();
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.trim() !== "") {
      scrollToProducts();
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || searchOpen
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "bg-background/0"
      }`}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:h-20 lg:px-8">
        <button
          onClick={() => handleNav("Todos")}
          className="justify-self-start text-xl font-extrabold tracking-tight sm:text-2xl"
        >
          FASHION<span className="text-muted-foreground">.</span>
        </button>

        <nav className="hidden items-center justify-center gap-9 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link.category)}
              className="relative text-sm font-medium text-foreground/80 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 hover:text-foreground hover:after:origin-left hover:after:scale-x-100"
            >
              {link.label}
            </button>
          ))}
        </nav>


        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            aria-label="Buscar"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-full p-2 transition-colors hover:bg-accent"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/pedido"
            aria-label="Acompanhar pedido"
            className="rounded-full p-2 transition-colors hover:bg-accent"
          >
            <Package className="h-5 w-5" />
          </Link>
          <button
            aria-label="Favoritos"
            onClick={handleFavorites}
            className="relative rounded-full p-2 transition-colors hover:bg-accent"
          >
            <Heart className="h-5 w-5" />
            {favoritesCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {favoritesCount}
              </span>
            )}
          </button>
          <button
            aria-label="Carrinho"
            onClick={() => setCartOpen(true)}
            className="relative rounded-full p-2 transition-colors hover:bg-accent"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 transition-colors hover:bg-accent md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-background px-5 py-3 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar produtos por nome ou categoria…"
              className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                aria-label="Limpar busca"
                onClick={() => setSearch("")}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-5 py-3 md:hidden">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link.category)}
              className="rounded-md px-2 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
