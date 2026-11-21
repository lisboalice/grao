/**
 * Etapa 3 — Veredito (Figura 2): nota geral obrigatória em estrelas, média sensorial só como
 * referência, radar de pré-visualização, notas livres e data/hora automáticas.
 */
import React from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { GraficoRadar } from '../../components/Graficos';
import { CampoTexto, Cartao, SeletorEstrelas, TextoSecundario } from '../../components/ui';
import { DegustacaoForm } from '../../models/esquemas';
import { useTema } from '../../theme/TemaContext';
import { formatarNota } from '../../utils/calculos';
import { formatarDataHora } from '../../utils/datas';
import { useAuth } from '../../viewmodels/useAuth';
import { useDados } from '../../viewmodels/DadosContext';

interface Props {
  form: UseFormReturn<DegustacaoForm>;
  media: number;
  dataHora: Date | null;
}

export function Etapa3Veredito({ form, media, dataHora }: Props) {
  const { cores } = useTema();
  const { perfil } = useAuth();
  const { catalogos } = useDados();
  const notas = useWatch({ control: form.control, name: 'notas' });
  const erro = form.formState.errors.notaGeral?.message;
  const maxEscala = perfil.escalaNotas === '1-10' ? 10 : 5;

  return (
    <View>
      <Cartao style={{ alignItems: 'center', paddingVertical: 22, marginBottom: 12 }}>
        <TextoSecundario style={{ fontSize: 16, marginBottom: 8 }}>Nota geral</TextoSecundario>
        <Controller
          control={form.control}
          name="notaGeral"
          render={({ field }) => <SeletorEstrelas valor={field.value} onChange={field.onChange} />}
        />
        <TextoSecundario style={{ fontSize: 15, marginTop: 10 }}>
          Média sensorial: {formatarNota(media, perfil.escalaNotas)} / {maxEscala}
        </TextoSecundario>
        {erro && (
          <Text accessibilityLiveRegion="polite" style={{ color: cores.perigo, marginTop: 8, fontSize: 14 }}>
            {erro}
          </Text>
        )}
      </Cartao>

      <View style={{ marginVertical: 8 }}>
        <GraficoRadar notas={notas} atributos={catalogos.atributos} tamanho={250} />
      </View>

      <Controller
        control={form.control}
        name="notasLivres"
        render={({ field }) => (
          <CampoTexto
            rotulo="Notas livres"
            placeholder="O que chamou sua atenção? Algo a mudar no preparo?"
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={form.formState.errors.notasLivres?.message}
            maxLength={1000}
          />
        )}
      />
      <TextoSecundario style={{ marginTop: 10 }}>
        {dataHora
          ? `Salvo em ${formatarDataHora(dataHora)} (automático)`
          : `Data e hora: ${formatarDataHora(new Date())} (automático)`}
      </TextoSecundario>
    </View>
  );
}
