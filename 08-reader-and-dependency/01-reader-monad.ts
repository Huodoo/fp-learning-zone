/**
 * 第八章第一节: Reader Monad
 * 
 * Reader Monad 是函数式编程中实现依赖注入的核心模式
 * 它将函数的执行环境（依赖）延迟到最后再提供
 * 本质上 Reader<R, A> 就是一个函数 R => A
 * 
 * 核心思想：让函数组合时不用关心依赖从哪来，只需要声明需要什么依赖
 */

console.log('=== Reader Monad ===\n');

// ============================================================================
// 1. Reader 类型定义
// ============================================================================

console.log('1. Reader 类型定义\n');

/**
 * Reader<R, A> 表示一个需要环境 R 才能产生结果 A 的计算
 * R: Environment/Context/Dependencies (环境/上下文/依赖)
 * A: 计算结果
 * 
 * 本质就是一个函数: R => A
 */
type Reader<R, A> = (env: R) => A;

console.log('Reader<R, A> 的本质是函数类型: (env: R) => A');
console.log('- R: 依赖/环境/配置');
console.log('- A: 计算结果\n');

// ============================================================================
// 2. Reader 的基础操作
// ============================================================================

console.log('2. Reader 的基础操作\n');

// --- 2.1 of: 将值包装成 Reader ---

/**
 * of (也叫 pure): 将纯值包装成 Reader
 * 创建一个不需要环境就能返回值的 Reader
 */
const of = <R, A>(a: A): Reader<R, A> => 
  (_env: R) => a;

console.log('✅ of: 将值包装成 Reader');
const reader1 = of<any, number>(42);
console.log('of(42)() =>', reader1({}));
console.log('不需要任何环境,直接返回 42\n');

// --- 2.2 ask: 获取环境 ---

/**
 * ask: 获取当前的环境
 * 返回一个 Reader,它会直接返回传入的环境
 */
const ask = <R>(): Reader<R, R> => 
  (env: R) => env;

console.log('✅ ask: 获取环境');
interface Config {
  apiUrl: string;
  timeout: number;
}

const getConfig: Reader<Config, Config> = ask<Config>();
const config: Config = { apiUrl: 'https://api.example.com', timeout: 5000 };
console.log('ask<Config>()({...}) =>', getConfig(config));
console.log();

// --- 2.3 asks: 获取环境的某个字段 ---

/**
 * asks: 从环境中提取特定字段
 * 类似于 ask 但可以对环境进行转换
 */
const asks = <R, A>(f: (env: R) => A): Reader<R, A> => 
  (env: R) => f(env);

console.log('✅ asks: 从环境中提取字段');
const getApiUrl: Reader<Config, string> = asks((config: Config) => config.apiUrl);
console.log('asks(c => c.apiUrl)({...}) =>', getApiUrl(config));
console.log();

// --- 2.4 map: Functor 操作 ---

/**
 * map: 转换 Reader 的返回值
 * 实现 Functor 接口
 */
const map = <R, A, B>(
  f: (a: A) => B
) => (reader: Reader<R, A>): Reader<R, B> =>
  (env: R) => f(reader(env));

console.log('✅ map: 转换 Reader 的结果');
const getTimeoutInSeconds: Reader<Config, number> = 
  map((ms: number) => ms / 1000)(
    asks((c: Config) => c.timeout)
  );
console.log('map(ms => ms/1000)(asks(c => c.timeout)) =>', getTimeoutInSeconds(config));
console.log();

// --- 2.5 flatMap (chain): Monad 操作 ---

/**
 * flatMap (也叫 chain、bind): 链式组合 Reader
 * 实现 Monad 接口
 * 允许后续计算依赖前一个计算的结果
 */
const flatMap = <R, A, B>(
  f: (a: A) => Reader<R, B>
) => (reader: Reader<R, A>): Reader<R, B> =>
  (env: R) => {
    const a = reader(env);  // 先执行第一个 Reader
    return f(a)(env);        // 用结果创建新 Reader 并执行
  };

console.log('✅ flatMap: 链式组合 Reader');

// 示例：根据配置决定使用哪个 API 版本
const getApiVersion: Reader<Config, string> = 
  flatMap((url: string) => {
    if (url.includes('v2')) {
      return of('v2');
    } else {
      return of('v1');
    }
  })(getApiUrl);

console.log('flatMap 组合示例:', getApiVersion(config));
console.log();

// --- 2.6 local: 修改局部环境 ---

/**
 * local: 在子计算中使用修改后的环境
 * 允许临时改变环境而不影响外部
 */
const local = <R, A>(
  f: (r: R) => R
) => (reader: Reader<R, A>): Reader<R, A> =>
  (env: R) => reader(f(env));

console.log('✅ local: 修改局部环境');

interface AppConfig extends Config {
  logLevel: 'debug' | 'info' | 'error';
}

const appConfig: AppConfig = {
  ...config,
  logLevel: 'info'
};

const getLogLevel: Reader<AppConfig, string> = 
  asks((c: AppConfig) => c.logLevel);

// 临时改变日志级别
const withDebugLog: Reader<AppConfig, string> = 
  local((c: AppConfig) => ({ ...c, logLevel: 'debug' as const }))(getLogLevel);

console.log('原始日志级别:', getLogLevel(appConfig));
console.log('临时修改为 debug:', withDebugLog(appConfig));
console.log('外部环境未改变:', getLogLevel(appConfig));
console.log();

// ============================================================================
// 3. 实用工具函数
// ============================================================================

console.log('3. 实用工具函数\n');

/**
 * pipe: 管道组合 Reader
 * 提供更好的链式调用语法
 */
const pipe = <R, A, B, C>(
  reader: Reader<R, A>,
  f1: (r: Reader<R, A>) => Reader<R, B>,
  f2: (r: Reader<R, B>) => Reader<R, C>
): Reader<R, C> => f2(f1(reader));

console.log('✅ pipe: 管道组合');

const getFormattedTimeout: Reader<Config, string> = pipe(
  asks((c: Config) => c.timeout),
  map((ms: number) => ms / 1000),
  map((sec: number) => `${sec}秒`)
);

console.log('pipe 组合:', getFormattedTimeout(config));
console.log();

// ============================================================================
// 4. 实战示例：数据库服务
// ============================================================================

console.log('4. 实战示例：数据库服务\n');

// --- 定义依赖接口 ---

interface Database {
  query: (sql: string) => Promise<any[]>;
}

interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
}

interface Cache {
  get: (key: string) => Promise<any | null>;
  set: (key: string, value: any) => Promise<void>;
}

interface Dependencies {
  db: Database;
  logger: Logger;
  cache: Cache;
}

// --- 实现具体依赖（模拟） ---

const mockDatabase: Database = {
  query: async (sql: string) => {
    console.log(`  [DB] 执行查询: ${sql}`);
    return [{ id: 1, name: '张三', email: 'zhang@example.com' }];
  }
};

const mockLogger: Logger = {
  log: (msg: string) => console.log(`  [LOG] ${msg}`),
  error: (msg: string) => console.error(`  [ERROR] ${msg}`)
};

const mockCache: Cache = {
  get: async (key: string) => {
    console.log(`  [CACHE] 获取: ${key}`);
    return null;  // 模拟缓存未命中
  },
  set: async (key: string, value: any) => {
    console.log(`  [CACHE] 设置: ${key} =>`, value);
  }
};

const deps: Dependencies = {
  db: mockDatabase,
  logger: mockLogger,
  cache: mockCache
};

// --- 使用 Reader 构建服务 ---

/**
 * 从数据库获取用户
 * 注意：返回的是 Reader<Dependencies, Promise<User>>
 */
interface User {
  id: number;
  name: string;
  email: string;
}

const getUserFromDB = (id: number): Reader<Dependencies, Promise<User>> =>
  asks(async (deps: Dependencies) => {
    deps.logger.log(`开始获取用户 ${id}`);
    
    // 先查缓存
    const cached = await deps.cache.get(`user:${id}`);
    if (cached) {
      deps.logger.log(`从缓存获取用户 ${id}`);
      return cached;
    }
    
    // 查数据库
    const results = await deps.db.query(`SELECT * FROM users WHERE id = ${id}`);
    if (results.length === 0) {
      throw new Error(`用户 ${id} 不存在`);
    }
    
    const user = results[0] as User;
    
    // 写入缓存
    await deps.cache.set(`user:${id}`, user);
    
    deps.logger.log(`成功获取用户 ${id}`);
    return user;
  });

console.log('示例 1: 使用 Reader 获取用户\n');

// 运行 Reader (提供依赖)
(async () => {
  const user = await getUserFromDB(1)(deps);
  console.log('\n最终结果:', user);
  console.log();
  
  // ========================================================================
  // 5. Reader 组合：构建复杂业务逻辑
  // ========================================================================
  
  console.log('\n5. Reader 组合：构建复杂业务逻辑\n');
  
  /**
   * 获取用户列表
   */
  const getUserList = (ids: number[]): Reader<Dependencies, Promise<User[]>> =>
    asks(async (deps: Dependencies) => {
      deps.logger.log(`获取用户列表: [${ids.join(', ')}]`);
      
      // 并行获取所有用户
      const users = await Promise.all(
        ids.map(id => getUserFromDB(id)(deps))
      );
      
      return users;
    });
  
  /**
   * 格式化用户信息
   */
  const formatUser = (user: User): Reader<Dependencies, string> =>
    asks((deps: Dependencies) => {
      deps.logger.log(`格式化用户信息: ${user.name}`);
      return `用户 #${user.id}: ${user.name} (${user.email})`;
    });
  
  console.log('示例 2: 组合多个 Reader 操作\n');
  
  const users = await getUserList([1])(deps);
  console.log('\n获取到的用户:', users);
  
  const formatted = users.map(u => formatUser(u)(deps));
  console.log('格式化后:', formatted);
  console.log();
  
  // ========================================================================
  // 6. 测试的优势：轻松切换依赖
  // ========================================================================
  
  console.log('\n6. 测试的优势：轻松切换依赖\n');
  
  // 创建测试用的依赖
  const testDeps: Dependencies = {
    db: {
      query: async (sql: string) => {
        return [{ id: 999, name: '测试用户', email: 'test@example.com' }];
      }
    },
    logger: {
      log: () => {},  // 测试时不输出日志
      error: () => {}
    },
    cache: {
      get: async () => null,
      set: async () => {}
    }
  };
  
  console.log('使用测试依赖:');
  const testUser = await getUserFromDB(999)(testDeps);
  console.log('测试结果:', testUser);
  console.log();
  
  // ========================================================================
  // 7. 实际场景：配置驱动行为
  // ========================================================================
  
  console.log('\n7. 实际场景：配置驱动行为\n');
  
  interface EmailConfig {
    smtp: string;
    from: string;
    enabled: boolean;
  }
  
  interface AppDeps {
    emailConfig: EmailConfig;
    logger: Logger;
  }
  
  /**
   * 发送邮件（根据配置决定是否真的发送）
   */
  const sendEmail = (to: string, subject: string, body: string): Reader<AppDeps, void> =>
    (deps: AppDeps) => {
      if (deps.emailConfig.enabled) {
        deps.logger.log(`📧 发送邮件到 ${to}`);
        deps.logger.log(`  主题: ${subject}`);
        deps.logger.log(`  内容: ${body}`);
        // 实际发送逻辑...
      } else {
        deps.logger.log(`📧 [模拟] 邮件到 ${to}: ${subject}`);
      }
    };
  
  // 生产环境配置
  const prodAppDeps: AppDeps = {
    emailConfig: { smtp: 'smtp.gmail.com', from: 'noreply@app.com', enabled: true },
    logger: mockLogger
  };
  
  // 开发环境配置
  const devAppDeps: AppDeps = {
    emailConfig: { smtp: '', from: '', enabled: false },
    logger: mockLogger
  };
  
  console.log('生产环境发送邮件:');
  sendEmail('user@example.com', '欢迎', '欢迎使用我们的服务！')(prodAppDeps);
  
  console.log('\n开发环境发送邮件:');
  sendEmail('user@example.com', '欢迎', '欢迎使用我们的服务！')(devAppDeps);
  console.log();
  
  // ========================================================================
  // 总结
  // ========================================================================
  
  console.log('\n=== 总结 ===\n');
  console.log('✅ Reader Monad 的核心概念:');
  console.log('  1. Reader<R, A> 本质是函数 R => A');
  console.log('  2. 延迟注入依赖,让函数组合更纯粹');
  console.log('  3. 通过 map、flatMap 实现 Functor 和 Monad');
  console.log('  4. 通过 ask、asks、local 操作环境');
  console.log();
  console.log('✅ Reader 的优势:');
  console.log('  1. 类型安全的依赖注入');
  console.log('  2. 易于测试（切换依赖很简单）');
  console.log('  3. 纯函数式（无副作用）');
  console.log('  4. 组合性强（可与其他 Monad 组合）');
  console.log();
  console.log('✅ 适用场景:');
  console.log('  1. 需要依赖注入的应用程序');
  console.log('  2. 配置驱动的行为');
  console.log('  3. 需要灵活切换环境（开发/测试/生产）');
  console.log('  4. 构建可测试的业务逻辑');
})();
