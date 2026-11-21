/**
 * Gráficos próprios com react-native-svg (Tabela 10): radar hexagonal dos seis atributos
 * e barras de cafés por mês. Ambos têm rótulo acessível com os valores (RNF05).
 */
import React from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { ATRIBUTOS_ORDEM, AtributoSensorial, NotasSensoriais } from '../models/tipos';
import { useTema } from '../theme/TemaContext';
import { BarraMes, formatarDecimal } from '../utils/calculos';

/** No web o SVG usaria serifa por padrão; no app nativo vale a fonte do sistema. */
const FONTE_SVG = Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : undefined;

const NOMES_PADRAO: Record<string, string> = {
  aroma: 'Aroma',
  acidez: 'Acidez',
  corpo: 'Corpo',
  docura: 'Doçura',
  amargor: 'Amargor',
  retrogosto: 'Retrogosto',
};

export function pontoRadar(indice: number, raio: number, cx: number, cy: number, total = 6) {
  const angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
  return { x: cx + raio * Math.cos(angulo), y: cy + raio * Math.sin(angulo) };
}

export function GraficoRadar({
  notas,
  tamanho = 260,
  atributos,
}: {
  notas: NotasSensoriais;
  tamanho?: number;
  atributos?: AtributoSensorial[];
}) {
  const { cores } = useTema();
  const nomes = (id: string) => atributos?.find((a) => a.id === id)?.nome ?? NOMES_PADRAO[id];
  const largura = tamanho * 1.45; // espaço lateral para os rótulos
  const cx = largura / 2;
  const cy = tamanho / 2;
  const raio = tamanho * 0.36;
  const niveis = [1, 2, 3, 4, 5];

  const poligono = (r: (i: number) => number) =>
    ATRIBUTOS_ORDEM.map((_, i) => {
      const p = pontoRadar(i, r(i), cx, cy);
      return `${p.x},${p.y}`;
    }).join(' ');

  const descricao = ATRIBUTOS_ORDEM.map((id) => `${nomes(id)} ${formatarDecimal(notas[id])}`).join(', ');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Gráfico radar: ${descricao}`} style={{ alignItems: 'center' }}>
      <Svg width={largura} height={tamanho}>
        {niveis.map((n) => (
          <Polygon
            key={n}
            points={poligono(() => (raio * n) / 5)}
            fill="none"
            stroke={cores.borda}
            strokeWidth={1}
          />
        ))}
        {ATRIBUTOS_ORDEM.map((_, i) => {
          const p = pontoRadar(i, raio, cx, cy);
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={cores.borda} strokeWidth={1} />;
        })}
        <Polygon
          points={poligono((i) => (raio * notas[ATRIBUTOS_ORDEM[i]]) / 5)}
          fill={cores.destaqueSuave}
          stroke={cores.destaque}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {ATRIBUTOS_ORDEM.map((id, i) => {
          const p = pontoRadar(i, (raio * notas[id]) / 5, cx, cy);
          return <Circle key={id} cx={p.x} cy={p.y} r={4.5} fill={cores.destaque} />;
        })}
        {ATRIBUTOS_ORDEM.map((id, i) => {
          const p = pontoRadar(i, raio + 18, cx, cy);
          const ancora = Math.abs(p.x - cx) < 4 ? 'middle' : p.x > cx ? 'start' : 'end';
          const ajusteX = ancora === 'start' ? -8 : ancora === 'end' ? 8 : 0;
          return (
            <SvgText
              key={id}
              x={p.x + ajusteX}
              y={p.y + 5}
              fill={cores.textoSecundario}
              fontSize={14}
              fontFamily={FONTE_SVG}
              textAnchor={ancora}
            >
              {nomes(id)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

export function GraficoBarras({ barras, altura = 120 }: { barras: BarraMes[]; altura?: number }) {
  const { cores } = useTema();
  const [largura, setLargura] = React.useState(0);
  const maximo = Math.max(1, ...barras.map((b) => b.qtd));
  const alturaRotulo = 26;
  const areaBarras = altura - alturaRotulo;
  const passo = barras.length > 0 ? largura / barras.length : 0;
  const larguraBarra = passo * 0.76;
  const descricao = barras.map((b) => `${b.rotulo}: ${b.qtd}`).join(', ');

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Cafés por mês: ${descricao}`}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
    >
      {largura > 0 && (
        <Svg width={largura} height={altura}>
          {barras.map((b, i) => {
            const h = Math.max(b.qtd > 0 ? 10 : 4, (areaBarras - 8) * (b.qtd / maximo));
            const x = i * passo + (passo - larguraBarra) / 2;
            return (
              <G key={`${b.ano}-${b.mes}`}>
                <Rect
                  x={x}
                  y={areaBarras - h}
                  width={larguraBarra}
                  height={h}
                  rx={8}
                  fill={b.atual ? cores.destaque : cores.barraInativa}
                />
                <SvgText
                  x={x + larguraBarra / 2}
                  y={altura - 6}
                  fill={cores.textoSecundario}
                  fontSize={14}
                  fontFamily={FONTE_SVG}
                  textAnchor="middle"
                >
                  {b.rotulo}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
