import { useState } from "react";
import { useApp } from "../context/AppContext";
import { nombreTipoSuelo } from "../lib/calc";
import { uid } from "../lib/format";
import {
  Boton,
  Campo,
  CampoNumero,
  EstadoVacio,
  HojaInferior,
  SelectorBasico,
  TituloPantalla,
} from "../components/ui";

const ESTADOS_PARCELA = [
  { valor: "DISPONIBLE", texto: "Disponible" },
  { valor: "EN_USO", texto: "En uso" },
  { valor: "DESCANSO", texto: "Descanso" },
];

export default function Predios() {
  const { db, puede, actualizar, registrar, notificar, empresaVencida } = useApp();
  const admin = puede("estructura:administrar") && !empresaVencida;
  const plan = db.planes.find((p) => p.id === db.empresa.planId);
  const parcelasActivas = db.parcelas.filter((p) => p.activo).length;
  const [abriendo, setAbriendo] = useState<null | "predio" | "parcela">(null);

  const [nombrePredio, setNombrePredio] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [superficiePredio, setSuperficiePredio] = useState("");

  const [predioSel, setPredioSel] = useState("");
  const [nombreParcela, setNombreParcela] = useState("");
  const [superficieParcela, setSuperficieParcela] = useState("");
  const [tipoSueloId, setTipoSueloId] = useState("");

  const cerrar = () => setAbriendo(null);

  const guardarPredio = () => {
    if (!nombrePredio.trim() || !superficiePredio) {
      notificar("Captura nombre y superficie del predio.", "error");
      return;
    }
    const id = uid("pre");
    actualizar((prev) => ({
      ...prev,
      predios: [
        ...prev.predios,
        {
          id,
          nombre: nombrePredio.trim(),
          ubicacion: "",
          municipio: municipio.trim() || "—",
          entidad: "—",
          superficieHa: Number(superficiePredio),
          lat: null,
          lng: null,
          activo: true,
        },
      ],
    }));
    registrar("CREAR", "Predio", id, null, nombrePredio);
    notificar("Predio creado.");
    setNombrePredio("");
    setMunicipio("");
    setSuperficiePredio("");
    cerrar();
  };

  const guardarParcela = () => {
    if (!predioSel || !nombreParcela.trim() || !superficieParcela) {
      notificar("Elige predio, nombre y superficie.", "error");
      return;
    }
    const id = uid("par");
    actualizar((prev) => ({
      ...prev,
      parcelas: [
        ...prev.parcelas,
        {
          id,
          predioId: predioSel,
          nombre: nombreParcela.trim(),
          superficieHa: Number(superficieParcela),
          tipoSueloId: tipoSueloId || null,
          poligono: null,
          estado: "DISPONIBLE",
          activo: true,
        },
      ],
    }));
    registrar("CREAR", "Parcela", id, null, nombreParcela);
    notificar("Parcela creada.");
    setNombreParcela("");
    setSuperficieParcela("");
    setTipoSueloId("");
    cerrar();
  };

  return (
    <div className="pb-28">
      <TituloPantalla
        titulo="Predios y parcelas"
        subtitulo={admin ? "Administra tu estructura" : "Solo consulta"}
        acciones={
          admin ? (
            <Boton onClick={() => setAbriendo("predio")}>+ Predio</Boton>
          ) : undefined
        }
      />

      <div className="mb-4 rounded-xl bg-campo-50 dark:bg-campo-900/40 px-4 py-2.5 text-sm text-campo-900 dark:text-campo-200">
        🗺 {parcelasActivas}/{plan?.maxParcelas} parcelas en uso del plan {plan?.nombre}
      </div>

      {db.predios.length === 0 ? (
        <EstadoVacio mensaje="Aún no hay predios registrados." accionTexto={admin ? "Crear predio" : undefined} onAccion={admin ? () => setAbriendo("predio") : undefined} />
      ) : (
        <div className="space-y-4">
          {db.predios.filter((p) => p.activo).map((predio) => {
            const parcelas = db.parcelas.filter((p) => p.predioId === predio.id && p.activo);
            return (
              <section key={predio.id} className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-stone-900 dark:text-stone-100">{predio.nombre}</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300">
                      {predio.municipio}, {predio.entidad} · {predio.superficieHa} ha
                    </p>
                  </div>
                  {admin && (
                    <Boton variante="fantasma" onClick={() => { setPredioSel(predio.id); setAbriendo("parcela"); }}>
                      + Parcela
                    </Boton>
                  )}
                </div>
                <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
                  {parcelas.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{p.nombre}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {p.superficieHa} ha{nombreTipoSuelo(db, p) ? ` · ${nombreTipoSuelo(db, p)}` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.estado === "EN_USO"
                            ? "bg-campo-100 dark:bg-campo-900/60 text-campo-900 dark:text-campo-200"
                            : p.estado === "DISPONIBLE"
                              ? "bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200"
                        }`}
                      >
                        {ESTADOS_PARCELA.find((e) => e.valor === p.estado)?.texto ?? p.estado}
                      </span>
                    </li>
                  ))}
                  {parcelas.length === 0 && (
                    <li className="py-2 text-sm text-stone-500 dark:text-stone-400">Sin parcelas.</li>
                  )}
                </ul>
                {parcelas.reduce((s, p) => s + p.superficieHa, 0) > predio.superficieHa && (
                  <p className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
                    ⚠ La suma de parcelas ({parcelas.reduce((s, p) => s + p.superficieHa, 0)} ha) excede
                    la superficie del predio ({predio.superficieHa} ha).
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}

      <HojaInferior abierto={abriendo === "predio"} onCerrar={cerrar} titulo="Nuevo predio">
        <div className="space-y-4 pb-2">
          <Campo etiqueta="Nombre" valor={nombrePredio} onChange={setNombrePredio} obligatorio placeholder="Ej. Rancho Sur" />
          <Campo etiqueta="Municipio" valor={municipio} onChange={setMunicipio} />
          <CampoNumero etiqueta="Superficie total" valor={superficiePredio} onChange={setSuperficiePredio} sufijo="ha" obligatorio />
          <Boton className="w-full" onClick={guardarPredio}>Guardar predio</Boton>
        </div>
      </HojaInferior>

      <HojaInferior abierto={abriendo === "parcela"} onCerrar={cerrar} titulo="Nueva parcela">
        <div className="space-y-4 pb-2">
          <SelectorBasico
            etiqueta="Predio"
            valor={predioSel}
            onChange={setPredioSel}
            opciones={db.predios.filter((p) => p.activo).map((p) => ({ valor: p.id, texto: p.nombre }))}
            obligatorio
          />
          <Campo etiqueta="Nombre" valor={nombreParcela} onChange={setNombreParcela} obligatorio placeholder="Ej. Parcela 4" />
          <CampoNumero etiqueta="Superficie" valor={superficieParcela} onChange={setSuperficieParcela} sufijo="ha" obligatorio />
          <SelectorBasico
            etiqueta="Tipo de suelo"
            valor={tipoSueloId}
            onChange={setTipoSueloId}
            opciones={db.tiposSuelo.filter((t) => t.activo).map((t) => ({ valor: t.id, texto: t.nombre }))}
            placeholder="Sin especificar"
          />
          <Boton className="w-full" onClick={guardarParcela}>Guardar parcela</Boton>
        </div>
      </HojaInferior>

      {!admin && (
        <p className="mt-4 text-center text-xs text-stone-500 dark:text-stone-400">
          Solo tu administrador puede modificar predios y parcelas.
        </p>
      )}
    </div>
  );
}
