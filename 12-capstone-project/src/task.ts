/**
 * Task Monad 实现（复用第 7 章）
 */

import { Either, left, right } from './either.js';

export class Task<A> {
  constructor(private readonly computation: () => Promise<A>) {}

  async run(): Promise<A> {
    return this.computation();
  }

  map<B>(f: (a: A) => B): Task<B> {
    return new Task(async () => f(await this.run()));
  }

  flatMap<B>(f: (a: A) => Task<B>): Task<B> {
    return new Task(async () => {
      const a = await this.run();
      return f(a).run();
    });
  }
}

export function task<A>(computation: () => Promise<A>): Task<A> {
  return new Task(computation);
}

export class TaskEither<E, A> {
  constructor(private readonly computation: () => Promise<Either<E, A>>) {}

  async run(): Promise<Either<E, A>> {
    return this.computation();
  }

  map<B>(f: (a: A) => B): TaskEither<E, B> {
    return new TaskEither(async () => {
      const either = await this.run();
      return either._tag === 'Right' ? right(f(either.right)) : either;
    });
  }

  flatMap<B>(f: (a: A) => TaskEither<E, B>): TaskEither<E, B> {
    return new TaskEither(async () => {
      const either = await this.run();
      if (either._tag === 'Left') return either;
      return f(either.right).run();
    });
  }
}

export function taskEither<E, A>(computation: () => Promise<Either<E, A>>): TaskEither<E, A> {
  return new TaskEither(computation);
}

export function tryCatch<E, A>(
  f: () => Promise<A>,
  onError: (error: unknown) => E
): TaskEither<E, A> {
  return new TaskEither(async () => {
    try {
      const result = await f();
      return right(result);
    } catch (error) {
      return left(onError(error));
    }
  });
}
