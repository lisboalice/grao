/**
 * Mapa de origens nativo (Android/iOS) usando @maplibre/maplibre-react-native + tiles do OpenStreetMap.
 */
import {
  Camera,
  CameraRef,
  Map,
  Marker,
  StyleSpecification,
} from '@maplibre/maplibre-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
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

/** Estilo do mapa: tiles raster do OpenStreetMap, escurecidos no tema escuro. */
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
  const camera = useRef<CameraRef>(null);
  const estilo = useMemo(() => estiloMapa(cores, modo), [cores, modo]);

  useEffect(() => {
    camera.current?.fitBounds(limites, { duration: 600, padding: { top: 24, bottom: 24, left: 24, right: 24 } });
  }, [limites]);

  return (
    <Map
      style={{ flex: 1 }}
      mapStyle={estilo}
      logo={false}
      attribution
      compass={false}
      touchRotate={false}
      touchPitch={false}
      onPress={onFechar}
    >
      <Camera ref={camera} initialViewState={{ bounds: limites }} minZoom={0} maxZoom={7} />
      {grupos.map((g) => {
        const raio = raioMarcador(g.qtd, maximo);
        const ativo = paisSelecionado === g.pais;
        return (
          <Marker
            key={g.pais}
            id={`pais-${g.pais}`}
            lngLat={[g.lon, g.lat]}
            anchor="center"
            onPress={() => onSelecionar(g.pais)}
          >
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${g.pais}: ${g.qtd} ${g.qtd === 1 ? 'café' : 'cafés'}`}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: raio * 2 + 14,
                height: raio * 2 + 14,
                borderRadius: raio + 7,
                backgroundColor: cores.destaqueSuave,
              }}
            >
              <View
                style={{
                  width: raio * 2,
                  height: raio * 2,
                  borderRadius: raio,
                  backgroundColor: ativo ? cores.destaque : '#B8732A',
                  borderWidth: 2,
                  borderColor: '#2A1A0E',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#1A120C', fontWeight: '800', fontSize: raio > 20 ? 18 : 14 }}>{g.qtd}</Text>
              </View>
            </View>
          </Marker>
        );
      })}
    </Map>
  );
}
