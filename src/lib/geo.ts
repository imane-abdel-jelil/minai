/**
 * Helpers géo : point-in-polygon (ray-casting) pour Polygon et MultiPolygon.
 * Zéro dépendance — algorithme classique inline.
 *
 * Utilisé pour compter combien de points d'eau tombent dans chaque wilaya.
 */

type Coord = [number, number] // [lng, lat]
type Ring = Coord[]
type Polygon = Ring[] // 1er ring = outer, suivants = trous
type MultiPolygon = Polygon[]

/** Ray-casting : un point est-il à l'intérieur d'un anneau fermé ? */
function pointInRing(pt: Coord, ring: Ring): boolean {
  let inside = false
  const [x, y] = pt
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Polygon = outer + trous : dedans si dans outer ET hors de tous les trous */
function pointInPolygon(pt: Coord, polygon: Polygon): boolean {
  if (polygon.length === 0) return false
  if (!pointInRing(pt, polygon[0])) return false
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(pt, polygon[i])) return false
  }
  return true
}

/** Supporte Feature avec geometry Polygon ou MultiPolygon */
export function pointInFeature(pt: Coord, feature: GeoJSON.Feature): boolean {
  const g = feature.geometry
  if (!g) return false
  if (g.type === 'Polygon') {
    return pointInPolygon(pt, g.coordinates as Polygon)
  }
  if (g.type === 'MultiPolygon') {
    for (const poly of g.coordinates as MultiPolygon) {
      if (pointInPolygon(pt, poly)) return true
    }
    return false
  }
  return false
}

/** Bbox simple [minLng, minLat, maxLng, maxLat] pour pré-filtrer */
function featureBbox(feature: GeoJSON.Feature): [number, number, number, number] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  const visit = (rings: Ring[]) => {
    for (const ring of rings) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const g = feature.geometry
  if (g?.type === 'Polygon') visit(g.coordinates as Ring[])
  else if (g?.type === 'MultiPolygon') {
    for (const poly of g.coordinates as Ring[][]) visit(poly)
  }
  return [minX, minY, maxX, maxY]
}

/**
 * Pour chaque wilaya, compte combien de points d'eau tombent dedans.
 * Retourne aussi un breakdown par type de point.
 */
export interface WilayaStats {
  total: number
  byKind: Record<string, number>
}

export function countPointsByWilaya(
  wilayasFC: GeoJSON.FeatureCollection,
  pointsFC: GeoJSON.FeatureCollection,
  regionIdProp: string = 'regionId'
): Record<string, WilayaStats> {
  const result: Record<string, WilayaStats> = {}
  const wilayaWithBbox = wilayasFC.features.map((f) => ({
    feature: f,
    bbox: featureBbox(f),
    regionId: (f.properties?.[regionIdProp] as string) || null,
  }))

  for (const wf of wilayaWithBbox) {
    if (!wf.regionId) continue
    result[wf.regionId] = { total: 0, byKind: {} }
  }

  for (const point of pointsFC.features) {
    if (point.geometry?.type !== 'Point') continue
    const [x, y] = point.geometry.coordinates as Coord
    const kind = (point.properties?.kind as string) || 'other'
    for (const wf of wilayaWithBbox) {
      if (!wf.regionId) continue
      const [minX, minY, maxX, maxY] = wf.bbox
      if (x < minX || x > maxX || y < minY || y > maxY) continue
      if (pointInFeature([x, y], wf.feature)) {
        const stats = result[wf.regionId]
        stats.total += 1
        stats.byKind[kind] = (stats.byKind[kind] || 0) + 1
        break // un point ne peut être que dans une wilaya
      }
    }
  }

  return result
}
