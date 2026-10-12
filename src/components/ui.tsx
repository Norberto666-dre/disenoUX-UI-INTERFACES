import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useApp } from "../context/AppContext";
import { money, num, round2 } from "../lib/format";

/* ---------------- Botón ---------------- */

export function Boton({
  children,
  onClick,
  variante = "primario",
  disabled,
  tipo = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "peligro" | "fantasma";
  disabled?: boolean;
  tipo?: "button" | "submit";
  className?: string;
}) {
  const estilos = {
    primario: "bg-campo-800 text-white hover:bg-campo-900",
    secundario: "bg-white dark:bg-stone-800 text-campo-900 dark:text-campo-200 border border-campo-700 dark:border-campo-400 hover:bg-campo-50 dark:hover:bg-campo-900/50",
    peligro: "bg-red-600 text-white hover:bg-red-700",
    fantasma: "text-campo-800 dark:text-campo-200 hover:bg-campo-50 dark:hover:bg-campo-900/50",
  }[variante];
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Campos de captura (§4.1) ---------------- */

function etiqueta(texto: string, obligatorio?: boolean) {
  return (
    <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-200">
      {texto}
      {obligatorio && <span className="ml-0.5 text-red-600">*</span>}
    </span>
  );
}

const clsInput =
  "w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2.5 text-base text-stone-900 dark:text-stone-100 outline-none transition focus:border-campo-600 focus:ring-2 focus:ring-campo-200 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-500 dark:disabled:text-stone-400";

export function Campo({
  etiqueta: texto,
  valor,
  onChange,
  obligatorio,
  error,
  placeholder,
  tipo = "text",
  disabled,
  autoComplete,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  obligatorio?: boolean;
  error?: string;
  placeholder?: string;
  tipo?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      {etiqueta(texto, obligatorio)}
      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={clsInput}
        aria-invalid={!!error}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function CampoNumero({
  etiqueta: texto,
  valor,
  onChange,
  obligatorio,
  error,
  sufijo,
  disabled,
  decimales = true,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  obligatorio?: boolean;
  error?: string;
  sufijo?: string;
  disabled?: boolean;
  decimales?: boolean;
}) {
  return (
    <label className="block">
      {etiqueta(texto, obligatorio)}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={valor}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
          onBlur={(e) => {
            const n = Number(e.target.value.replace(/,/g, "").replace(/\./g, (_m, i, s) => (s.indexOf(".") === i ? "." : "")));
            if (!Number.isNaN(n) && e.target.value !== "") {
              onChange(decimales ? String(round2(n)) : String(Math.round(n)));
            }
          }}
          className={`${clsInput} ${sufijo ? "pr-14" : ""}`}
        />
        {sufijo && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-500 dark:text-stone-400">
            {sufijo}
          </span>
        )}
      </div>
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function CampoImporte({
  etiqueta: texto,
  valor,
  onChange,
  obligatorio,
  error,
  moneda = "MXN",
  disabled,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  obligatorio?: boolean;
  error?: string;
  moneda?: string;
  disabled?: boolean;
}) {
  return (
    <CampoNumero
      etiqueta={texto}
      valor={valor}
      onChange={onChange}
      obligatorio={obligatorio}
      error={error}
      sufijo={moneda === "MXN" ? "$" : moneda}
      disabled={disabled}
    />
  );
}

export function SelectorFecha({
  etiqueta: texto,
  valor,
  onChange,
  obligatorio,
  error,
  min,
  disabled,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  obligatorio?: boolean;
  error?: string;
  min?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {etiqueta(texto, obligatorio)}
      <input
        type="date"
        value={valor}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={clsInput}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function SelectorBasico({
  etiqueta: texto,
  valor,
  onChange,
  opciones,
  obligatorio,
  error,
  placeholder = "Elige una opción",
  disabled,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: { valor: string; texto: string }[];
  obligatorio?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {etiqueta(texto, obligatorio)}
      <select
        value={valor}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={clsInput}
      >
        <option value="">{placeholder}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function SelectorSegmentado({
  etiqueta: texto,
  valor,
  onChange,
  opciones,
  obligatorio,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: { valor: string; texto: string }[];
  obligatorio?: boolean;
}) {
  return (
    <div>
      {etiqueta(texto, obligatorio)}
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => onChange(o.valor)}
            className={`min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
              valor === o.valor
                ? "border-campo-700 dark:border-campo-400 bg-campo-800 text-white"
                : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-campo-50 dark:hover:bg-campo-900/50"
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Hoja inferior (bottom sheet) ---------------- */

export function HojaInferior({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!abierto) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onCerrar}
      />
      <div className="relative z-10 max-h-[80vh] w-full max-w-md animate-slide-up overflow-hidden rounded-t-3xl bg-white dark:bg-stone-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-4 py-3">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-full p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Cerrar hoja"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-4 py-3 safe-bottom">{children}</div>
      </div>
    </div>
  );
}

export function SelectorCatalogo({
  etiqueta: texto,
  valor,
  onChange,
  opciones,
  obligatorio,
  error,
  buscarEn = "nombre",
  placeholder = "Elige…",
  disabled,
  onCrearNuevo,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: Record<string, unknown>[];
  obligatorio?: boolean;
  error?: string;
  buscarEn?: string;
  placeholder?: string;
  disabled?: boolean;
  onCrearNuevo?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const sel = opciones.find((o) => o.id === valor);
  const etiquetaSel = sel
    ? String(
        sel["etiquetaCompleta"] ?? sel[buscarEn] ?? sel["nombre"] ?? sel["id"] ?? "",
      )
    : "";

  const filtradas = opciones.filter((o) =>
    Object.values(o)
      .filter((v) => typeof v === "string")
      .some((v) => String(v).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      {etiqueta(texto, obligatorio)}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto(true)}
        className={`${clsInput} flex items-center justify-between text-left disabled:bg-stone-100 dark:disabled:bg-stone-800`}
      >
        <span className={etiquetaSel ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-500"}>
          {etiquetaSel || placeholder}
        </span>
        <span className="text-stone-400 dark:text-stone-500">▾</span>
      </button>
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
      <HojaInferior abierto={abierto} onCerrar={() => setAbierto(false)} titulo={texto}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className={clsInput}
        />
        <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
          {filtradas.map((o) => (
            <li key={String(o["id"])}>
              <button
                type="button"
                onClick={() => {
                  onChange(String(o["id"]));
                  setAbierto(false);
                  setQ("");
                }}
                className={`flex w-full items-center justify-between px-1 py-3 text-left text-sm ${
                  String(o["id"]) === valor ? "font-semibold text-campo-800 dark:text-campo-200" : "text-stone-800 dark:text-stone-100"
                }`}
              >
                <span>
                  {String(
                    o["etiquetaCompleta"] ?? o[buscarEn] ?? o["nombre"] ?? o["id"] ?? "",
                  )}
                </span>
                {String(o["id"]) === valor && <span>✓</span>}
              </button>
            </li>
          ))}
          {filtradas.length === 0 && (
            <li className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">Sin resultados</li>
          )}
        </ul>
        {onCrearNuevo && (
          <Boton variante="secundario" className="mt-3 w-full" onClick={() => { setAbierto(false); onCrearNuevo(); }}>
            + Crear nuevo
          </Boton>
        )}
      </HojaInferior>
    </div>
  );
}

/* ---------------- Guardar / resumen (§4.1) ---------------- */

export function BarraGuardar({
  children,
  resumen,
  deshabilitado,
}: {
  children: ReactNode;
  resumen?: ReactNode;
  deshabilitado?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md border-t border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-800/95 backdrop-blur safe-bottom">
      {resumen && <div className="border-b border-stone-100 dark:border-stone-800 px-4 py-2 text-sm">{resumen}</div>}
      <div className="px-4 py-3">
        <div className="[&>button]:w-full">{children}</div>
      </div>
      {deshabilitado && <span className="sr-only">Enviando</span>}
    </div>
  );
}

export function ResumenCalculo({
  capturado,
  calculado,
  etiquetaCalculo = "Calculado",
}: {
  capturado: number;
  calculado: number;
  etiquetaCalculo?: string;
}) {
  const dif = Math.abs(round2(capturado) - round2(calculado));
  const ok = dif <= 0.05;
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2 ${
        ok ? "bg-campo-50 dark:bg-campo-900/40 text-campo-900 dark:text-campo-200" : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
      }`}
    >
      <span className="text-sm">
        {ok ? "✓" : "⚠"} Total {etiquetaCalculo.toLowerCase()}: <b>{money(calculado)}</b>
      </span>
      <span className="text-sm font-semibold">Dif. {money(dif)}</span>
    </div>
  );
}

/* ---------------- Consulta y análisis (§4.2) ---------------- */

export function TarjetaKPI({
  etiqueta: texto,
  valor,
  variacion,
  tono = "neutro",
  sufijo,
}: {
  etiqueta: string;
  valor: string;
  variacion?: string;
  tono?: "positivo" | "negativo" | "neutro";
  sufijo?: string;
}) {
  const color = {
    positivo: "text-campo-700 dark:text-campo-300",
    negativo: "text-red-600",
    neutro: "text-stone-900 dark:text-stone-100",
  }[tono];
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">{texto}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>
        {valor}
        {sufijo && <span className="ml-0.5 text-sm font-semibold">{sufijo}</span>}
      </p>
      {variacion && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{variacion}</p>}
    </div>
  );
}

const coloresEstado: Record<string, string> = {
  Activo: "bg-campo-100 dark:bg-campo-900/60 text-campo-900 dark:text-campo-200",
  Planificado: "bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200",
  Suspendido: "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200",
  Finalizado: "bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-100",
  Cancelado: "bg-red-100 text-red-800 dark:text-red-300",
  Pendiente: "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200",
  Parcial: "bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200",
  Pagada: "bg-campo-100 dark:bg-campo-900/60 text-campo-900 dark:text-campo-200",
  Vencida: "bg-red-100 text-red-800 dark:text-red-300",
  Cancelada: "bg-red-100 text-red-800 dark:text-red-300",
  Editable: "bg-campo-100 dark:bg-campo-900/60 text-campo-900 dark:text-campo-200",
};

export function InsigniaEstado({ texto }: { texto: string }) {
  const clave = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${coloresEstado[clave] ?? "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100"}`}
    >
      {texto}
    </span>
  );
}

const severidadEstilo: Record<string, string> = {
  ALTA: "border-l-red-600 bg-red-50 dark:bg-red-950/40",
  MEDIA: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/40",
  BAJA: "border-l-sky-500 bg-sky-50 dark:bg-sky-950/40",
  INFORMATIVA: "border-l-stone-400 bg-stone-50",
};

export function TarjetaAlerta({
  severidad,
  titulo,
  mensaje,
  onIr,
}: {
  severidad: string;
  titulo: string;
  mensaje: string;
  onIr?: () => void;
}) {
  return (
    <div className={`rounded-2xl border border-stone-200 dark:border-stone-700 border-l-4 p-3 shadow-sm ${severidadEstilo[severidad] ?? ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{titulo}</p>
          <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-200">{mensaje}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-600 dark:text-stone-300">
          {severidad}
        </span>
      </div>
      {onIr && (
        <button onClick={onIr} className="mt-2 text-sm font-semibold text-campo-800 dark:text-campo-200 underline">
          Ver detalle
        </button>
      )}
    </div>
  );
}

/* ---------------- Estados del sistema (§4.3) ---------------- */

export function AvisoSoloLectura({ texto }: { texto: string }) {
  return (
    <div className="sticky top-0 z-20 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      🔒 {texto}
    </div>
  );
}

export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  confirmarTexto = "Confirmar",
  peligro,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  confirmarTexto?: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancelar} aria-label="Cancelar" />
      <div className="relative z-10 w-full max-w-sm animate-fade-in rounded-2xl bg-white dark:bg-stone-800 p-5 shadow-2xl">
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{titulo}</h2>
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">{mensaje}</p>
        <div className="mt-5 flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCancelar}>
            Cancelar
          </Boton>
          <Boton variante={peligro ? "peligro" : "primario"} className="flex-1" onClick={onConfirmar}>
            {confirmarTexto}
          </Boton>
        </div>
      </div>
    </div>
  );
}

export function EstadoVacio({
  mensaje,
  accionTexto,
  onAccion,
  icono = "🌾",
}: {
  mensaje: string;
  accionTexto?: string;
  onAccion?: () => void;
  icono?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-6 py-10 text-center">
      <span className="text-4xl">{icono}</span>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{mensaje}</p>
      {accionTexto && onAccion && (
        <Boton className="mt-4" onClick={onAccion}>
          {accionTexto}
        </Boton>
      )}
    </div>
  );
}

export function Esqueleto({ lineas = 3 }: { lineas?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: lineas }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-700" />
      ))}
    </div>
  );
}

export function AvisoError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300">
      <p className="font-semibold">No se pudo cargar la información.</p>
      <p className="mt-1">{mensaje}</p>
      {onReintentar && (
        <Boton variante="secundario" className="mt-3" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}

export function CapturaComprobante({
  valor,
  onChange,
}: {
  valor: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-200">Comprobante</span>
      {valor ? (
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 p-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white dark:bg-stone-800 text-2xl shadow-sm">
            🧾
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">{valor}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Foto adjunta</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 dark:bg-red-950/40"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Boton variante="secundario" onClick={() => onChange("foto-camara.jpg")}>
            📷 Tomar foto
          </Boton>
          <Boton variante="secundario" onClick={() => onChange("galeria-ticket.jpg")}>
            🖼 Galería
          </Boton>
        </div>
      )}
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">En el prototipo se adjunta un archivo simulado.</p>
    </div>
  );
}

/* ---------------- Encabezado de pantalla ---------------- */

export function TituloPantalla({
  titulo,
  subtitulo,
  volver,
  acciones,
}: {
  titulo: string;
  subtitulo?: string;
  volver?: () => void;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start gap-2">
      {volver && (
        <button
          onClick={volver}
          className="-ml-1 mt-0.5 rounded-full p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Volver"
        >
          ←
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">{subtitulo}</p>}
      </div>
      {acciones}
    </div>
  );
}

/* ---------------- Tabla simple ---------------- */

export function FilaDato({ etiqueta: texto, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 py-2 last:border-0">
      <span className="text-sm text-stone-500 dark:text-stone-400">{texto}</span>
      <span className="text-right text-sm font-medium text-stone-900 dark:text-stone-100">{valor ?? "—"}</span>
    </div>
  );
}

export function valorOpcional(n: number | null | undefined, formato: (n: number) => string) {
  return n == null ? "—" : formato(n);
}

/* ---------------- Modo día / noche ---------------- */

export function TemaInterruptor() {
  const { tema, alternarTema } = useApp();
  const oscuro = tema === "oscuro";
  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-pressed={oscuro}
      className="flex w-full items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 px-3 py-2.5"
    >
      <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
        {oscuro ? "🌙 Modo noche" : "☀️ Modo día"}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          oscuro ? "bg-campo-600" : "bg-stone-300 dark:bg-stone-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            oscuro ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export { money, num };
