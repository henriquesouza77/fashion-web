export type Category = "Feminino" | "Masculino" | "Acessórios";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  img: string;
  category: Category;
  /** Higher = mais recente. Usado para ordenar por novidade. */
  releasedAt: number;
  sizes: string[];
  colors: ColorOption[];
}

export const categories: Category[] = ["Feminino", "Masculino", "Acessórios"];

const APPAREL_SIZES = ["PP", "P", "M", "G", "GG"];
const ONE_SIZE = ["Único"];

export const products: Product[] = [
  {
    id: "casaco-la-oversized",
    name: "Casaco de Lã Oversized",
    price: 459.9,
    img: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80",
    category: "Feminino",
    releasedAt: 9,
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Camel", hex: "#b08d57" },
      { name: "Preto", hex: "#1a1a1a" },
      { name: "Off-white", hex: "#ede8df" },
    ],
  },
  {
    id: "vestido-midi-plissado",
    name: "Vestido Midi Plissado",
    price: 299.9,
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    category: "Feminino",
    releasedAt: 7,
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Vinho", hex: "#5e2230" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
  },
  {
    id: "blusa-trico-canelada",
    name: "Blusa de Tricô Canelada",
    price: 179.9,
    img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
    category: "Feminino",
    releasedAt: 11,
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Bege", hex: "#d8c3a5" },
      { name: "Verde Musgo", hex: "#4b5320" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
  },
  {
    id: "camisa-linho",
    name: "Camisa de Linho",
    price: 199.9,
    img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    category: "Masculino",
    releasedAt: 6,
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Branco", hex: "#f5f5f0" },
      { name: "Azul Claro", hex: "#a9c4d6" },
    ],
  },
  {
    id: "blazer-alfaiataria",
    name: "Blazer de Alfaiataria",
    price: 529.9,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    category: "Masculino",
    releasedAt: 12,
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Grafite", hex: "#3a3a3a" },
      { name: "Marinho", hex: "#1f2a44" },
    ],
  },
  {
    id: "calca-chino",
    name: "Calça Chino Slim",
    price: 249.9,
    img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    category: "Masculino",
    releasedAt: 4,
    sizes: APPAREL_SIZES,
    colors: [
      { name: "Caqui", hex: "#9a8568" },
      { name: "Preto", hex: "#1a1a1a" },
      { name: "Marinho", hex: "#1f2a44" },
    ],
  },
  {
    id: "bolsa-estruturada",
    name: "Bolsa Estruturada",
    price: 389.9,
    img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    category: "Acessórios",
    releasedAt: 8,
    sizes: ONE_SIZE,
    colors: [
      { name: "Caramelo", hex: "#a05a2c" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
  },
  {
    id: "oculos-acetato",
    name: "Óculos de Acetato",
    price: 159.9,
    img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    category: "Acessórios",
    releasedAt: 10,
    sizes: ONE_SIZE,
    colors: [
      { name: "Tartaruga", hex: "#6b4423" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
  },
  {
    id: "cinto-couro",
    name: "Cinto de Couro",
    price: 129.9,
    img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80",
    category: "Acessórios",
    releasedAt: 3,
    sizes: ["85", "90", "95", "100"],
    colors: [
      { name: "Marrom", hex: "#5a3a22" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
  },
];

export const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
