/**
 * Reader Monad 实现（复用第 8 章）
 */

export class Reader<R, A> {
  constructor(private readonly runReader: (r: R) => A) {}

  run(deps: R): A {
    return this.runReader(deps);
  }

  map<B>(f: (a: A) => B): Reader<R, B> {
    return new Reader((r: R) => f(this.run(r)));
  }

  flatMap<B>(f: (a: A) => Reader<R, B>): Reader<R, B> {
    return new Reader((r: R) => f(this.run(r)).run(r));
  }
}

export function reader<R, A>(f: (r: R) => A): Reader<R, A> {
  return new Reader(f);
}

export function ask<R>(): Reader<R, R> {
  return new Reader((r: R) => r);
}
