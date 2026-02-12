# 第五章：Option 和 Either

> 使用代数数据类型优雅地处理空值和错误,告别 null/undefined 和 try-catch

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解 Option/Maybe 类型及其使用场景
- ✅ 掌握 Either/Result 类型进行错误处理
- ✅ 使用 Railway-Oriented Programming 模式
- ✅ 熟练使用 map、flatMap、fold 等组合子
- ✅ 用函数式方式替代命令式的 null 检查和异常处理

## 📖 核心概念

### 1. 为什么需要 Option 和 Either?

#### 传统方式的问题

```typescript
// ❌ 问题1: null/undefined 导致的运行时错误
function getUser(id: number): User | null {
  // ...
}

const user = getUser(1);
const name = user.name;  // 💥 可能抛出 TypeError!

// ❌ 问题2: 异常破坏了函数的纯粹性
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('除数不能为0');
  return a / b;
}

// ❌ 问题3: 错误信息不在类型系统中
function parseJSON(str: string): any {  // 返回类型不包含错误信息!
  return JSON.parse(str);  // 可能抛出异常
}
```

#### 函数式解决方案

```typescript
// ✅ Option: 显式表示"可能没有值"
type Option<T> = Some<T> | None;

// ✅ Either: 显式表示"可能成功或失败"
type Either<L, R> = Left<L> | Right<R>;
```

### 2. Option/Maybe 类型

#### 通俗类比

Option 就像一个**可能为空的盒子**:
- **Some(value)** = 盒子里有东西
- **None** = 盒子是空的

不需要检查 null,只需要对盒子进行操作!

#### 类型定义

```typescript
type Option<T> =
  | { _tag: 'Some'; value: T }
  | { _tag: 'None' };
```

#### 常用操作

| 操作 | 说明 | 类似的命令式代码 |
|------|------|----------------|
| **map** | 转换内部的值 | `if (x) { return f(x.value); }` |
| **flatMap** | 链式调用返回 Option 的函数 | 嵌套的 null 检查 |
| **getOrElse** | 提供默认值 | `x ?? defaultValue` |
| **fold** | 处理两种情况 | `if (x) { ... } else { ... }` |

### 3. Either/Result 类型

#### 通俗类比

Either 就像**火车轨道**:
- **Right(value)** = 正常轨道,一路向前
- **Left(error)** = 错误轨道,直接到终点

所有操作都在正常轨道上进行,遇到错误自动切换!

#### 类型定义

```typescript
type Either<L, R> =
  | { _tag: 'Left'; left: L }
  | { _tag: 'Right'; right: R };

// 常见的特化版本
type Result<T, E = string> = Either<E, T>;
```

#### 常用操作

| 操作 | 说明 | 类似的命令式代码 |
|------|------|----------------|
| **map** | 转换成功值 | `try { f(x) } catch (e) { return e }` |
| **mapLeft** | 转换错误值 | 转换 catch 块中的错误 |
| **flatMap** | 链式调用 | 嵌套的 try-catch |
| **fold** | 处理成功和失败 | `try { ... } catch { ... }` |

### 4. Railway-Oriented Programming

#### 可视化

```
成功路径:  ──→ f1 ──→ f2 ──→ f3 ──→ 结果
                ↓      ↓      ↓
失败路径:      错误1  错误2  错误3 ──→ 错误
```

#### 核心思想

1. **两条轨道**: 成功轨道和失败轨道
2. **自动切换**: 任何步骤失败,自动切换到失败轨道
3. **失败传播**: 一旦进入失败轨道,后续步骤自动跳过
4. **统一处理**: 最后用 fold 统一处理成功和失败

```typescript
const result = pipe(
  input,
  validate,      // string -> Either<Error, ValidInput>
  transform,     // ValidInput -> Either<Error, TransformedData>
  save,          // TransformedData -> Either<Error, SavedData>
  notify         // SavedData -> Either<Error, NotificationResult>
);

result.fold(
  error => console.error('失败:', error),
  success => console.log('成功:', success)
);
```

## 🆚 Option/Either vs 传统方式对比

### Null 检查对比

#### 传统方式

```typescript
function getUserEmail(userId: number): string | null {
  const user = getUser(userId);
  if (!user) return null;
  
  const profile = user.profile;
  if (!profile) return null;
  
  const email = profile.email;
  if (!email) return null;
  
  return email.toLowerCase();
}
```

#### Option 方式

```typescript
function getUserEmail(userId: number): Option<string> {
  return pipe(
    getUser(userId),
    flatMap(user => user.profile),
    flatMap(profile => profile.email),
    map(email => email.toLowerCase())
  );
}
```

### 错误处理对比

#### 传统方式 (异常)

```typescript
function processOrder(order: Order): void {
  try {
    validateOrder(order);
    const payment = processPayment(order);
    const shipment = scheduleShipment(order);
    sendConfirmation(order);
  } catch (error) {
    logger.error('订单处理失败', error);
    // 错误类型不明确,需要 instanceof 检查
  }
}
```

#### Either 方式

```typescript
function processOrder(order: Order): Either<OrderError, Confirmation> {
  return pipe(
    validateOrder(order),
    flatMap(processPayment),
    flatMap(scheduleShipment),
    flatMap(sendConfirmation)
  );
}

// 使用
processOrder(order).fold(
  error => handleError(error),  // 类型安全!
  confirmation => showSuccess(confirmation)
);
```

## 💡 关键要点总结

1. **Option = 可能没有值**
   - 替代 null/undefined
   - 显式表达"可选性"
   - 类型安全的操作

2. **Either = 可能成功或失败**
   - 替代异常
   - 错误信息在类型中
   - 纯函数的错误处理

3. **map/flatMap/fold 是核心**
   - map: 转换值
   - flatMap: 链式调用
   - fold: 处理所有情况

4. **Railway-Oriented Programming**
   - 两条轨道的比喻
   - 自动的错误传播
   - 清晰的数据流

## 🤔 进一步思考

1. **问: Option 和 null/undefined 的本质区别是什么?**
   - 答: Option 将"可能没有值"编码在类型系统中,编译器可以强制你处理 None 的情况。而 null 是运行时的检查。

2. **问: Either 和异常的区别?**
   - 答: Either 是值,可以像其他值一样传递、组合。异常破坏了控制流,且错误类型不在类型系统中。

3. **问: 什么时候用 Option,什么时候用 Either?**
   - 答:
     - Option: 值可能不存在,但不需要解释原因 (查找、可选字段)
     - Either: 值可能失败,需要错误信息 (验证、IO 操作)

4. **问: 性能如何?**
   - 答: 有轻微开销(额外的对象包装),但通常可以忽略。好处是类型安全和代码清晰度。

## 📝 实践指南

### 何时使用 Option

✅ **适合的场景:**
- 数据库/缓存查询 (可能找不到)
- 数组查找 (find)
- 配置项 (可能未设置)
- 表单字段 (可选)

```typescript
function findUser(id: number): Option<User>
function getConfig(key: string): Option<string>
```

### 何时使用 Either

✅ **适合的场景:**
- 验证 (可能失败,需要错误信息)
- IO 操作 (文件读写、网络请求)
- 解析 (JSON、CSV、命令行参数)
- 业务规则 (可能违反约束)

```typescript
function validateEmail(email: string): Either<ValidationError, Email>
function parseJSON<T>(str: string): Either<ParseError, T>
```

### 组合模式

```typescript
// 链式调用: flatMap
const result = pipe(
  getUserInput(),
  flatMap(validate),
  flatMap(transform),
  flatMap(save)
);

// 并行操作: 使用辅助函数
const result = combine(
  getUser(userId),
  getOrder(orderId),
  (user, order) => createShipment(user, order)
);

// 恢复错误: orElse
const result = pipe(
  primarySource(),
  orElse(() => backupSource()),
  orElse(() => defaultValue)
);
```

## 🎯 学习检查清单

- [ ] 理解 Option 和 Either 的概念和用途
- [ ] 能够从零实现 Option 和 Either 类型
- [ ] 掌握 map、flatMap、fold 等核心操作
- [ ] 理解 Railway-Oriented Programming 模式
- [ ] 能够用 Option/Either 重构现有代码
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-option.ts` - Option/Maybe 类型从零实现和使用
- `02-either.ts` - Either/Result 类型实现和错误处理
- `03-error-handling.ts` - Railway-Oriented Programming 实战
- `04-chaining.ts` - 链式操作、map/flatMap/fold 详解
- `05-exercises.ts` - 练习题

## ➡️ 下一章

[第六章: Functor 和 Monad](/06-functor-and-monad) - 理解函数式编程的核心抽象
