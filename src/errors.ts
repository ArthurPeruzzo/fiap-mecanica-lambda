export type AppErrorCode =
  | "CPF_INVALIDO"
  | "CLIENTE_NAO_ENCONTRADO"
  | "UPSTREAM_INDISPONIVEL"
  | "UPSTREAM_TIMEOUT"
  | "CONFIG_INVALIDA";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  CPF_INVALIDO: 400,
  CLIENTE_NAO_ENCONTRADO: 404,
  UPSTREAM_INDISPONIVEL: 502,
  UPSTREAM_TIMEOUT: 504,
  CONFIG_INVALIDA: 500,
};

const MESSAGE_BY_CODE: Record<AppErrorCode, string> = {
  CPF_INVALIDO: "CPF invalido",
  CLIENTE_NAO_ENCONTRADO: "Cliente nao encontrado",
  UPSTREAM_INDISPONIVEL: "Servico de autenticacao indisponivel",
  UPSTREAM_TIMEOUT: "Tempo limite ao contatar o servico de autenticacao",
  CONFIG_INVALIDA: "Erro interno de configuracao",
};

/** Erro de negocio com mapeamento direto para status HTTP e mensagem publica. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  /** Mensagem segura para devolver ao chamador. */
  readonly publicMessage: string;

  constructor(code: AppErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "AppError";
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    this.publicMessage = MESSAGE_BY_CODE[code];
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
