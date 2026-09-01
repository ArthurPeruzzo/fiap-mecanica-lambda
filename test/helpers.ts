import { vi } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
import type { Config } from "../src/config";

/** Segredo de teste: 32 bytes -> atende ao minimo exigido. */
export const TEST_SECRET_RAW = Buffer.alloc(32, 7);
export const TEST_SECRET_B64URL = TEST_SECRET_RAW.toString("base64url");

/** CPF valido usado nos testes (e sua versao formatada). */
export const VALID_CPF = "52998224725";
export const VALID_CPF_FORMATTED = "529.982.247-25";

export function testConfig(over: Partial<Config> = {}): Config {
  return {
    appBaseUrl: "http://app.test",
    jwtSecret: TEST_SECRET_RAW,
    jwtIssuer: "mecanica-fiap",
    tokenTtlSeconds: 4 * 3600,
    httpTimeoutMs: 3000,
    ...over,
  };
}

interface FakeResponseOptions {
  /** Faz `response.json()` lancar, simulando corpo nao-JSON. */
  invalidJson?: boolean;
}

export function fakeResponse(
  status: number,
  body: unknown,
  options: FakeResponseOptions = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (options.invalidJson) {
        throw new SyntaxError("Unexpected token in JSON");
      }
      return body;
    },
  } as unknown as Response;
}

export function abortError(): Error {
  const err = new Error("The operation was aborted");
  err.name = "AbortError";
  return err;
}

/** Instala um mock de `fetch` global e o devolve. Use `vi.unstubAllGlobals()` no afterEach. */
export function stubFetch(impl: typeof fetch): ReturnType<typeof vi.fn> {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

export function apiGatewayEvent(
  body: string | null,
  over: Partial<APIGatewayProxyEvent> = {},
): APIGatewayProxyEvent {
  return {
    body,
    isBase64Encoded: false,
    httpMethod: "POST",
    path: "/auth",
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    resource: "/auth",
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    ...over,
  } as APIGatewayProxyEvent;
}
