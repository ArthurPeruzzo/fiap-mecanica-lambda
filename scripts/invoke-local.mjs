// Invoca o handler da Lambda localmente, batendo de verdade no endpoint
// /authenticate/cliente/status da aplicacao (APP_BASE_URL) e imprimindo a
// resposta. Uso:
//
//   npm run invoke:local -- <cpf>
//
// As variaveis de ambiente vem do .env (carregado via `node --env-file` no
// script npm). Requer `dist/` compilado — o script npm roda `npm run build` antes.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler } = require("../dist/handler.js");

const cpf = process.argv[2];
if (!cpf) {
  console.error("Uso: npm run invoke:local -- <cpf>");
  process.exit(1);
}

const event = {
  body: JSON.stringify({ cpf }),
  isBase64Encoded: false,
};

const result = await handler(event);

let parsedBody;
try {
  parsedBody = JSON.parse(result.body);
} catch {
  parsedBody = result.body;
}

console.log(`HTTP ${result.statusCode}`);
console.log(JSON.stringify(parsedBody, null, 2));

if (result.statusCode === 200 && parsedBody && typeof parsedBody.token === "string") {
  console.log("\ntoken:");
  console.log(parsedBody.token);
}
