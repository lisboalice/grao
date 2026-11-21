/**
 * Etapa 1 — O café (Figura 2): foto (câmera/galeria, opcional), nome (obrigatório), torrefação,
 * origem com autocompletar "país · região", variedade, processo, nível de torra, método (obrigatório)
 * e receita com a razão calculada.
 */
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SeletorOpcoes } from '../../components/Folhas';
import { CampoTexto, Chip, Rotulo } from '../../components/ui';
import { DegustacaoForm } from '../../models/esquemas';
import { NIVEIS_TORRA, Origem, PROCESSOS } from '../../models/tipos';
import { escolherFoto, OrigemFoto, PermissaoNegadaError } from '../../services/fotos';
import { raios, useTema } from '../../theme/TemaContext';
import { normalizar } from '../../utils/calculos';
import { useDados } from '../../viewmodels/DadosContext';

interface Props {
  form: UseFormReturn<DegustacaoForm>;
  razao: string | null;
}

const rotuloOrigem = (o: { pais: string; regiao: string }) => `${o.pais} · ${o.regiao}`;

export function Etapa1Cafe({ form, razao }: Props) {
  const { cores } = useTema();
  const { catalogos } = useDados();
  const { control, setValue, formState } = form;
  const erros = formState.errors;
  const fotoUri = useWatch({ control, name: 'fotoUri' });
  const origem = useWatch({ control, name: 'origem' });

  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [buscaOrigem, setBuscaOrigem] = useState<string | null>(null); // null = não está digitando
  const [seletorProcesso, setSeletorProcesso] = useState(false);

  const sugestoes = useMemo(() => {
    if (buscaOrigem == null || buscaOrigem.trim().length < 2) return [];
    const termo = normalizar(buscaOrigem).replace(/·/g, ' ').replace(/\s+/g, ' ');
    return catalogos.origens
      .filter((o) => normalizar(`${o.pais} ${o.regiao}`).includes(termo))
      .slice(0, 6);
  }, [buscaOrigem, catalogos.origens]);

  async function pegarFoto(origemFoto: OrigemFoto) {
    setProcessandoFoto(true);
    try {
      const uri = await escolherFoto(origemFoto);
      if (uri) setValue('fotoUri', uri, { shouldDirty: true });
    } catch (e) {
      const msg = e instanceof PermissaoNegadaError ? e.message : 'Não foi possível carregar a foto.';
      Alert.alert('Foto', msg);
    } finally {
      setProcessandoFoto(false);
    }
  }

  function escolherOrigem(o: Origem) {
    const { id: _id, ...semId } = o;
    setValue('origem', semId, { shouldDirty: true });
    setBuscaOrigem(null);
  }

  return (
    <View>
      {/* Foto */}
      <View style={[estilos.caixaFoto, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
        {processandoFoto ? (
          <ActivityIndicator color={cores.destaque} style={{ height: 96 }} />
        ) : fotoUri ? (
          <View style={estilos.linhaFoto}>
            <Image source={{ uri: fotoUri }} style={estilos.previa} accessibilityLabel="Foto do café" />
            <View style={{ flex: 1, gap: 8 }}>
              <BotaoFoto icone="camera" texto="Trocar foto" onPress={() => pegarFoto('camera')} />
              <BotaoFoto
                icone="trash-2"
                texto="Remover"
                onPress={() => setValue('fotoUri', null, { shouldDirty: true })}
              />
            </View>
          </View>
        ) : (
          <View style={estilos.linhaFoto}>
            <BotaoFoto icone="camera" texto="Câmera" vertical onPress={() => pegarFoto('camera')} />
            <View style={[estilos.divisor, { backgroundColor: cores.borda }]} />
            <BotaoFoto icone="image" texto="Galeria" vertical onPress={() => pegarFoto('galeria')} />
          </View>
        )}
      </View>

      <Controller
        control={control}
        name="nome"
        render={({ field }) => (
          <CampoTexto
            rotulo="Nome do café"
            placeholder="Ex.: Fazenda Santa Inês"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={erros.nome?.message}
            estiloContainer={estilos.campo}
          />
        )}
      />

      <View style={estilos.linha}>
        <Controller
          control={control}
          name="torrefacao"
          render={({ field }) => (
            <CampoTexto
              rotulo="Torrefação"
              placeholder="Opcional"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              estiloContainer={estilos.metade}
            />
          )}
        />
        <CampoTexto
          rotulo="Origem"
          placeholder="País ou região"
          value={buscaOrigem ?? (origem ? rotuloOrigem(origem) : '')}
          onChangeText={(t) => {
            setBuscaOrigem(t);
            if (origem) setValue('origem', null, { shouldDirty: true });
          }}
          onFocus={() => setBuscaOrigem(origem ? rotuloOrigem(origem) : '')}
          onBlur={() => setTimeout(() => setBuscaOrigem(null), 150)}
          numberOfLines={1}
          estiloContainer={estilos.metade}
          direita={<Feather name="chevron-down" size={18} color={cores.textoSecundario} style={{ marginRight: 14 }} />}
        />
      </View>
      {sugestoes.length > 0 && (
        <View
          accessibilityRole="list"
          style={[estilos.sugestoes, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
        >
          {sugestoes.map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              onPress={() => escolherOrigem(o)}
              style={({ pressed }) => [estilos.sugestao, pressed && { backgroundColor: cores.superficieElevada }]}
            >
              <Text style={{ color: cores.texto, fontSize: 17 }}>
                {o.pais}
                <Text style={{ color: cores.textoSecundario }}> · {o.regiao}</Text>
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {buscaOrigem != null && buscaOrigem.trim().length >= 2 && sugestoes.length === 0 && (
        <Text style={{ color: cores.textoSecundario, marginTop: -8, marginBottom: 12 }}>
          Origem não encontrada no catálogo.
        </Text>
      )}

      <View style={estilos.linha}>
        <Controller
          control={control}
          name="variedade"
          render={({ field }) => (
            <CampoTexto
              rotulo="Variedade"
              placeholder="Ex.: Bourbon"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              estiloContainer={estilos.metade}
            />
          )}
        />
        <Controller
          control={control}
          name="processo"
          render={({ field }) => (
            <View style={estilos.metade}>
              <Rotulo>Processo</Rotulo>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Processo: ${field.value || 'não informado'}`}
                onPress={() => setSeletorProcesso(true)}
                style={[estilos.select, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
              >
                <Text style={{ color: field.value ? cores.texto : cores.textoSecundario, fontSize: 17 }}>
                  {field.value || 'Escolher'}
                </Text>
                <Feather name="chevron-down" size={18} color={cores.textoSecundario} />
              </Pressable>
              <SeletorOpcoes
                visivel={seletorProcesso}
                titulo="Processo"
                selecionado={field.value}
                opcoes={[{ valor: '', rotulo: 'Não informado' }, ...PROCESSOS.map((p) => ({ valor: p as string, rotulo: p }))]}
                onEscolher={field.onChange}
                onFechar={() => setSeletorProcesso(false)}
              />
            </View>
          )}
        />
      </View>

      <Rotulo>Nível de torra</Rotulo>
      <Controller
        control={control}
        name="torra"
        render={({ field }) => (
          <View style={[estilos.linha, { marginBottom: 18 }]}>
            {NIVEIS_TORRA.map((n) => (
              <Chip
                key={n}
                texto={n}
                selecionado={field.value === n}
                onPress={() => field.onChange(field.value === n ? '' : n)}
                style={{ flex: 1, paddingHorizontal: 8 }}
              />
            ))}
          </View>
        )}
      />

      <Rotulo>Método de preparo</Rotulo>
      <Controller
        control={control}
        name="metodo"
        render={({ field }) => (
          <View style={{ marginBottom: 18 }}>
            <View style={[estilos.chips, catalogos.metodos.length <= 4 && { flexWrap: 'nowrap' }]}>
              {catalogos.metodos.map((m) => (
                <Chip
                  key={m.id}
                  texto={m.nome}
                  selecionado={field.value === m.nome}
                  onPress={() => field.onChange(m.nome)}
                  compacto
                  style={catalogos.metodos.length <= 4 ? { flex: 1, paddingHorizontal: 4 } : undefined}
                />
              ))}
            </View>
            {erros.metodo && (
              <Text style={{ color: cores.perigo, fontSize: 13, marginTop: 6 }}>{erros.metodo.message}</Text>
            )}
          </View>
        )}
      />

      <View style={estilos.linha}>
        <Controller
          control={control}
          name="dose"
          render={({ field }) => (
            <CampoTexto
              rotulo="Dose"
              placeholder="18"
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              erro={erros.dose?.message}
              estiloContainer={estilos.terco}
              direita={<Text style={[estilos.unidade, { color: cores.textoSecundario }]}>g</Text>}
            />
          )}
        />
        <Controller
          control={control}
          name="agua"
          render={({ field }) => (
            <CampoTexto
              rotulo="Água"
              placeholder="288"
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              erro={erros.agua?.message}
              estiloContainer={estilos.terco}
              direita={<Text style={[estilos.unidade, { color: cores.textoSecundario }]}>ml</Text>}
            />
          )}
        />
        <CampoTexto
          rotulo="Razão"
          value={razao ?? '—'}
          editable={false}
          destacarValor
          accessibilityLabel={`Razão calculada: ${razao ?? 'informe dose e água'}`}
          estiloContainer={estilos.terco}
        />
      </View>
    </View>
  );
}

function BotaoFoto({
  icone,
  texto,
  onPress,
  vertical,
}: {
  icone: keyof typeof Feather.glyphMap;
  texto: string;
  onPress: () => void;
  vertical?: boolean;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        vertical ? estilos.botaoFotoVertical : estilos.botaoFotoHorizontal,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icone} size={vertical ? 30 : 18} color={cores.destaque} />
      <Text style={{ color: cores.textoSecundario, fontSize: 16, marginTop: vertical ? 6 : 0, marginLeft: vertical ? 0 : 8 }}>
        {texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caixaFoto: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: raios.grande,
    padding: 16,
    marginBottom: 20,
  },
  linhaFoto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  previa: { width: 96, height: 96, borderRadius: 14 },
  divisor: { width: 1, height: 64 },
  botaoFotoVertical: { flex: 1, minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  botaoFotoHorizontal: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  campo: { marginBottom: 18 },
  linha: { flexDirection: 'row', gap: 12 },
  metade: { flex: 1, marginBottom: 18 },
  terco: { flex: 1, marginBottom: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  select: {
    minHeight: 56,
    borderRadius: raios.medio,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sugestoes: { borderWidth: 1, borderRadius: raios.medio, marginTop: -8, marginBottom: 18, overflow: 'hidden' },
  sugestao: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 },
  unidade: { marginRight: 14, fontSize: 16 },
});
