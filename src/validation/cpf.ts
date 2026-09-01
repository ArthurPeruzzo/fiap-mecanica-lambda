import { AppError } from "../errors";

/** Remove tudo que nao for digito. */
export function normalizeCpf(raw: string): string {
  return raw.replace(/\D/g, "");
}

function calcCheckDigit(digits: string, factorStart: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (factorStart - i);
  }
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

/**
 * Valida um CPF (11 digitos) pelos digitos verificadores. Rejeita sequencias
 * de digitos repetidos (ex.: 00000000000), que passam no calculo mas nao sao validas.
 */
export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const d1 = calcCheckDigit(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) return false;

  const d2 = calcCheckDigit(cpf.slice(0, 10), 11);
  return d2 === Number(cpf[10]);
}

/**
 * Normaliza e valida o CPF; devolve os 11 digitos. Lanca `AppError("CPF_INVALIDO")`
 * se estiver ausente ou nao passar na validacao.
 */
export function assertValidCpf(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new AppError("CPF_INVALIDO", "campo cpf ausente");
  }
  const cpf = normalizeCpf(raw);
  if (!isValidCpf(cpf)) {
    throw new AppError("CPF_INVALIDO", "digitos verificadores nao conferem");
  }
  return cpf;
}
