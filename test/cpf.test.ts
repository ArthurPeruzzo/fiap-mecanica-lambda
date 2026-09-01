import { describe, expect, it } from "vitest";
import { assertValidCpf, isValidCpf, normalizeCpf } from "../src/validation/cpf";
import { AppError } from "../src/errors";
import { VALID_CPF, VALID_CPF_FORMATTED } from "./helpers";

describe("normalizeCpf", () => {
  it("remove pontuacao e espacos", () => {
    expect(normalizeCpf(VALID_CPF_FORMATTED)).toBe(VALID_CPF);
    expect(normalizeCpf("  529 982 247 25 ")).toBe(VALID_CPF);
  });
});

describe("isValidCpf", () => {
  it("aceita CPF valido, com ou sem formatacao", () => {
    expect(isValidCpf(VALID_CPF)).toBe(true);
    expect(isValidCpf(VALID_CPF_FORMATTED)).toBe(true);
  });

  it("rejeita digitos verificadores incorretos", () => {
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("52998224715")).toBe(false);
  });

  it("rejeita sequencias de digitos repetidos", () => {
    expect(isValidCpf("00000000000")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
  });

  it("rejeita tamanho diferente de 11 digitos", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("529982247250")).toBe(false);
  });
});

describe("assertValidCpf", () => {
  it("devolve os 11 digitos para entrada valida formatada", () => {
    expect(assertValidCpf(VALID_CPF_FORMATTED)).toBe(VALID_CPF);
  });

  it("lanca AppError CPF_INVALIDO quando ausente", () => {
    expect(() => assertValidCpf(undefined)).toThrow(AppError);
    expect(() => assertValidCpf("")).toThrow(/CPF_INVALIDO/);
    expect(() => assertValidCpf(12345678901)).toThrow(/CPF_INVALIDO/);
  });

  it("lanca AppError CPF_INVALIDO quando digitos nao conferem", () => {
    try {
      assertValidCpf("52998224724");
      expect.unreachable("deveria ter lancado");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("CPF_INVALIDO");
      expect((err as AppError).statusCode).toBe(400);
    }
  });
});
