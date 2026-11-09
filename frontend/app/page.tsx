"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  HelpCircleIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { DatosPDF } from "@/components/presupuesto-pdf"

const MAX_DESCRIPCION = 1000

type ServicioCatalogo = { id: string; nombre: string; descripcion: string }
type Seleccionado = { id: string; justificacion: string; origen: "ia" | "manual" }
type Propuesta = {
  resumen_proyecto: string
  servicios_propuestos: { id: string; justificacion: string }[]
  dudas_pendientes: string[]
  descartados: string[]
}
type Presupuesto = {
  lineas: { id: string; nombre: string; descripcion: string; precio: number }[]
  total: number
  moneda: string
  fecha: string
}

const EJEMPLOS = [
  "Quiero un ecommerce de zapatos con pasarela de pago",
  "Necesito una web para mi negocio, algo sencillo pero profesional",
  "Quiero una web para mi clínica dental con citas online y además una app móvil para iOS y Android",
]

const euros = (n: number, moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda }).format(n)

async function postJSON<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; errores: string[] }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data) return { ok: true, data: data as T }
    return { ok: false, errores: data?.detalles ?? [data?.error ?? `Error del servidor (HTTP ${res.status}).`] }
  } catch {
    return { ok: false, errores: ["No se pudo contactar con el servidor. Comprueba tu conexión e inténtalo de nuevo."] }
  }
}

export default function Page() {
  // Paso 1: solicitud
  const [cliente, setCliente] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [analizando, setAnalizando] = useState(false)
  const [erroresAnalisis, setErroresAnalisis] = useState<string[]>([])

  // Paso 2: revisión humana
  const [catalogo, setCatalogo] = useState<ServicioCatalogo[]>([])
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null)
  const [resumen, setResumen] = useState("")
  const [dudas, setDudas] = useState<string[]>([])
  const [seleccion, setSeleccion] = useState<Seleccionado[]>([])

  // Paso 3: presupuesto calculado en el servidor
  const [calculando, setCalculando] = useState(false)
  const [erroresCalculo, setErroresCalculo] = useState<string[]>([])
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  useEffect(() => {
    fetch("/api/catalogo")
      .then((r) => r.json())
      .then(setCatalogo)
      .catch(() => setCatalogo([]))
  }, [])

  const porId = new Map(catalogo.map((s) => [s.id, s]))
  const idsSeleccionados = new Set(seleccion.map((s) => s.id))
  const disponibles = catalogo.filter((s) => !idsSeleccionados.has(s.id))
  const longitud = descripcion.trim().length

  async function analizar(e?: FormEvent) {
    e?.preventDefault()
    setAnalizando(true)
    setErroresAnalisis([])
    const r = await postJSON<Propuesta>("/api/analizar", { cliente, descripcion })
    setAnalizando(false)
    if (!r.ok) return setErroresAnalisis(r.errores)

    setPropuesta(r.data)
    setResumen(r.data.resumen_proyecto)
    setDudas(r.data.dudas_pendientes)
    setSeleccion(r.data.servicios_propuestos.map((s) => ({ ...s, origen: "ia" })))
    setPresupuesto(null)
    setErroresCalculo([])
  }

  // Cualquier cambio en la selección invalida el presupuesto ya confirmado.
  function cambiarSeleccion(nueva: Seleccionado[]) {
    setSeleccion(nueva)
    setPresupuesto(null)
    setErroresCalculo([])
  }

  async function confirmar() {
    setCalculando(true)
    setErroresCalculo([])
    // Solo se envían IDs: el servidor decide los precios.
    const r = await postJSON<Presupuesto>("/api/presupuesto", { ids: seleccion.map((s) => s.id) })
    setCalculando(false)
    if (r.ok) setPresupuesto(r.data)
    else setErroresCalculo(r.errores)
  }

  async function descargarPDF() {
    if (!presupuesto) return
    setGenerandoPDF(true)
    try {
      const [{ pdf }, { PresupuestoPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/presupuesto-pdf"),
      ])
      const datos: DatosPDF = { cliente: cliente.trim(), resumen: resumen.trim(), dudas, ...presupuesto }
      const blob = await pdf(<PresupuestoPDF datos={datos} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `presupuesto-${cliente.trim().toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "cliente"}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error(err)
      setErroresCalculo(["No se pudo generar el PDF. Inténtalo de nuevo."])
    } finally {
      setGenerandoPDF(false)
    }
  }

  function empezarDeNuevo() {
    setPropuesta(null)
    setSeleccion([])
    setPresupuesto(null)
    setErroresCalculo([])
  }

  return (
    <main className="flex min-h-svh justify-center bg-muted/40 p-4 sm:p-10">
      <div className="grid w-full max-w-3xl content-start gap-6">
        <header className="grid gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <SparklesIcon className="size-6" /> Presupuesta mi web
          </h1>
          <p className="text-sm text-muted-foreground">
            Cuéntanos tu proyecto, revisa la propuesta de servicios y descarga tu presupuesto en PDF.
          </p>
          <Pasos actual={presupuesto ? 3 : propuesta ? 2 : 1} />
        </header>

        {/* PASO 1: Solicitud */}
        <Card>
          <CardHeader>
            <CardTitle>1. ¿Qué necesitas?</CardTitle>
            <CardDescription>Explícalo con tus propias palabras.</CardDescription>
          </CardHeader>
          <form onSubmit={analizar}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cliente">Nombre o empresa</Label>
                <Input
                  id="cliente"
                  value={cliente}
                  maxLength={100}
                  placeholder="Ej.: Calzados Martínez S.L."
                  onChange={(e) => setCliente(e.target.value)}
                  disabled={analizando}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción del proyecto</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  maxLength={MAX_DESCRIPCION}
                  rows={5}
                  placeholder="Ej.: Quiero vender zapatos online y cobrar con tarjeta…"
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={analizando}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {EJEMPLOS.map((ej) => (
                      <button
                        key={ej}
                        type="button"
                        className="rounded-md border px-2 py-0.5 hover:bg-muted"
                        onClick={() => setDescripcion(ej)}
                        disabled={analizando}
                      >
                        {ej.length > 40 ? ej.slice(0, 40) + "…" : ej}
                      </button>
                    ))}
                  </div>
                  <span className="tabular-nums">
                    {longitud}/{MAX_DESCRIPCION}
                  </span>
                </div>
              </div>

              {erroresAnalisis.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>No se pudo analizar la solicitud</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc">
                      {erroresAnalisis.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="mt-4 gap-2">
              <Button type="submit" disabled={analizando || !cliente.trim() || longitud === 0}>
                {analizando ? (
                  <>
                    <Spinner /> Analizando con IA…
                  </>
                ) : erroresAnalisis.length > 0 ? (
                  <>
                    <RotateCcwIcon /> Reintentar
                  </>
                ) : (
                  <>
                    <SparklesIcon /> {propuesta ? "Volver a analizar" : "Analizar mi proyecto"}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* PASO 2: Revisión humana */}
        {propuesta && (
          <Card>
            <CardHeader>
              <CardTitle>2. Revisa la propuesta</CardTitle>
              <CardDescription>
                La IA ha sugerido estos servicios. Quita los que no necesites o añade otros del catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="resumen" className="flex items-center gap-1">
                  <PencilIcon className="size-3.5" /> Resumen del proyecto
                </Label>
                <Textarea
                  id="resumen"
                  value={resumen}
                  maxLength={1500}
                  onChange={(e) => setResumen(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <h3 className="text-sm font-medium">Servicios seleccionados ({seleccion.length})</h3>
                {seleccion.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No hay servicios seleccionados. Añade alguno del catálogo.
                  </p>
                )}
                <ul className="grid gap-2">
                  {seleccion.map((s) => {
                    const info = porId.get(s.id)
                    return (
                      <li key={s.id} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                        <div className="grid flex-1 gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{info?.nombre ?? s.id}</span>
                            {s.origen === "ia" ? (
                              <Badge variant="secondary">
                                <SparklesIcon /> Sugerido por IA
                              </Badge>
                            ) : (
                              <Badge variant="outline">Añadido por ti</Badge>
                            )}
                          </div>
                          {s.justificacion && <p className="text-sm">{s.justificacion}</p>}
                          {info && <p className="text-xs text-muted-foreground">{info.descripcion}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Quitar ${info?.nombre ?? s.id}`}
                          onClick={() => cambiarSeleccion(seleccion.filter((x) => x.id !== s.id))}
                        >
                          <XIcon />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {disponibles.length > 0 && (
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium">Añadir del catálogo</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {disponibles.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="flex h-full w-full items-start gap-2 rounded-lg border border-dashed p-3 text-left hover:bg-muted"
                          onClick={() =>
                            cambiarSeleccion([...seleccion, { id: s.id, justificacion: "", origen: "manual" }])
                          }
                        >
                          <PlusIcon className="mt-0.5 size-4 shrink-0" />
                          <span className="grid gap-0.5">
                            <span className="text-sm font-medium">{s.nombre}</span>
                            <span className="text-xs text-muted-foreground">{s.descripcion}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dudas.length > 0 && (
                <div className="grid gap-2">
                  <h3 className="flex items-center gap-1 text-sm font-medium">
                    <HelpCircleIcon className="size-4" /> Aspectos pendientes de concretar
                  </h3>
                  <ul className="grid gap-1">
                    {dudas.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                        <span className="flex-1">{d}</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Descartar duda"
                          onClick={() => setDudas(dudas.filter((_, j) => j !== i))}
                        >
                          <XIcon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {propuesta.descartados.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Se descartaron {propuesta.descartados.length} sugerencia(s) de la IA que no pertenecen a nuestro
                  catálogo.
                </p>
              )}

              {erroresCalculo.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>No se pudo calcular el presupuesto</AlertTitle>
                  <AlertDescription>{erroresCalculo.join(" ")}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="mt-4 flex-wrap gap-2">
              <Button onClick={confirmar} disabled={calculando || seleccion.length === 0}>
                {calculando ? (
                  <>
                    <Spinner /> Calculando…
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon /> Confirmar selección
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={empezarDeNuevo}>
                Descartar propuesta
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* PASO 3: Presupuesto final */}
        {presupuesto && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2Icon className="size-5 text-green-600" /> 3. Tu presupuesto
              </CardTitle>
              <CardDescription>Importes calculados en el servidor con nuestras tarifas · sin impuestos</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {presupuesto.lineas.map((l) => (
                <div key={l.id} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{l.nombre}</span>
                  <span className="tabular-nums">{euros(l.precio, presupuesto.moneda)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{euros(presupuesto.total, presupuesto.moneda)}</span>
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button onClick={descargarPDF} disabled={generandoPDF}>
                {generandoPDF ? (
                  <>
                    <Spinner /> Generando PDF…
                  </>
                ) : (
                  <>
                    <DownloadIcon /> Descargar presupuesto (PDF)
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  )
}

function Pasos({ actual }: { actual: number }) {
  const pasos = ["Describe", "Revisa", "Descarga"]
  return (
    <ol className="mt-2 flex gap-2 text-xs">
      {pasos.map((p, i) => (
        <li
          key={p}
          className={
            i + 1 <= actual
              ? "rounded-full bg-primary px-2.5 py-0.5 text-primary-foreground"
              : "rounded-full border px-2.5 py-0.5 text-muted-foreground"
          }
        >
          {i + 1}. {p}
        </li>
      ))}
    </ol>
  )
}
