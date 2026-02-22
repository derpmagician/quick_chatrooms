declare namespace Bun {
  function hash(data: string, opts?: object): Promise<string>;
  function compare(data: string, hash: string): Promise<boolean>;

  interface JwtOptions {
    algorithm?: string;
    expiresIn?: string | number;
    audience?: string;
    issuer?: string;
    subject?: string;
    [k: string]: unknown;
  }
  interface Jwt {
    sign(
      payload: Record<string, unknown>,
      secret: string,
      opts?: JwtOptions
    ): string;
    verify<T = Record<string, unknown>>(
      token: string,
      secret: string
    ): T;
  }
  const jwt: Jwt;
}