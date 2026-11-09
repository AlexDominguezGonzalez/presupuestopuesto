import "server-only"

// Catálogo oficial. ÚNICA fuente de precios: vive solo en el servidor.
// Ampliado a partir de las tarifas de la versión anterior (landing, corporativa,
// páginas adicionales, formulario y segundo idioma).
export type Servicio = {
  id: string
  nombre: string
  descripcion: string
  precio: number
}

export const MONEDA = "EUR"

export const CATALOGO: readonly Servicio[] = Object.freeze([
  {
    id: "landing",
    nombre: "Landing page",
    descripcion: "Web de una sola página orientada a presentar un producto o captar contactos.",
    precio: 300,
  },
  {
    id: "web_corporativa",
    nombre: "Web corporativa",
    descripcion: "Web institucional de empresa con inicio, quiénes somos, servicios y contacto.",
    precio: 600,
  },
  {
    id: "paginas_adicionales",
    nombre: "Pack de 5 páginas adicionales",
    descripcion: "Cinco secciones o páginas de contenido extra sobre la web base.",
    precio: 250,
  },
  {
    id: "formulario_contacto",
    nombre: "Formulario de contacto",
    descripcion: "Formulario con validación y envío de los mensajes por correo electrónico.",
    precio: 80,
  },
  {
    id: "segundo_idioma",
    nombre: "Segundo idioma",
    descripcion: "Versión completa de la web en un idioma adicional con selector de idioma.",
    precio: 150,
  },
  {
    id: "tienda_online",
    nombre: "Tienda online",
    descripcion: "Catálogo de productos, carrito de compra, gestión de pedidos y stock.",
    precio: 1200,
  },
  {
    id: "pasarela_pago",
    nombre: "Pasarela de pago",
    descripcion: "Integración de pagos con tarjeta (Stripe, Redsys o PayPal).",
    precio: 250,
  },
  {
    id: "blog",
    nombre: "Blog",
    descripcion: "Sección de noticias o artículos gestionable desde un panel de administración.",
    precio: 200,
  },
  {
    id: "reservas",
    nombre: "Sistema de reservas",
    descripcion: "Calendario para que los clientes reserven citas o servicios online.",
    precio: 350,
  },
  {
    id: "area_clientes",
    nombre: "Área privada de usuarios",
    descripcion: "Registro, inicio de sesión y zona privada con contenido para usuarios.",
    precio: 400,
  },
  {
    id: "seo_basico",
    nombre: "SEO on-page básico",
    descripcion: "Optimización de títulos, metadatos, sitemap y velocidad para buscadores.",
    precio: 180,
  },
  {
    id: "hosting_dominio",
    nombre: "Hosting y dominio",
    descripcion: "Alojamiento web y registro de dominio durante el primer año.",
    precio: 120,
  },
  {
    id: "mantenimiento",
    nombre: "Mantenimiento",
    descripcion: "Actualizaciones, copias de seguridad y pequeños cambios durante un año.",
    precio: 300,
  },
] satisfies Servicio[])

const POR_ID = new Map(CATALOGO.map((s) => [s.id, s]))

export function buscarServicio(id: string) {
  return POR_ID.get(id)
}

/** Catálogo SIN precios: lo único que ven la IA y el navegador antes de confirmar. */
export function catalogoSinPrecios() {
  return CATALOGO.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion }))
}

/** Cálculo puro: cruza los IDs confirmados con el catálogo y suma los precios reales. */
export function calcularPresupuesto(ids: string[]) {
  const lineas = ids.map((id) => {
    const s = POR_ID.get(id)!
    return { id: s.id, nombre: s.nombre, descripcion: s.descripcion, precio: s.precio }
  })
  const total = lineas.reduce((suma, l) => suma + l.precio, 0)
  return { lineas, total, moneda: MONEDA }
}
