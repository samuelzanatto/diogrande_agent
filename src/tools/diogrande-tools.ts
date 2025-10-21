import { z } from 'zod';
import { tool } from 'ai';
// Removido: node:https não pode ser utilizado no renderer (Vite externaliza)

const DIOGRANDE_BASE_URL = 'https://diogrande.campogrande.ms.gov.br';

// Headers mantidos no processo main

// Todas as requisições agora passam via processo main (IPC) para evitar APIs Node no renderer.

interface DiarioRow {
  numero: string;
  dia: string;
  arquivo: string;
  desctpd: string;
  codigodia: string;
}

interface DiarioResponse {
  data: DiarioRow[];
}

export interface DiarioInfo {
  numero: string;
  tipo: string;
  data: string;
  dataISO: string;
  arquivo: string;
  codigo: string;
  downloadUrl: string;
}

function formatarData(dia: string): string {
  const [ano, mes, diaDoMes] = dia.split('-');
  return `${diaDoMes}/${mes}/${ano}`;
}

function montarDownloadUrl(codigo: string): string {
  // Browser-safe base64 encoding (no Buffer dependency)
  const jsonStr = JSON.stringify({ codigodia: Number(codigo) });
  const payload = btoa(unescape(encodeURIComponent(jsonStr)));
  return `${DIOGRANDE_BASE_URL}/download_edicao/${encodeURIComponent(payload)}.pdf`;
}

// Removido: fetchJson/fetchComAgente agora é responsabilidade do processo main

async function buscarDiarios(params?: {
  numero?: string;
  palavra?: string;
  de?: string;
  ate?: string;
}): Promise<DiarioInfo[]> {
  // Delegar ao processo main
  const json = (await window.electronAPI.diograndeListar({ numero: params?.numero, palavra: params?.palavra, de: params?.de, ate: params?.ate })) as DiarioResponse;

  return json.data.map((row) => ({
    numero: row.numero,
    tipo: row.desctpd,
    data: formatarData(row.dia),
    dataISO: row.dia,
    arquivo: row.arquivo,
    codigo: row.codigodia,
    downloadUrl: montarDownloadUrl(row.codigodia),
  }));
}

/**
 * Busca os diários mais recentes publicados diretamente do endpoint oficial.
 */
async function buscarDiariosRecentes(): Promise<DiarioInfo[]> {
  try {
    return await buscarDiarios();
  } catch (error) {
    console.error('Erro ao buscar diários:', error);
    throw new Error('Não foi possível buscar os diários oficiais.');
  }
}

/**
 * Faz download e extrai o texto de um diário em PDF.
 */
async function lerDiarioPDF(downloadUrl: string): Promise<string> {
  try {
    const { text } = await window.electronAPI.diograndeLerPdf(downloadUrl);
    return text;
  } catch (error) {
    console.error('Erro ao ler PDF:', error);
    throw new Error('Não foi possível ler o conteúdo do diário oficial.');
  }
}

/**
 * Busca um diário específico por número.
 */
async function buscarDiarioPorNumero(numero: string): Promise<DiarioInfo | null> {
  const diarios = await buscarDiarios({ numero });
  return diarios[0] ?? null;
}

/**
 * Tool: Listar diários oficiais recentes.
 */
export const listarDiariosRecentesTool = tool({
  description: 'Lista os diários oficiais mais recentes de Campo Grande/MS, incluindo número, tipo, data e link de download.',
  inputSchema: z.object({}),
  execute: async () => {
    const diarios = await buscarDiariosRecentes();
    const listaFormatada = diarios
      .map((d) => `📄 Diário ${d.numero} ${d.tipo} - ${d.data}`)
      .join('\n');

    return {
      quantidade: diarios.length,
      diarios,
      mensagem: `Encontrei ${diarios.length} diários oficiais:\n\n${listaFormatada}`,
    };
  },
});

/**
 * Tool: Ler conteúdo de um diário específico.
 */
export const lerDiarioOficialTool = tool({
  description:
    'Lê o conteúdo completo de um diário oficial específico de Campo Grande/MS. Informe o número do diário (ex: "8096") ou use "mais recente" para o diário mais atual.',
  inputSchema: z.object({
    numero: z
      .string()
      .describe('Número do diário oficial (ex: "8096") ou "mais recente" para buscar o diário mais atual'),
    tipo: z.string().optional().describe('Tipo do diário: OFICIAL, SUPLEMENTO I, SUPLEMENTO II, EXTRA (padrão: OFICIAL)'),
  }),
  execute: async ({ numero, tipo = 'OFICIAL' }) => {
    try {
      let diario: DiarioInfo | null = null;
      const tipoLower = tipo.toLowerCase();

      if (numero.toLowerCase().includes('recente') || numero.toLowerCase().includes('atual') || numero.toLowerCase().includes('último')) {
        const diarios = await buscarDiariosRecentes();
        diario = diarios.find((d) => d.tipo.toLowerCase().includes(tipoLower)) ?? diarios[0] ?? null;
      } else {
        const diariosEncontrados = await buscarDiarios({ numero });
        diario = diariosEncontrados.find((d) => d.tipo.toLowerCase().includes(tipoLower)) ?? diariosEncontrados[0] ?? null;
      }

      if (!diario) {
        return {
          sucesso: false,
          mensagem: `Não encontrei o diário oficial ${numero} ${tipo}. Use a ferramenta "listarDiariosRecentes" para ver os diários disponíveis.`,
        };
      }

      const conteudo = await lerDiarioPDF(diario.downloadUrl);

      // Aumentar limite para capturar mais informações (ex: organogramas, estruturas)
      const limite = 15000;
      const conteudoLimitado = conteudo.substring(0, limite);

      return {
        sucesso: true,
        diario: {
          numero: diario.numero,
          tipo: diario.tipo,
          data: diario.data,
          link: diario.downloadUrl,
        },
        conteudo: conteudoLimitado,
        conteudoCompleto: conteudo.length <= limite,
        tamanhoTotal: conteudo.length,
        mensagem: `📄 Diário Oficial ${diario.numero} ${diario.tipo} - ${diario.data}\n\nConteúdo extraído com sucesso (${conteudo.length} caracteres total). ${conteudo.length > limite ? `Mostrando os primeiros ${limite} caracteres.` : 'Conteúdo completo incluído.'}\n\n${conteudo.length > limite ? 'DICA: Use a ferramenta "buscarPublicacao" com um termo específico (ex: "organograma", "estrutura") para encontrar seções específicas do diário.' : ''}`,
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro ao ler o diário oficial: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

/**
 * Tool: Buscar publicações específicas dentro dos diários.
 */
export const buscarPublicacaoTool = tool({
  description:
    'Busca por palavras-chave ou termos específicos nos diários oficiais de Campo Grande/MS. Se não especificar número do diário, faz busca global em todos os diários disponíveis.',
  inputSchema: z.object({
    termo: z.string().describe('Termo ou palavra-chave para buscar nas publicações (ex: "licitação", "edital", nome de empresa)'),
    numeroDiario: z.string().optional().describe('Número específico do diário para buscar (opcional, se omitido busca em todos os diários)'),
  }),
  execute: async ({ termo, numeroDiario }) => {
    try {
      // Se não especificar diário, usa busca global do site
      if (!numeroDiario) {
        const diariosComTermo = await buscarDiarios({ palavra: termo });
        
        if (diariosComTermo.length === 0) {
          return {
            sucesso: true,
            mensagem: `Não encontrei nenhum diário oficial contendo "${termo}".`,
            ocorrencias: 0,
            diarios: [],
          };
        }

        const listaFormatada = diariosComTermo
          .map((d) => `📄 Diário ${d.numero} ${d.tipo} - ${d.data}`)
          .join('\n');

        return {
          sucesso: true,
          termo,
          quantidade: diariosComTermo.length,
          diarios: diariosComTermo,
          mensagem: `Encontrei ${diariosComTermo.length} diário(s) oficial(is) contendo "${termo}":\n\n${listaFormatada}\n\nPara ver o conteúdo detalhado, especifique o número do diário que deseja ler.`,
        };
      }

      // Busca específica em um diário
      const diario = await buscarDiarioPorNumero(numeroDiario);

      if (!diario) {
        return {
          sucesso: false,
          mensagem: `Diário ${numeroDiario} não encontrado.`,
        };
      }

      const conteudo = await lerDiarioPDF(diario.downloadUrl);

      const termoLower = termo.toLowerCase();
      const linhas = conteudo.split('\n');
      const resultados: string[] = [];

      linhas.forEach((linha, index) => {
        if (linha.toLowerCase().includes(termoLower)) {
          // Capturar mais contexto (10 linhas antes e depois)
          const contextoInicio = Math.max(0, index - 10);
          const contextoFim = Math.min(linhas.length, index + 11);
          const contexto = linhas.slice(contextoInicio, contextoFim).join('\n');

          resultados.push(contexto);
        }
      });

      if (resultados.length === 0) {
        return {
          sucesso: true,
          mensagem: `Não encontrei nenhuma publicação contendo "${termo}" no Diário ${diario.numero} ${diario.tipo} - ${diario.data}.`,
          ocorrencias: 0,
        };
      }

      // Retornar dados estruturados para a IA interpretar melhor
      const resultadosLimitados = resultados.slice(0, 5);

      return {
        sucesso: true,
        diario: {
          numero: diario.numero,
          tipo: diario.tipo,
          data: diario.data,
          link: diario.downloadUrl,
        },
        termo,
        ocorrencias: resultados.length,
        trechos: resultadosLimitados,
        mensagem: `Encontrei ${resultados.length} ocorrência(s) de "${termo}" no Diário ${diario.numero} ${diario.tipo} - ${diario.data}. Use os trechos fornecidos para responder de forma clara e organizada ao usuário.${resultados.length > 5 ? ' Mostrando as 5 primeiras ocorrências.' : ''}`,
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro ao buscar publicação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
