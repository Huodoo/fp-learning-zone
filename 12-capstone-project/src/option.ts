/**
 * Option 类型实现（复用第 5 章）
 */

export type Option<A> = Some<A> | None;

export type Some<A> = {
  readonly _tag: 'Some';
  readonly value: A;
};

export type None = {
  readonly _tag: 'None';
};

export function some<A>(value: A): Option<A> {
  return { _tag: 'Some', value };
}

export function none<A = never>(): Option<A> {
  return { _tag: 'None' };
}

export function isSome<A>(option: Option<A>): option is Some<A> {
  return option._tag === 'Some';
}

export function isNone<A>(option: Option<A>): option is None {
  return option._tag === 'None';
}

export function map<A, B>(option: Option<A>, f: (a: A) => B): Option<B> {
  return isSome(option) ? some(f(option.value)) : none();
}

export function flatMap<A, B>(option: Option<A>, f: (a: A) => Option<B>): Option<B> {
  return isSome(option) ? f(option.value) : none();
}

export function getOrElse<A>(option: Option<A>, defaultValue: A): A {
  return isSome(option) ? option.value : defaultValue;
}

export function fromNullable<A>(value: A | null | undefined): Option<A> {
  return value != null ? some(value) : none();
}
