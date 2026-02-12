# 第七章：IO 和 Effects

> 在纯函数中描述副作用，使用 IO Monad 和 Task 处理异步操作

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解副作用(Side Effects)及其问题
- ✅ 掌握延迟执行(Lazy Evaluation)的概念
- ✅ 实现和使用 IO Monad 封装副作用
- ✅ 实现 Task Monad 处理异步操作
- ✅ 实现 TaskEither 组合异步和错误处理
- ✅ 在实际项目中使用 IO/Task 处理文件、网络等副作用

## 📖 核心概念

### 1. 什么是副作用？

#### 副作用的定义

副作用(Side Effect)是指函数除了返回值之外，还与外部世界产生了交互:

```typescript
// ❌ 有副作用的函数
function greet(name: string): string {
  console.log(`Hello, ${name}!`);  // 副作用：控制台输出
  return `Greeted ${name}`;
}

function saveUser(user: User): void {
  database.save(user);  // 副作用：数据库写入
  sendEmail(user.email);  // 副作用：网络请求
}

function getCurrentTime(): number {
  return Date.now();  // 副作用：依赖外部状态
}
```

#### 常见的副作用

| 类型 | 示例 | 问题 |
|-----|------|------|
| **I/O** | 读写文件、数据库 | 可能失败、难以测试 |
| **网络** | HTTP 请求、WebSocket | 异步、不可预测 |
| **控制台** | console.log | 影响外部环境 |
| **随机** | Math.random() | 不确定性 |
| **时间** | Date.now() | 非纯函数 |
| **状态修改** | 修改全局变量 | 破坏引用透明性 |

### 2. 纯函数如何处理副作用？

#### 核心思想：描述而非执行

```typescript
// ❌ 直接执行副作用
function greet(name: string): void {
  console.log(`Hello, ${name}!`);  // 立即执行
}

// ✅ 描述副作用
function greet(name: string): IO<void> {
  return new IO(() => {
    console.log(`Hello, ${name}!`);  // 延迟执行
  });
}
```

**关键区别:**
- 直接执行：调用函数时立即产生副作用
- 描述副作用：返回一个描述，稍后由"世界的边缘"执行

### 3. IO Monad

#### 通俗类比

IO Monad 就像**一个任务清单**:
- 你在清单上写下要做的事（描述）
- 但不立即去做（延迟）
- 最后统一执行清单（在 main 函数中）

#### 类型定义

```typescript
class IO<A> {
  constructor(private effect: () => A) {}
  
  // Functor
  map<B>(f: (a: A) => B): IO<B>
  
  // Monad
  flatMap<B>(f: (a: A) => IO<B>): IO<B>
  
  // 执行副作用
  unsafeRun(): A
}
```

#### 核心特点

1. **延迟执行**: 创建 IO 时不执行副作用
2. **纯函数**: 返回 IO 的函数是纯函数
3. **可组合**: 可以用 map/flatMap 组合
4. **边界清晰**: 只在 main 函数中执行

### 4. Task Monad

#### 通俗类比

Task 是**异步的 IO**:
- 像 Promise，但更"懒"
- 不会自动开始执行
- 更容易取消和组合

#### 类型定义

```typescript
class Task<A> {
  constructor(private computation: () => Promise<A>) {}
  
  // Functor
  map<B>(f: (a: A) => B): Task<B>
  
  // Monad
  flatMap<B>(f: (a: A) => Task<B>): Task<B>
  
  // 执行
  run(): Promise<A>
}
```

### 5. TaskEither

#### 通俗类比

TaskEither 是**带错误处理的异步 IO**:
- 异步操作 (Task)
- 错误处理 (Either)
- 最实用的组合！

#### 类型定义

```typescript
class TaskEither<E, A> {
  constructor(private computation: () => Promise<Either<E, A>>) {}
  
  // Functor
  map<B>(f: (a: A) => B): TaskEither<E, B>
  
  // Monad
  flatMap<B>(f: (a: A) => TaskEither<E, B>): TaskEither<E, B>
  
  // 执行
  run(): Promise<Either<E, A>>
}
```

## 🆚 IO/Task vs 传统方式对比

### 副作用处理

#### 传统方式

```typescript
// ❌ 副作用散布在代码各处
function processOrder(orderId: string): void {
  const order = database.findOrder(orderId);  // 副作用1
  console.log('Processing order:', order);     // 副作用2
  sendEmail(order.userEmail, 'Confirmed');     // 副作用3
  updateInventory(order.items);                // 副作用4
}
```

#### IO/Task 方式

```typescript
// ✅ 副作用被描述和组合，最后统一执行
function processOrder(orderId: string): TaskEither<Error, void> {
  return pipe(
    findOrder(orderId),           // TaskEither<Error, Order>
    flatMap(validateOrder),       // Order -> TaskEither<Error, Order>
    flatMap(sendConfirmation),    // Order -> TaskEither<Error, void>
    flatMap(updateInventory)      // void -> TaskEither<Error, void>
  );
}

// 在边界执行
processOrder('O1').run().then(/* ... */);
```

### 异步操作

#### 传统 Promise 方式

```typescript
// ❌ Promise 立即开始执行
const promise = fetchUser(1);  // 已经开始网络请求！

// 无法取消
// 难以组合多个异步操作
```

#### Task 方式

```typescript
// ✅ Task 不会立即执行
const task = fetchUserTask(1);  // 只是描述，未执行

// 可以组合
const combined = pipe(
  task,
  flatMap(user => fetchPostsTask(user.id)),
  map(posts => posts.length)
);

// 手动执行
combined.run();  // 现在才开始执行
```

## 💡 关键要点总结

1. **IO Monad = 描述副作用**
   - 延迟执行
   - 保持纯函数性
   - 在边界统一执行

2. **Task = 异步的 IO**
   - 懒惰的 Promise
   - 更好的组合性
   - 可取消

3. **TaskEither = Task + Either**
   - 异步 + 错误处理
   - 最实用的组合
   - Railway-Oriented Programming for async

4. **Pure Core, Impure Shell**
   - 核心业务逻辑纯函数
   - 副作用在边缘执行
   - 清晰的架构分层

## 🤔 进一步思考

1. **问: IO Monad 和直接执行副作用的本质区别?**
   - 答: IO 将"描述"和"执行"分离。返回 IO 的函数仍然是纯函数，可测试、可组合。

2. **问: Task 和 Promise 的区别?**
   - 答:
     - Promise: 立即执行，不可取消
     - Task: 延迟执行，可取消，可重复运行

3. **问: 为什么需要 TaskEither 而不是 Task<Either>?**
   - 答: TaskEither 提供了更方便的 map/flatMap，自动处理 Either 的包装和解包。

4. **问: 所有副作用都要用 IO 包装吗?**
   - 答: 在理想情况下是的。但实践中需要权衡。核心业务逻辑应该纯函数，边界可以有副作用。

## 📝 实践指南

### 何时使用 IO

✅ **适合的场景:**
- 同步的副作用操作
- 控制台输出
- 同步文件读写
- 获取当前时间

```typescript
const logMessage = (msg: string): IO<void>
const readFileSync = (path: string): IO<string>
const getCurrentTime = (): IO<number>
```

### 何时使用 Task

✅ **适合的场景:**
- 异步操作
- 网络请求
- 异步文件 I/O
- 定时器

```typescript
const fetchUser = (id: number): Task<User>
const readFile = (path: string): Task<string>
const delay = (ms: number): Task<void>
```

### 何时使用 TaskEither

✅ **适合的场景:**
- 异步 + 可能失败的操作
- HTTP API 调用
- 数据库操作
- 文件系统操作

```typescript
const apiRequest = (url: string): TaskEither<Error, Response>
const queryDatabase = (sql: string): TaskEither<DbError, Row[]>
const writeFile = (path: string, data: string): TaskEither<Error, void>
```

### Pure Core, Impure Shell 架构

```typescript
// ===== Pure Core (核心业务逻辑) =====
// 纯函数，易于测试
function calculateDiscount(price: number, userLevel: string): number {
  // ...
}

function validateOrder(order: Order): Either<Error, Order> {
  // ...
}

// ===== Impure Shell (副作用层) =====
// 使用 IO/Task 描述副作用
function saveOrder(order: Order): TaskEither<Error, void> {
  // ...
}

function sendEmail(to: string, content: string): TaskEither<Error, void> {
  // ...
}

// ===== Main (边界) =====
// 组合和执行
function main(): TaskEither<Error, void> {
  return pipe(
    getOrderFromUser(),         // TaskEither<Error, Order>
    flatMap(validateOrder),     // 纯函数包装成 TaskEither
    flatMap(saveOrder),         // 副作用
    flatMap(sendConfirmation)   // 副作用
  );
}

main().run();  // 在边界执行所有副作用
```

## 🎯 学习检查清单

- [ ] 理解副作用的概念和问题
- [ ] 理解延迟执行的重要性
- [ ] 能够实现 IO Monad
- [ ] 能够实现 Task Monad
- [ ] 能够实现 TaskEither
- [ ] 理解 Pure Core, Impure Shell 架构
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-io-monad.ts` - IO Monad 实现和使用
- `02-task-monad.ts` - Task Monad 实现
- `03-task-either.ts` - TaskEither 实现
- `04-real-world-example.ts` - 实际应用示例
- `05-exercises.ts` - 综合练习

## ➡️ 下一章

[第八章: Reader 和 Dependency Injection](/08-reader-and-dependency) - 优雅的依赖注入
