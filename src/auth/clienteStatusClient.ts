import type { Config } from "../config";
import { AppError } from "../errors";

export interface ClienteStatus {
  userId: number;
}

/** Path do endpoint interno (publico) da aplicacao. */
export const CLIENTE_STATUS_PATH = "/authenticate/cliente/status";

/**
 * Chama `GET {APP_BASE_URL}/authenticate/cliente/status?cpf=...` na aplicacao.
 *
 * - `200` -> `{ userId }`
 * - `404` -> `AppError("CLIENTE_NAO_ENCONTRADO")`
 * - timeout -> `AppError("UPSTREAM_TIMEOUT")`
 * - qualquer outra falha/resposta inesperada -> `AppError("UPSTREAM_INDISPONIVEL")`
 */
export async function fetchClienteStatus(cpf: string, config: Config): Promise<ClienteStatus> {
  const url = `${config.appBaseUrl}${CLIENTE_STATUS_PATH}?cpf=${encodeURIComponent(cpf)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.httpTimeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AppError("UPSTREAM_TIMEOUT", `GET ${CLIENTE_STATUS_PATH}`);
    }
    throw new AppError("UPSTREAM_INDISPONIVEL", err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404) {
    throw new AppError("CLIENTE_NAO_ENCONTRADO", `cpf ${cpf}`);
  }
  if (!response.ok) {
    throw new AppError("UPSTREAM_INDISPONIVEL", `status HTTP ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AppError("UPSTREAM_INDISPONIVEL", "resposta nao e JSON valido");
  }

  const userId = (body as { userId?: unknown } | null)?.userId;
  if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
    throw new AppError("UPSTREAM_INDISPONIVEL", "resposta sem userId numerico valido");
  }

  return { userId };
}
