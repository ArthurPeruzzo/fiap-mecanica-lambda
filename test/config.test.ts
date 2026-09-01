import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";
import { TEST_SECRET_B64URL } from "./helpers";

const baseEnv = {
  APP_BASE_URL: "http://app.test",
  JWT_SECRET: TEST_SECRET_B64URL,
} as NodeJS.ProcessEnv;

describe("loadConfig", () => {
  it("aplica defaults de issuer, TTL e timeout", () => {
    const config = loadConfig({ ...baseEnv });
    expect(config.jwtIssuer).toBe("mecanica-fiap");
    expect(config.tokenTtlSeconds).toBe(4 * 3600);
    expect(config.httpTimeoutMs).toBe(3000);
    expect(config.jwtSecret.length).toBe(32);
  });

  it("remove barras finais da APP_BASE_URL", () => {
    const config = loadConfig({ ...baseEnv, APP_BASE_URL: "http://app.test/" });
    expect(config.appBaseUrl).toBe("http://app.test");
  });

  it("converte TOKEN_TTL_HOURS para segundos", () => {
    const config = loadConfig({ ...baseEnv, TOKEN_TTL_HOURS: "2" });
    expect(config.tokenTtlSeconds).toBe(7200);
  });

  it("lanca quando APP_BASE_URL esta ausente", () => {
    expect(() => loadConfig({ JWT_SECRET: TEST_SECRET_B64URL } as NodeJS.ProcessEnv)).toThrow(
      /APP_BASE_URL/,
    );
  });

  it("lanca quando o segredo decodificado tem menos de 32 bytes", () => {
    const shortSecret = Buffer.alloc(16, 1).toString("base64url");
    expect(() => loadConfig({ ...baseEnv, JWT_SECRET: shortSecret })).toThrow(/JWT_SECRET/);
  });

  it("lanca quando TOKEN_TTL_HOURS nao e numero positivo", () => {
    expect(() => loadConfig({ ...baseEnv, TOKEN_TTL_HOURS: "abc" })).toThrow(/TOKEN_TTL_HOURS/);
    expect(() => loadConfig({ ...baseEnv, TOKEN_TTL_HOURS: "-1" })).toThrow(/TOKEN_TTL_HOURS/);
  });
});
