import jwt from "jsonwebtoken";
import type { Config } from "../config";

/** Role atribuida a clientes autenticados via CPF (espelha RoleEnum.ROLE_CLIENTE da app). */
export const CLIENTE_ROLE = "ROLE_CLIENTE";

export interface CustomerTokenClaims {
  iss: string;
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * Assina um JWT compativel com o `UserAuthenticationFilter` da aplicacao:
 * HS256 sobre o segredo compartilhado, `iss = mecanica-fiap`, `sub = userId`,
 * `exp = agora + TTL`. O claim `roles` e incluido por simetria com o token da
 * app (o filtro deriva as authorities do banco, nao do token).
 *
 * Retorna a string ja prefixada com `"Bearer "`, igual ao `LoginResponseJson`.
 */
export function signCustomerToken(userId: number, config: Config, now: Date = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000);
  const payload: Pick<CustomerTokenClaims, "roles" | "iat" | "exp"> = {
    roles: [CLIENTE_ROLE],
    iat,
    exp: iat + config.tokenTtlSeconds,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    algorithm: "HS256",
    issuer: config.jwtIssuer,
    subject: String(userId),
  });

  return `Bearer ${token}`;
}
