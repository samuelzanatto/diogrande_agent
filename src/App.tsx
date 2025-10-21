import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createGroq } from '@ai-sdk/groq';
import { streamText, smoothStream, stepCountIs } from 'ai';
import ReactMarkdown from 'react-markdown';
import { listarDiariosRecentesTool, lerDiarioOficialTool, buscarPublicacaoTool } from './tools/diogrande-tools';
import './index.css';
// Import da logo como asset do Vite
import logoImage from './assets/logo.png';

// Inicializar provider com API key
const groqProvider = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-focus input after assistant responds
  useEffect(() => {
    if (!isProcessing && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [isProcessing, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Listen for clear conversations event from main process
  useEffect(() => {
    let disposeClear: (() => void) | undefined;
    if (window.electronAPI?.onClearConversations) {
      disposeClear = window.electronAPI.onClearConversations(() => {
        setMessages([]);
        setStreamingContent('');
        setQuery('');
        setIsProcessing(false);
      });
    }

    return () => {
      disposeClear?.();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsProcessing(true);
    setStreamingContent('');
    
    try {
      console.log('🤖 Processando query:', query);
      
      // Criar array de mensagens para contexto
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Adicionar system message
      const messagesWithSystem = [
        {
          role: 'system' as const,
          content: `Você é um assistente especializado em consultar o Diário Oficial de Campo Grande/MS. 

FERRAMENTAS DISPONÍVEIS:
- listarDiariosRecentes: Lista os diários oficiais mais recentes
- lerDiarioOficial: Lê o conteúdo completo de um diário específico (até 15.000 caracteres)
- buscarPublicacao: Busca por termos nos diários oficiais
  * Se NÃO especificar numeroDiario: faz BUSCA GLOBAL em TODOS os diários e retorna a lista de diários que contêm o termo
  * Se especificar numeroDiario: busca naquele diário específico e retorna os trechos encontrados COM CONTEXTO EXPANDIDO (10 linhas antes e depois)

ESTRATÉGIA RECOMENDADA:
1. Para encontrar qual diário tem uma informação: use buscarPublicacao SEM numeroDiario (busca global)
2. Para ver detalhes de uma seção específica: use buscarPublicacao COM numeroDiario e termo específico (ex: "organograma", "estrutura", "competências")
3. Para ler o início do diário: use lerDiarioOficial

IMPORTANTE - FORMATAÇÃO DAS RESPOSTAS:
- Quando receber resultados de busca, SEMPRE analise e organize as informações de forma clara
- Use listas numeradas ou com marcadores para itens
- Separe seções com subtítulos (use ## para seções principais)
- Para estruturas organizacionais, organize hierarquicamente
- Destaque informações importantes com **negrito**
- Resuma e sintetize o conteúdo quando houver muita informação
- NUNCA cole texto bruto sem formatação
- Sempre explique o contexto antes de listar informações

EXEMPLO DE BOA FORMATAÇÃO:
"## Estrutura da Secretaria Municipal de Saúde

Segundo o Decreto n. 16.404/2025 publicado no Diário 8093:

**Competências principais:**
1. Formulação da política de saúde municipal
2. Coordenação de programas do SUS
3. Controle sanitário e vigilância

**Órgãos subordinados:**
- Departamento X
- Coordenadoria Y
..."

Sempre utilize as ferramentas de forma eficiente e apresente informações de forma clara e organizada.`,
        },
        ...conversationHistory,
      ];
      
      // Usar AI SDK com streaming
      const result = streamText({
        model: groqProvider('llama-3.3-70b-versatile'),
        messages: messagesWithSystem,
        temperature: 0.7,
        // Adicionar tools para consulta de diários oficiais
        tools: {
          listarDiariosRecentes: listarDiariosRecentesTool,
          lerDiarioOficial: lerDiarioOficialTool,
          buscarPublicacao: buscarPublicacaoTool,
        },
        // Permitir múltiplos steps para tool calling
        stopWhen: stepCountIs(5),
        // Controlar velocidade do streaming
        experimental_transform: smoothStream({
          delayInMs: 30, // Delay entre palavras (padrão: 10ms)
          chunking: 'word', // Enviar palavra por palavra
        }),
      });

      // Processar stream completo (texto + tool calls)
      let fullResponse = '';
      const toolCallMessages: string[] = [];
      
      for await (const chunk of result.fullStream) {
        if (chunk.type === 'text-delta') {
          // Texto sendo gerado
          fullResponse += chunk.text;
          setStreamingContent(fullResponse);
        } else if (chunk.type === 'tool-call') {
          // Ferramenta sendo chamada - mostrar indicador visual
          const toolName = chunk.toolName;
          const displayName = 
            toolName === 'listarDiariosRecentes' ? '📋 Listando diários recentes...' :
            toolName === 'lerDiarioOficial' ? '📄 Lendo diário oficial...' :
            toolName === 'buscarPublicacao' ? '🔍 Buscando publicação...' :
            `🔧 ${toolName}...`;
          
          setStreamingContent(fullResponse + '\n\n' + displayName);
          
          console.log('🔧 Tool call:', toolName, chunk.input);
        } else if (chunk.type === 'tool-result') {
          // Resultado da ferramenta recebido
          console.log('✅ Tool result:', chunk.toolName, chunk.output);
          
          // Extrair mensagem do resultado
          const output = chunk.output as { mensagem?: string; sucesso?: boolean };
          
          if (output.mensagem) {
            toolCallMessages.push(output.mensagem);
          }
        } else if (chunk.type === 'finish') {
          console.log('🏁 Stream finalizado:', chunk.finishReason);
        }
      }

      // Se não houve texto gerado pela IA, usar as mensagens das ferramentas
      if (!fullResponse.trim() && toolCallMessages.length > 0) {
        fullResponse = toolCallMessages.join('\n\n');
      }

      // Adicionar resposta completa às mensagens
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse || 'Processamento concluído.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');

      console.log('✅ Resposta final da IA:', fullResponse);
      
    } catch (error) {
      console.error('❌ Erro ao processar:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erro ao processar sua solicitação. Tente novamente.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape to close window
    if (e.key === 'Escape') {
      setQuery('');
      setMessages([]);
      setStreamingContent('');
      if (window.electronAPI) {
        window.electronAPI.hideWindow();
      }
    }
  };

  useLayoutEffect(() => {
    if (!containerRef.current || !window.electronAPI?.resizeWindow) {
      return;
    }

    const sendResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const padding = 40; // extra space for shadows and breathing room
      const desiredHeight = Math.ceil(rect.height + padding);
      window.electronAPI.resizeWindow(desiredHeight);
    };

    sendResize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        sendResize();
      });
      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }

    const interval = window.setInterval(sendResize, 250);
    return () => window.clearInterval(interval);
  }, [messages, streamingContent]); // Redimensionar quando mensagens mudarem

  return (
    <div className="agent-container" ref={containerRef}>
      {/* Input sempre visível no topo */}
      <div style={{ flexShrink: 0 }}>
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <span className={`search-icon${isProcessing ? ' search-icon--processing' : ''}`}>
              {isProcessing ? '⚙️' : (
                <img
                  src={logoImage}
                  alt="Logo do agente"
                  className="search-icon-image"
                  draggable={false}
                  onError={(e) => {
                    // Fallback para emoji se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.textContent = '🤖';
                    }
                  }}
                />
              )}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao agente de IA..."
              className="search-input"
              autoComplete="off"
              spellCheck={false}
              disabled={isProcessing}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="clear-button"
                aria-label="Limpar"
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Processing indicator */}
      {isProcessing && !streamingContent && messages.length === 0 && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Processando...</span>
        </div>
      )}

      {/* Messages area - scrollable */}
      {messages.length > 0 && (
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.role}`}
            >
              <div className="message-content">
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          
          {/* Streaming message */}
          {streamingContent && (
            <div className="message-bubble assistant streaming">
              <div className="message-content">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
