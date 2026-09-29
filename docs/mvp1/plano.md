# ContrataAí — Plano do MVP1

> **Status:** aprovado em 24/09/2026, com as respostas da §5. **Sprints 1 a 6 concluídas: MVP1 completo** (25/09/2026).
> A fonte de verdade do banco é `supabase/migrations/`; a migração inicial é o schema aprovado.

---

## 0. Decisões técnicas

| Tema | Escolha | Por quê |
|---|---|---|
| Base | Expo SDK 57 (RN 0.86, React 19.2, TypeScript 6), Expo Router, TypeScript `strict` | SDK estável mais recente; roteamento por arquivos |
| Estilo | `StyleSheet` + tokens tipados em `shared/ui/theme.ts` | Zero dependência; NativeWind traria configuração de build sem ganho real num app deste tamanho |
| Estado do servidor | TanStack Query v5 | Cache e invalidação; o Realtime só invalida queries |
| Estado do cliente | Context de sessão (`onAuthStateChange`) | Sessão e tipo de conta são o único estado global |
| Formulários | react-hook-form + zod | Validação tipada em ~8 formulários sem estado manual por campo |
| Listas | FlashList v2 | Listas grandes desde o início (regra do projeto) |
| Imagens | expo-image + expo-image-picker | Cache de imagem nos cards; upload direto no Storage |
| Check-in/out | Código de 4 dígitos gerado e conferido no banco (RPCs) | Substituiu o QR Code em 29/09/2026 (ver §5): dispensa câmera e funciona igual no celular e na web |
| Data/hora | Chips com os próximos dias + horário digitado com máscara (sprint 4) | O dia sai em um toque e o horário em 4 dígitos; igual no celular e na web, sem dependência nativa. Substituiu o datetimepicker previsto no plano |
| Edge Functions | `@supabase/server` (`withSupabase`) + `fetch` | Padrão atual do Supabase para auth nas funções; Asaas, BrasilAPI e CEP via `fetch`, sem SDK |
| Chaves | publishable no app; secret só nas Edge Functions | Modelo novo do Supabase (as chaves legadas `anon`/`service_role` param no fim de 2026) |
| Pagamento | **Asaas** (Pix) | Único dos três com API de transferência Pix para qualquer chave: o freelancer não precisa abrir conta. Mercado Pago exige assinatura Ed25519 com cadastro manual para payouts; Stripe não faz Pix de saída para terceiros no Brasil |
| Qualidade | ESLint (`eslint-config-expo`) + Prettier + `tsc --noEmit`; testes pgTAP no banco | RLS e transições de estado são a parte crítica: testadas onde vivem |

**Design**
- Fonte do sistema (SF Pro/Roboto), 4 tamanhos (28/20/16/13) e 2 pesos (400/600). Valores em dinheiro com `tabular-nums`.
- 60/30/10: fundo branco e cinza-claro, texto quase preto, destaque coral `#C24020` só em CTAs e indicadores (a cor é 1 token). O coral foi escurecido em relação ao `#E4572E` original para passar no contraste AA: texto branco no botão (5,2:1) e texto coral no fundo coral-claro dos botões secundários e selos (4,6:1).
- Espaçamento 4/8/12/16/24/32/48; cards com raio 16 e sombra suave; alvos de toque ≥ 44pt; ação principal no rodapé (zona do polegar).
- `ListingCard` estilo Airbnb: foto grande 4:3, título, subtítulo, ★ nota (nº de avaliações).
- Momentos de pico com microanimação: "Check-in confirmado" (restaurante) e "Pagamento liberado" (freelancer).

**Interpretações que assumi** (corrija se não for isso)
- "Explorar restaurantes e vagas" (profissional) = cards de **vagas e freelas** com foto e nota do restaurante; o card abre a vaga e, dali, o perfil da loja.
- "Tempo de existência" = data de início de atividade na Receita (não editável).
- Um chat por par restaurante–profissional, reaproveitado em novos matches.
- "Vagas de freelancer" = chamados abertos com início no futuro.
- "Disponibilidade para freela" aparece no perfil; não bloqueia nada.

---

## 1. Estrutura de pastas

```
contrataai/
├── src/
│   ├── app/                         # Expo Router: só rotas; cada arquivo reexporta uma tela de feature
│   │   ├── _layout.tsx              # providers + Stack.Protected por sessão e tipo de conta
│   │   ├── (auth)/                  # welcome, sign-in, sign-up-restaurant, sign-up-professional
│   │   ├── restaurant/
│   │   │   ├── (tabs)/              # Profissionais · Vagas · Freelas · Mensagens · Loja
│   │   │   ├── jobs/new.tsx · jobs/[id].tsx       # criar | editar/encerrar + candidaturas
│   │   │   ├── gigs/new.tsx · gigs/[id].tsx       # publicar | aceites, confirmar, Pix, código, liberar
│   │   │   └── professionals/[id].tsx
│   │   ├── professional/
│   │   │   ├── onboarding.tsx
│   │   │   ├── (tabs)/              # Explorar · Freelas · Candidaturas · Mensagens · Perfil
│   │   │   ├── jobs/[id].tsx · gigs/[id].tsx
│   │   │   └── restaurants/[id].tsx
│   │   └── (em cada área) chat/[id].tsx  # conversa; a tela é a mesma (feature chat)
│   ├── features/                    # cada uma: screens/ components/ hooks/ services/ + index.ts (API pública)
│   │   ├── auth/                    # login, cadastros, validação de CNPJ no app (inclui o alfanumérico)
│   │   ├── restaurants/             # perfil da loja (edição) e perfil público
│   │   ├── professionals/           # onboarding/perfil, perfil público, explorar profissionais
│   │   ├── openings/                # vitrine do profissional (vagas + freelas)
│   │   ├── jobs/                    # vagas fixas e candidaturas recebidas
│   │   ├── applications/            # "Minhas candidaturas" + histórico de freelas
│   │   ├── gigs/                    # chamados, aceites, confirmação, código de check-in/out
│   │   ├── payments/                # cobrança Pix, liberação, status do repasse
│   │   ├── chat/                    # inbox e conversa em tempo real
│   │   └── reviews/                 # avaliar e listar avaliações
│   └── shared/
│       ├── ui/                      # theme.ts (tokens), Button, TextField, ListingCard, Avatar, Rating, Chip, EmptyState…
│       ├── lib/                     # supabase.ts, query-client.ts, database.types.ts (gerado), errors.ts, format.ts, labels.ts
│       └── hooks/                   # useSession
├── supabase/
│   ├── config.toml
│   ├── migrations/                  # schema, RLS e regras do banco; a inicial é o schema aprovado
│   ├── seed.sql                     # restaurantes, profissionais e vagas de exemplo
│   ├── tests/                       # pgTAP: RLS e máquina de estados
│   └── functions/
│       ├── _shared/                 # asaas.ts, brasil-api.ts, cep.ts, gig.ts, http.ts, database.types.ts
│       └── register-restaurant/ · lookup-cep/ · create-gig-charge/ · asaas-webhook/
│           release-gig-payment/ · cancel-gig/
├── .env.example                     # só para trocar de servidor (Supabase local); o padrão é a nuvem
└── app.json · package.json · tsconfig.json (strict, alias @/*) · eslint.config.js · .prettierrc
```

- **Camadas:** tela (compõe e navega) → hook (TanStack Query; traduz erro em estado de UI) → service (Supabase; lança `AppError` tipado). Componente não importa `supabase`.
- **Áreas por pasta, não por grupo:** `restaurant/` e `professional/` são segmentos reais. Grupos `( )` não mudam a URL, e as duas áreas têm telas homônimas (ex.: `gigs/[id]`).
- **Proposta fora do padrão:** uma feature pode usar a API pública (`index.ts`) de outra, sem ciclos. Exemplo: a tela do freela (`gigs`) usa o `PixChargeSheet` de `payments` e o formulário de `reviews`. Mover isso para `shared/` misturaria regra de domínio com UI genérica.

---

## 2. Schema Postgres + RLS

Arquivo completo: `supabase/migrations/20260924233610_init.sql`.

### Tabelas e relações
- `profiles` 1:1 `auth.users`: tipo de conta. Criado por trigger no cadastro.
- `restaurants` 1:1 `profiles`: CNPJ (aceita o alfanumérico de jul/2026), razão social, nome, descrição, início de atividade, capa, endereço, cidade, nota média. `restaurant_photos`: galeria.
- `professionals` 1:1 `profiles`: nome, foto, cargo principal e secundários, experiência, cidade, disponível para freela, nota média. `payout_accounts` 1:1: chave Pix, em tabela à parte porque o perfil é público e a chave não.
- `jobs` (cargo, descrição, salário ou faixa em centavos, turno, aberta/encerrada) → `job_applications` (enviada/aceita/recusada; única por vaga + profissional).
- `gigs` (cargo, início, fim, valor, estado, freelancer confirmado e a data de cada transição) → `gig_applications` (aceites) e `payments` (1 por freela: cobrança Pix, `platform_fee_cents` = 0 sem lógica, repasse).
- `conversations` (única por restaurante + profissional, criada no match) → `messages`.
- `reviews`: uma por avaliador por freela, nota de 1 a 5; trigger atualiza a média no perfil.
- View `openings`: vagas e freelas abertos com foto, cidade e nota da loja. A vitrine do profissional é uma lista só.
- Cidade tem uma chave normalizada (`city_key`) para o filtro: "SAO PAULO", que vem da Receita, casa com "São Paulo", que o usuário digita.

### Quem lê e quem escreve

| Tabela | Leitura | Escrita pelo app |
|---|---|---|
| profiles | o próprio usuário | nenhuma (trigger; o restaurante é convertido pela Edge Function) |
| restaurants | usuários logados | dono edita nome, descrição, capa e endereço; CNPJ, razão social, abertura e nota, não |
| restaurant_photos | logados | dono |
| professionals | logados | dono (menos a nota) |
| payout_accounts | só o dono | dono |
| jobs | logados | restaurante cria; edita ou encerra só vaga aberta |
| job_applications | o profissional e o restaurante da vaga | profissional cria (sempre "enviada"); restaurante aceita ou recusa |
| gigs | abertos: logados; os demais: as partes e quem aceitou | restaurante cria; **o estado nunca** (só RPC ou Edge Function) |
| gig_applications | o profissional e o restaurante do chamado | profissional aceita chamado aberto |
| payments | as partes do chamado | nenhuma (só Edge Functions) |
| conversations / messages | participantes | participantes enviam mensagens |
| reviews | logados | parte do freela, depois do check-out, avaliando a outra parte |
| Storage `avatars`, `restaurant-photos` | público (URL da imagem) | cada usuário só na pasta `{uid}/`; até 5 MB, jpeg/png/webp |

Como isso é garantido:
- RLS em todas as tabelas.
- Privilégio por coluna: o app não consegue nem enviar `status`, `rating_avg`, `cnpj`…
- Funções internas no schema `private`, fora da API.
- `(select auth.uid())` nas policies, que é a recomendação de performance do Supabase.

### Máquina de estados do freela

| # | Transição | Quem dispara | Onde é validada |
|---|---|---|---|
| 1 | `open → confirmed` | restaurante escolhe um dos aceites | RPC `confirm_gig_professional` (recusa os demais e cria a conversa) |
| 2 | `confirmed → paid_held` | Pix recebido | Edge `asaas-webhook` |
| 3 | `paid_held → checked_in` | freelancer digita o código de check-in | RPC `redeem_gig_checkpoint` |
| 4 | `checked_in → checked_out` | freelancer digita o código de check-out | RPC `redeem_gig_checkpoint` |
| 5 | `checked_out → released` | restaurante libera | Edge `release-gig-payment` (transferência Pix) |
| 6 | `open` / `confirmed` / `paid_held → cancelled` | restaurante cancela | Edge `cancel-gig` (estorno se já pagou) |
| 7 | `paid_held` / `checked_in` / `checked_out → disputed` | qualquer das partes | RPC `open_gig_dispute` |
| 8 | `disputed → released` / `cancelled` | equipe, manualmente | pelo painel do Supabase |

O trigger `guard_gig_transition` rejeita qualquer transição fora dessa tabela, inclusive vinda do service role, e grava a data de cada estado (`checked_in_at`, `checked_out_at`…).

### Validação já feita
O schema foi aplicado num Supabase local (Postgres 17) e o `supabase db lint` passou limpo. Rodei 24 cenários como cada tipo de usuário, e todos se comportaram como esperado:
- profissional não cria loja nem aumenta a própria nota;
- restaurante não vê chave Pix;
- ninguém pula estado, nem o service role;
- quem teve o aceite recusado ainda vê o freela no histórico, e terceiros não;
- o chat é fechado aos participantes;
- avaliação só depois do check-out, com a média atualizando;
- CNPJ alfanumérico é aceito;
- visitante anônimo não lê nada.

Na sprint 1 esses cenários viram testes pgTAP em `supabase/tests/`.

---

## 3. Edge Functions

| Função | Quem chama | Auth | Responsabilidade |
|---|---|---|---|
| `register-restaurant` | app, sem sessão | publishable key | Consulta o CNPJ na BrasilAPI: 404 → "não encontrado", 400 → "inválido", situação ≠ ATIVA → recusa informando a situação. Bloqueia CNPJ repetido, cria o usuário (Admin API), converte o profile para restaurante e cria a loja com os dados da Receita. Se algo falhar no meio, apaga o usuário. Em seguida o app faz login. |
| `create-gig-charge` | restaurante | usuário | Para um chamado `confirmed` do próprio restaurante: busca ou cria o cliente no Asaas pelo CNPJ, cria a cobrança Pix, grava em `payments` e devolve o QR e o copia-e-cola. Idempotente: se já há cobrança pendente, devolve a mesma. |
| `asaas-webhook` | Asaas | token no header `asaas-access-token` | `PAYMENT_RECEIVED` → `paid_held` (se o chamado foi cancelado nesse meio-tempo, estorna). `PAYMENT_REFUNDED` → `refunded`. `TRANSFER_DONE` / `FAILED` / `CANCELLED` → status do repasse. Idempotente: evento repetido não muda nada. |
| `release-gig-payment` | restaurante | usuário | Para um chamado `checked_out`: transfere via Pix o valor (menos `platform_fee_cents`, hoje 0) para a chave do freelancer, grava o id do repasse e passa o chamado para `released`. |
| `cancel-gig` | restaurante | usuário | `open` ou `confirmed`: cancela a cobrança pendente no Asaas. `paid_held`: faz o estorno Pix. Depois, `cancelled`, e os aceites pendentes são recusados. Só o restaurante, até o check-in (decisão 1). |
| `lookup-cep` *(sprint 2)* | app, logado | usuário | CEP → endereço com acentos e coordenadas do trecho do CEP (AwesomeAPI, sem chave). Usada nos perfis de loja e de profissional; o cadastro do restaurante usa o mesmo módulo para gravar as coordenadas da loja. |

A pasta `_shared/` guarda o cliente Asaas mínimo (fetch), a consulta à BrasilAPI, a consulta de CEP, as respostas e erros HTTP e os tipos gerados do banco. Os segredos `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` ficam só em `supabase secrets`.

---

## 4. Sprints

Toda sprint termina com `npx expo start` sem erro de tipo ou lint e com um roteiro de teste manual.

| Sprint | Entrega | Você testa |
|---|---|---|
| **1 — Fundação + contas** | Projeto Expo configurado (TS strict, ESLint/Prettier, Router, Query), tema e componentes base. Supabase local com a migração, seed, testes pgTAP e tipos gerados. Boas-vindas, login, cadastro de profissional e de restaurante (CNPJ no app + `register-restaurant`), áreas protegidas por tipo de conta | Restaurante com CNPJ ativo, inexistente, inválido e inativo; profissional; login e logout; uma conta não entra na área da outra |
| **2 — Perfis** | Onboarding e edição do profissional (foto, cargos em chips, experiência, cidade, disponibilidade, chave Pix); perfil da loja (capa, galeria, descrição, endereço, tempo de existência); perfis públicos; Storage | Enviar e trocar fotos; campos obrigatórios; ver o perfil do outro lado |
| **3 — Explorar + vagas fixas** | Restaurante: explorar profissionais (cards, filtro por cargo, busca), criar, editar e encerrar vaga, candidaturas recebidas. Profissional: vitrine de vagas e freelas (filtros de cargo, tipo e cidade), candidatar-se, "Minhas candidaturas" | Filtros e busca; candidatura aceita ou recusada aparecendo do outro lado |
| **4 — Freelas + chat** | Publicar chamado, aceite em um toque, aceites em tempo real, confirmar freelancer; chat em tempo real criado no match | Em dois aparelhos: aceite aparece ao vivo; confirmar; conversar |
| **5 — Pagamento com garantia** | Asaas sandbox: cobrança Pix e webhook, QR de check-in e check-out com a câmera, liberação com transferência Pix, cancelamento e estorno, disputa; linha do tempo do chamado | Fluxo completo com Pix simulado; QR vencido, reutilizado ou lido por outra pessoa é recusado |
| **6 — Avaliações + acabamento** | Avaliação dos dois lados após o check-out; notas nos cards e perfis; revisão dos estados vazio, erro e carregando; acessibilidade (44pt, contraste); roteiro ponta a ponta | Avaliar; ver a média nos cards; percorrer o app inteiro com os dois tipos de conta |

---

## 5. Decisões de produto (respondidas em 24/09/2026)

| # | Tema | Decisão |
|---|---|---|
| 1 | Cancelamento do freela | Só o restaurante cancela, até o check-in. Se já pagou, estorno integral via Pix (a tarifa Pix do Asaas não volta; a plataforma absorve). O freelancer confirmado não cancela pelo app. |
| 2 | Disputa | Qualquer das partes abre, de `paid_held` até antes de `released`. O valor fica congelado e a equipe resolve manualmente; o chamado termina `released` ou `cancelled`. |
| 3 | Avaliações | Só em freelas concluídos (após o check-out), nos dois sentidos. |
| 4 | Cargos | Cozinheiro(a), Auxiliar de cozinha, Sushiman, Chapeiro(a), Pizzaiolo(a), Confeiteiro(a), Auxiliar de limpeza/copa, Garçom/Garçonete, Bartender, Caixa, Motoboy. Novos cargos entram depois com uma migração (`alter type job_role add value …`) e o rótulo no app. |
| 5 | Turno da vaga fixa | Um por vaga: Manhã, Tarde, Noite, Madrugada ou Integral. |
| 6 | Chave Pix | Obrigatória antes do primeiro aceite de freela, garantida por RLS em `gig_applications`. |
| 7 | Confirmação de e-mail | **Ligada desde a sprint 1.** Código de 6 dígitos digitado no app, sem deep link. Em produção exige um provedor SMTP próprio, porque o SMTP padrão do Supabase só envia para membros da equipe. |
| 8 | Localização nos cards | **Mostrar distância** (ex.: "Itaim Bibi · 2,4 km"), a partir de coordenadas geocodificadas do endereço/CEP. Entra na sprint 3; a sprint 1 já guarda o endereço em campos separados. |
| 9 | Asaas | Ainda não há conta. Antes da sprint 5: criar conta no sandbox. Antes do lançamento: conta PJ da plataforma. Em produção, os repasses começam com aprovação manual no app do Asaas. |

### Sprint 2 — decisões de implementação
- **Coordenadas por CEP (AwesomeAPI) no lugar do OpenStreetMap.** Nos testes, o OpenStreetMap não achou a Av. República do Chile (RJ) e confundiu a cidade de Descalvado com uma rua de São Paulo. A AwesomeAPI resolveu todos os CEPs testados numa chamada, com endereço acentuado. A precisão é a do trecho do CEP, suficiente para mostrar distância.
- **Localização do profissional é privada e aproximada:** fica em `professional_locations`, que só o dono lê, com 2 casas decimais (~1 km) garantidas pelo tipo da coluna. O perfil público mostra só bairro e cidade.
- O profissional pode **remover** a própria chave Pix (sem ela, não aceita freelas).
- Capa e galeria da loja salvam na hora; textos e endereço, no botão "Salvar".

### Sprints 3 a 6 — decisões de implementação
- **Distância calculada no banco** (haversine) entre as coordenadas do CEP da loja e as do profissional, nas views `openings` e `professional_cards` (`security_invoker`: vale a RLS de quem consulta). Listas paginadas de 20 em 20.
- **Tempo real só invalida o cache:** o Realtime (com RLS) avisa que o freela, os aceites, o pagamento ou a conversa mudaram, e a tela busca de novo. Assim o Pix pago, o check-in lido pelo freelancer e o repasse concluído aparecem sozinhos na tela do outro lado.
- **Webhooks do Asaas simulados no ambiente local** (`npm run sandbox:pay` / `sandbox:payout`), porque o sandbox não alcança o `localhost`. Cobrança, estorno e transferência são chamadas reais ao sandbox.
- **QR de check-in/out (substituído pelo código de 4 dígitos em 29/09/2026):** token assinado de 5 minutos, renovado sozinho a cada 4 minutos enquanto o restaurante deixa o QR aberto. O uso único vem da troca de estado: depois do check-in, nenhum QR de check-in vale mais.
- **Tela do freela por etapa:** um card diz em que pé está e o que vem a seguir; a ação da etapa (pagar, mostrar o código, confirmar o código, liberar) fica no rodapé, na zona do polegar. Cancelar e abrir disputa ficam em "Imprevistos", no fim da tela, e pedem dois toques. A linha do tempo mostra a hora de cada etapa.
- **Momentos de pico:** "Check-in confirmado" (restaurante) e "Pagamento liberado!" (freelancer) com o ícone animado; a animação respeita o "reduzir movimento" do sistema.
- **Avaliações nos perfis** vêm da view `review_cards`: `reviews.reviewer_id` aponta para `profiles`, que só o dono lê, então o nome e a foto de quem avaliou saem da loja ou do perfil profissional. O perfil mostra as 20 mais recentes; a média vem do trigger.
- **Coral escurecido para `#C24020`** na revisão de acessibilidade: o texto coral no fundo coral-claro (botões secundários e selos) tinha contraste 4,2:1, abaixo do AA.

### Depois do MVP — ajustes de ambiente (29/09/2026)

- **Sem IP no `.env`:** para o Supabase local, o `.env.local` fica com `http://127.0.0.1:54321` e, em desenvolvimento no celular, o app troca esse endereço pelo do computador que está servindo o app (`Constants.expoConfig.hostUri`). Antes, o IP do computador ficava escrito no `.env` e o app parava no celular quando o roteador entregava outro IP. Em produção (URL do projeto Supabase) nada é trocado.
- **Formatação compatível com o motor do celular (Hermes):** o formatador de moeda informa mínimo e máximo de casas juntos, e a busca remove acentos por faixa de caracteres em vez de `p{M}`.

### Servidor na nuvem (29/09/2026)

Pedido do usuário: rodar o app de qualquer lugar, com o Asaas ainda no sandbox.

- **Projeto Supabase `contrataai`** (`pxpghoicyyraezfokxlc`, São Paulo, plano gratuito). O app aponta para ele por padrão; o Supabase local vira opção de desenvolvimento, ligada por um `.env.local`.
- **Banco idêntico ao local:** as 6 migrações foram aplicadas na ordem e o histórico na nuvem usa as mesmas versões dos arquivos, então `supabase db push` continua valendo. A conferência comparou tabelas, policies, funções, triggers, views, permissões, índices e constraints dos dois bancos.
- **Dados de demonstração na nuvem:** o mesmo `seed.sql`, com os freelas espalhados em duas semanas (o ambiente da nuvem não é recriado todo dia). As contas têm senha conhecida e saem antes do lançamento.
- **Asaas no sandbox**, por decisão do usuário. Os segredos vão para a nuvem pelo `npm run cloud:setup`, que também cadastra o webhook no Asaas.
- **CEP com serviço reserva:** a AwesomeAPI devolve 429 para as funções na nuvem, porque a cota gratuita é por IP e o IP de saída é compartilhado. Com `AWESOMEAPI_KEY` (gratuita) a cota passa a ser da chave. Se a AwesomeAPI falhar, o endereço vem da BrasilAPI, sem coordenadas: o cadastro não trava, mas aquele perfil fica sem distância nos cards. As coordenadas da BrasilAPI não são usadas porque, nos testes, vieram do centro da cidade.
- **Avisos do verificador do Supabase aceitos:** `confirm_gig_professional` e `open_gig_dispute` são `security definer` chamáveis por usuários logados de propósito (conferem `auth.uid()` por dentro).
- **Túnel do Expo não entrou:** no computador de desenvolvimento o túnel não conecta (bloqueio de segurança do Windows/antivírus). Para usar o app longe do computador, o caminho é gerar o app instalável (EAS Build).

### Check-in e check-out por código de 4 dígitos (29/09/2026)

Pedido do usuário: trocar o QR Code por um código de 4 dígitos no início e no fim do turno.

- **Quem mostra e quem digita:** o restaurante mostra (ou dita) o código e o freelancer confirmado digita no app dele. É a mesma direção do QR e do código de entrega dos apps de delivery: quem contrata tem o código, quem presta o serviço digita.
- **Proteção de um código curto:** 4 dígitos são só 10 mil combinações, então o código vale 10 minutos, serve uma vez e trava depois de 5 erros. Só o restaurante gera outro; o freelancer não consegue pedir código novo para continuar tentando.
- **No banco, não em Edge Function:** as RPCs `issue_gig_checkpoint` e `redeem_gig_checkpoint` substituem as funções `issue-checkpoint` e `redeem-checkpoint`. Não há mais integração externa nem segredo envolvido, e conferir o código, contar o erro e trocar o estado do freela acontecem numa transação só. A tabela `gig_checkpoints` não é lida pelo app.
- **Erro não é exceção:** código errado, vencido ou travado voltam como resultado da RPC. Uma exceção desfaria a transação e, com ela, a contagem de erros.
- **Sem envio automático no 4º dígito:** como cada erro conta, a pessoa confere os números antes de tocar em "Confirmar".
- **Saíram do app:** a tela de leitura do QR, a permissão de câmera para isso e as dependências `expo-camera`, `react-native-qrcode-svg` e `react-native-svg`.

### Publicação e app instalável (29/09/2026)

- **Todas as Edge Functions declaradas em `supabase/config.toml`:** a integração do Supabase com o GitHub só publica as funções declaradas.
- **`eas.json` com os perfis `preview` (APK para Android, distribuição interna) e `production`**, os dois apontando para o servidor na nuvem. Identificador do app: `com.contrataai.app`.

### Limpeza e configuração zero (29/09/2026)

Pedido do usuário: apagar código e arquivos mortos, enxugar o que fica, tirar comentários que repetem o código, e deixar o repositório pronto para os colegas clonarem e rodarem em casa.

- **Sem `.env`:** o app aponta para a nuvem por padrão (valores em `src/shared/lib/supabase.ts`; a chave publishable é pública) e os scripts fazem o mesmo. `.env`/`.env.local` só trocam de servidor. O `eas.json` deixou de repetir os valores.
- **Expo Go no iPhone (SDK 57):** a Expo passou a exigir login na mesma conta no terminal (`npx expo login`) e no app. Cada colega usa a própria conta gratuita, no próprio computador. Documentado no README, com o `--tunnel` como saída para redes que isolam os aparelhos.
- **Saíram:** `PROMPT-engenheiro-mobile.md` (descrevia o fluxo de QR Code; as regras de código viraram a seção "Convenções" do README), `mobile-app-ui-design/` (skill de terceiros copiada para o repositório), `docs/mvp1/schema.sql` (cópia histórica; as migrações são a fonte de verdade), a dependência `@supabase/functions-js` das Edge Functions (só tipos ambientes sem uso; puxava 37 pacotes para cada `deno.lock`), colunas selecionadas que nenhuma tela lia, exports e tipos sem uso (`knip`).
- **Ficaram de propósito:** o suporte a web (`react-native-web`), que permite testar no navegador sem celular e é uma saída possível para o time de iPhone; e `.claude/launch.json`, que abre duas instâncias web para testar o fluxo restaurante ↔ profissional.
- **Refatoração (mesmo comportamento):** `unwrap()` no lugar de 47 cópias do desembrulho de erro dos serviços; `QueryFallback` no lugar dos blocos carregando/erro das telas; `FormChipSelect` no lugar de seis blocos `Controller` iguais; `ListRow` para as listas do restaurante; `GigStage` como tabela de etapas por quem vê; chaves de cache compartilhadas (`sharedKeys`) e `invalidate()`; nas Edge Functions, `handle()`, `readBody()`, `loadOwnGig()`, `refundPayment()` e `getJson()` no lugar do que as seis funções repetiam.
- **Comentários:** ficam só os que explicam um porquê; 66 que repetiam o código e 28 cópias de explicações já feitas em outro arquivo saíram (212 → 129).
- **Resultado:** app de 7.698 para 7.283 linhas, funções e scripts de 902 para 778 (sem contar os tipos gerados e os lockfiles). Verificado aqui: lint, typecheck, prettier, `functions:check` e o pacote iOS (`expo export`). Não rodados neste ambiente: `db:test` (sem Docker; as migrações e os testes não mudaram) e as duas checagens do `expo-doctor` que dependem de rede.

### Responsividade e UX (29/09/2026)

Pedido do usuário: app responsivo, seguindo boas práticas de UX/UI. Verificado no navegador com dados simulados, em 320, 375 e 430 pontos de largura (iPhone SE, padrão e Pro Max) e em 1024 (desktop), todas as 25 telas.

- **Coluna de conteúdo** (`useLayout` em `shared/ui`): margem de 16pt em telas com menos de 360pt e 24pt nas demais; largura máxima de 640pt centralizada em telas largas (web e tablet), aplicada por `Screen`, `PagedList`, os filtros das vitrines e o chat.
- **Tamanho de fonte do sistema:** o texto acompanha a preferência de acessibilidade até 1,5×; acima disso os layouts fixos quebrariam (`MAX_FONT_SCALE`, aplicado em `Text` e nos campos).
- **Barra de abas:** rótulos no tamanho padrão do iOS (10pt) e sem margem lateral no item; "Profissionais" virou "Explorar" (como no lado do profissional) e a aba "Candidaturas" virou "Inscrições", porque 12 letras não cabem em 375pt. Em 320pt (aparelhos antigos) rótulos de 9 letras ainda ganham reticências.
- **Selos de status** ficam abaixo do nome nas linhas de perfil (candidaturas, candidatos da vaga) em vez de disputar a linha com o título, que truncava em 375pt; nas linhas de vaga/freela o selo encolhe e quebra linha quando falta espaço.
- **Puxar para atualizar** nas listas e perfis (`onRefresh` do `Screen`, `PagedList`), com o indicador só durante a atualização pedida pela pessoa.
- **QR do Pix** escala com a tela (70% da largura, até 240pt) em vez de 200pt fixos.

### Migrações depois da inicial
`profiles_location` (sprint 2), `explore_distance` (3), `realtime_inbox` (4), `realtime_payments` (5), `review_cards` (6) e `checkpoint_codes` (código de 4 dígitos).

### Ajustes no schema aprovado (migração inicial)
- `restaurants.address` virou campos separados (`street`, `number`, `complement`, `neighborhood`, `postal_code`) para exibir o bairro e geocodificar.
- Policy de `gig_applications` exige chave Pix cadastrada (decisão 6).

---

## 6. Riscos e observações

- **Tributário e regulatório:** o valor do freela entra na conta da plataforma antes do repasse. Vale confirmar com o contador se isso conta como receita bruta e como enquadrar a intermediação.
- **Tarifas atuais do Asaas:** Pix recebido R$ 1,99 (R$ 0,99 nos 3 primeiros meses); 30 transferências Pix por mês grátis, depois R$ 2,00 cada.
- **BrasilAPI** é gratuita e usa cache de cerca de 11 h: um CNPJ que mudou de situação hoje pode demorar a refletir. Aceitável no MVP.
- **Webhooks do Asaas** chegam "pelo menos uma vez", por isso todo handler é idempotente pelo estado.
- **Tarifa do Asaas × repasse integral:** a tarifa do Pix recebido sai da conta da plataforma e o repasse ao freelancer é do valor cheio (a taxa da plataforma ainda é 0). A conta precisa de um pequeno saldo de reserva; sem ele, a liberação falha com "saldo insuficiente". Quem paga essa tarifa (restaurante, freelancer ou plataforma) é uma decisão de produto para quando entrar a taxa.
- **Transferências em produção** exigem aprovação no app do Asaas ou IPs fixos (as Edge Functions não têm). Até existir um proxy com IP fixo, o repasse fica "em andamento" até a aprovação manual.
- **Sandbox do Asaas:** às vezes credita o Pix confirmado só dois dias depois; até lá, liberações acima do saldo disponível falham no teste local.
- **Expo Go:** FlashList, seletor de imagem e área de transferência rodam nele. Não é preciso build nativo nas sprints 1 a 6.
