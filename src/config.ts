export interface Config {
  /** Base URL da aplicacao fiap-mecanica, sem barra no final. */
  appBaseUrl: string;
  /** Segredo Base64URL compartilhado com a aplicacao, ja decodificado para bytes. */
  jwtSecret: Buffer;
  /** Emissor do token (claim `iss`). */
  jwtIssuer: string;
  /** Validade do token, em segundos. */
  tokenTtlSeconds: number;
  /** Timeout da chamada HTTP a aplicacao, em ms. */
  httpTimeoutMs: number;
}

const DEFAULT_ISSUER = "mecanica-fiap";
const DEFAULT_TTL_HOURS = 4;
const DEFAULT_HTTP_TIMEOUT_MS = 3000;
/** Minimo exigido pela aplicacao: 32 bytes decodificados. */
const MIN_SECRET_BYTES = 32;

function required(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value.trim();
}

function positiveNumber(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Variavel de ambiente ${name} deve ser um numero positivo, recebido: ${raw}`);
  }
  return parsed;
}

function decodeSecret(raw: string): Buffer {
  const secret = Buffer.from(raw, "base64url");
  if (secret.length < MIN_SECRET_BYTES) {
    throw new Error(
      `JWT_SECRET invalido: apos decodificar Base64URL restam ${secret.length} bytes, ` +
        `minimo exigido e ${MIN_SECRET_BYTES}`,
    );
  }
  return secret;
}

/**
 * Le e valida a configuracao a partir de `process.env`. Lanca erro claro no
 * cold start se algo obrigatorio estiver ausente ou invalido.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const appBaseUrl = required("APP_BASE_URL", env.APP_BASE_URL).replace(/\/+$/, "");
  const jwtSecret = decodeSecret(required("JWT_SECRET", env.JWT_SECRET));
  const jwtIssuer = env.JWT_ISSUER?.trim() || DEFAULT_ISSUER;
  const ttlHours = positiveNumber("TOKEN_TTL_HOURS", env.TOKEN_TTL_HOURS, DEFAULT_TTL_HOURS);
  const httpTimeoutMs = positiveNumber("HTTP_TIMEOUT_MS", env.HTTP_TIMEOUT_MS, DEFAULT_HTTP_TIMEOUT_MS);

  return {
    appBaseUrl,
    jwtSecret,
    jwtIssuer,
    tokenTtlSeconds: Math.round(ttlHours * 3600),
    httpTimeoutMs,
  };
}
