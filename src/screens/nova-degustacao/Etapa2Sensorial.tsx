/**
 * Etapa 2 — Avaliação sensorial (Figura 2, Tabela 5): seis sliders de 1 a 5 com dicas e
 * famílias de sabor em chips de seleção múltipla.
 */
import React from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { SliderNota } from '../../components/SliderNota';
import { Chip, Rotulo, TextoSecundario } from '../../components/ui';
import { DegustacaoForm } from '../../models/esquemas';
import { useTema } from '../../theme/TemaContext';
import { useDados } from '../../viewmodels/DadosContext';

export function Etapa2Sensorial({ form }: { form: UseFormReturn<DegustacaoForm> }) {
  const { cores } = useTema();
  const { catalogos } = useDados();
  const sabores = useWatch({ control: form.control, name: 'sabores' });
  const exemplos = catalogos.familias.filter((f) => sabores.includes(f.nome));

  return (
    <View>
      <TextoSecundario style={{ fontSize: 16, marginBottom: 18 }}>
        Deslize para marcar a intensidade (1–5). Toque no nome para ver a explicação.
      </TextoSecundario>

      {catalogos.atributos.map((atributo) => (
        <Controller
          key={atributo.id}
          control={form.control}
          name={`notas.${atributo.id}`}
          render={({ field }) => (
            <SliderNota atributo={atributo} valor={field.value} onChange={field.onChange} />
          )}
        />
      ))}

      <Rotulo style={{ marginTop: 8 }}>Famílias de sabor</Rotulo>
      <Controller
        control={form.control}
        name="sabores"
        render={({ field }) => (
          <View style={estilos.chips}>
            {catalogos.familias.map((f) => {
              const ativo = field.value.includes(f.nome);
              return (
                <Chip
                  key={f.id}
                  texto={f.nome}
                  selecionado={ativo}
                  onPress={() =>
                    field.onChange(ativo ? field.value.filter((s) => s !== f.nome) : [...field.value, f.nome])
                  }
                />
              );
            })}
          </View>
        )}
      />
      {exemplos.length > 0 && (
        <View style={{ marginTop: 14 }}>
          {exemplos.map((f) => (
            <Text key={f.id} style={{ color: cores.textoSecundario, fontSize: 14, lineHeight: 21 }}>
              <Text style={{ color: cores.texto }}>{f.nome}:</Text> {f.exemplos}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
