import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SelectorCiclo } from "../components/SelectorCiclo";
import { round2, hoyIso, money, uid } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoImporte,
  CampoNumero,
  CapturaComprobante,
  ResumenCalculo,
  SelectorBasico,
  SelectorCatalogo,
  SelectorFecha,
  TituloPantalla,
} from "../components/ui";

export default function FormGasto() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();

  const [cicloId, setCicloId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [categoriaId, setCategoriaId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [actividadId, setActividadId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidadId, setUnidadId] = useState("un1");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [impuesto, setImpuesto] = useState("");
  const [totalPagado, setTotalPagado] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [adjunto, setAdjunto] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const ciclo = db.ciclos.find((c) => c.id === cicloId);
  const bloqueado = !ciclo || (ciclo.estado !== "ACTIVO" && ciclo.estado !== "SUSPENDIDO");

  const categorias = useMemo(
    () =>
      db.categoriasGasto
        .filter((c) => c.parentId)
        .map((c) => ({
          id: c.id,
          etiquetaCompleta: `${db.categoriasGasto.find((p) => p.id === c.parentId)?.nombre ?? ""} → ${c.nombre}`,
        })),
    [db.categoriasGasto],
  );

  const actividadesDelCiclo = db.actividades
    .filter((a) => a.cicloId === cicloId && a.estado === "ACTIVA")
    .map((a) => {
      const t = db.tiposActividad.find((x) => x.id === a.tipoActividadId);
      return { id: a.id, etiquetaCompleta: `${t?.nombre ?? ""} ${a.fecha}` };
    });

  const proveedores = db.proveedores
    .filter((p) => p.activo)
    .map((p) => ({ id: p.id, etiquetaCompleta: p.nombre }));

  const unidades = db.unidades.map((u) => ({ valor: u.id, texto: `${u.nombre} (${u.abrev})` }));

  const cantidadN = Number(cantidad.replace(/,/g, "")) || 0;
  const costoN = Number(costoUnitario.replace(/,/g, "")) || 0;
  const impN = Number(impuesto.replace(/,/g, "")) || 0;
  const totalN = Number(totalPagado.replace(/,/g, "")) || 0;
  const calculado = round2(cantidadN * costoN + impN);

  const unidadSel = db.unidades.find((u) => u.id === unidadId);
  const conversion = unidadSel && unidadSel.factorKg > 0 ? cantidadN * unidadSel.factorKg : null;

  const validar = () => {
    const e: Record<string, string> = {};
    if (!cicloId) e.cicloId = "Elige el ciclo.";
    else if (bloqueado) e.cicloId = "El ciclo no admite captura (RN-015).";
    if (!fecha) e.fecha = "Captura la fecha.";
    else if (ciclo && fecha < ciclo.fechaInicio) e.fecha = "No puede ser anterior al inicio del ciclo.";
    if (!categoriaId) e.categoriaId = "Elige la categoría.";
    if (!descripcion.trim()) e.descripcion = "Captura el concepto.";
    if (!cantidadN || cantidadN <= 0) e.cantidad = "Debe ser mayor a 0.";
    if (!costoN || costoN < 0) e.costoUnitario = "Captura el costo unitario.";
    if (totalN <= 0) e.totalPagado = "Captura el total pagado.";
    else if (Math.abs(totalN - calculado) > 0.05)
      e.totalPagado = `No coincide con cantidad × costo + impuesto (${money(calculado)}). El total es el dato que manda (RN-045).`;
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    setEnviando(true);
    const id = uid("g");
    const adjuntoId = adjunto ? uid("adj") : null;
    actualizar((prev) => ({
      ...prev,
      gastos: [
        ...prev.gastos,
        {
          id,
          cicloId,
          fecha,
          categoriaId,
          proveedorId: proveedorId || null,
          actividadId: actividadId || null,
          descripcion: descripcion.trim(),
          cantidad: cantidadN,
          unidadId,
          costoUnitario: costoN,
          impuesto: impN,
          totalPagado: totalN,
          comprobante: comprobante.trim() || null,
          adjunto,
          creadoPorId: sesion?.usuarioId ?? "",
          creadoEn: new Date().toISOString().slice(0, 19),
          estado: "ACTIVO" as const,
        },
      ],
      adjuntos: adjunto
        ? [
            ...prev.adjuntos,
            {
              id: adjuntoId ?? uid("adj"),
              entidad: "GASTO",
              entidadId: id,
              nombreArchivo: adjunto,
              tipoMime: adjunto.endsWith(".png") ? "image/png" : "image/jpeg",
              tamanoBytes: 0,
              claveAlmacenamiento: `gastos/${id}/${adjunto}`,
              creadoEn: new Date().toISOString().slice(0, 19),
            },
          ]
        : prev.adjuntos,
    }));
    registrar("CREAR", "Gasto", id, null, money(totalN));
    notificar("Gasto registrado.");
    window.setTimeout(() => navegar(cicloId ? `/ciclos/${cicloId}` : "/"), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nuevo gasto" subtitulo="Insumos, mano de obra y servicios" volver={() => navegar(-1)} />

      <div className="space-y-5">
        {/* Contexto */}
        <section>
          <SelectorCiclo valor={cicloId} onChange={setCicloId} error={errores.cicloId} />
          <div className="mt-4">
            <SelectorFecha
              etiqueta="Fecha"
              valor={fecha}
              onChange={setFecha}
              obligatorio
              error={errores.fecha}
              min={ciclo?.fechaInicio}
            />
          </div>
        </section>

        {/* Qué se compró */}
        <Seccion titulo="Qué se compró">
          <SelectorCatalogo
            etiqueta="Categoría"
            valor={categoriaId}
            onChange={setCategoriaId}
            opciones={categorias}
            obligatorio
            error={errores.categoriaId}
            placeholder="Categoría → subcategoría"
          />
          <div className="mt-4">
            <SelectorCatalogo
              etiqueta="Proveedor (opcional)"
              valor={proveedorId}
              onChange={setProveedorId}
              opciones={proveedores}
              placeholder="Sin proveedor"
            />
          </div>
          <div className="mt-4">
            <SelectorCatalogo
              etiqueta="Actividad vinculada (opcional)"
              valor={actividadId}
              onChange={setActividadId}
              opciones={actividadesDelCiclo}
              placeholder="Sin actividad"
            />
          </div>
          <div className="mt-4">
            <Campo
              etiqueta="Descripción / concepto"
              valor={descripcion}
              onChange={setDescripcion}
              obligatorio
              error={errores.descripcion}
              placeholder="Ej. Triple 17, bultos de 50 kg"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <CampoNumero etiqueta="Cantidad" valor={cantidad} onChange={setCantidad} obligatorio error={errores.cantidad} />
            <SelectorBasico
              etiqueta="Unidad"
              valor={unidadId}
              onChange={setUnidadId}
              opciones={unidades}
              obligatorio
            />
          </div>
          {conversion != null && (
            <p className="mt-1 text-xs font-medium text-campo-800 dark:text-campo-200">
              = {conversion.toLocaleString("es-MX")} kg
            </p>
          )}
        </Seccion>

        {/* Cuánto costó */}
        <Seccion titulo="Cuánto costó">
          <div className="grid grid-cols-2 gap-3">
            <CampoImporte etiqueta="Costo unitario" valor={costoUnitario} onChange={setCostoUnitario} obligatorio error={errores.costoUnitario} />
            <CampoImporte etiqueta="Impuesto" valor={impuesto} onChange={setImpuesto} />
          </div>
          <div className="mt-4">
            <CampoImporte etiqueta="Total pagado" valor={totalPagado} onChange={setTotalPagado} obligatorio error={errores.totalPagado} />
          </div>
          {totalN > 0 && (
            <div className="mt-3">
              <ResumenCalculo capturado={totalN} calculado={calculado} />
              {errores.totalPagado && (
                <p className="mt-1 text-xs text-red-600">{errores.totalPagado}</p>
              )}
            </div>
          )}
        </Seccion>

        {/* Comprobante */}
        <Seccion titulo="Comprobante">
          <Campo etiqueta="Número de comprobante" valor={comprobante} onChange={setComprobante} placeholder="Ej. A-3481" />
          <div className="mt-4">
            <CapturaComprobante valor={adjunto} onChange={setAdjunto} />
          </div>
        </Seccion>
      </div>

      <BarraGuardar
        resumen={
          totalN > 0 ? (
            <ResumenCalculo capturado={totalN} calculado={calculado} />
          ) : undefined
        }
      >
        <Boton onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar gasto"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{titulo}</h2>
      {children}
    </section>
  );
}
