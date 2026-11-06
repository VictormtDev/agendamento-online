# Redesign do frontend — Encaixe

## Por quê

O app funciona, mas o visual é o Tailwind padrão: tudo `slate`, um único botão preto, nenhum ícone, status em texto puro, `<input type="date">` nativo, header que quebra no celular e login sem marca. O projeto existe para impressionar recrutadores. A interface é a primeira coisa que eles veem, então precisa parecer um produto real, pensado para quem atende (salão, clínica, barbearia) e para os clientes dessas pessoas.

## Objetivos

- Ter uma identidade própria, a **Encaixe**, aplicada de forma consistente em todas as telas.
- Ter um design system pequeno em `components/ui`, reutilizado pelas telas, sem classes soltas repetidas.
- Funcionar bem no celular, incluindo o header com menu.
- Tornar o fluxo de agendamento a parte mais memorável da interface.

## Não-objetivos

- Nenhuma mudança em `apps/api`, na lógica, nos hooks de `src/api/` ou nos schemas Zod e validações.
- Nenhuma tela nova, nenhuma funcionalidade nova e nenhum dark mode.
- Nenhuma biblioteca de componentes (shadcn, Radix, Headless UI).

## Anti-objetivos (falha mesmo que "funcione")

- Mudar textos e labels que os testes usam, ou enfraquecer um teste para ele passar.
- Cair no visual genérico de "app acolhedor" (creme + terracota/marrom) ou no kit SaaS (cards idênticos com a mesma sombra cinza e gradientes decorativos).
- Duplicar no front uma regra de negócio que é da API (por exemplo, a janela de 60 dias).

## Restrições

- Tailwind v4: os tokens ficam em `@theme` no `src/index.css`.
- Uma única dependência nova: `lucide-react` (aprovada). As fontes entram por `<link>` do Google Fonts no `index.html`, sem pacote npm.
- Um commit por etapa, em Conventional Commits com descrição em português, na branch `feat/redesign`.
- Ao fim de cada etapa: `npm test -w apps/web` e `npm run build -w apps/web` passando, e depois uma parada para conferência no navegador.

## Identidade

**Nome:** Encaixe. "Tem um encaixe hoje?" é como se pede horário no salão; também descreve o que o sistema faz, que é encaixar um serviço num horário livre.
**Frase de apoio:** "Seu horário, no encaixe certo."

### Tokens (`@theme`)

| Token                  | Valor                                                                                        | Uso                                   |
| ---------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `--color-eucalyptus-*` | escala 50–900, base 700 `#1F5C55`                                                            | primária: botões, links, seleção      |
| `--color-saffron-*`    | escala, base 400 `#E3A72F`                                                                   | toque quente: "hoje", status agendado |
| `--color-linen`        | `#F6F7F4`                                                                                    | fundo da página                       |
| `--color-ink`          | `#1C2321`                                                                                    | texto principal                       |
| `--color-ruby-*`       | escala, base 600 `#B4363F`                                                                   | perigo, cancelado, erros              |
| `--font-display`       | Bricolage Grotesque                                                                          | títulos e logotipo                    |
| `--font-sans`          | Figtree                                                                                      | texto e interface                     |
| raios                  | pílula em botões e chips; `1rem` em cards; `0.75rem` em inputs                               |
| sombras                | quase nenhuma: os cards usam borda de 1px; sombra só no menu mobile e no card de confirmação |

Os tons intermediários das escalas são escolha do implementador, com contraste mínimo AA para texto.

### Onde ousar

Em um lugar só: o **seletor de dia e horário**. Todo o resto fica sóbrio.

## Abordagens consideradas

1. **Design system próprio em `components/ui` + tokens no `@theme`** (escolhida). É pouco código, não adiciona dependências e mostra domínio de CSS e componentização.
2. **shadcn/ui ou Radix:** traz acessibilidade pronta, mas adiciona várias dependências e deixa o visual com cara de template.
3. **Só trocar as classes tela a tela, sem componentes:** é rápido, mas repete classes e não demonstra um design system.

Direção visual: **Eucalipto** (escolhida) em vez de **Ameixa**, porque Ameixa afasta barbearia e clínica.

## Etapas (uma por commit)

**a) Design system:** tema no `index.css`, fontes no `index.html` e `<title>Encaixe</title>`. Componentes em `components/ui`:

- `Button`: variantes `primary`, `secondary`, `ghost` e `danger`, além de tamanhos.
- `Card`.
- `Badge` de status: ícone + texto, com cor por status, reaproveitando os textos de `STATUS_LABELS`.
- `Input`: o `TextField` atual é restilizado e mantém a API e os labels.
- `Avatar`: iniciais do nome, com cor derivada do nome de forma determinística.
- `Logo`: wordmark "encaixe".

Os componentes existentes (`FormError`, `Pagination`, `QueryState`) passam a usar os tokens.

**b) Layout:** header com logo, navegação e avatar com nome. No celular, um botão de menu (ícone, `aria-expanded`) abre um painel com os mesmos links. Os textos "Olá, {nome}" e "Sair" e os nomes dos links permanecem.

**c) Login e cadastro:** layout com a marca. No desktop, painel lateral com logotipo e frase de apoio; no celular, empilhado. Os títulos "Entrar" e outros e os labels permanecem.

**d) Profissionais:** lista com avatar, nome e a contagem de serviços ativos (`activeServiceCount`, já devolvida pela API). Não há bio, foto nem categoria, e nada disso será inventado. Página do profissional com cabeçalho (avatar grande) e serviços como cards com duração, preço e o link "Agendar {serviço}".

**e) Agendamento:**

- Uma faixa de 7 dias, começando no "hoje" do fuso do provider. Cada dia é um botão com o dia da semana abreviado e o número grande, além de `aria-pressed` e um nome acessível por extenso.
- Setas para a semana anterior e a próxima. A anterior fica desabilitada na semana de hoje, o que substitui o `min` do input. Não há limite superior no front: além da janela, a API já devolve lista vazia, e a tela mostra "Nenhum horário disponível nesta data."
- O grupo mantém o nome acessível "Data".
- Horários em pílulas agrupadas em Manhã, Tarde e Noite, com nome acessível igual ao horário ("09:00").
- A confirmação ganha um card de resumo com ícones.
- **Testes afetados:** os três pontos de `booking-flow.test.tsx` que usam `fireEvent.change` no input e o atributo `min` passam a clicar no dia e a conferir a seta desabilitada. A data de teste muda de `2099-01-15` para um dia dentro da faixa. O comportamento testado continua o mesmo.

**f) Meus agendamentos:** card com bloco de data (dia e mês), serviço, profissional, `Badge` de status e o botão de cancelar na variante `danger` ou `ghost`.

**g) Painel do profissional:** a agenda mantém as regiões por dia e os botões existentes ("Próximo dia", "Semana"), agora com os horários numa linha do tempo visual. Serviços e horários (grade e folgas) usam `Card`, `Input` e `Button`. Os labels permanecem.

## Deixado para o implementador

Tons intermediários das escalas, espaçamentos, a escolha de ícones lucide por elemento e o microcopy novo (sempre em português, direto, sem enfeite), desde que os textos testados não mudem.
