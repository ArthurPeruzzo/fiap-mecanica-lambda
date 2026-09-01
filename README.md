# fiap-mecanica-lambda

Function AWS Lambda de **autenticação de cliente por CPF** — Fase 3 do projeto
[Mecânica FIAP](https://github.com/ArthurPeruzzo/fiap-mecanica).

O cliente não tem usuário/senha: envia o CPF, a Lambda confirma a identidade na
aplicação e devolve um JWT que os endpoints de cliente da aplicação aceitam.

## Fluxo

```
Cliente ──{ "cpf": "529.982.247-25" }──▶ Lambda (API Gateway)
                                           │
                     GET /authenticate/cliente/status?cpf=...   (endpoint público da app)
                                           │
                          200 { "userId": 123 }  |  404 (sem cliente)
                                           │
                     assina JWT HS256 (segredo compartilhado, sub = userId)
                                           │
Cliente ◀──{ "token": "Bearer eyJ..." }────┘
```

O JWT emitido é intencionalmente compatível com o `UserAuthenticationFilter` da
aplicação: `HS256` sobre o mesmo `JWT_SECRET`, `iss = mecanica-fiap`,
`sub = <userId>`, `exp = agora + TOKEN_TTL_HOURS`. O token abre, por exemplo,
`GET /ordem-servico/minhas-ordens` (exige `ROLE_CLIENTE`).

## Contrato HTTP (integração proxy do API Gateway)

`POST` com corpo `{ "cpf": "<cpf>" }` (com ou sem pontuação):

| Status | Corpo | Quando |
|---|---|---|
| `200` | `{ "token": "Bearer <jwt>" }` | cliente identificado |
| `400` | `{ "error": "CPF invalido" }` | CPF ausente / mal formado / dígitos inválidos |
| `404` | `{ "error": "Cliente nao encontrado" }` | nenhum cliente para o CPF |
| `502` | `{ "error": "Servico de autenticacao indisponivel" }` | aplicação respondeu erro / resposta inesperada |
| `504` | `{ "error": "Tempo limite ao contatar o servico de autenticacao" }` | timeout da chamada à aplicação |
| `500` | `{ "error": "Erro interno de configuracao" }` | variável de ambiente obrigatória ausente/inválida |

## Variáveis de ambiente

Veja `.env.example`.

| Var | Obrigatória | Default | Uso |
|---|---|---|---|
| `APP_BASE_URL` | sim | — | base da aplicação (sem barra final) |
| `JWT_SECRET` | sim | — | **mesmo** segredo Base64URL da aplicação (≥ 32 bytes decodificados) |
| `JWT_ISSUER` | não | `mecanica-fiap` | claim `iss`; precisa bater com `jwt.issuer` da app |
| `TOKEN_TTL_HOURS` | não | `4` | validade do token |
| `HTTP_TIMEOUT_MS` | não | `3000` | timeout da chamada à aplicação |

## Desenvolvimento

```bash
npm install
npm test          # vitest run
npm run typecheck # tsc --noEmit
npm run build     # compila para dist/
```

### Estrutura

```
src/
  handler.ts                  entrypoint API Gateway proxy
  config.ts                   leitura/validação de env (cold start)
  errors.ts                   AppError tipado -> status HTTP
  validation/cpf.ts           normalização + dígitos verificadores
  auth/
    authenticateCustomer.ts   orquestra: valida CPF -> consulta app -> assina JWT
    clienteStatusClient.ts    GET /authenticate/cliente/status (fetch nativo do Node 20)
    jwt.ts                    signCustomerToken() — HS256, contrato do filtro da app
test/                         vitest (unidade; fetch e env mockados)
```

## Fora de escopo deste repositório (por enquanto)

Empacotamento (esbuild + zip), Terraform da Lambda + **API Gateway**, e o pipeline
de CI/CD — próximas etapas da Fase 3.
