/**
 * Lens 实现（复用第 11 章）
 */

export type Lens<S, A> = {
  readonly get: (s: S) => A;
  readonly set: (s: S, a: A) => S;
};

export function lens<S, A>(get: (s: S) => A, set: (s: S, a: A) => S): Lens<S, A> {
  return { get, set };
}

export function lensProp<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return lens(
    (s: S) => s[key],
    (s: S, a: S[K]) => ({ ...s, [key]: a })
  );
}

export function modify<S, A>(lens: Lens<S, A>, f: (a: A) => A, s: S): S {
  return lens.set(s, f(lens.get(s)));
}
