/**
 * IO Monad 实现（复用第 7 章）
 */

export class IO<A> {
  constructor(private readonly effect: () => A) {}

  run(): A {
    return this.effect();
  }

  map<B>(f: (a: A) => B): IO<B> {
    return new IO(() => f(this.run()));
  }

  flatMap<B>(f: (a: A) => IO<B>): IO<B> {
    return new IO(() => f(this.run()).run());
  }
}

export function io<A>(effect: () => A): IO<A> {
  return new IO(effect);
}
