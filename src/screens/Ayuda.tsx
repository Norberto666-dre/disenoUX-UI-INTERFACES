import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TituloPantalla } from "../components/ui";
import type { ReactNode } from "react";

function Seccion({ titulo, icono, children }: { titulo: string; icono: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        <span>{icono}</span> {titulo}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{titulo}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{children}</p>
    </div>
  );
}

function Leyenda({ color, texto, descripcion }: { color: string; texto: string; descripcion: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${color}`}>
        {texto}
      </span>
      <span className="text-sm text-stone-600 dark:text-stone-300">{descripcion}</span>
    </div>
  );
}

const FUNCIONES: { icono: string; titulo: string; desc: string }[] = [
  { icono: "📊", titulo: "Tablero / Inicio", desc: "Resumen del negocio: ganancia, costo, ingresos y alertas del ciclo que estés viendo. Es tu pantalla principal para saber cómo va todo de un vistazo." },
  { icono: "🌱", titulo: "Ciclos", desc: "Cada ciclo es una temporada de cultivo en una parcela. Aquí los creas, los abres para capturar datos y los cierras al final para calcular la rentabilidad." },
  { icono: "🧩", titulo: "Actividades", desc: "Registra labores del campo (riego, fertilización, poda…). Por sí mismas no tienen costo: sirven para vincularles los gastos." },
  { icono: "🧾", titulo: "Gastos", desc: "Todo lo que se gasta en el ciclo (insumos, mano de obra, renta…). Su suma es el costo total del ciclo. Puedes adjuntar la foto del comprobante." },
  { icono: "🧺", titulo: "Cosechas", desc: "Anota cortes con cantidad, unidad y calidad. La app convierte todo a kilogramos y avanza la barra de producción del ciclo." },
  { icono: "📉", titulo: "Mermas", desc: "Pérdidas por clima, plagas o manejo. Sirven para que la app calcule el % de merma y no se inflen los números de producción." },
  { icono: "🛒", titulo: "Ventas", desc: "Factura por renglones (calidad, cantidad, precio). Valida que no vendas más kilos de los cosechados y que el total cuadre con los renglones." },
  { icono: "💵", titulo: "Cobros", desc: "Abonos a una venta: efectivo, transferencia, cheque… Nunca puedes cobrar más del saldo pendiente." },
  { icono: "💰", titulo: "Finanzas", desc: "Cuentas por cobrar: qué se te debe, qué está vencido y qué ventas ya quedaron saldadas." },
  { icono: "🔔", titulo: "Alertas", desc: "Avisos automáticos de la app: cosechas vencidas, mermas altas, ventas por vencer, suscripción por caducar." },
  { icono: "🗺", titulo: "Predios y parcelas", desc: "La estructura del campo: rancho → parcelas con superficie y tipo de suelo. Cada ciclo se siembra en una parcela." },
  { icono: "🤝", titulo: "Clientes", desc: "Directorio de a quién le vendes (mayoreo, distribuidor, restaurante…). Necesarios para registrar ventas." },
  { icono: "🚚", titulo: "Proveedores", desc: "Directorio de a quién le compras insumos y servicios." },
  { icono: "🗒", titulo: "Mis registros", desc: "Todo lo que tú capturaste, en una sola lista con filtros por fecha y tipo." },
  { icono: "👤", titulo: "Mi perfil", desc: "Tus datos, tu rol, los permisos que tienes y el interruptor de modo claro/oscuro." },
  { icono: "🏢", titulo: "Empresa", desc: "Datos del negocio (RFC, contacto) y el plan de suscripción con sus límites de parcelas y usuarios." },
];

const INDICADORES: { titulo: string; desc: string }[] = [
  { titulo: "Ganancia", desc: "Ingresos menos costo total del ciclo. Si sale roja, el ciclo costó más de lo que produjo." },
  { titulo: "Margen", desc: "Ganancia como % de los ingresos: por cada $100 vendidos, cuánto queda de ganancia." },
  { titulo: "Costo por kg", desc: "Costo total entre kilogramos cosechados: cuánto te cuesta producir 1 kg." },
  { titulo: "Precio prom. kg", desc: "Lo que has cobrado en promedio por kilo vendido." },
  { titulo: "Merma %", desc: "Kilos perdidos sobre lo cosechado. Muy alto = problema de manejo o clima." },
  { titulo: "ROI", desc: "Retorno de la inversión: ganancia ÷ costo × 100. Positive = el ciclo se paga." },
  { titulo: "Por cobrar", desc: "Saldo pendiente de cobrar de las ventas del ciclo." },
  { titulo: "Avance de cosecha", desc: "Kilos cosechados frente a la meta de producción del ciclo." },
];

const REGLAS: { titulo: string; desc: string }[] = [
  { titulo: "Totales exactos", desc: "El total de una venta debe coincidir con Σ(cantidad × precio) − descuento + impuesto, con tolerancia de $0.05." },
  { titulo: "Solo cosechado se vende", desc: "No puedes facturar más kilos de los que tienes cosechados y disponibles en el ciclo." },
  { titulo: "Cobros dentro del saldo", desc: "Un cobro nunca puede superar el saldo pendiente de la venta." },
  { titulo: "Ciclo cerrado = solo lectura", desc: "Al finalizar un ciclo se bloquea la captura de actividades, gastos, cosechas, mermas y ventas (los cobros sí se permiten)." },
  { titulo: "Un ciclo activo por parcela", desc: "Una parcela no puede tener dos cultivos al mismo tiempo; al cerrar el ciclo la parcela queda disponible." },
  { titulo: "Nada se borra", desc: "Las ventas y cobros equivocados se cancelan/anulan y quedan en el historial; la información siempre es rastreable en la bitácora." },
];

export default function Ayuda() {
  const navegar = useNavigate();
  const { db } = useApp();

  return (
    <div className="pb-24">
      <TituloPantalla
        titulo="Ayuda y leyendas"
        subtitulo="Qué hace cada función y qué significan los colores"
        volver={() => navegar(-1)}
      />

      <div className="space-y-4">
        <Seccion titulo="Sobre esta aplicación" icono="🌾">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            <b>Rentabilidad Agrícola</b> te ayuda a saber cuánto ganas o pierdes con cada cultivo: capturas
            actividades, gastos, cosechas, ventas y cobros, y la app calcula automáticamente los costos,
            indicadores y alertas de cada ciclo. Los datos se guardan en este dispositivo.
          </p>
        </Seccion>

        <Seccion titulo="Funciones" icono="🧩">
          {FUNCIONES.map((f) => (
            <div key={f.titulo} className="flex gap-3">
              <span className="text-xl">{f.icono}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{f.titulo}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{f.desc}</p>
              </div>
            </div>
          ))}
        </Seccion>

        <Seccion titulo="Leyenda de estados" icono="🏷">
          <Leyenda color="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" texto="Planificado" descripcion="Ciclo creado pero aún sin iniciar la siembra; no admite capturas." />
          <Leyenda color="bg-campo-100 text-campo-900 dark:bg-campo-900/60 dark:text-campo-200" texto="Activo" descripcion="En producción: aquí sí capturas actividades, gastos, cosechas y ventas." />
          <Leyenda color="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" texto="Suspendido" descripcion="Pausado temporalmente; todavía admite captura." />
          <Leyenda color="bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200" texto="Finalizado" descripcion="Cerrado con su fecha de fin; solo lectura (se permiten cobros)." />
          <Leyenda color="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" texto="Cancelado" descripcion="Anulado; queda en el historial, no se borra." />
          <div className="border-t border-stone-100 dark:border-stone-700 pt-3" />
          <Leyenda color="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" texto="Pendiente" descripcion="Venta sin cobrar." />
          <Leyenda color="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" texto="Parcial" descripcion="Cobrada en parte; queda saldo." />
          <Leyenda color="bg-campo-100 text-campo-900 dark:bg-campo-900/60 dark:text-campo-200" texto="Pagada" descripcion="Saldo en cero: venta saldada." />
          <Leyenda color="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" texto="Vencida" descripcion="Pasó la fecha límite de pago." />
        </Seccion>

        <Seccion titulo="Severidad de alertas" icono="🔔">
          <Leyenda color="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" texto="Alta" descripcion="Atención inmediata: por ejemplo, cosechas vencidas o mermas fuera de rango." />
          <Leyenda color="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" texto="Media" descripcion="Convendría revisar pronto: ventas por vencer, producción baja, etc." />
          <Leyenda color="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" texto="Baja" descripcion="Aviso menor que puedes dejar para después." />
          <Leyenda color="bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200" texto="Informativa" descripcion="Solo para tu conocimiento, no requiere acción." />
        </Seccion>

        <Seccion titulo="Tipos de actividad" icono="🧩">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {db.tiposActividad.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl bg-stone-100 dark:bg-stone-700/60 px-3 py-2 text-sm text-stone-700 dark:text-stone-200">
                <span>{t.icono}</span> {t.nombre}
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Calidades de cosecha" icono="🧺">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            <b>Extra</b> y <b>Primera</b>: mejor precio. <b>Segunda</b> y <b>Tercera</b>: precio menor.
            <b> Industrial</b>: destina a procesamiento. La calidad se elige en cada renglón de la venta.
          </p>
        </Seccion>

        <Seccion titulo="Etapas de merma" icono="📉">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            <b>Campo</b>: pérdida antes de empaquetar (clima, plagas, manejo).{" "}
            <b>Poscosecha</b>: pérdida después del corte (transporte, daño, bodega).
          </p>
        </Seccion>

        <Seccion titulo="Métodos de cobro" icono="💵">
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            Efectivo · Transferencia · Cheque · Tarjeta · Otro. Se registran en cada cobro y
            alimentan el saldo de cada venta.
          </p>
        </Seccion>

        <Seccion titulo="Roles y permisos" icono="👥">
          <Dato titulo="Administrador">Control total: configura empresa, predios, usuarios, crea y cierra ciclos, captura todo y consulta reportes.</Dato>
          <Dato titulo="Capturista">Captura en campo: actividades, gastos, cosechas y mermas; consulta sus registros y ciclos.</Dato>
          <Dato titulo="Contador">Área financiera: gastos, ventas, cobros, finanzas, alertas y reportes; no cierra ciclos ni administra usuarios.</Dato>
        </Seccion>

        <Seccion titulo="Indicadores del tablero" icono="📈">
          {INDICADORES.map((i) => (
            <Dato key={i.titulo} titulo={i.titulo}>{i.desc}</Dato>
          ))}
        </Seccion>

        <Seccion titulo="Reglas clave" icono="⚖">
          {REGLAS.map((r) => (
            <Dato key={r.titulo} titulo={r.titulo}>{r.desc}</Dato>
          ))}
        </Seccion>

        <p className="pb-4 text-center text-xs text-stone-400 dark:text-stone-500">
          Prototipo UX/UI · Rentabilidad Agrícola · Datos demo en este dispositivo
        </p>
      </div>
    </div>
  );
}
