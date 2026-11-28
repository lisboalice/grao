/**
 * Mapa de origens para Expo Web usando maplibre-gl + tiles do OpenStreetMap.
 */
import { Map as MapLibreMap, Marker, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useMemo, useRef } from 'react';
import { Paleta } from '../theme/cores';
import { ModoTema, useTema } from '../theme/TemaContext';
import { GrupoPais, raioMarcador } from '../utils/calculos';
import type { LimitesMapa } from '../viewmodels/useMapa';

export interface MapaOrigensProps {
  grupos: GrupoPais[];
  maximo: number;
  limites: LimitesMapa;
  paisSelecionado: string | null;
  onSelecionar: (pais: string) => void;
  onFechar: () => void;
}

function estiloMapa(cores: Paleta, modo: ModoTema): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      { id: 'fundo', type: 'background', paint: { 'background-color': cores.superficie } },
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        paint:
          modo === 'escuro'
            ? { 'raster-saturation': -0.9, 'raster-brightness-max': 0.32, 'raster-contrast': 0.15, 'raster-hue-rotate': 20 }
            : { 'raster-saturation': -0.7, 'raster-brightness-min': 0.12 },
      },
    ],
  };
}

export function MapaOrigens({
  grupos,
  maximo,
  limites,
  paisSelecionado,
  onSelecionar,
  onFechar,
}: MapaOrigensProps) {
  const { cores, modo } = useTema();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<MapLibreMap | null>(null);
  const marcadoresRef = useRef<Marker[]>([]);
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;
  const onSelecionarRef = useRef(onSelecionar);
  onSelecionarRef.current = onSelecionar;

  const estilo = useMemo(() => estiloMapa(cores, modo), [cores, modo]);
  const estiloInicialRef = useRef(estilo);
  const limitesIniciaisRef = useRef(limites);

  useEffect(() => {
    if (!containerRef.current) return;
    const mapa = new MapLibreMap({
      container: containerRef.current,
      style: estiloInicialRef.current,
      bounds: limitesIniciaisRef.current,
      fitBoundsOptions: { padding: 24 },
      minZoom: 0,
      maxZoom: 7,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    mapa.on('click', () => onFecharRef.current());
    mapaRef.current = mapa;
    return () => {
      marcadoresRef.current.forEach((m) => m.remove());
      marcadoresRef.current = [];
      mapa.remove();
      mapaRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapaRef.current?.setStyle(estilo);
  }, [estilo]);

  useEffect(() => {
    mapaRef.current?.fitBounds(limites, { duration: 600, padding: 24 });
  }, [limites]);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    marcadoresRef.current.forEach((m) => m.remove());
    marcadoresRef.current = grupos.map((g) => {
      const raio = raioMarcador(g.qtd, maximo);
      const ativo = paisSelecionado === g.pais;

      const halo = document.createElement('button');
      halo.type = 'button';
      halo.setAttribute('aria-label', `${g.pais}: ${g.qtd} ${g.qtd === 1 ? 'café' : 'cafés'}`);
      Object.assign(halo.style, {
        width: `${raio * 2 + 14}px`,
        height: `${raio * 2 + 14}px`,
        borderRadius: `${raio + 7}px`,
        backgroundColor: cores.destaqueSuave,
        border: 'none',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      });

      const circulo = document.createElement('span');
      circulo.textContent = String(g.qtd);
      Object.assign(circulo.style, {
        width: `${raio * 2}px`,
        height: `${raio * 2}px`,
        borderRadius: `${raio}px`,
        backgroundColor: ativo ? cores.destaque : '#B8732A',
        border: '2px solid #2A1A0E',
        color: '#1A120C',
        fontWeight: '800',
        fontSize: `${raio > 20 ? 18 : 14}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      });

      halo.appendChild(circulo);
      halo.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelecionarRef.current(g.pais);
      });

      return new Marker({ element: halo, anchor: 'center' })
        .setLngLat([g.lon, g.lat])
        .addTo(mapa);
    });
  }, [grupos, maximo, paisSelecionado, cores.destaque, cores.destaqueSuave]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
}
