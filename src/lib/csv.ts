export function exportarCSV(
  nombreArchivo: string,
  encabezados: string[],
  filas: (string | number | null)[][],
): void {
  const esc = (v: string | number | null) => {
    const s = String(v ?? "");
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenido =
    "\ufeff" +
    [encabezados, ...filas].map((f) => f.map(esc).join(",")).join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
