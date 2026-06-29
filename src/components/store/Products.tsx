import { useMemo, useState } from "react";
import { Heart, ShoppingBag, SearchX, Check } from "lucide-react";
import { toast } from "sonner";
import { useReveal } from "@/hooks/use-reveal";
import { useStore } from "@/lib/store-context";
import { products, categories, formatPrice, type Category, type Product } from "@/lib/products";

type SortKey = "novidade" | "menor-preco" | "maior-preco";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "novidade", label: "Novidades" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite, addToCart, setCartOpen } = useStore();
  const fav = isFavorite(product.id);

  const [size, setSize] = useState<string>(product.sizes.length === 1 ? product.sizes[0] : "");
  const [color, setColor] = useState<string>(
    product.colors.length === 1 ? product.colors[0].name : "",
  );

  const handleFavorite = () => {
    toggleFavorite(product.id);
    toast(fav ? "Removido dos favoritos" : "Adicionado aos favoritos", {
      description: product.name,
    });
  };

  const handleAdd = () => {
    if (!size) {
      toast.error("Selecione um tamanho", { description: product.name });
      return;
    }
    if (!color) {
      toast.error("Selecione uma cor", { description: product.name });
      return;
    }
    addToCart(product, { size, color });
    toast.success("Adicionado ao carrinho", {
      description: `${product.name} — ${size} / ${color}`,
      action: { label: "Ver", onClick: () => setCartOpen(true) },
    });
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={product.img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <button
          aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
          aria-pressed={fav}
          onClick={handleFavorite}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition-colors ${
            fav
              ? "bg-destructive text-destructive-foreground"
              : "bg-white/90 text-foreground hover:bg-white hover:text-destructive"
          }`}
        >
          <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
        {product.category}
      </p>
      <h3 className="mt-0.5 text-sm font-medium">{product.name}</h3>
      <p className="mt-1 text-sm font-bold">{formatPrice(product.price)}</p>

      {/* Seleção de cor */}
      {product.colors.length > 1 && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            {product.colors.map((c) => {
              const selected = color === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={`Cor ${c.name}`}
                  aria-pressed={selected}
                  onClick={() => setColor(c.name)}
                  className={`grid h-6 w-6 place-items-center rounded-full border transition-all ${
                    selected ? "border-foreground ring-1 ring-foreground" : "border-border"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selected && (
                    <Check className="h-3 w-3 text-white mix-blend-difference" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seleção de tamanho */}
      {product.sizes.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.sizes.map((s) => {
            const selected = size === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => setSize(s)}
                className={`min-w-9 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/60 hover:border-foreground/40"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleAdd}
        className="mt-3 flex items-center justify-center gap-2 bg-primary py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:tracking-widest"
      >
        <ShoppingBag className="h-4 w-4" />
        Adicionar
      </button>
    </div>
  );
}

export function Products() {
  const reveal = useReveal<HTMLDivElement>();
  const {
    search,
    category: activeCategory,
    setCategory,
    favoritesOnly,
    setFavoritesOnly,
    isFavorite,
  } = useStore();

  const [sort, setSort] = useState<SortKey>("novidade");

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = products.filter((p) => {
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      const matchesQuery =
        query === "" ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);
      const matchesFavorites = !favoritesOnly || isFavorite(p.id);
      return matchesCategory && matchesQuery && matchesFavorites;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "novidade":
          return b.releasedAt - a.releasedAt;
        case "menor-preco":
          return a.price - b.price;
        case "maior-preco":
          return b.price - a.price;
      }
    });

    return list;
  }, [activeCategory, sort, search, favoritesOnly, isFavorite]);

  const filters: (Category | "Todos")[] = ["Todos", ...categories];

  return (
    <section id="produtos" className="bg-sand text-sand-foreground">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="mb-8 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Mais Vendidos
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Produtos em Destaque
          </h2>
          {search.trim() !== "" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Resultados para <span className="font-semibold text-foreground">“{search}”</span>
            </p>
          )}
        </div>

        {/* Filtros + ordenação */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setFavoritesOnly(false);
                  }}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/60 text-foreground/80 hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              aria-pressed={favoritesOnly}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                favoritesOnly
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background/60 text-foreground/80 hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              <Heart className="h-4 w-4" fill={favoritesOnly ? "currentColor" : "none"} />
              Favoritos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-muted-foreground">
              Ordenar:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium outline-none transition-colors focus:border-foreground"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">
              Nenhum produto encontrado para a sua seleção.
            </p>
          </div>
        ) : (
          <div
            ref={reveal.ref}
            className={`${reveal.className} grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4`}
          >
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
