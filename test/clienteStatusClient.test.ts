import { afterEach, describe, expect, it, vi } from "vitest";
import { CLIENTE_STATUS_PATH, fetchClienteStatus } from "../src/auth/clienteStatusClient";
import { AppError } from "../src/errors";
import { abortError, fakeResponse, stubFetch, testConfig, VALID_CPF } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchClienteStatus", () => {
  it("monta a URL com o path interno e o cpf codificado", async () => {
    const fetchMock = stubFetch(async () => fakeResponse(200, { userId: 10 }));
    await fetchClienteStatus(VALID_CPF, testConfig({ appBaseUrl: "http://app.test" }));

    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toBe(`http://app.test${CLIENTE_STATUS_PATH}?cpf=${VALID_CPF}`);
  });

  it("devolve { userId } no status 200", async () => {
    stubFetch(async () => fakeResponse(200, { userId: 123 }));
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).resolves.toEqual({ userId: 123 });
  });

  it("lanca CLIENTE_NAO_ENCONTRADO no status 404", async () => {
    stubFetch(async () => fakeResponse(404, { error: "nao encontrado" }));
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).rejects.toMatchObject({
      code: "CLIENTE_NAO_ENCONTRADO",
      statusCode: 404,
    });
  });

  it("lanca UPSTREAM_INDISPONIVEL em status 5xx", async () => {
    stubFetch(async () => fakeResponse(503, {}));
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).rejects.toMatchObject({
      code: "UPSTREAM_INDISPONIVEL",
      statusCode: 502,
    });
  });

  it("lanca UPSTREAM_INDISPONIVEL quando o corpo nao e JSON", async () => {
    stubFetch(async () => fakeResponse(200, null, { invalidJson: true }));
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).rejects.toBeInstanceOf(AppError);
  });

  it("lanca UPSTREAM_INDISPONIVEL quando falta userId numerico", async () => {
    stubFetch(async () => fakeResponse(200, { userId: "abc" }));
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).rejects.toMatchObject({
      code: "UPSTREAM_INDISPONIVEL",
    });
  });

  it("lanca UPSTREAM_TIMEOUT quando o fetch e abortado", async () => {
    stubFetch(async () => {
      throw abortError();
    });
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).rejects.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
      statusCode: 504,
    });
  });

  it("lanca UPSTREAM_INDISPONIVEL em erro de rede", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(fetchClienteStatus(VALID_CPF, testConfig())).rejects.toMatchObject({
      code: "UPSTREAM_INDISPONIVEL",
    });
  });
});
