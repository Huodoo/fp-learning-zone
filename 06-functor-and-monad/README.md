# 第六章：Functor 和 Monad

> 理解函数式编程的核心抽象模式，掌握 Functor、Applicative 和 Monad 的本质

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解 Functor（函子）的概念和 Functor Laws
- ✅ 掌握 Applicative Functor 及其应用场景
- ✅ 深入理解 Monad（单子）及其重要性
- ✅ 验证并运用 Monad Laws（单子定律）
- ✅ 使用 Generator 函数模拟 Haskell 的 do-notation
- ✅ 在实际业务中运用 Functor 和 Monad 模式

## 📖 核心概念

### 1. 为什么需要 Functor 和 Monad？

#### 传统方式的问题

```typescript
// ❌ 问题1: 重复的模式匹配代码
function processOption(opt: Option<number>): Option<number> {
  if (opt._tag === 'Some') {
    return Some(opt.value * 2);
  }
  return None;
}

function processEither(either: Either<Error, number>): Either<Error, number> {
  if (either._tag === 'Right') {
    return Right(either.right * 2);
  }
  return either;
}

// ❌ 问题2: 无法统一处理不同的容器类型
// Option、Either、Array 等都有相似的"映射"操作，但没有统一接口
```

#### 函数式解决方案

```typescript
// ✅ Functor: 统一的 map 接口
interface Functor<F> {
  map<A, B>(f: (a: A) => B, fa: F<A>): F<B>;
}

// ✅ Monad: 统一的 flatMap 接口
interface Monad<M> extends Functor<M> {
  pure<A>(a: A): M<A>;
  flatMap<A, B>(f: (a: A) => M<B>, ma: M<A>): M<B>;
}
```

### 2. Functor（函子）

#### 通俗类比

Functor 就像一个**智能容器**:
- 容器里装着值
- 可以对容器内的值应用函数，而无需取出值
- 操作后仍然返回相同类型的容器

就像**透过玻璃操作盒子里的东西**，不用打开盒子！

#### 核心概念

```typescript
// Functor 的本质: 可以被 map 的东西
interface Functor<F> {
  map<A, B>(f: (a: A) => B): (fa: F<A>) => F<B>;
}

// 例子:
// Array 是 Functor:    [1, 2, 3].map(x => x * 2)  → [2, 4, 6]
// Option 是 Functor:   Some(5).map(x => x * 2)    → Some(10)
// Either 是 Functor:   Right(5).map(x => x * 2)   → Right(10)
```

#### Functor Laws（函子定律）

Functor 必须遵守两个定律:

1. **Identity Law（恒等定律）**
   ```typescript
   map(x => x)(fa) === fa
   // 映射恒等函数等于什么都不做
   ```

2. **Composition Law（组合定律）**
   ```typescript
   map(f)(map(g)(fa)) === map(x => f(g(x)))(fa)
   // 先后 map 两次 = 一次 map 组合函数
   ```

### 3. Applicative Functor（应用函子）

#### 通俗类比

Applicative 是**增强版的 Functor**:
- Functor 只能用普通函数映射值
- Applicative 可以用**容器里的函数**映射**容器里的值**

就像**两个盒子之间的互动**！

#### 核心概念

```typescript
interface Applicative<F> extends Functor<F> {
  pure<A>(a: A): F<A>;                          // 将值放入容器
  ap<A, B>(ff: F<(a: A) => B>, fa: F<A>): F<B>; // 应用容器中的函数
}

// 例子: 组合多个独立的 Option 值
const add = (a: number) => (b: number) => a + b;

// 传统方式需要嵌套 flatMap
flatMap(a => 
  flatMap(b => 
    Some(a + b)
  )(optionB)
)(optionA)

// Applicative 方式更清晰
ap(ap(pure(add), optionA), optionB)
```

### 4. Monad（单子）

#### 通俗类比

Monad 是**可以展平的 Functor**:
- Functor 的 map 可能产生嵌套: `Option<Option<T>>`
- Monad 的 flatMap 自动展平: `Option<T>`

就像**俄罗斯套娃，自动拆开一层**！

#### 核心概念

```typescript
interface Monad<M> extends Applicative<M> {
  flatMap<A, B>(f: (a: A) => M<B>): (ma: M<A>) => M<B>;
}

// flatMap 的别名: chain, bind, >>=

// 为什么需要 flatMap?
const parseUser = (json: string): Option<User>
const getAddress = (user: User): Option<Address>

// 使用 map 会嵌套:
const nested: Option<Option<Address>> = map(getAddress)(parseUser(json))

// 使用 flatMap 自动展平:
const flat: Option<Address> = flatMap(getAddress)(parseUser(json))
```

#### Monad Laws（单子定律）

Monad 必须遵守三个定律:

1. **Left Identity（左恒等）**
   ```typescript
   flatMap(f)(pure(a)) === f(a)
   // 将值包装后 flatMap = 直接调用函数
   ```

2. **Right Identity（右恒等）**
   ```typescript
   flatMap(pure)(ma) === ma
   // flatMap pure 等于什么都不做
   ```

3. **Associativity（结合律）**
   ```typescript
   flatMap(g)(flatMap(f)(ma)) === flatMap(x => flatMap(g)(f(x)))(ma)
   // flatMap 的嵌套顺序不影响结果
   ```

### 5. Do-Notation 模拟

#### 通俗类比

do-notation 就像**命令式代码的外观，函数式的内核**:
- 看起来像在写普通的变量赋值
- 实际上是纯函数的链式调用

在 JavaScript/TypeScript 中用 Generator 模拟！

#### 核心概念

```typescript
// Haskell 的 do-notation:
/*
do
  user <- findUser(id)
  address <- getAddress(user)
  zipCode <- getZipCode(address)
  return zipCode
*/

// TypeScript 用 Generator 模拟:
const result = Do(function*() {
  const user = yield* findUser(id);
  const address = yield* getAddress(user);
  const zipCode = yield* getZipCode(address);
  return zipCode;
});
```

## 🆚 Functor/Monad vs 传统方式对比

### 处理嵌套容器

#### 传统方式

```typescript
function getUserCity(userId: number): string {
  const userOpt = findUser(userId);
  if (userOpt._tag === 'None') return '未知';
  
  const addressOpt = getAddress(userOpt.value);
  if (addressOpt._tag === 'None') return '未知';
  
  const cityOpt = getCity(addressOpt.value);
  if (cityOpt._tag === 'None') return '未知';
  
  return cityOpt.value;
}
```

#### Monad 方式

```typescript
function getUserCity(userId: number): string {
  return pipe(
    findUser(userId),
    flatMap(getAddress),
    flatMap(getCity),
    getOrElse('未知')
  );
}
```

### 组合多个独立计算

#### 传统方式

```typescript
function validateForm(name: string, email: string, age: number): Option<Form> {
  const nameOpt = validateName(name);
  if (nameOpt._tag === 'None') return None;
  
  const emailOpt = validateEmail(email);
  if (emailOpt._tag === 'None') return None;
  
  const ageOpt = validateAge(age);
  if (ageOpt._tag === 'None') return None;
  
  return Some({
    name: nameOpt.value,
    email: emailOpt.value,
    age: ageOpt.value
  });
}
```

#### Applicative 方式

```typescript
function validateForm(name: string, email: string, age: number): Option<Form> {
  return liftA3(
    (n, e, a) => ({ name: n, email: e, age: a }),
    validateName(name),
    validateEmail(email),
    validateAge(age)
  );
}
```

## 💡 关键要点总结

1. **Functor = 可 map 的容器**
   - 提供统一的 map 接口
   - 保持容器结构，只转换值
   - 遵守恒等定律和组合定律

2. **Applicative = 容器间的函数应用**
   - 可以组合多个独立的容器
   - 适合并行验证等场景
   - 比 Monad 更强的组合能力

3. **Monad = 可展平的 Functor**
   - flatMap 避免嵌套
   - 适合链式依赖的操作
   - 遵守三大定律保证正确性

4. **层次关系**
   ```
   Functor
      ↓
   Applicative
      ↓
   Monad
   ```

## 🤔 进一步思考

1. **问: Functor、Applicative、Monad 的本质区别?**
   - Functor: 只能用纯函数转换容器内的值
   - Applicative: 可以组合多个独立的容器
   - Monad: 可以根据前一个值决定下一步（依赖链）

2. **问: 什么时候用 Applicative，什么时候用 Monad?**
   - Applicative: 多个独立计算，可并行（如表单验证）
   - Monad: 后续计算依赖前面结果（如数据库查询链）

3. **问: 为什么 Monad Laws 很重要?**
   - 保证 flatMap 行为可预测
   - 允许重构而不改变语义
   - 编译器优化的基础

4. **问: Array 是 Monad 吗?**
   - 是的！flatMap 就是 Array 的 flat + map
   - `[1,2,3].flatMap(x => [x, x*2])` → `[1,2,2,4,3,6]`

## 📝 实践指南

### 何时使用 Functor

✅ **适合的场景:**
- 简单的值转换
- 不改变容器结构
- 独立的映射操作

```typescript
// 转换 Option 中的值
const doubled = map((x: number) => x * 2)(Some(5));

// 转换数组中的值
const uppercased = map((s: string) => s.toUpperCase())(['a', 'b', 'c']);
```

### 何时使用 Applicative

✅ **适合的场景:**
- 组合多个独立的容器
- 并行验证
- 不依赖前面结果的计算

```typescript
// 表单验证
const validForm = liftA3(
  createForm,
  validateName(name),
  validateEmail(email),
  validateAge(age)
);
```

### 何时使用 Monad

✅ **适合的场景:**
- 链式依赖操作
- 后续计算需要前面的结果
- 需要展平嵌套结构

```typescript
// 数据库查询链
const result = pipe(
  findUser(id),           // Option<User>
  flatMap(getOrders),     // User -> Option<Orders>
  flatMap(getLatest),     // Orders -> Option<Order>
  map(formatOrder)        // Order -> FormattedOrder
);
```

## 🎯 学习检查清单

- [ ] 理解 Functor 的概念和 Functor Laws
- [ ] 能够为自定义类型实现 Functor 接口
- [ ] 理解 Applicative 与 Functor 的区别
- [ ] 掌握 Monad 的 flatMap 操作
- [ ] 能够验证 Monad Laws
- [ ] 理解 do-notation 的原理和用途
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-functor.ts` - Functor 接口和实现
- `02-applicative.ts` - Applicative Functor 详解
- `03-monad.ts` - Monad 接口和核心概念
- `04-monad-laws.ts` - Monad Laws 验证
- `05-do-notation.ts` - Generator 模拟 do-notation
- `06-exercises.ts` - 综合练习

## ➡️ 下一章

[第七章: IO 和 Effects](/07-io-and-effects) - 在纯函数中描述副作用
