import type { Config } from "../config";
import { assertValidCpf } from "../validation/cpf";
import { fetchClienteStatus } from "./clienteStatusClient";
import { signCustomerToken } from "./jwt";

export interface AuthenticateResult {
  /** JWT ja prefixado com "Bearer ". */
  token: string;
}

/**
 * Orquestra a autenticacao de um cliente por CPF:
 *
 * 1. valida o CPF (formato + digitos verificadores);
 * 2. confirma na aplicacao que o CPF pertence a um cliente e obtem o `userId`
 *    (a aplicacao cria o User com ROLE_CLIENTE na primeira chamada);
 * 3. assina o JWT compativel com o filtro da aplicacao.
 *
 * Erros de negocio sao propagados como `AppError`.
 */
export async function authenticateCustomer(
  rawCpf: unknown,
  config: Config,
  now: Date = new Date(),
): Promise<AuthenticateResult> {
  const cpf = assertValidCpf(rawCpf);
  const { userId } = await fetchClienteStatus(cpf, config);
  const token = signCustomerToken(userId, config, now);
  return { token };
}
