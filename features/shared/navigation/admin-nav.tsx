export type AdminNavItem = {
  href: string;
  label: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "#users", label: "Usuarios" },
  { href: "#mercadopago", label: "Mercado Pago" },
  { href: "#stripe", label: "Stripe" },
];
