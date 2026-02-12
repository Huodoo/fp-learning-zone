/**
 * Either 类型实现（复用第 5 章）
 */

export type Either<L, R> = Left<L> | Right<R>;

export type Left<L> = {
  readonly _tag: 'Left';
  readonly left: L;
};

export type Right<R> = {
  readonly _tag: 'Right';
  readonly right: R;
};

export function left<L, R = never>(value: L): Either<L, R> {
  return { _tag: 'Left', left: value };
}

export function right<R, L = never>(value: R): Either<L, R> {
  return { _tag: 'Right', right: value };
}

export function isLeft<L, R>(either: Either<L, R>): either is Left<L> {
  return either._tag === 'Left';
}

export function isRight<L, R>(either: Either<L, R>): either is Right<R> {
  return either._tag === 'Right';
}

export function map<L, R, B>(either: Either<L, R>, f: (r: R) => B): Either<L, B> {
  return isRight(either) ? right(f(either.right)) : either;
}

export function flatMap<L, R, B>(either: Either<L, R>, f: (r: R) => Either<L, B>): Either<L, B> {
  return isRight(either) ? f(either.right) : either;
}

export function getOrElse<L, R>(either: Either<L, R>, defaultValue: R): R {
  return isRight(either) ? either.right : defaultValue;
}

export function fold<L, R, B>(either: Either<L, R>, onLeft: (l: L) => B, onRight: (r: R) => B): B {
  return isLeft(either) ? onLeft(either.left) : onRight(either.right);
}
