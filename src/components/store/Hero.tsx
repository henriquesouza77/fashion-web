export function Hero() {
  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80"
        alt="Modelo vestindo a nova coleção outono inverno"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 lg:px-8">
        <div className="max-w-xl text-primary-foreground">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            Edição Limitada
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Nova Coleção
            <br />
            Outono / Inverno
          </h1>
          <p className="mt-5 max-w-md text-base text-white/85 sm:text-lg">
            Peças atemporais com caimento impecável. Descubra o essencial que
            define o seu estilo nesta estação.
          </p>
          <a
            href="#produtos"
            className="mt-8 inline-flex items-center justify-center bg-white px-8 py-4 text-sm font-semibold uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-white/90 hover:tracking-widest"
          >
            Comprar Agora
          </a>
        </div>
      </div>
    </section>
  );
}
