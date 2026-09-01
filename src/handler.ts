import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { authenticateCustomer } from "./auth/authenticateCustomer";
import { loadConfig, type Config } from "./config";
import { AppError, isAppError } from "./errors";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

let cachedConfig: Config | undefined;

/** So para testes: forca a releitura da configuracao na proxima invocacao. */
export function resetConfigCache(): void {
  cachedConfig = undefined;
}

function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

function json(statusCode: number, body: Record<string, unknown>): APIGatewayProxyResult {
  return { statusCode, headers: { ...JSON_HEADERS }, body: JSON.stringify(body) };
}

function parseBody(event: APIGatewayProxyEvent): Record<string, unknown> {
  if (!event.body) {
    throw new AppError("CPF_INVALIDO", "corpo da requisicao ausente");
  }
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("CPF_INVALIDO", "corpo da requisicao nao e JSON valido");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AppError("CPF_INVALIDO", "corpo da requisicao deve ser um objeto JSON");
  }
  return parsed as Record<string, unknown>;
}

/**
 * Entrypoint da Lambda (integracao proxy do API Gateway).
 *
 * `POST` com corpo `{ "cpf": "..." }`:
 * - `200` -> `{ "token": "Bearer <jwt>" }`
 * - `400` -> CPF ausente/invalido
 * - `404` -> cliente nao encontrado
 * - `502` / `504` -> aplicacao indisponivel / timeout
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  let config: Config;
  try {
    config = getConfig();
  } catch (err) {
    console.error("Configuracao invalida:", err);
    return json(500, { error: "Erro interno de configuracao" });
  }

  try {
    const body = parseBody(event);
    const { token } = await authenticateCustomer(body.cpf, config);
    return json(200, { token });
  } catch (err) {
    if (isAppError(err)) {
      if (err.statusCode >= 500) {
        console.error("Falha ao autenticar cliente:", err.message);
      }
      return json(err.statusCode, { error: err.publicMessage });
    }
    console.error("Erro inesperado ao autenticar cliente:", err);
    return json(500, { error: "Erro interno" });
  }
}
