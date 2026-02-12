/**
 * 第八章第三节: ReaderTaskEither - 终极 Monad 栈
 * 
 * 在真实应用中，我们需要同时处理：
 * 1. Reader - 依赖注入
 * 2. Task - 异步操作
 * 3. Either - 错误处理
 * 
 * ReaderTaskEither 将三者组合，提供完整的应用架构基础
 * 
 * 类型：ReaderTaskEither<R, E, A> = Reader<R, Task<Either<E, A>>>
 * 即：(env: R) => Promise<Either<E, A>>
 */

console.log('=== ReaderTaskEither: 终极 Monad 栈 ===\n');

// ============================================================================
// 1. 基础类型定义
// ============================================================================

console.log('1. 基础类型定义\n');

// --- Either: 错误处理 ---

type Either<E, A> = Left<E> | Right<A>;

interface Left<E> {
  readonly _tag: 'Left';
  readonly left: E;
}

interface Right<A> {
  readonly _tag: 'Right';
  readonly right: A;
}

const Left = <E, A = never>(left: E): Either<E, A> => ({
  _tag: 'Left',
  left
});

const Right = <A, E = never>(right: A): Either<E, A> => ({
  _tag: 'Right',
  right
});

const isLeft = <E, A>(either: Either<E, A>): either is Left<E> =>
  either._tag === 'Left';

const isRight = <E, A>(either: Either<E, A>): either is Right<A> =>
  either._tag === 'Right';

// --- Task: 异步操作 ---

/**
 * Task<A> 表示一个异步计算，总是成功返回 A
 * 本质是 () => Promise<A>
 */
type Task<A> = () => Promise<A>;

// --- TaskEither: Task + Either ---

/**
 * TaskEither<E, A> 表示一个可能失败的异步计算
 * 本质是 () => Promise<Either<E, A>>
 */
type TaskEither<E, A> = Task<Either<E, A>>;

// --- Reader ---

/**
 * Reader<R, A> 表示需要环境 R 的计算
 * 本质是 (env: R) => A
 */
type Reader<R, A> = (env: R) => A;

// --- ReaderTaskEither: 三者组合 ---

/**
 * ReaderTaskEither<R, E, A> 表示：
 * - 需要依赖 R
 * - 执行异步操作
 * - 可能失败返回 E
 * - 成功返回 A
 * 
 * 本质是 (env: R) => Promise<Either<E, A>>
 */
type ReaderTaskEither<R, E, A> = Reader<R, TaskEither<E, A>>;

console.log('✅ ReaderTaskEither<R, E, A> = (env: R) => Promise<Either<E, A>>');
console.log('  R: 依赖/环境');
console.log('  E: 错误类型');
console.log('  A: 成功结果\n');

// ============================================================================
// 2. ReaderTaskEither 的基本操作
// ============================================================================

console.log('2. ReaderTaskEither 的基本操作\n');

// --- 构造函数 ---

/**
 * of: 将值包装成 ReaderTaskEither
 */
const of = <R, E, A>(a: A): ReaderTaskEither<R, E, A> =>
  (_env: R) => async () => Right(a);

/**
 * left: 创建失败的 ReaderTaskEither
 */
const left = <R, E, A>(e: E): ReaderTaskEither<R, E, A> =>
  (_env: R) => async () => Left(e);

/**
 * ask: 获取环境
 */
const ask = <R, E>(): ReaderTaskEither<R, E, R> =>
  (env: R) => async () => Right(env);

/**
 * asks: 从环境中提取值
 */
const asks = <R, E, A>(f: (env: R) => A): ReaderTaskEither<R, E, A> =>
  (env: R) => async () => Right(f(env));

// --- map: Functor ---

/**
 * map: 转换成功的值
 */
const map = <R, E, A, B>(
  f: (a: A) => B
) => (rte: ReaderTaskEither<R, E, A>): ReaderTaskEither<R, E, B> =>
  (env: R) => async () => {
    const either = await rte(env)();
    if (isRight(either)) {
      return Right(f(either.right));
    }
    return either;
  };

// --- flatMap: Monad ---

/**
 * flatMap: 链式组合 ReaderTaskEither
 */
const flatMap = <R, E, A, B>(
  f: (a: A) => ReaderTaskEither<R, E, B>
) => (rte: ReaderTaskEither<R, E, A>): ReaderTaskEither<R, E, B> =>
  (env: R) => async () => {
    const either = await rte(env)();
    if (isRight(either)) {
      return await f(either.right)(env)();
    }
    return either;
  };

// --- mapLeft: 转换错误 ---

/**
 * mapLeft: 转换错误值
 */
const mapLeft = <R, E, E2, A>(
  f: (e: E) => E2
) => (rte: ReaderTaskEither<R, E, A>): ReaderTaskEither<R, E2, A> =>
  (env: R) => async () => {
    const either = await rte(env)();
    if (isLeft(either)) {
      return Left(f(either.left));
    }
    return either;
  };

// --- tryCatch: 捕获异常 ---

/**
 * tryCatch: 将可能抛出异常的函数转换为 ReaderTaskEither
 */
const tryCatch = <R, E, A>(
  f: (env: R) => Promise<A>,
  onError: (error: unknown) => E
): ReaderTaskEither<R, E, A> =>
  (env: R) => async () => {
    try {
      const result = await f(env);
      return Right(result);
    } catch (error) {
      return Left(onError(error));
    }
  };

console.log('✅ 核心操作实现完成\n');

// ============================================================================
// 3. 实战示例：用户注册系统
// ============================================================================

console.log('3. 实战示例：用户注册系统\n');

// --- 定义领域类型 ---

interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface NewUser {
  username: string;
  email: string;
  password: string;
}

// --- 定义错误类型 ---

type AppError =
  | { type: 'ValidationError'; message: string }
  | { type: 'DatabaseError'; message: string }
  | { type: 'EmailError'; message: string }
  | { type: 'DuplicateUser'; username: string };

// --- 定义依赖 ---

interface AppDependencies {
  db: {
    userExists: (username: string) => Promise<boolean>;
    createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  };
  emailService: {
    sendWelcomeEmail: (email: string, username: string) => Promise<void>;
  };
  hashService: {
    hash: (password: string) => Promise<string>;
  };
  logger: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
}

// --- 业务逻辑函数 ---

/**
 * 验证用户输入
 */
const validateUser = (
  userData: NewUser
): ReaderTaskEither<AppDependencies, AppError, NewUser> =>
  (deps: AppDependencies) => async () => {
    deps.logger.info(`验证用户输入: ${userData.username}`);
    
    // 验证用户名
    if (userData.username.length < 3) {
      return Left({
        type: 'ValidationError',
        message: '用户名至少 3 个字符'
      });
    }
    
    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return Left({
        type: 'ValidationError',
        message: '邮箱格式无效'
      });
    }
    
    // 验证密码
    if (userData.password.length < 6) {
      return Left({
        type: 'ValidationError',
        message: '密码至少 6 个字符'
      });
    }
    
    deps.logger.info('验证通过');
    return Right(userData);
  };

/**
 * 检查用户名是否已存在
 */
const checkUserExists = (
  userData: NewUser
): ReaderTaskEither<AppDependencies, AppError, NewUser> =>
  tryCatch(
    async (deps: AppDependencies) => {
      deps.logger.info(`检查用户是否存在: ${userData.username}`);
      const exists = await deps.db.userExists(userData.username);
      
      if (exists) {
        throw new Error(`用户已存在: ${userData.username}`);
      }
      
      return userData;
    },
    (error) => {
      if (error instanceof Error && error.message.includes('用户已存在')) {
        return { type: 'DuplicateUser', username: userData.username };
      }
      return { type: 'DatabaseError', message: String(error) };
    }
  );

/**
 * 哈希密码
 */
const hashPassword = (
  userData: NewUser
): ReaderTaskEither<AppDependencies, AppError, Omit<User, 'id' | 'createdAt'>> =>
  tryCatch(
    async (deps: AppDependencies) => {
      deps.logger.info('哈希密码');
      const passwordHash = await deps.hashService.hash(userData.password);
      
      return {
        username: userData.username,
        email: userData.email,
        passwordHash
      };
    },
    (error) => ({
      type: 'DatabaseError',
      message: `密码哈希失败: ${error}`
    })
  );

/**
 * 保存用户到数据库
 */
const saveUser = (
  userData: Omit<User, 'id' | 'createdAt'>
): ReaderTaskEither<AppDependencies, AppError, User> =>
  tryCatch(
    async (deps: AppDependencies) => {
      deps.logger.info(`保存用户: ${userData.username}`);
      const user = await deps.db.createUser(userData);
      deps.logger.info(`用户创建成功，ID: ${user.id}`);
      return user;
    },
    (error) => ({
      type: 'DatabaseError',
      message: `保存用户失败: ${error}`
    })
  );

/**
 * 发送欢迎邮件
 */
const sendWelcomeEmail = (
  user: User
): ReaderTaskEither<AppDependencies, AppError, User> =>
  tryCatch(
    async (deps: AppDependencies) => {
      deps.logger.info(`发送欢迎邮件到: ${user.email}`);
      await deps.emailService.sendWelcomeEmail(user.email, user.username);
      return user;
    },
    (error) => ({
      type: 'EmailError',
      message: `发送邮件失败: ${error}`
    })
  );

// --- 组合完整流程 ---

/**
 * 注册用户：完整的业务流程
 * 使用 ReaderTaskEither 组合所有步骤
 */
const registerUser = (
  userData: NewUser
): ReaderTaskEither<AppDependencies, AppError, User> => {
  // 使用函数组合串联所有步骤
  let rte: ReaderTaskEither<AppDependencies, AppError, any> = validateUser(userData);
  
  rte = flatMap((_: NewUser) => checkUserExists(userData))(rte);
  rte = flatMap((_: NewUser) => hashPassword(userData))(rte);
  rte = flatMap((hashed: Omit<User, 'id' | 'createdAt'>) => saveUser(hashed))(rte);
  rte = flatMap((user: User) => sendWelcomeEmail(user))(rte);
  
  return rte as ReaderTaskEither<AppDependencies, AppError, User>;
};

// --- 创建模拟依赖 ---

const mockDeps: AppDependencies = {
  db: {
    userExists: async (username: string) => {
      console.log(`  [DB] 检查用户是否存在: ${username}`);
      return username === 'admin';  // admin 已存在
    },
    createUser: async (userData) => {
      console.log(`  [DB] 创建用户:`, userData);
      return {
        id: Math.floor(Math.random() * 1000),
        ...userData,
        createdAt: new Date()
      };
    }
  },
  emailService: {
    sendWelcomeEmail: async (email, username) => {
      console.log(`  [EMAIL] 发送欢迎邮件到 ${email}`);
      console.log(`    你好 ${username}，欢迎加入！`);
    }
  },
  hashService: {
    hash: async (password) => {
      console.log(`  [HASH] 哈希密码`);
      return `hashed_${password}`;
    }
  },
  logger: {
    info: (msg) => console.log(`  [INFO] ${msg}`),
    error: (msg) => console.error(`  [ERROR] ${msg}`)
  }
};

// --- 运行示例 ---

(async () => {
  console.log('=== 示例 1: 成功注册 ===\n');
  
  const result1 = await registerUser({
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    password: 'password123'
  })(mockDeps)();
  
  if (isRight(result1)) {
    console.log('\n✅ 注册成功:', result1.right);
  } else {
    console.log('\n❌ 注册失败:', result1.left);
  }
  
  console.log('\n=== 示例 2: 用户名已存在 ===\n');
  
  const result2 = await registerUser({
    username: 'admin',
    email: 'admin@example.com',
    password: 'password123'
  })(mockDeps)();
  
  if (isRight(result2)) {
    console.log('\n✅ 注册成功:', result2.right);
  } else {
    console.log('\n❌ 注册失败:', result2.left);
  }
  
  console.log('\n=== 示例 3: 验证失败 ===\n');
  
  const result3 = await registerUser({
    username: 'ab',  // 太短
    email: 'invalid-email',  // 邮箱无效
    password: '123'  // 密码太短
  })(mockDeps)();
  
  if (isRight(result3)) {
    console.log('\n✅ 注册成功:', result3.right);
  } else {
    console.log('\n❌ 注册失败:', result3.left);
  }
  
  // ==========================================================================
  // 4. 错误处理和恢复
  // ==========================================================================
  
  console.log('\n\n4. 错误处理和恢复\n');
  
  /**
   * orElse: 提供错误恢复逻辑
   */
  const orElse = <R, E, E2, A>(
    f: (e: E) => ReaderTaskEither<R, E2, A>
  ) => (rte: ReaderTaskEither<R, E, A>): ReaderTaskEither<R, E2, A> =>
    (env: R) => async () => {
      const either = await rte(env)();
      if (isLeft(either)) {
        return await f(either.left)(env)();
      }
      return either;
    };
  
  /**
   * fold: 处理两种情况
   */
  const fold = <R, E, A, B>(
    onLeft: (e: E) => ReaderTaskEither<R, never, B>,
    onRight: (a: A) => ReaderTaskEither<R, never, B>
  ) => (rte: ReaderTaskEither<R, E, A>): ReaderTaskEither<R, never, B> =>
    (env: R) => async () => {
      const either = await rte(env)();
      if (isLeft(either)) {
        return await onLeft(either.left)(env)();
      }
      return await onRight(either.right)(env)();
    };
  
  // 带错误恢复的注册
  const registerUserWithFallback = (userData: NewUser) =>
    fold<AppDependencies, AppError, User, string>(
      (error: AppError) => {
        // 错误处理
        return (deps: AppDependencies) => async () => {
          deps.logger.error(`注册失败: ${JSON.stringify(error)}`);
          
          if (error.type === 'DuplicateUser') {
            return Right(`用户名 ${error.username} 已被占用，请换一个`);
          }
          
          return Right(`注册失败: ${error.message}`);
        };
      },
      (user: User) => {
        // 成功处理
        return (deps: AppDependencies) => async () => {
          deps.logger.info(`用户 ${user.username} 注册成功！`);
          return Right(`欢迎 ${user.username}！您的 ID 是 ${user.id}`);
        };
      }
    )(registerUser(userData));
  
  console.log('=== 带错误恢复的注册 ===\n');
  
  const result4 = await registerUserWithFallback({
    username: 'admin',
    email: 'admin@example.com',
    password: 'password123'
  })(mockDeps)();
  
  console.log('\n结果:', isRight(result4) ? result4.right : result4.left);
  
  // ==========================================================================
  // 总结
  // ==========================================================================
  
  console.log('\n\n=== 总结 ===\n');
  console.log('✅ ReaderTaskEither 的优势:');
  console.log('  1. 三位一体: 依赖注入 + 异步 + 错误处理');
  console.log('  2. 类型安全: 编译时检查所有可能的错误');
  console.log('  3. 可组合: 轻松组合复杂的业务流程');
  console.log('  4. 可测试: 依赖注入使测试变简单');
  console.log('  5. Railway Oriented: 错误自动短路');
  console.log();
  console.log('✅ 适用场景:');
  console.log('  1. Web API 服务');
  console.log('  2. 微服务应用');
  console.log('  3. 需要严格错误处理的系统');
  console.log('  4. 复杂的业务流程编排');
  console.log();
  console.log('💡 学习路径:');
  console.log('  Either → Task → Reader → ReaderTaskEither');
  console.log('  逐步理解每一层的作用，最后组合使用');
})();
