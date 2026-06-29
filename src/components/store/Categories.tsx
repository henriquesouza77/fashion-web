import { useReveal } from "@/hooks/use-reveal";

const categories = [
  {
    name: "Feminino",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Masculino",
    img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Acessórios",
    img: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=80",
  },
];

export function Categories() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="mb-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Explore
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Categorias em Destaque
        </h2>
      </div>

      <div ref={reveal.ref} className={`${reveal.className} grid grid-cols-1 gap-5 md:grid-cols-3`}>
        {categories.map((cat) => (
          <a
            key={cat.name}
            href="#produtos"
            className="group relative block aspect-[3/4] overflow-hidden"
          >
            <img
              src={cat.img}
              alt={`Categoria ${cat.name}`}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="text-xl font-bold text-white">{cat.name}</h3>
              <span className="mt-1 inline-block text-sm font-medium text-white/80 transition-all duration-300 group-hover:tracking-wider">
                Ver coleção →
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
