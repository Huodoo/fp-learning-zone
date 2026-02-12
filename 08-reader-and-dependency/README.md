# 第八章：Reader Monad 与依赖注入

> 使用 Reader Monad 实现纯函数式的依赖注入，告别复杂的 DI 容器

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解 Reader Monad 的原理和使用场景
- ✅ 掌握如何用 Reader 实现依赖注入
- ✅ 对比 OOP DI 容器与 FP Reader 的区别
- ✅ 组合 Reader + Task + Either 构建强大的应用架构
- ✅ 在实际项目中应用函数式依赖注入模式

## 📖 核心概念

### 1. 什么是 Reader Monad?

#### 通俗类比

Reader Monad 就像一个**食谱**:
- **环境 (Environment)** = 厨房里的配料和工具
- **Reader<R, A>** = 一份需要特定配料的食谱
- **运行 Reader** = 带着配料进入厨房,按食谱做菜

食谱本身不包含配料,但描述了如何使用配料!

#### 类型定义

```typescript
// Reader<R, A> 本质上就是一个函数: R => A
// R: 环境/上下文/依赖
// A: 计算结果
type Reader<R, A> = (env: R) => A;
```

#### 为什么需要 Reader?

**问题场景**：你有很多函数需要相同的配置/依赖

```typescript
// ❌ 传统方式: 到处传递配置
function getUser(id: number, config: Config): User {
  const db = connectDB(config.dbUrl);
  // ...
}

function saveUser(user: User, config: Config): void {
  const db = connectDB(config.dbUrl);
  // ...
}

function processUser(id: number, config: Config): Result {
  const user = getUser(id, config);  // 要传 config
  const updated = updateUser(user, config);  // 又要传 config
  saveUser(updated, config);  // 还要传 config
}
```

**✅ Reader 方式**: 自动注入依赖

```typescript
// 函数签名变简洁了,不需要显式传递 config
const getUser = (id: number): Reader<Config, User> => 
  (config) => { /* ... */ };

const processUser = (id: number): Reader<Config, Result> =>
  pipe(
    getUser(id),
    flatMap(updateUser),
    flatMap(saveUser)
  );
  
// 最后统一提供配置
const result = processUser(123)(config);
```

### 2. Reader vs OOP DI 容器

#### OOP 依赖注入

```typescript
// OOP 方式: 使用 DI 容器
class UserService {
  constructor(
    @Inject('IDatabase') private db: IDatabase,
    @Inject('ILogger') private logger: ILogger,
    @Inject('ICache') private cache: ICache
  ) {}
  
  async getUser(id: number): Promise<User> {
    this.logger.log(`Getting user ${id}`);
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;
    
    const user = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    await this.cache.set(`user:${id}`, user);
    return user;
  }
}

// 需要配置 DI 容器
container.bind<IDatabase>('IDatabase').to(PostgresDatabase);
container.bind<ILogger>('ILogger').to(ConsoleLogger);
container.bind<ICache>('ICache').to(RedisCache);
container.bind<UserService>('UserService').to(UserService);

// 使用
const userService = container.get<UserService>('UserService');
```

#### FP Reader 方式

```typescript
// FP 方式: 使用 Reader
interface Dependencies {
  db: IDatabase;
  logger: ILogger;
  cache: ICache;
}

const getUser = (id: number): Reader<Dependencies, Promise<User>> =>
  async (deps) => {
    deps.logger.log(`Getting user ${id}`);
    const cached = await deps.cache.get(`user:${id}`);
    if (cached) return cached;
    
    const user = await deps.db.query('SELECT * FROM users WHERE id = ?', [id]);
    await deps.cache.set(`user:${id}`, user);
    return user;
  };

// 使用: 显式提供依赖
const deps: Dependencies = {
  db: new PostgresDatabase(),
  logger: new ConsoleLogger(),
  cache: new RedisCache()
};

const user = await getUser(123)(deps);
```

#### 对比表格

| 特性 | OOP DI 容器 | FP Reader Monad |
|------|------------|----------------|
| **复杂度** | 高 (需要配置容器) | 低 (纯函数) |
| **可测试性** | 中 (需要 mock 容器) | 高 (直接传参) |
| **类型安全** | 弱 (字符串 key) | 强 (类型推导) |
| **运行时开销** | 有 (反射/查找) | 无 (编译优化) |
| **学习曲线** | 陡峭 (框架特定) | 平缓 (纯函数) |
| **灵活性** | 受容器限制 | 完全灵活 |
| **副作用控制** | 无 | 有 (可组合 IO) |

### 3. Reader Monad 的核心操作

#### ask - 获取环境

```typescript
// 获取当前的环境/依赖
const ask = <R>(): Reader<R, R> => 
  (env) => env;

// 示例: 获取配置
const getConfig: Reader<Config, Config> = ask();
```

#### local - 修改局部环境

```typescript
// 在子计算中使用修改后的环境
const local = <R, A>(
  f: (r: R) => R,
  reader: Reader<R, A>
): Reader<R, A> =>
  (env) => reader(f(env));

// 示例: 临时修改日志级别
const withDebugLogging = <A>(reader: Reader<Config, A>) =>
  local(
    (config) => ({ ...config, logLevel: 'debug' }),
    reader
  );
```

#### map - 转换结果

```typescript
// Functor: 转换 Reader 的返回值
const map = <R, A, B>(
  f: (a: A) => B,
  reader: Reader<R, A>
): Reader<R, B> =>
  (env) => f(reader(env));
```

#### flatMap - 链式组合

```typescript
// Monad: 组合多个 Reader
const flatMap = <R, A, B>(
  f: (a: A) => Reader<R, B>,
  reader: Reader<R, A>
): Reader<R, B> =>
  (env) => {
    const a = reader(env);
    return f(a)(env);
  };
```

### 4. Reader + Task + Either: 终极组合

在真实应用中,我们通常需要:
- **Reader**: 依赖注入
- **Task**: 异步操作
- **Either**: 错误处理

组合后的类型:

```typescript
type ReaderTaskEither<R, E, A> = Reader<R, Task<Either<E, A>>>;
```

这个组合让我们可以:
1. 自动注入依赖 (Reader)
2. 处理异步操作 (Task)
3. 类型安全的错误处理 (Either)

```typescript
// 示例: 完整的用户服务
const getUserWithValidation = (
  id: number
): ReaderTaskEither<Dependencies, Error, User> =>
  pipe(
    validateId(id),           // Either<Error, number>
    map(getUser),             // Reader<Deps, Task<Either<Error, User>>>
    flatMap(enrichUserData),  // 添加额外数据
    map(logResult)            // 记录结果
  );
```

### 5. 实际应用场景

#### 场景 1: Web API 服务

```typescript
interface ApiDependencies {
  database: Database;
  cache: Cache;
  logger: Logger;
  config: Config;
}

// 所有路由处理器都是 Reader
type ApiHandler<A> = Reader<ApiDependencies, Response<A>>;

const getUserHandler = (req: Request): ApiHandler<User> => {
  // 自动获得所有依赖
};
```

#### 场景 2: 测试环境切换

```typescript
// 生产环境依赖
const prodDeps: Dependencies = {
  db: new PostgresDB(),
  logger: new CloudLogger(),
};

// 测试环境依赖
const testDeps: Dependencies = {
  db: new InMemoryDB(),
  logger: new NoOpLogger(),
};

// 同一份代码,不同环境
const result = myApp(prodDeps);  // 生产
const testResult = myApp(testDeps);  // 测试
```

#### 场景 3: 配置管理

```typescript
// 根据环境自动调整行为
const sendEmail: Reader<Config, Task<void>> = pipe(
  ask<Config>(),
  map(config => 
    config.env === 'production' 
      ? sendRealEmail 
      : logEmailToConsole
  )
);
```

## 🎓 本章内容

1. **01-reader-monad.ts** - Reader Monad 完整实现
   - 从零实现 Reader<R, A>
   - ask、local、map、flatMap 等操作
   - 实际业务示例

2. **02-dependency-injection.ts** - 依赖注入对比
   - OOP DI 容器示例
   - FP Reader 实现
   - 优缺点对比分析

3. **03-reader-task-either.ts** - Monad 栈组合
   - ReaderTaskEither 实现
   - 完整的 Web 服务示例
   - 错误处理 + 异步 + 依赖注入

4. **04-exercises.ts** - 实战练习
   - 构建配置管理系统
   - 实现多租户应用
   - 创建可测试的业务逻辑

## 💡 学习建议

1. **先理解问题**: 体会依赖传递的痛点
2. **从简单开始**: 先掌握基础的 Reader 操作
3. **逐步组合**: 理解如何组合 Reader + Task + Either
4. **实际应用**: 在项目中尝试用 Reader 替代 DI 容器
5. **对比思考**: 思考 FP 和 OOP 在依赖管理上的差异

## 🔗 相关章节

- 第六章: Functor 和 Monad - Reader 是 Monad 的实例
- 第七章: IO 和 Effects - Reader 常与 IO 组合使用
- 第五章: Option 和 Either - Reader 常与 Either 组合处理错误

## 📚 延伸阅读

- Reader Monad 的数学基础
- Free Monad 和 Tagless Final
- Effect Systems (ZIO, cats-effect)
- Dependency Injection 的演变历史

---

**下一章**: 第九章 - 递归思维 (Recursive Thinking)
