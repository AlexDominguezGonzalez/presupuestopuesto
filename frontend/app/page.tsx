"use client"

import { useEffect, useState, type FormEvent } from "react"
import { AlertCircleIcon, CheckCircle2Icon, CalculatorIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type Tipo = "landing" | "corporativa"

type Presupuesto = {
  base: number
  paginasAdicionales: number
  formulario: number
  segundoIdioma: number
  total: number
  moneda: string
}

const tipos = [
  { label: "Landing page", value: "landing" },
  { label: "Web corporativa", value: "corporativa" },
]

const euros = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)

export default function Page() {
  const [tipo, setTipo] = useState<Tipo>("landing")
  const [paginas, setPaginas] = useState("1")
  const [formulario, setFormulario] = useState(false)
  const [segundoIdioma, setSegundoIdioma] = useState(false)

  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<Presupuesto | null>(null)
  const [errores, setErrores] = useState<string[]>([])
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/estado`)
      .then((r) => r.json())
      .then((d) => setApiOnline(d.status === "ok"))
      .catch(() => setApiOnline(false))
  }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setResultado(null)
    setErrores([])

    try {
      // Solo se envían las opciones: los precios los decide el servidor.
      const res = await fetch(`${API_URL}/api/presupuesto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          paginas: paginas === "" ? null : Number(paginas),
          formulario,
          segundoIdioma,
        }),
      })
      const data = await res.json()

      if (res.ok) setResultado(data as Presupuesto)
      else setErrores(data.detalles ?? [data.error ?? `Error HTTP ${res.status}`])
    } catch {
      setErrores([`No se pudo conectar con la API en ${API_URL}. ¿Está arrancado el backend?`])
    } finally {
      setCargando(false)
    }
  }

  const lineas = resultado
    ? [
        { concepto: `Base (${tipo === "landing" ? "landing" : "corporativa"}, incluye 1ª página)`, importe: resultado.base },
        { concepto: `Páginas adicionales (${Number(paginas) - 1} × 50 €)`, importe: resultado.paginasAdicionales },
        { concepto: "Formulario de contacto", importe: resultado.formulario },
        { concepto: "Segundo idioma", importe: resultado.segundoIdioma },
      ]
    : []

  return (
    <main className="flex min-h-svh items-start justify-center bg-muted/40 p-4 sm:p-10">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalculatorIcon className="size-5" /> Calculadora de presupuesto
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              API:
              {apiOnline === null && <Badge variant="outline">comprobando…</Badge>}
              {apiOnline === true && <Badge>conectada</Badge>}
              {apiOnline === false && <Badge variant="destructive">sin conexión</Badge>}
            </CardDescription>
          </CardHeader>

          <form onSubmit={enviar}>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de web</Label>
                <Select items={tipos} value={tipo} onValueChange={(v) => v && setTipo(v as Tipo)}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paginas">Número de páginas (1–20)</Label>
                <Input
                  id="paginas"
                  type="number"
                  inputMode="numeric"
                  value={paginas}
                  onChange={(e) => setPaginas(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="formulario">Formulario de contacto</Label>
                <Switch id="formulario" checked={formulario} onCheckedChange={setFormulario} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="idioma">Segundo idioma</Label>
                <Switch id="idioma" checked={segundoIdioma} onCheckedChange={setSegundoIdioma} />
              </div>
            </CardContent>

            <CardFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={cargando}>
                {cargando ? (
                  <>
                    <Spinner /> Calculando…
                  </>
                ) : (
                  "Calcular presupuesto"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="grid content-start gap-4">
          {errores.length > 0 && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>La solicitud no es válida (HTTP 400)</AlertTitle>
              <AlertDescription>
                <ul className="list-inside list-disc">
                  {errores.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {resultado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-5 text-green-600" /> Presupuesto desglosado
                </CardTitle>
                <CardDescription>Importes calculados en el servidor · sin impuestos</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {lineas.map((l) => (
                  <div key={l.concepto} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{l.concepto}</span>
                    <span className="tabular-nums">{euros(l.importe)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{euros(resultado.total)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {!resultado && errores.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Rellena el formulario y pulsa «Calcular presupuesto».
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
