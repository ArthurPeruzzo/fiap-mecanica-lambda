import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler, resetConfigCache } from "../src/handler";
import {
  apiGatewayEvent,
  fakeResponse,
  stubFetch,
  TEST_SECRET_B64URL,
  TEST_SECRET_RAW,
  VALID_CPF,
  VALID_CPF_FORMATTED,
} from "./helpers";

function setValidEnv(): void {
  vi.stubEnv("APP_BASE_URL", "http://app.test");
  vi.stubEnv("JWT_SECRET", TEST_SECRET_B64URL);
  vi.stubEnv("JWT_ISSUER", "mecanica-fiap");
  vi.stubEnv("TOKEN_TTL_HOURS", "4");
}

beforeEach(() => {
  resetConfigCache();
  setValidEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetConfigCache();
});

describe("handler", () => {
  it("200 com token 'Bearer ...' para body valido", async () => {
    stubFetch(async () => fakeResponse(200, { userId: 55 }));

    const res = await handler(apiGatewayEvent(JSON.stringify({ cpf: VALID_CPF_FORMATTED })));

    expect(res.statusCode).toBe(200);
    expect(res.headers?.["Content-Type"]).toBe("application/json");
    const token = JSON.parse(res.body).token as string;
    expect(token.startsWith("Bearer ")).toBe(true);
    const decoded = jwt.verify(token.replace("Bearer ", ""), TEST_SECRET_RAW, {
      algorithms: ["HS256"],
      issuer: "mecanica-fiap",
    }) as jwt.JwtPayload;
    expect(decoded.sub).toBe("55");
  });

  it("decodifica body em base64", async () => {
    stubFetch(async () => fakeResponse(200, { userId: 1 }));
    const b64 = Buffer.from(JSON.stringify({ cpf: VALID_CPF })).toString("base64");

    const res = await handler(apiGatewayEvent(b64, { isBase64Encoded: true }));

    expect(res.statusCode).toBe(200);
  });

  it("400 quando o body esta ausente", async () => {
    const res = await handler(apiGatewayEvent(null));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("CPF invalido");
  });

  it("400 quando o body nao e JSON valido", async () => {
    const res = await handler(apiGatewayEvent("{cpf:"));
    expect(res.statusCode).toBe(400);
  });

  it("400 quando o body nao e um objeto JSON", async () => {
    const res = await handler(apiGatewayEvent(JSON.stringify("529.982.247-25")));
    expect(res.statusCode).toBe(400);
  });

  it("400 quando o cpf e invalido", async () => {
    const res = await handler(apiGatewayEvent(JSON.stringify({ cpf: "111.111.111-11" })));
    expect(res.statusCode).toBe(400);
  });

  it("404 quando a aplicacao nao encontra o cliente", async () => {
    stubFetch(async () => fakeResponse(404, {}));
    const res = await handler(apiGatewayEvent(JSON.stringify({ cpf: VALID_CPF })));
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("Cliente nao encontrado");
  });

  it("502 quando a aplicacao responde com erro", async () => {
    stubFetch(async () => fakeResponse(500, {}));
    const res = await handler(apiGatewayEvent(JSON.stringify({ cpf: VALID_CPF })));
    expect(res.statusCode).toBe(502);
  });

  it("500 quando a configuracao esta invalida (JWT_SECRET ausente)", async () => {
    vi.stubEnv("JWT_SECRET", "");
    resetConfigCache();
    stubFetch(async () => fakeResponse(200, { userId: 1 }));

    const res = await handler(apiGatewayEvent(JSON.stringify({ cpf: VALID_CPF })));

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Erro interno de configuracao");
  });
});
