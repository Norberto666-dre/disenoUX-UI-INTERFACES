import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { diasEntre, fecha, hoyIso } from "../lib/format";
import { Boton, Campo, FilaDato, HojaInferior, TituloPantalla } from "../components/ui";
import type { Plan } from "../types";

type Marca = "si" | "no";

interface FilaPlan {
  grupo: string;
  etiqueta: string;
  valores: [Marca | string, Marca | string, Marca | string];
}

const FILAS: FilaPlan[] = [
  { grupo: "Trabajo de campo", etiqueta: "Ciclos de cultivo (crear y cerrar)", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Capturas: actividad, gasto, cosecha y merma", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Predios, parcelas y catálogos", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Proveedores", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Reabrir ciclos cerrados", valores: ["no", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Ventas, cobros y clientes", valores: ["si", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Cancelar ventas", valores: ["si", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Cuentas por cobrar (Finanzas)", valores: ["si", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Editar gastos de otros usuarios", valores: ["no", "si", "si"] },
  { grupo: "Reportes y alertas", etiqueta: "Tablero con indicadores", valores: ["si", "si", "si"] },
  { grupo: "Reportes y alertas", etiqueta: "Alertas de la operación", valores: ["no", "si", "si"] },
  { grupo: "Reportes y alertas", etiqueta: "Exportar reportes (CSV)", valores: ["no", "no", "si"] },
  { grupo: "Gestión", etiqueta: "Alta de cuentas administradoras", valores: ["si", "si", "si"] },
  { grupo: "Gestión", etiqueta: "Datos de la empresa y cambio de plan", valores: ["si", "si", "si"] },
  { grupo: "Límites", etiqueta: "Parcelas activas", valores: ["3", "10", "30"] },
  { grupo: "Límites", etiqueta: "Usuarios", valores: ["2", "5", "15"] },
  { grupo: "Límites", etiqueta: "Precio por mes", valores: ["$299", "$599", "$999"] },
];

function Celda({ v }: { v: Marca | string }) {
  if (v === "si") return <span className="font-bold text-campo-700 dark:text-campo-300">✓</span>;
  if (v === "no") return <span className="font-bold text-stone-300 dark:text-stone-600">✗</span>;
  return <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-200">{v}</span>;
}

function sumar30(iso: string | null): string {
  const base = iso ? new Date(iso + "T00:00:00") : new Date();
  base.setDate(base.getDate() + 30);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}

export default function Planes() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const empresa = db.empresa;
  const planActual = db.planes.find((p) => p.id === empresa.planId);
  const parcelas = db.parcelas.filter((p) => p.activo).length;
  const usuarios = db.usuarios.length;
  const diasRestantes =
    empresa.suscripcionVence !== null ? diasEntre(hoyIso(), empresa.suscripcionVence) : null;
  const esAdmin = sesion?.rol === "ADMIN";

  const [destino, setDestino] = useState<Plan | null>(null);
  const [paso, setPaso] = useState<"resumen" | "pago">("resumen");
  const [procesando, setProcesando] = useState(false);
  const [tarjeta, setTarjeta] = useState({ titular: "", numero: "", vence: "", cvv: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const nuevaVence = empresa.suscripcionVence === null ? hoyIso() : sumar30(empresa.suscripcionVence);

  const abrirCambio = (p: Plan) => {
    if (p.id === empresa.planId) return;
    if (parcelas > p.maxParcelas || usuarios > p.maxUsuarios) {
      notificar(
        `No puedes cambiar al plan ${p.nombre}: usas ${parcelas} parcelas y ${usuarios} usuario(s), y solo permite ${p.maxParcelas} / ${p.maxUsuarios}.`,
        "error",
      );
      return;
    }
    setTarjeta({ titular: "", numero: "", vence: "", cvv: "" });
    setErrores({});
    setPaso("resumen");
    setDestino(p);
  };

  const cerrarHoja = () => {
    if (procesando) return;
    setDestino(null);
    setPaso("resumen");
  };

  const validarPago = () => {
    const e: Record<string, string> = {};
    if (!tarjeta.titular.trim()) e.titular = "Captura el nombre del titular.";
    const digitos = tarjeta.numero.replace(/\D/g, "");
    if (digitos.length < 12 || digitos.length > 19) e.numero = "Debe tener de 12 a 16 dígitos.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(tarjeta.vence)) e.vence = "Usa el formato MM/AA.";
    if (!/^\d{3,4}$/.test(tarjeta.cvv)) e.cvv = "El CVV tiene 3 o 4 dígitos.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const pagar = () => {
    if (!destino || procesando) return;
    if (!validarPago()) return;
    setProcesando(true);
    window.setTimeout(() => {
      const anterior = planActual?.nombre ?? "—";
      const destinoRef = destino;
      actualizar((prev) => ({
        ...prev,
        empresa: { ...prev.empresa, planId: destinoRef.id, suscripcionVence: nuevaVence },
      }));
      registrar("CAMBIAR_PLAN", "Empresa", destinoRef.id, anterior, destinoRef.nombre);
      notificar(`¡Pago aplicado! Tu empresa ahora está en el plan ${destinoRef.nombre}.`);
      setProcesando(false);
      setDestino(null);
      setPaso("resumen");
    }, 600);
  };

  const agrupadas: { grupo: string; filas: FilaPlan[] }[] = [];
  for (const f of FILAS) {
    const ultima = agrupadas[agrupadas.length - 1];
    if (ultima && ultima.grupo === f.grupo) ultima.filas.push(f);
    else agrupadas.push({ grupo: f.grupo, filas: [f] });
  }

  return (
    <div className="pb-28">
      <TituloPantalla
        titulo="Planes"
        subtitulo="Funciones y límites de cada plan"
        volver={() => navegar(-1)}
      />

      <div className="mb-4 rounded-2xl border border-campo-300 dark:border-campo-700 bg-campo-50 dark:bg-campo-900/50 p-4 shadow-sm">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-campo-800 dark:text-campo-200">
            Tu plan actual
          </h2>
          <span className="rounded-full bg-campo-800 px-3 py-0.5 text-xs font-bold text-white">
            {planActual?.nombre ?? "—"}
          </span>
        </div>
        <FilaDato etiqueta="Precio" valor={`$${planActual?.precioMensual ?? 0} / mes`} />
        <FilaDato etiqueta="Parcelas" valor={`${parcelas} de ${planActual?.maxParcelas ?? 0} en uso`} />
        <FilaDato etiqueta="Usuarios" valor={`${usuarios} de ${planActual?.maxUsuarios ?? 0} en uso`} />
        <FilaDato
          etiqueta="Suscripción"
          valor={
            empresa.suscripcionVence === null
              ? "Sin fecha"
              : `${fecha(empresa.suscripcionVence)}${
                  diasRestantes !== null ? ` · ${diasRestantes} día(s) restante(s)` : ""
                }`
          }
        />
      </div>

      <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
        Las funciones disponibles combinan tu <strong>rol</strong> con tu <strong>plan</strong>: aquí
        se muestran las que tu plan habilita para cualquier rol.
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="grid grid-cols-[1fr_2.6rem_2.6rem_2.6rem] items-end gap-x-1 border-b border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/60">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Función
          </span>
          {["Bás.", "Prod.", "Prof."].map((c, i) => (
            <span
              key={c}
              className={`text-center text-[11px] font-bold uppercase ${
                i === 1 ? "text-campo-800 dark:text-campo-200" : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
        {agrupadas.map((g) => (
          <div key={g.grupo}>
            <div className="border-b border-stone-100 bg-stone-50/70 px-3 py-1.5 dark:border-stone-800 dark:bg-stone-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {g.grupo}
              </span>
            </div>
            {g.filas.map((f) => (
              <div
                key={f.etiqueta}
                className="grid grid-cols-[1fr_2.6rem_2.6rem_2.6rem] items-center gap-x-1 border-b border-stone-100 px-3 py-2 last:border-b-0 dark:border-stone-800"
              >
                <span className="pr-1 text-xs text-stone-700 dark:text-stone-200">{f.etiqueta}</span>
                {f.valores.map((v, i) => (
                  <span key={i} className="text-center">
                    <Celda v={v} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {db.planes.map((p: Plan) => {
          const esActual = p.id === empresa.planId;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                esActual
                  ? "border-campo-400 bg-campo-50 dark:border-campo-700 dark:bg-campo-900/50"
                  : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100">{p.nombre}</h3>
                {esActual ? (
                  <span className="rounded-full bg-campo-800 px-3 py-0.5 text-xs font-bold text-white">
                    Tu plan
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                <strong className="text-lg text-stone-900 dark:text-stone-100">${p.precioMensual}</strong> / mes
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Hasta {p.maxParcelas} parcelas · {p.maxUsuarios} usuarios ·{" "}
                {p.incluyeReportes ? "reportes y alertas incluidos" : "sin reportes ni alertas"}
              </p>
              {esActual ? null : esAdmin ? (
                <Boton variante="secundario" className="mt-3 w-full" onClick={() => abrirCambio(p)}>
                  Cambiar a {p.nombre}
                </Boton>
              ) : null}
            </div>
          );
        })}
      </div>

      {!esAdmin && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Solo el administrador puede comprar o cambiar el plan. Pídele el cambio a tu administrador.
        </p>
      )}

      <HojaInferior
        abierto={destino !== null}
        onCerrar={cerrarHoja}
        titulo={paso === "resumen" ? `Cambiar al plan ${destino?.nombre ?? ""}` : "Pago (demo)"}
      >
        {destino && paso === "resumen" && (
          <div className="space-y-3 pb-6">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-700 dark:bg-stone-900/50">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-stone-100">{destino.nombre}</span>
                <span className="font-bold text-campo-800 dark:text-campo-200">
                  ${destino.precioMensual} / mes
                </span>
              </div>
              <FilaDato etiqueta="Ahora" valor={planActual?.nombre ?? "—"} />
              <FilaDato etiqueta="Parcelas" valor={`${destino.maxParcelas} (${parcelas} en uso)`} />
              <FilaDato etiqueta="Usuarios" valor={`${destino.maxUsuarios} (${usuarios} en uso)`} />
              <FilaDato etiqueta="Reportes y alertas" valor={destino.incluyeReportes ? "Incluidos" : "Sin incluir"} />
              <FilaDato etiqueta="Próxima renovación" valor={fecha(nuevaVence)} />
            </div>
            <p className="rounded-xl border border-campo-300 bg-campo-50 px-3 py-2 text-xs text-campo-800 dark:border-campo-700 dark:bg-campo-900/50 dark:text-campo-200">
              Las funciones y límites del nuevo plan se aplican de inmediato en toda la app.
            </p>
            <Boton className="w-full" onClick={() => setPaso("pago")}>
              Continuar al pago de ${destino.precioMensual}
            </Boton>
          </div>
        )}

        {destino && paso === "pago" && (
          <div className="space-y-3 pb-6">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              🧪 Pago simulado para demostración: no se realiza ningún cargo real.
            </p>
            <Campo
              etiqueta="Titular de la tarjeta"
              valor={tarjeta.titular}
              onChange={(v) => setTarjeta((t) => ({ ...t, titular: v }))}
              placeholder="Nombre como aparece en la tarjeta"
              error={errores.titular}
              obligatorio
            />
            <Campo
              etiqueta="Número de tarjeta"
              valor={tarjeta.numero}
              onChange={(v) => setTarjeta((t) => ({ ...t, numero: v.replace(/[^\d ]/g, "").slice(0, 19) }))}
              placeholder="4242 4242 4242 4242"
              tipo="tel"
              autoComplete="cc-number"
              error={errores.numero}
              obligatorio
            />
            <div className="grid grid-cols-2 gap-3">
              <Campo
                etiqueta="Vence"
                valor={tarjeta.vence}
                onChange={(v) => setTarjeta((t) => ({ ...t, vence: v.slice(0, 5) }))}
                placeholder="MM/AA"
                tipo="tel"
                error={errores.vence}
                obligatorio
              />
              <Campo
                etiqueta="CVV"
                valor={tarjeta.cvv}
                onChange={(v) => setTarjeta((t) => ({ ...t, cvv: v.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="123"
                tipo="tel"
                autoComplete="cc-csc"
                error={errores.cvv}
                obligatorio
              />
            </div>
            <Boton className="w-full" onClick={pagar} disabled={procesando}>
              {procesando ? "Procesando…" : `Pagar $${destino.precioMensual} / mes`}
            </Boton>
            <Boton variante="fantasma" className="w-full" onClick={() => setPaso("resumen")} disabled={procesando}>
              Volver al resumen
            </Boton>
          </div>
        )}
      </HojaInferior>
    </div>
  );
}
