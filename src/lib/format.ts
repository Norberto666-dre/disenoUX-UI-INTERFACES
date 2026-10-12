/** Redondeo "mitad hacia arriba" con 2 decimales (RN-066). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function money(n: number, moneda = "MXN"): string {
  const v = round2(n);
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const s = abs.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return moneda === "MXN" ? `${sign}$${s}` : `${sign}${s} ${moneda}`;
}

export function kg(n: number): string {
  return `${Math.round(n).toLocaleString("es-MX")} kg`;
}

export function num(n: number, dec = 2): string {
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export function pct(n: number): string {
  return `${round2(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function fecha(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${meses[m - 1]} ${y}`;
}

export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function diasEntre(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00").getTime();
  const b = new Date(isoB + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

export function haceMenosDe48h(creadoEn: string): boolean {
  const t = new Date(creadoEn).getTime();
  return Date.now() - t < 48 * 3600 * 1000;
}

export function uid(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
