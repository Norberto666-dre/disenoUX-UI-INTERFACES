export type Rol = "ADMIN" | "CAPTURISTA" | "CONTADOR";

export type EstadoCiclo =
  | "PLANIFICADO"
  | "ACTIVO"
  | "SUSPENDIDO"
  | "FINALIZADO"
  | "CANCELADO";

export type EstadoCobroVenta =
  | "PENDIENTE"
  | "PARCIAL"
  | "PAGADA"
  | "VENCIDA"
  | "CANCELADA";

export type Calidad = "EXTRA" | "PRIMERA" | "SEGUNDA" | "TERCERA" | "INDUSTRIAL";
export type EtapaMerma = "CAMPO" | "POSCOSECHA" | "TRANSPORTE" | "ALMACEN";
export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE" | "TARJETA" | "OTRO";
export type TipoCliente =
  | "MERCADO_MAYOREO"
  | "DISTRIBUIDOR"
  | "SUPERMERCADO"
  | "RESTAURANTE"
  | "EXPORTADOR"
  | "MENUDEO"
  | "OTRO";
export type Severidad = "ALTA" | "MEDIA" | "BAJA" | "INFORMATIVA";
export type TipoUnidad = "PESO" | "VOLUMEN" | "UNIDAD" | "SUPERFICIE" | "OTRO";

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  precioMensual: number;
  maxParcelas: number;
  maxUsuarios: number;
  incluyeReportes: boolean;
  activo: boolean;
}

export interface Empresa {
  id: string;
  nombre: string;
  razonSocial: string;
  rfc: string;
  correo: string;
  telefono: string;
  direccion: string;
  planId: string;
  estado: "PRUEBA" | "ACTIVA" | "VENCIDA" | "CANCELADA";
  suscripcionVence: string | null;
  moneda: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: Rol;
  password: string;
  activo: boolean;
  creadoEn: string;
  ultimoAcceso: string | null;
}

export interface Predio {
  id: string;
  nombre: string;
  ubicacion: string;
  municipio: string;
  entidad: string;
  superficieHa: number;
  lat: number | null;
  lng: number | null;
  activo: boolean;
}

export interface TipoSuelo {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Parcela {
  id: string;
  predioId: string;
  nombre: string;
  superficieHa: number;
  tipoSueloId: string | null;
  poligono: number[][] | null;
  estado: "DISPONIBLE" | "EN_USO" | "DESCANSO" | "INACTIVA";
  activo: boolean;
}

export interface Cultivo {
  id: string;
  nombre: string;
  nombreCientifico: string | null;
  activo: boolean;
}

export interface Variedad {
  id: string;
  cultivoId: string;
  nombre: string;
}

export interface Ciclo {
  id: string;
  empresaId: string;
  parcelaId: string;
  variedadId: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string | null;
  superficieSembradaHa: number;
  metaKg: number | null;
  observaciones: string | null;
  estado: EstadoCiclo;
  cerradoEn: string | null;
  cerradoPorId: string | null;
  creadoEn: string;
}

export interface TipoActividad {
  id: string;
  nombre: string;
  icono: string;
}

export interface Actividad {
  id: string;
  cicloId: string;
  tipoActividadId: string;
  fecha: string;
  descripcion: string | null;
  horas: number | null;
  responsableId: string | null;
  creadoPorId: string;
  creadoEn: string;
  estado: "ACTIVA" | "ANULADA";
}

export interface CategoriaGasto {
  id: string;
  nombre: string;
  parentId: string | null;
  esSistema: boolean;
}

export interface Unidad {
  id: string;
  clave: string;
  nombre: string;
  abrev: string;
  tipo: TipoUnidad;
  factorKg: number;
}

export interface Gasto {
  id: string;
  cicloId: string;
  fecha: string;
  categoriaId: string;
  proveedorId: string | null;
  actividadId: string | null;
  descripcion: string;
  cantidad: number;
  unidadId: string;
  costoUnitario: number;
  impuesto: number;
  totalPagado: number;
  comprobante: string | null;
  adjunto: string | null;
  creadoPorId: string;
  creadoEn: string;
  estado: "ACTIVO" | "ANULADO";
}

export interface Cosecha {
  id: string;
  cicloId: string;
  fecha: string;
  cantidad: number;
  unidadId: string;
  calidad: Calidad;
  observaciones: string | null;
  creadoPorId: string;
  creadoEn: string;
  estado: "ACTIVA" | "ANULADA";
}

export interface Merma {
  id: string;
  cicloId: string;
  fecha: string;
  motivoId: string;
  etapa: EtapaMerma;
  cantidad: number;
  unidadId: string;
  cosechaOrigenId: string | null;
  observaciones: string | null;
  creadoPorId: string;
  creadoEn: string;
  estado: "ACTIVA" | "ANULADA";
}

export interface MotivoMerma {
  id: string;
  nombre: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  tipo: TipoCliente;
  rfc: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
}

export interface Proveedor {
  id: string;
  nombre: string;
  rfc: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface Venta {
  id: string;
  cicloId: string;
  clienteId: string;
  fecha: string;
  numeroFactura: string | null;
  fechaLimitePago: string | null;
  descuento: number;
  impuesto: number;
  totalFacturado: number;
  notas: string | null;
  creadoPorId: string;
  creadoEn: string;
  estado: "ACTIVA" | "CANCELADA";
}

export interface DetalleVenta {
  id: string;
  ventaId: string;
  calidad: Calidad;
  cantidad: number;
  unidadId: string;
  precioUnitario: number;
  cosechaOrigenId: string | null;
}

export interface Cobro {
  id: string;
  ventaId: string;
  fecha: string;
  monto: number;
  metodo: MetodoPago;
  referencia: string | null;
  creadoPorId: string;
  creadoEn: string;
  estado: "ACTIVO" | "ANULADO";
}

export interface Adjunto {
  id: string;
  entidad: string;
  entidadId: string;
  nombreArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
  claveAlmacenamiento: string;
  creadoEn: string;
}

export interface Bitacora {
  id: string;
  empresaId: string;
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  fecha: string;
}

export interface DB {
  empresa: Empresa;
  planes: Plan[];
  usuarios: Usuario[];
  predios: Predio[];
  parcelas: Parcela[];
  tiposSuelo: TipoSuelo[];
  cultivos: Cultivo[];
  variedades: Variedad[];
  ciclos: Ciclo[];
  tiposActividad: TipoActividad[];
  actividades: Actividad[];
  categoriasGasto: CategoriaGasto[];
  unidades: Unidad[];
  gastos: Gasto[];
  cosechas: Cosecha[];
  mermas: Merma[];
  motivosMerma: MotivoMerma[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  ventas: Venta[];
  detallesVenta: DetalleVenta[];
  cobros: Cobro[];
  adjuntos: Adjunto[];
  bitacora: Bitacora[];
}

export interface Sesion {
  usuarioId: string;
  rol: Rol;
  empresaId: string;
}

export interface AlertaGenerada {
  id: string;
  tipo: string;
  severidad: Severidad;
  mensaje: string;
  cicloId: string | null;
  enlace: string;
}

/* Permisos simulados del MVP (3 roles, módulos de la sección 2.10.4) */
export type Permiso =
  | "tablero:ver"
  | "estructura:administrar"
  | "estructura:ver"
  | "ciclo:crear"
  | "ciclo:cerrar"
  | "ciclo:reabrir"
  | "actividad:crear"
  | "gasto:crear"
  | "gasto:editar_todos"
  | "cosecha:crear"
  | "merma:crear"
  | "venta:crear"
  | "venta:cancelar"
  | "cobro:crear"
  | "tercero:administrar"
  | "reporte:ver"
  | "reporte:exportar"
  | "usuario:administrar"
  | "empresa:administrar";

export const PERMISOS_POR_ROL: Record<Rol, Permiso[]> = {
  ADMIN: [
    "tablero:ver",
    "estructura:administrar",
    "estructura:ver",
    "ciclo:crear",
    "ciclo:cerrar",
    "ciclo:reabrir",
    "actividad:crear",
    "gasto:crear",
    "gasto:editar_todos",
    "cosecha:crear",
    "merma:crear",
    "venta:crear",
    "venta:cancelar",
    "cobro:crear",
    "tercero:administrar",
    "reporte:ver",
    "reporte:exportar",
    "usuario:administrar",
    "empresa:administrar",
  ],
  CAPTURISTA: [
    "estructura:ver",
    "actividad:crear",
    "gasto:crear",
    "cosecha:crear",
    "merma:crear",
  ],
  CONTADOR: [
    "tablero:ver",
    "estructura:ver",
    "gasto:crear",
    "gasto:editar_todos",
    "venta:crear",
    "venta:cancelar",
    "cobro:crear",
    "tercero:administrar",
    "reporte:ver",
    "reporte:exportar",
  ],
};

/* Permisos que habilita cada plan de suscripción. El acceso final es la
   intersección: permisos del rol ∩ permisos del plan. */
export type CodigoPlan = "BASICO" | "PRODUCTOR" | "EMPRESA";

const PERMISOS_BASICO: Permiso[] = [
  "tablero:ver",
  "estructura:administrar",
  "estructura:ver",
  "ciclo:crear",
  "ciclo:cerrar",
  "actividad:crear",
  "gasto:crear",
  "cosecha:crear",
  "merma:crear",
  "venta:crear",
  "venta:cancelar",
  "cobro:crear",
  "tercero:administrar",
  "usuario:administrar",
  "empresa:administrar",
];

const PERMISOS_PRODUCTOR: Permiso[] = [
  ...PERMISOS_BASICO,
  "ciclo:reabrir",
  "gasto:editar_todos",
  "reporte:ver",
];

export const PLAN_PERMISOS: Record<CodigoPlan, Permiso[]> = {
  BASICO: PERMISOS_BASICO,
  PRODUCTOR: PERMISOS_PRODUCTOR,
  EMPRESA: [...PERMISOS_PRODUCTOR, "reporte:exportar"],
};

export function permisosPlan(codigo: string | undefined): Permiso[] {
  return PLAN_PERMISOS[codigo as CodigoPlan] ?? PLAN_PERMISOS.EMPRESA;
}
