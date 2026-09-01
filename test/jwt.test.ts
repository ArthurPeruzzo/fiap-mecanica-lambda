import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { CLIENTE_ROLE, signCustomerToken } from "../src/auth/jwt";
import { TEST_SECRET_RAW, testConfig } from "./helpers";

const NOW = new Date("2026-08-31T12:00:00.000Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

describe("signCustomerToken", () => {
  it("devolve a string prefixada com 'Bearer '", () => {
    const token = signCustomerToken(42, testConfig(), NOW);
    expect(token.startsWith("Bearer ")).toBe(true);
  });

  it("produz um JWT que o filtro da aplicacao aceitaria (HS256 + issuer + sub + exp)", () => {
    const raw = signCustomerToken(42, testConfig(), NOW).replace("Bearer ", "");

    // Espelha JwtTokenService.decodeToken: JWT.require(HMAC256(secret)).withIssuer(...)
    // clockTimestamp fixa o "agora" da verificacao no instante de emissao.
    const decoded = jwt.verify(raw, TEST_SECRET_RAW, {
      algorithms: ["HS256"],
      issuer: "mecanica-fiap",
      clockTimestamp: NOW_SECONDS,
    }) as jwt.JwtPayload;

    expect(decoded.sub).toBe("42");
    expect(decoded.iss).toBe("mecanica-fiap");
    expect(decoded.roles).toEqual([CLIENTE_ROLE]);
    expect(decoded.iat).toBe(NOW_SECONDS);
    expect(decoded.exp).toBe(NOW_SECONDS + 4 * 3600);
  });

  it("respeita TOKEN_TTL_HOURS customizado via tokenTtlSeconds", () => {
    const raw = signCustomerToken(7, testConfig({ tokenTtlSeconds: 1800 }), NOW).replace("Bearer ", "");
    const decoded = jwt.decode(raw) as jwt.JwtPayload;
    expect(decoded.exp).toBe(NOW_SECONDS + 1800);
  });

  it("falha na verificacao com segredo diferente", () => {
    const raw = signCustomerToken(1, testConfig(), NOW).replace("Bearer ", "");
    expect(() => jwt.verify(raw, Buffer.alloc(32, 9), { algorithms: ["HS256"] })).toThrow();
  });

  it("falha na verificacao com issuer diferente", () => {
    const raw = signCustomerToken(1, testConfig(), NOW).replace("Bearer ", "");
    expect(() =>
      jwt.verify(raw, TEST_SECRET_RAW, { algorithms: ["HS256"], issuer: "outro-issuer" }),
    ).toThrow();
  });
});
