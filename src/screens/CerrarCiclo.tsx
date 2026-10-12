import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { indicadoresCiclo, saldoVenta, ventasActivas } from "../lib/calc";
import { fecha, hoyIso, money } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  DialogoConfirmacion,
  EstadoVacio,
  SelectorFecha,
  TituloPantalla,
} from "../components/ui";

export default function CerrarCiclo() {
  const { id = "" } = useParams();
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const ciclo = db.ciclos.find((c) => c.id === id);
  const [fechaFin, setFechaFin] = useState(hoyIso());
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!ciclo) return <EstadoVacio mensaje="Ciclo no encontrado." />;

  const ind = indicadoresCiclo(db, ciclo.id);
  const ventasConSaldo = ventasActivas(db, ciclo.id).filter((v) => saldoVenta(db, v) > 0);

  const cerrar = () => {
    setEnviando(true);
    actualizar((prev) => ({
      ...prev,
      ciclos: prev.ciclos.map((c) =>
        c.id === ciclo.id
          ? { ...c, estado: "FINALIZADO" as const, fechaFin, cerradoEn: hoyIso(), cerradoPorId: sesion?.usuarioId ?? null }
          : c,
      ),
      parcelas: prev.parcelas.map((p) =>
        p.id === ciclo.parcelaId ? { ...p, estado: "DISPONIBLE" as const } : p,
      ),
    }));
    registrar("CERRAR_CICLO", "Ciclo", ciclo.id, "Activo", "Finalizado");
    notificar("Ciclo finalizado. La parcela quedó disponible.");
    window.setTimeout(() => navegar(`/ciclos/${ciclo.id}`), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Cierre de ciclo" subtitulo={ciclo.nombre} volver={() => navegar(-1)} />

      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Resumen de rentabilidad
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Dato etiqueta="Costo total" valor={money(ind.costoTotal)} />
          <Dato etiqueta="Ingresos" valor={money(ind.ingresos)} />
          <Dato
            etiqueta="Ganancia"
            valor={money(ind.ganancia)}
            rojo={ind.ganancia < 0}
          />
          <Dato etiqueta="Costo por kg" valor={ind.costoPorKg == null ? "—" : money(ind.costoPorKg)} />
          <Dato etiqueta="Kg cosechados" valor={`${Math.round(ind.kgCosechados).toLocaleString("es-MX")} kg`} />
          <Dato etiqueta="Por cobrar" valor={money(ind.porCobrar)} />
        </div>
      </div>

      {ventasConSaldo.length > 0 && (
        <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4">
          <p className="font-bold text-red-800 dark:text-red-300">⚠ Ventas con saldo pendiente</p>
          <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
            {ventasConSaldo.map((v) => {
              const cliente = db.clientes.find((c) => c.id === v.clienteId);
              return (
                <li key={v.id}>
                  {cliente?.nombre} ({v.numeroFactura}): {money(saldoVenta(db, v))}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-red-700 dark:text-red-300">
            Podrás seguir registrando cobros después de cerrar.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <SelectorFecha etiqueta="Fecha de fin" valor={fechaFin} onChange={setFechaFin} obligatorio />
        <Campo
          etiqueta="Motivo del cierre"
          valor=""
          onChange={() => undefined}
          disabled
          placeholder="Cierre normal de temporada"
        />
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        Al finalizar se bloquea la captura de actividades, gastos, cosechas, mermas y ventas. Se
        libera la parcela y queda registro en la bitácora.
      </div>

      <BarraGuardar>
        <Boton variante="peligro" onClick={() => setConfirmar(true)} disabled={enviando}>
          Finalizar ciclo
        </Boton>
      </BarraGuardar>

      <DialogoConfirmacion
        abierto={confirmar}
        titulo="¿Finalizar este ciclo?"
        mensaje={`Se cerrará "${ciclo.nombre}" con fecha ${fecha(fechaFin)}. Después de cerrar solo podrás registrar cobros.`}
        confirmarTexto="Sí, finalizar"
        peligro
        onConfirmar={cerrar}
        onCancelar={() => setConfirmar(false)}
      />
    </div>
  );
}

function Dato({ etiqueta: t, valor, rojo }: { etiqueta: string; valor: string; rojo?: boolean }) {
  return (
    <div>
      <p className="text-xs text-stone-500 dark:text-stone-400">{t}</p>
      <p className={`font-bold ${rojo ? "text-red-600" : "text-stone-900 dark:text-stone-100"}`}>{valor}</p>
    </div>
  );
}
