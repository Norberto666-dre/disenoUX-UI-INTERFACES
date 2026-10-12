import type { ChangeEvent, ReactNode } from "react";

/* Fondo abstracto con degradado difuso en la paleta campo */
export function FondoCristal() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-gradient-to-br from-campo-950 via-campo-900 to-campo-700">
      <div className="absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-campo-400/30 blur-3xl" />
      <div className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] animate-float-slow rounded-full bg-campo-500/25 blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-96 w-96 animate-float-slower rounded-full bg-amber-300/15 blur-3xl" />
      <div className="absolute bottom-1/4 right-10 h-64 w-64 animate-float rounded-full bg-campo-300/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,rgba(10,61,28,0.55)_100%)]" />
    </div>
  );
}

/* Tarjeta de cristal esmerilado */
export function TarjetaCristal({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full max-w-md animate-fade-in rounded-[2rem] border border-white/25 bg-white/10 p-6 shadow-[0_25px_60px_-15px_rgba(10,61,28,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/20 via-transparent to-white/5" />
      <div className="relative">{children}</div>
    </div>
  );
}

const clsCristalInput =
  "w-full rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 text-base text-white placeholder-white/45 outline-none transition backdrop-blur-sm focus:border-campo-300 focus:ring-2 focus:ring-campo-300/40";

export function CampoCristal({
  etiqueta: texto,
  valor,
  onChange,
  tipo = "text",
  placeholder,
  autoComplete,
  error,
  obligatorio,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  obligatorio?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">
        {texto}
        {obligatorio && <span className="ml-0.5 text-red-300">*</span>}
      </span>
      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={clsCristalInput}
      />
      {error && <span className="mt-1 block text-sm text-red-200">{error}</span>}
    </label>
  );
}

export function SelectorCristal({
  etiqueta: texto,
  valor,
  onChange,
  opciones,
  error,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: { valor: string; texto: string }[];
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">{texto}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={`${clsCristalInput} [&>option]:text-stone-900`}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-sm text-red-200">{error}</span>}
    </label>
  );
}

export function BotonCristal({
  children,
  onClick,
  tipo = "button",
  disabled,
  variante = "solido",
}: {
  children: ReactNode;
  onClick?: () => void;
  tipo?: "button" | "submit";
  disabled?: boolean;
  variante?: "solido" | "linea";
}) {
  const estilos =
    variante === "solido"
      ? "bg-white text-campo-950 hover:bg-campo-50 shadow-lg shadow-campo-950/40"
      : "border border-white/35 text-white hover:bg-white/10";
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos}`}
    >
      {children}
    </button>
  );
}
