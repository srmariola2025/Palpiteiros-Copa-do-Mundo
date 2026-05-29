# Documentação Técnica - Sistema de Palpites Copa do Mundo 2026

Este documento apresenta a arquitetura técnica e o estado atual do sistema de palpites da Copa do Mundo 2026 desenvolvido em React, TypeScript e Tailwind CSS.

## 🛠️ Arquitetura e Engenharia de Arquivos

O sistema é inteiramente client-side (SPA) e opera sem banco de dados ou servidor dedicado, mantendo excelente velocidade de carregamento e portabilidade (perfeito para hospedagem estática no GitHub Pages).

### 📁 Estrutura de Pastas e Componentes

```text
/src
├── App.tsx                    # Componente principal e orquestrador de estado global
├── index.css                  # Folha de estilo global com importação do Tailwind
├── main.tsx                   # Ponto de entrada da aplicação
├── types.ts                   # Definição técnica das interfaces TypeScript
├── /components
│   ├── Barcode.tsx            # Componente de representação de código de barras para bilhetes
│   ├── InfoModal.tsx          # Modal com informações de ajuda e regras do torneio
│   ├── TeamCardModal.tsx      # Modal interativo de figurinha para equipes selecionadas
│   └── TeamFlag.tsx           # Componente dinâmico de exibição das bandeiras dos países
├── /data
│   └── mockSoccerData.ts      # Dados da Copa do Mundo (fase de grupos, eliminação e bandeiras)
└── /utils
    ├── fifaValidator.ts       # Validador de consistência e regras FIFA para os dados carregados
    ├── openFootballLoader.ts  # Loader externo para importação de URLs compatíveis com OpenFootball
    └── whatsappFormatter.ts   # Utilitário que gera o texto esteticamente formatado para envio via WhatsApp
```

---

## ⚙️ Funcionalidades Atuais do Sistema

1. **Gestão de Palpites Estática**: O usuário pode preencher resultados para todos os jogos da fase ativa.
2. **Sistema de Timeline Simulada**: Um seletor de linha do tempo que permite simular datas futuras e congelar jogos passados (marcando como "INICIADO"), destravando partidas subsequentes (2ª rodada etc.).
3. **Mecanismo de "Surpresinha"**: Preenchimento automático e aleatório dos placares pendentes para aumentar o engajamento.
4. **Exportação de Bilhete Estético para WhatsApp**: Consolidação de todos os dados do formulário e envio direto, sem backend, gerando um bilhete legível e decorado com emojis no chat de destino.
5. **Autenticação e Persistência Local**: Uso do `localStorage` para salvar o nome do usuário e as predições anteriores de forma persistente.
6. **Modais de Figurinha**: Permite ver informações detalhadas sobre cada equipe em estilo de card colecionável ao clicar nas bandeiras/nomes das seleções.

---

## 🔒 Regras de Negócio e Condução

- **Trava de Tempo**: Jogos cuja data/hora simulada já passou são considerados iniciados e não admitem novos palpites (bloqueados na UI e na validação).
- **Consistência de Empates**: Permite empates na Fase de Grupos, mas força prorrogação/pênaltis fictícios em fases eliminatórias através de validações internas.
- **Liberador Dinâmico da 2ª Rodada**: Exibe rodadas e confrontos condicionalmente baseando-se no avanço simulado do calendário.
