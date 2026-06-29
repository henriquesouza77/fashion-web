import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useReveal } from "@/hooks/use-reveal";

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Por favor, informe seu e-mail." })
  .email({ message: "Digite um e-mail válido." })
  .max(255, { message: "E-mail muito longo." });

export function PromoBanner() {
  const reveal = useReveal<HTMLDivElement>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      const message = result.error.issues[0].message;
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setSent(true);
    toast.success("Inscrição confirmada!", {
      description: "Seu cupom de 15% foi enviado para o seu e-mail.",
    });
  };

  return (
    <section className="bg-primary text-primary-foreground">
      <div
        ref={reveal.ref}
        className={`${reveal.className} mx-auto max-w-3xl px-5 py-20 text-center lg:py-28`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">
          Oferta de Boas-vindas
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
          15% de desconto na
          <br /> primeira compra
        </h2>
        <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
          Assine nossa newsletter e receba o cupom em primeira mão, além de
          novidades e lançamentos exclusivos.
        </p>

        {sent ? (
          <p className="mt-8 text-lg font-medium">Obrigado! Seu cupom está a caminho ✦</p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mx-auto mt-8 max-w-md">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 text-left">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Seu melhor e-mail"
                  aria-label="E-mail"
                  aria-invalid={!!error}
                  className={`w-full border bg-transparent px-4 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none ${
                    error
                      ? "border-destructive"
                      : "border-primary-foreground/30 focus:border-primary-foreground"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="bg-primary-foreground px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary transition-all duration-300 hover:bg-primary-foreground/90 hover:tracking-widest"
              >
                Assinar
              </button>
            </div>
            {error && (
              <p className="mt-2 text-left text-sm text-destructive-foreground/90" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
