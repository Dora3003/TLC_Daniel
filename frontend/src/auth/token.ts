const TOKEN = /^[A-Z0-9]{7}$/;

export function normalizarToken(token: string): string {
  return token.trim().toUpperCase();
}

export function tokenValido(token: string): boolean {
  return TOKEN.test(normalizarToken(token));
}
