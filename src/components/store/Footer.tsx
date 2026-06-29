import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";

const columns = [
  {
    title: "Sobre Nós",
    links: ["Nossa História", "Sustentabilidade", "Lojas", "Trabalhe Conosco"],
  },
  {
    title: "Atendimento ao Cliente",
    links: ["FAQ", "Trocas e Devoluções", "Entregas", "Contato"],
  },
  {
    title: "Categorias",
    links: ["Feminino", "Masculino", "Acessórios", "Novidades"],
  },
];

const socials = [Instagram, Facebook, Twitter, Youtube];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="text-2xl font-extrabold tracking-tight">
              FASHION<span className="text-muted-foreground">.</span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Moda atemporal e atemporal para quem valoriza o essencial bem feito.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Rede social"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FASHION. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Termos de Uso · Política de Privacidade
          </p>
        </div>
      </div>
    </footer>
  );
}
