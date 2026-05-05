'use client'

import { useMemo, useRef, useEffect } from 'react'
import Map, { Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useFilteredCrimes } from '@/hooks/useFilteredCrimes'
import { useAppStore } from '@/lib/store'
import { CITIES, CRIME_TYPES } from '@/lib/utils'

// Free, no-key-required vector style from OpenFreeMap
const MAP_STYLES = {
  dark:  'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/bright'
}

export function VectorMap() {
  const mapRef = useRef<any>(null)
  const { currentCity, layers, theme } = useAppStore()
  const crimes = useFilteredCrimes()

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center:   [currentCity.lng, currentCity.lat],
        zoom:     currentCity.zoom,
        duration: 2000,
        essential: true
      })
    }
  }, [currentCity])

  // Convert crimes to GeoJSON for react-map-gl
  const crimeData = useMemo(() => ({
    type: 'FeatureCollection',
    features: crimes.map(c => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      properties: { 
        severity: c.severity,
        typeId: c.typeId,
        color: CRIME_TYPES.find(t => t.id === c.typeId)?.color ?? '#fff'
      }
    }))
  }), [crimes])

  // Heatmap layer configuration
  const heatmapLayer: any = {
    id: 'crime-heat',
    type: 'heatmap',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 'medium', 1, 'high', 2, 'critical', 3],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,255,0)',
        0.2, theme === 'dark' ? 'rgba(30,100,255,0.4)' : 'rgba(30,100,255,0.2)',
        0.4, 'rgba(255,140,0,0.6)',
        0.8, 'rgba(255,40,0,0.8)',
        1, 'rgba(255,0,0,0.9)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
      'heatmap-opacity': 0.7
    }
  }

  // Point layer for markers
  const circleLayer: any = {
    id: 'crime-point',
    type: 'circle',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 2, 16, 8],
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.8
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          latitude:  currentCity.lat,
          longitude: currentCity.lng,
          zoom:      currentCity.zoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[theme]}
        reuseMaps
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />

        <Source type="geojson" data={crimeData as any}>
          {layers.heat && <Layer {...heatmapLayer} />}
          {layers.markers && <Layer {...circleLayer} />}
        </Source>
      </Map>
    </div>
  )
}
