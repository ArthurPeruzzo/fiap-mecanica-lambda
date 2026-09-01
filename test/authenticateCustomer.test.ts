import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticateCustomer } from "../src/auth/authenticateCustomer";
import { AppError } from "../src/errors";
import {
  fakeResponse,
  stubFetch,
  TEST_SECRET_RAW,
  testConfig,
  VALID_CPF_FORMATTED,
} from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authenticateCustomer", () => {
  it("valida o CPF, consulta a aplicacao e devolve um token verificavel", async () => {
    stubFetch(async () => fakeResponse(200, { userId: 99 }));

    const { token } = await authenticateCustomer(VALID_CPF_FORMATTED, testConfig());

    const decoded = jwt.verify(token.replace("Bearer ", ""), TEST_SECRET_RAW, {
      algorithms: ["HS256"],
      issuer: "mecanica-fiap",
    }) as jwt.JwtPayload;
    expect(decoded.sub).toBe("99");
  });

  it("nao chama a aplicacao quando o CPF e invalido", async () => {
    const fetchMock = stubFetch(async () => fakeResponse(200, { userId: 1 }));

    await expect(authenticateCustomer("123", testConfig())).rejects.toMatchObject({
      code: "CPF_INVALIDO",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propaga CLIENTE_NAO_ENCONTRADO vindo da aplicacao", async () => {
    stubFetch(async () => fakeResponse(404, {}));

    await expect(authenticateCustomer(VALID_CPF_FORMATTED, testConfig())).rejects.toMatchObject({
      code: "CLIENTE_NAO_ENCONTRADO",
    });
  });

  it("propaga erros como AppError (nunca vaza excecao crua)", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      authenticateCustomer(VALID_CPF_FORMATTED, testConfig()),
    ).rejects.toBeInstanceOf(AppError);
  });
});
