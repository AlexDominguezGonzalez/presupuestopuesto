import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

export type DatosPDF = {
  cliente: string
  fecha: string
  resumen: string
  lineas: { id: string; nombre: string; descripcion: string; precio: number }[]
  total: number
  moneda: string
  dudas: string[]
}

const euros = (n: number, moneda: string) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda }).format(n)

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937", lineHeight: 1.4 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  marca: { fontSize: 18, fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 2 },
  sub: { color: "#6b7280" },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 6 },
  datos: { flexDirection: "row", gap: 24, marginBottom: 4 },
  etiqueta: { color: "#6b7280", fontSize: 8, textTransform: "uppercase" },
  fila: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  filaCabecera: { borderBottomWidth: 1, borderBottomColor: "#1f2937", fontFamily: "Helvetica-Bold" },
  colConcepto: { flex: 1, paddingRight: 12 },
  colImporte: { width: 90, textAlign: "right" },
  desc: { color: "#6b7280", fontSize: 9 },
  total: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  duda: { flexDirection: "row", marginBottom: 3 },
  pie: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#9ca3af" },
})

export function PresupuestoPDF({ datos }: { datos: DatosPDF }) {
  const fecha = new Date(datos.fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Document title={`Presupuesto - ${datos.cliente}`} author="Presupuesta mi web" language="es">
      <Page size="A4" style={s.page}>
        <View style={s.cabecera}>
          <View>
            <Text style={s.marca}>Presupuesta mi web</Text>
            <Text style={s.sub}>Presupuesto de desarrollo web</Text>
          </View>
        </View>

        <View style={s.datos}>
          <View>
            <Text style={s.etiqueta}>Cliente</Text>
            <Text>{datos.cliente}</Text>
          </View>
          <View>
            <Text style={s.etiqueta}>Fecha</Text>
            <Text>{fecha}</Text>
          </View>
        </View>

        {datos.resumen ? (
          <>
            <Text style={s.h2}>Resumen del proyecto</Text>
            <Text>{datos.resumen}</Text>
          </>
        ) : null}

        <Text style={s.h2}>Servicios confirmados</Text>
        <View style={[s.fila, s.filaCabecera]}>
          <Text style={s.colConcepto}>Concepto</Text>
          <Text style={s.colImporte}>Importe</Text>
        </View>
        {datos.lineas.map((l) => (
          <View key={l.id} style={s.fila} wrap={false}>
            <View style={s.colConcepto}>
              <Text>{l.nombre}</Text>
              <Text style={s.desc}>{l.descripcion}</Text>
            </View>
            <Text style={s.colImporte}>{euros(l.precio, datos.moneda)}</Text>
          </View>
        ))}
        <View style={s.total}>
          <Text style={{ marginRight: 16 }}>Total</Text>
          <Text style={s.colImporte}>{euros(datos.total, datos.moneda)}</Text>
        </View>
        <Text style={[s.sub, { textAlign: "right", fontSize: 8 }]}>Importes sin impuestos.</Text>

        {datos.dudas.length > 0 && (
          <>
            <Text style={s.h2}>Aspectos pendientes de concretar</Text>
            {datos.dudas.map((d, i) => (
              <View key={i} style={s.duda}>
                <Text style={{ width: 12 }}>•</Text>
                <Text style={{ flex: 1 }}>{d}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.pie} fixed>
          Presupuesto orientativo. La propuesta de servicios se generó con ayuda de IA y fue revisada por el
          cliente; los importes se calculan a partir de nuestras tarifas oficiales.
        </Text>
      </Page>
    </Document>
  )
}
