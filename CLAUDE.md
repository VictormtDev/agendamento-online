# CLAUDE.md — Plataforma de Agendamento

Projeto de portfólio: plataforma onde **profissionais** (barbeiros, personal trainers, terapeutas etc.) cadastram serviços e horários disponíveis, e **clientes** fazem agendamentos online.

O objetivo do projeto é **demonstrar qualidade de código para recrutadores**: regras de negócio bem isoladas, testes, API bem desenhada e organização de time profissional. Prefira sempre a solução clara e bem testada à solução "esperta".

---

## Stack

| Camada           | Tecnologia                                                     |
| ---------------- | -------------------------------------------------------------- |
| Linguagem        | TypeScript (strict) em todo o projeto                          |
| Backend          | Node.js 26 LTS + Express 5                                     |
| Banco            | PostgreSQL 16                                                  |
| ORM / migrations | Prisma                                                         |
| Validação        | Zod (back e front)                                             |
| Autenticação     | JWT (access token) + bcrypt                                    |
| Testes back      | Vitest + Supertest                                             |
| Frontend         | React + Vite + React Router + TanStack Query + React Hook Form |
| Estilo           | Tailwind CSS                                                   |
| Testes front     | Vitest + Testing Library                                       |
| Infra local      | Docker Compose (Postgres)                                      |
| CI               | GitHub Actions (lint + typecheck + testes)                     |
| Docs da API      | OpenAPI/Swagger em `/docs`                                     |

Não adicione dependências novas sem me perguntar antes e explicar o motivo.

---

## Estrutura do repositório

Monorepo com npm workspaces:

```
/
├── apps/
│   ├── api/          # backend
│   └── web/          # frontend
├── docker-compose.yml
├── .github/workflows/ci.yml
├── CLAUDE.md
└── README.md
```

### Backend (`apps/api/src`) — Clean Architecture simplificada

```
src/
├── domain/              # regras de negócio puras (SEM Express, SEM Prisma)
│   ├── entities/        # Appointment, Provider, Service, Availability...
│   ├── errors/          # erros de domínio (ex: SlotUnavailableError)
│   └── services/        # regras que envolvem várias entidades (ex: cálculo de slots)
├── application/
│   ├── use-cases/       # um arquivo por caso de uso (CreateAppointment, CancelAppointment...)
│   └── ports/           # interfaces de repositórios e serviços externos
├── infra/
│   ├── database/        # PrismaClient, repositórios que implementam os ports
│   ├── http/
│   │   ├── controllers/ # recebem request, chamam use case, devolvem response
│   │   ├── routes/
│   │   ├── middlewares/ # auth, error handler, validação
│   │   └── schemas/     # schemas Zod de request/response
│   └── providers/       # hash, token, relógio (Clock)
├── config/              # env validado com Zod
└── main.ts
```

**Regra de dependência:** `domain` não importa nada de fora dele. `application` importa só `domain`. `infra` pode importar tudo. Se precisar de algo externo num use case, crie uma interface em `application/ports` e implemente em `infra`.

**Use cases** recebem dependências pelo construtor (injeção manual, sem framework de DI) e expõem um único método `execute(input)`.

**Relógio:** nunca use `new Date()` direto em regra de negócio. Use o port `Clock` para que os testes controlem a data atual.

### Frontend (`apps/web/src`)

```
src/
├── api/           # client HTTP e hooks do TanStack Query por recurso
├── components/    # componentes reutilizáveis (ui/ para genéricos)
├── features/      # pastas por funcionalidade (auth, booking, provider-dashboard...)
├── pages/         # páginas ligadas às rotas
├── lib/           # utilitários (datas, formatação)
└── main.tsx
```

---

## Domínio e regras de negócio

### Entidades

- **User**: `id, name, email, passwordHash, role (CLIENT | PROVIDER), timezone, createdAt`
- **Service**: serviço oferecido por um provider — `id, providerId, name, durationMinutes, priceCents, active`
- **Availability**: janela semanal de atendimento — `id, providerId, weekday (0-6), startTime ("09:00"), endTime ("18:00")`
- **TimeOff**: bloqueio pontual (férias, folga) — `id, providerId, startsAt, endsAt, reason`
- **Appointment**: `id, providerId, clientId, serviceId, startsAt, endsAt, status (SCHEDULED | CANCELED | COMPLETED | NO_SHOW), canceledAt, createdAt`

### Regras (todas devem ter teste unitário)

1. Um agendamento só pode ser criado **dentro de uma Availability** do provider e **fora de qualquer TimeOff**.
2. `endsAt = startsAt + service.durationMinutes`.
3. **Sem sobreposição**: um provider não pode ter dois agendamentos `SCHEDULED` que se sobreponham.
4. Antecedência mínima para agendar: **2 horas**. Não é possível agendar no passado.
5. Janela máxima: agendamentos até **60 dias** no futuro.
6. Cancelamento pelo cliente: até **24 horas antes** do início. O provider pode cancelar a qualquer momento.
7. Slots oferecidos ao cliente têm intervalos de **15 minutos**.
8. Só o próprio cliente ou o provider do agendamento podem vê-lo ou cancelá-lo.
9. Um provider não pode agendar consigo mesmo.

Os valores (2h, 24h, 60 dias, 15 min) ficam em constantes de domínio nomeadas, não espalhados pelo código.

### Datas e fuso horário

- Armazenar tudo em **UTC** (`timestamptz`).
- Cada provider tem um campo `timezone` (ex: `America/Sao_Paulo`); Availability é interpretada nesse fuso.
- O frontend exibe no fuso do provider.
- Use `date-fns` + `@date-fns/tz` (`TZDate`) para cálculos. Nunca faça conta de data "na mão" com milissegundos espalhados pelo código.

### Concorrência (diferencial do projeto)

Duas requisições simultâneas para o mesmo horário **não podem** gerar dois agendamentos. A proteção é em duas camadas:

1. Validação no use case (para devolver erro amigável).
2. **Exclusion constraint no PostgreSQL** como garantia final, criada via SQL na migration:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment"
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    "providerId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE (status = 'SCHEDULED');
```

O repositório deve capturar a violação dessa constraint e convertê-la em `SlotUnavailableError`. Deve existir um teste de integração que dispara requisições em paralelo e verifica que só uma foi aceita.

---

## API REST

- Prefixo: `/api/v1`
- JSON em camelCase; datas em ISO 8601 UTC.
- Paginação: `?page=1&perPage=20` → resposta `{ data: [...], meta: { page, perPage, total } }`
- Erros sempre no formato:

```json
{ "error": { "code": "SLOT_UNAVAILABLE", "message": "Horário indisponível", "details": {} } }
```

- Status codes: `400` validação, `401` sem auth, `403` sem permissão, `404` não encontrado, `409` conflito de regra de negócio (slot ocupado, cancelamento fora do prazo), `422` evitar (usar 400).
- Erros de domínio são mapeados para HTTP **apenas** no error handler middleware.

### Endpoints principais

```
POST   /auth/register
POST   /auth/login
GET    /me
PATCH  /me                                # atualiza o fuso horário (IANA)

GET    /providers                         # lista pública
GET    /providers/:id                     # perfil + serviços
GET    /providers/:id/slots?serviceId=&date=YYYY-MM-DD   # horários livres no dia

# área do provider (role PROVIDER)
POST   /services          PATCH /services/:id          DELETE /services/:id
GET    /availability      PUT /availability   # lê / substitui a grade semanal inteira
GET    /time-off          POST /time-off      DELETE /time-off/:id   # GET lista as folgas não encerradas
GET    /provider/appointments?from=&to=

# área do cliente
POST   /appointments
GET    /appointments                       # meus agendamentos
PATCH  /appointments/:id/cancel
```

Toda rota nova deve ser documentada no OpenAPI.

---

## Testes

- **Domínio e use cases**: testes unitários com repositórios **in-memory** (ficam em `tests/in-memory/`). Esses são os mais importantes.
- **API**: testes de integração com Supertest contra um banco Postgres de teste (`DATABASE_URL` de teste, migrations aplicadas, tabelas limpas entre testes).
- **Front**: testar fluxos críticos (escolher serviço → escolher horário → confirmar) com Testing Library.
- Nome dos testes descreve comportamento: `it("should not allow booking less than 2 hours in advance")`.
- Ao implementar uma regra de negócio, escreva o teste **antes ou junto**, nunca depois "se der tempo".
- Todo bug corrigido ganha um teste que o reproduz.

---

## Convenções de código

- Código, nomes de arquivos e variáveis em **inglês**. Commits, PRs e textos exibidos ao usuário em **português**.
- Arquivos em `kebab-case.ts`; classes em `PascalCase`; funções e variáveis em `camelCase`; constantes de domínio em `UPPER_SNAKE_CASE`.
- Sem `any`. Se for inevitável, comente o porquê.
- Funções pequenas, com nomes que dizem o que fazem. Prefira early return a `if` aninhado.
- Sem comentários óbvios; comente o **porquê**, não o **o quê**.
- Valores monetários em centavos (inteiro), nunca float.
- Variáveis de ambiente validadas com Zod em `config/env.ts`; o app não sobe se faltar alguma. Manter `.env.example` atualizado.
- ESLint + Prettier; o código deve passar em `lint` e `typecheck` antes de qualquer commit.

---

## Git

- Branch principal: `main`. Trabalhar em branches `feat/...`, `fix/...`, `chore/...`, `test/...`, `docs/...`.
- **Conventional Commits** com tipo e escopo em inglês e descrição em português: `feat(appointments): impede agendamentos sobrepostos`
- Uma branch e um PR por **fase** do roadmap (ex: `feat/phase-2-provider`), com um commit por item (ou por correção), sem misturar refatoração com feature. PRs mesclados com squash.
- Não faça commit nem push sem eu pedir.

---

## Comandos

```bash
docker compose up -d --wait          # sobe o Postgres (dev :5432, teste :5433)
npm install                          # instala tudo (workspaces) e gera o Prisma Client
npm run dev                          # api + web em paralelo
npm run test                         # todos os testes
npm run test -w apps/api             # só backend
npm run test:unit -w apps/api        # só unitários (sem banco)
npm run test:integration -w apps/api # só integração (usa o Postgres de teste)
npm run test -w apps/web             # só frontend
npm run lint && npm run typecheck
npx -w apps/api prisma migrate dev   # nova migration
npx -w apps/api prisma studio
npx -w apps/api prisma db seed       # recria os dados de demonstração (senha demo12345)
```

(Ajustar esta seção se os scripts mudarem.)

---

## Roadmap

Seguir em ordem. Marcar `[x]` ao concluir cada item.

**Fase 0 — Setup**

- [x] Monorepo com workspaces, TS strict, ESLint, Prettier
- [x] Docker Compose com Postgres (dev e teste)
- [x] Prisma configurado + env validado
- [x] Express com healthcheck `/api/v1/health` e error handler
- [x] Vitest rodando no back e no front
- [x] GitHub Actions: lint, typecheck, testes

**Fase 1 — Auth**

- [x] Register / login / `GET /me`, roles CLIENT e PROVIDER
- [x] Middleware de auth e de autorização por role

**Fase 2 — Área do provider**

- [x] CRUD de serviços
- [x] Grade semanal (Availability) e TimeOff
- [x] Campo timezone no provider

**Fase 3 — Agendamento (núcleo do projeto)**

- [x] Cálculo de slots disponíveis (serviço de domínio + testes extensivos)
- [x] Criar agendamento com todas as regras
- [x] Exclusion constraint + teste de concorrência
- [x] Cancelamento com regra de 24h
- [x] Listagens do cliente e do provider

**Fase 4 — Frontend**

- [x] Login / cadastro
- [x] Lista de profissionais e página do profissional
- [x] Fluxo de agendamento (serviço → data → horário → confirmação)
- [x] "Meus agendamentos" com cancelamento
- [x] Dashboard do provider (agenda do dia/semana, gestão de serviços e horários)

**Fase 5 — Acabamento de portfólio**

- [x] Swagger completo em `/docs`
- [x] Seed com dados de demonstração e usuários de teste
- [x] Deploy (API + banco + front) com link público
- [x] README com: problema, prints/GIF, arquitetura, decisões técnicas, como rodar, próximos passos

**Extras (se sobrar fôlego)**

- [ ] Lembrete por e-mail 24h antes (fila/job agendado)
- [ ] Refresh token
- [ ] Rate limiting nas rotas de auth
- [ ] Status COMPLETED / NO_SHOW e histórico do cliente

---

## Como trabalhar comigo (instruções para o Claude)

- Antes de implementar algo grande, apresente um **plano curto** (arquivos que serão criados/alterados e a abordagem) e espere minha confirmação.
- Trabalhe **um item do roadmap por vez** e atualize o checklist ao terminar.
- Ao final de cada tarefa, rode `lint`, `typecheck` e os testes relacionados, e me diga o resultado.
- Se uma regra de negócio estiver ambígua, **pergunte** em vez de assumir.
- Explique brevemente decisões não óbvias: estou usando este projeto também para aprender e preciso saber defendê-lo em entrevista.
- Não gere código morto, TODOs soltos ou arquivos "para o futuro".
