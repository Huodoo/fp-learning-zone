/**
 * 第八章第二节: 依赖注入 - OOP vs FP
 * 
 * 对比 OOP 的依赖注入容器 (DI Container) 和函数式的 Reader Monad
 * 展示两种范式在解决依赖管理问题上的不同思路
 * 
 * OOP: 通过容器管理对象生命周期和依赖关系
 * FP: 通过函数组合和延迟求值管理依赖
 */

console.log('=== 依赖注入: OOP vs FP ===\n');

// ============================================================================
// 场景：构建一个用户管理系统
// 需要：数据库、日志、缓存、邮件服务
// ============================================================================

// --- 共享的接口定义 ---

interface IDatabase {
  query<T>(sql: string, params: any[]): Promise<T[]>;
  execute(sql: string, params: any[]): Promise<void>;
}

interface ILogger {
  debug(message: string): void;
  info(message: string): void;
  error(message: string): void;
}

interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// ============================================================================
// 第一部分：OOP 方式 - 使用依赖注入容器
// ============================================================================

console.log('第一部分：OOP 方式 - 使用依赖注入容器\n');

/**
 * 简化的 DI 容器实现
 * 实际项目中会使用 InversifyJS、TSyringe 等成熟框架
 */
class DIContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  /**
   * 注册单例服务
   */
  registerSingleton<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }
  
  /**
   * 注册工厂函数
   */
  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }
  
  /**
   * 获取服务实例
   */
  get<T>(key: string): T {
    // 先检查是否已经创建
    if (this.services.has(key)) {
      return this.services.get(key);
    }
    
    // 使用工厂创建
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.services.set(key, instance);  // 缓存实例
      return instance;
    }
    
    throw new Error(`服务 "${key}" 未注册`);
  }
}

/**
 * OOP 风格的 UserService
 * 使用构造函数注入依赖
 */
class UserService {
  constructor(
    private db: IDatabase,
    private logger: ILogger,
    private cache: ICache,
    private emailService: IEmailService
  ) {}
  
  async getUser(id: number): Promise<User | null> {
    this.logger.info(`获取用户 ${id}`);
    
    // 检查缓存
    const cacheKey = `user:${id}`;
    const cached = await this.cache.get<User>(cacheKey);
    
    if (cached) {
      this.logger.debug(`从缓存获取用户 ${id}`);
      return cached;
    }
    
    // 查询数据库
    const results = await this.db.query<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (results.length === 0) {
      this.logger.info(`用户 ${id} 不存在`);
      return null;
    }
    
    const user = results[0];
    
    // 写入缓存
    await this.cache.set(cacheKey, user, 3600);
    
    return user;
  }
  
  async createUser(name: string, email: string): Promise<User> {
    this.logger.info(`创建用户: ${name}`);
    
    // 插入数据库
    await this.db.execute(
      'INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)',
      [name, email, new Date()]
    );
    
    // 查询新创建的用户
    const results = await this.db.query<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    const user = results[0];
    
    // 发送欢迎邮件
    await this.emailService.sendEmail(
      user.email,
      '欢迎加入',
      `你好 ${user.name}，欢迎加入我们的平台！`
    );
    
    this.logger.info(`用户创建成功: ${user.id}`);
    
    return user;
  }
}

// --- 实现具体的服务（模拟） ---

class MockDatabase implements IDatabase {
  private users = new Map<number, User>([
    [1, { id: 1, name: '张三', email: 'zhang@example.com', createdAt: new Date() }]
  ]);
  
  async query<T>(sql: string, params: any[]): Promise<T[]> {
    console.log(`  [数据库] 查询: ${sql.substring(0, 50)}...`);
    
    if (sql.includes('WHERE id')) {
      const id = params[0] as number;
      const user = this.users.get(id);
      return user ? [user as any] : [];
    }
    
    if (sql.includes('WHERE email')) {
      const email = params[0] as string;
      const user = Array.from(this.users.values()).find(u => u.email === email);
      return user ? [user as any] : [];
    }
    
    return [];
  }
  
  async execute(sql: string, params: any[]): Promise<void> {
    console.log(`  [数据库] 执行: ${sql.substring(0, 50)}...`);
    
    if (sql.includes('INSERT')) {
      const [name, email] = params;
      const id = this.users.size + 1;
      this.users.set(id, {
        id,
        name: name as string,
        email: email as string,
        createdAt: new Date()
      });
    }
  }
}

class ConsoleLogger implements ILogger {
  debug(message: string): void {
    console.log(`  [DEBUG] ${message}`);
  }
  
  info(message: string): void {
    console.log(`  [INFO] ${message}`);
  }
  
  error(message: string): void {
    console.error(`  [ERROR] ${message}`);
  }
}

class InMemoryCache implements ICache {
  private cache = new Map<string, any>();
  
  async get<T>(key: string): Promise<T | null> {
    console.log(`  [缓存] 读取: ${key}`);
    return this.cache.get(key) ?? null;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    console.log(`  [缓存] 写入: ${key} (TTL: ${ttl}s)`);
    this.cache.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    console.log(`  [缓存] 删除: ${key}`);
    this.cache.delete(key);
  }
}

class MockEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`  [邮件] 发送到 ${to}`);
    console.log(`    主题: ${subject}`);
    console.log(`    内容: ${body.substring(0, 50)}...`);
  }
}

// --- 配置 DI 容器 ---

console.log('配置 OOP DI 容器:\n');

const container = new DIContainer();

// 注册服务
container.registerSingleton<IDatabase>('IDatabase', new MockDatabase());
container.registerSingleton<ILogger>('ILogger', new ConsoleLogger());
container.registerSingleton<ICache>('ICache', new InMemoryCache());
container.registerSingleton<IEmailService>('IEmailService', new MockEmailService());

// 注册 UserService (依赖其他服务)
container.registerFactory<UserService>('UserService', () => {
  return new UserService(
    container.get<IDatabase>('IDatabase'),
    container.get<ILogger>('ILogger'),
    container.get<ICache>('ICache'),
    container.get<IEmailService>('IEmailService')
  );
});

console.log('✅ DI 容器配置完成\n');

// --- 使用 UserService ---

(async () => {
  console.log('=== OOP 方式使用示例 ===\n');
  
  const userService = container.get<UserService>('UserService');
  
  console.log('示例 1: 获取用户\n');
  const user = await userService.getUser(1);
  console.log('结果:', user);
  
  console.log('\n示例 2: 创建用户\n');
  const newUser = await userService.createUser('李四', 'lisi@example.com');
  console.log('结果:', newUser);
  
  console.log('\n--- OOP 方式的特点 ---');
  console.log('✅ 优点:');
  console.log('  - 熟悉的面向对象模式');
  console.log('  - 框架支持成熟 (InversifyJS, TSyringe)');
  console.log('  - 自动管理对象生命周期');
  console.log();
  console.log('❌ 缺点:');
  console.log('  - 容器配置复杂（字符串 key，易出错）');
  console.log('  - 类型安全性弱（运行时才知道依赖是否满足）');
  console.log('  - 测试需要 mock 整个容器');
  console.log('  - 隐式依赖（不看代码不知道需要什么）');
  console.log('  - 有运行时开销（查找、反射）');
  console.log();
  
  // ==========================================================================
  // 第二部分：FP 方式 - 使用 Reader Monad
  // ==========================================================================
  
  console.log('\n第二部分：FP 方式 - 使用 Reader Monad\n');
  
  // --- Reader 类型定义 ---
  
  type Reader<R, A> = (env: R) => A;
  
  // Reader 操作
  const of = <R, A>(a: A): Reader<R, A> => 
    (_env: R) => a;
  
  const ask = <R>(): Reader<R, R> => 
    (env: R) => env;
  
  const asks = <R, A>(f: (env: R) => A): Reader<R, A> => 
    (env: R) => f(env);
  
  const map = <R, A, B>(
    f: (a: A) => B
  ) => (reader: Reader<R, A>): Reader<R, B> =>
    (env: R) => f(reader(env));
  
  const flatMap = <R, A, B>(
    f: (a: A) => Reader<R, B>
  ) => (reader: Reader<R, A>): Reader<R, B> =>
    (env: R) => {
      const a = reader(env);
      return f(a)(env);
    };
  
  // --- 定义依赖环境 ---
  
  interface Dependencies {
    db: IDatabase;
    logger: ILogger;
    cache: ICache;
    emailService: IEmailService;
  }
  
  // --- FP 风格的用户服务函数 ---
  
  /**
   * 获取用户 (FP 版本)
   * 返回 Reader，延迟到最后才注入依赖
   */
  const getUserFP = (id: number): Reader<Dependencies, Promise<User | null>> =>
    asks(async (deps: Dependencies) => {
      deps.logger.info(`获取用户 ${id}`);
      
      // 检查缓存
      const cacheKey = `user:${id}`;
      const cached = await deps.cache.get<User>(cacheKey);
      
      if (cached) {
        deps.logger.debug(`从缓存获取用户 ${id}`);
        return cached;
      }
      
      // 查询数据库
      const results = await deps.db.query<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      if (results.length === 0) {
        deps.logger.info(`用户 ${id} 不存在`);
        return null;
      }
      
      const user = results[0];
      
      // 写入缓存
      await deps.cache.set(cacheKey, user, 3600);
      
      return user;
    });
  
  /**
   * 创建用户 (FP 版本)
   */
  const createUserFP = (name: string, email: string): Reader<Dependencies, Promise<User>> =>
    asks(async (deps: Dependencies) => {
      deps.logger.info(`创建用户: ${name}`);
      
      // 插入数据库
      await deps.db.execute(
        'INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)',
        [name, email, new Date()]
      );
      
      // 查询新创建的用户
      const results = await deps.db.query<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      const user = results[0];
      
      // 发送欢迎邮件
      await deps.emailService.sendEmail(
        user.email,
        '欢迎加入',
        `你好 ${user.name}，欢迎加入我们的平台！`
      );
      
      deps.logger.info(`用户创建成功: ${user.id}`);
      
      return user;
    });
  
  // --- 创建依赖对象 ---
  
  const deps: Dependencies = {
    db: new MockDatabase(),
    logger: new ConsoleLogger(),
    cache: new InMemoryCache(),
    emailService: new MockEmailService()
  };
  
  // --- 使用函数式服务 ---
  
  console.log('=== FP 方式使用示例 ===\n');
  
  console.log('示例 1: 获取用户\n');
  const userFP = await getUserFP(1)(deps);  // 注意：显式提供依赖
  console.log('结果:', userFP);
  
  console.log('\n示例 2: 创建用户\n');
  const newUserFP = await createUserFP('王五', 'wangwu@example.com')(deps);
  console.log('结果:', newUserFP);
  
  console.log('\n--- FP 方式的特点 ---');
  console.log('✅ 优点:');
  console.log('  - 完全类型安全（编译时检查依赖）');
  console.log('  - 显式依赖（一眼看出需要什么）');
  console.log('  - 测试简单（直接传入 mock 对象）');
  console.log('  - 无运行时开销（纯函数调用）');
  console.log('  - 组合性强（易于扩展）');
  console.log();
  console.log('❌ 缺点:');
  console.log('  - 需要理解 Reader Monad 概念');
  console.log('  - 不如 OOP 模式直观');
  console.log('  - TypeScript 对高阶类型支持有限');
  console.log();
  
  // ==========================================================================
  // 第三部分：测试对比
  // ==========================================================================
  
  console.log('\n第三部分：测试对比\n');
  
  console.log('--- OOP 测试 ---\n');
  
  // OOP: 需要创建新的容器或 mock 容器
  const testContainer = new DIContainer();
  testContainer.registerSingleton<IDatabase>('IDatabase', {
    query: async () => [{ id: 999, name: 'Test User', email: 'test@test.com', createdAt: new Date() }],
    execute: async () => {}
  } as IDatabase);
  testContainer.registerSingleton<ILogger>('ILogger', {
    debug: () => {},
    info: () => {},
    error: () => {}
  } as ILogger);
  testContainer.registerSingleton<ICache>('ICache', {
    get: async () => null,
    set: async () => {},
    delete: async () => {}
  } as ICache);
  testContainer.registerSingleton<IEmailService>('IEmailService', {
    sendEmail: async () => {}
  } as IEmailService);
  testContainer.registerFactory('UserService', () => new UserService(
    testContainer.get('IDatabase'),
    testContainer.get('ILogger'),
    testContainer.get('ICache'),
    testContainer.get('IEmailService')
  ));
  
  const testUserService = testContainer.get<UserService>('UserService');
  const testUserOOP = await testUserService.getUser(999);
  console.log('OOP 测试结果:', testUserOOP);
  
  console.log('\n--- FP 测试 ---\n');
  
  // FP: 直接创建测试依赖对象
  const testDeps: Dependencies = {
    db: {
      query: async () => [{ id: 999, name: 'Test User', email: 'test@test.com', createdAt: new Date() }],
      execute: async () => {}
    } as IDatabase,
    logger: {
      debug: () => {},
      info: () => {},
      error: () => {}
    } as ILogger,
    cache: {
      get: async () => null,
      set: async () => {},
      delete: async () => {}
    } as ICache,
    emailService: {
      sendEmail: async () => {}
    } as IEmailService
  };
  
  const testUserFP = await getUserFP(999)(testDeps);
  console.log('FP 测试结果:', testUserFP);
  
  console.log('\n✅ FP 测试更简单：');
  console.log('  - 不需要容器');
  console.log('  - 直接传入 mock 对象');
  console.log('  - 类型安全');
  console.log('  - 代码更少');
  
  // ==========================================================================
  // 总结
  // ==========================================================================
  
  console.log('\n=== 总结 ===\n');
  console.log('OOP DI 容器 vs FP Reader Monad\n');
  console.log('| 维度         | OOP DI           | FP Reader        |');
  console.log('|--------------|------------------|------------------|');
  console.log('| 类型安全     | ⭐⭐ (运行时)    | ⭐⭐⭐⭐⭐ (编译时) |');
  console.log('| 学习曲线     | ⭐⭐⭐ (框架特定) | ⭐⭐⭐⭐ (通用概念) |');
  console.log('| 测试难度     | ⭐⭐⭐ (需要容器) | ⭐⭐⭐⭐⭐ (直接传参) |');
  console.log('| 性能         | ⭐⭐⭐ (反射开销) | ⭐⭐⭐⭐⭐ (零开销)   |');
  console.log('| 组合性       | ⭐⭐ (继承/装饰)  | ⭐⭐⭐⭐⭐ (函数组合) |');
  console.log('| 生态系统     | ⭐⭐⭐⭐⭐ (成熟)  | ⭐⭐⭐ (新兴)      |');
  console.log();
  console.log('💡 建议:');
  console.log('  - 大型企业项目、团队熟悉 OOP → 使用 DI 容器');
  console.log('  - 追求函数式纯粹性、重视类型安全 → 使用 Reader');
  console.log('  - 可以混合使用：外层用 DI，内层用 Reader');
})();
