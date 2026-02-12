/**
 * 第八章练习: Reader Monad 实战
 * 
 * 通过实际练习掌握 Reader Monad 的使用
 * 涵盖依赖注入、配置管理、多租户应用等场景
 */

console.log('=== Reader Monad 练习 ===\n');

// ============================================================================
// 练习 1: 配置管理系统
// ============================================================================

console.log('练习 1: 配置管理系统\n');
console.log('任务: 实现一个配置管理系统，支持多环境配置切换\n');

// --- 类型定义 ---

type Environment = 'development' | 'staging' | 'production';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface CacheConfig {
  host: string;
  port: number;
  ttl: number;
}

interface AppConfig {
  env: Environment;
  apiBaseUrl: string;
  database: DatabaseConfig;
  cache: CacheConfig;
  enableLogging: boolean;
  enableMetrics: boolean;
}

type Reader<R, A> = (env: R) => A;

// --- Reader 工具函数 ---

const ask = <R>(): Reader<R, R> => (env: R) => env;

const asks = <R, A>(f: (env: R) => A): Reader<R, A> => (env: R) => f(env);

const map = <R, A, B>(f: (a: A) => B) => (reader: Reader<R, A>): Reader<R, B> =>
  (env: R) => f(reader(env));

const flatMap = <R, A, B>(f: (a: A) => Reader<R, B>) => (reader: Reader<R, A>): Reader<R, B> =>
  (env: R) => {
    const a = reader(env);
    return f(a)(env);
  };

// --- 练习 1.1: 实现配置读取函数 ---

/**
 * TODO: 实现 getDatabaseUrl
 * 从配置中生成数据库连接字符串
 * 格式: postgresql://username:password@host:port/database
 */
const getDatabaseUrl: Reader<AppConfig, string> = asks((config: AppConfig) => {
  const { host, port, database, username, password } = config.database;
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
});

/**
 * TODO: 实现 getCacheUrl
 * 从配置中生成缓存连接字符串
 * 格式: redis://host:port
 */
const getCacheUrl: Reader<AppConfig, string> = asks((config: AppConfig) => {
  const { host, port } = config.cache;
  return `redis://${host}:${port}`;
});

/**
 * TODO: 实现 getFullApiUrl
 * 根据环境和路径生成完整的 API URL
 */
const getFullApiUrl = (path: string): Reader<AppConfig, string> =>
  asks((config: AppConfig) => {
    const base = config.apiBaseUrl.replace(/\/$/, '');  // 移除末尾斜杠
    const cleanPath = path.replace(/^\//, '');  // 移除开头斜杠
    return `${base}/${cleanPath}`;
  });

// --- 测试 ---

const devConfig: AppConfig = {
  env: 'development',
  apiBaseUrl: 'http://localhost:3000',
  database: {
    host: 'localhost',
    port: 5432,
    database: 'myapp_dev',
    username: 'dev_user',
    password: 'dev_pass'
  },
  cache: {
    host: 'localhost',
    port: 6379,
    ttl: 300
  },
  enableLogging: true,
  enableMetrics: false
};

const prodConfig: AppConfig = {
  env: 'production',
  apiBaseUrl: 'https://api.myapp.com',
  database: {
    host: 'db.myapp.com',
    port: 5432,
    database: 'myapp_prod',
    username: 'prod_user',
    password: 'prod_pass'
  },
  cache: {
    host: 'cache.myapp.com',
    port: 6379,
    ttl: 3600
  },
  enableLogging: false,
  enableMetrics: true
};

console.log('开发环境配置:');
console.log('  数据库 URL:', getDatabaseUrl(devConfig));
console.log('  缓存 URL:', getCacheUrl(devConfig));
console.log('  API URL:', getFullApiUrl('/users/123')(devConfig));

console.log('\n生产环境配置:');
console.log('  数据库 URL:', getDatabaseUrl(prodConfig));
console.log('  缓存 URL:', getCacheUrl(prodConfig));
console.log('  API URL:', getFullApiUrl('/users/123')(prodConfig));

// --- 练习 1.2: 实现条件日志 ---

/**
 * TODO: 实现 log 函数
 * 根据配置决定是否输出日志
 */
const log = (message: string): Reader<AppConfig, void> =>
  (config: AppConfig) => {
    if (config.enableLogging) {
      console.log(`  [LOG] ${message}`);
    }
  };

/**
 * TODO: 实现 metric 函数
 * 根据配置决定是否记录指标
 */
const metric = (name: string, value: number): Reader<AppConfig, void> =>
  (config: AppConfig) => {
    if (config.enableMetrics) {
      console.log(`  [METRIC] ${name} = ${value}`);
    }
  };

console.log('\n条件日志测试:');
console.log('开发环境 (日志开启，指标关闭):');
log('这是一条日志')(devConfig);
metric('request_count', 100)(devConfig);

console.log('\n生产环境 (日志关闭，指标开启):');
log('这是一条日志')(prodConfig);
metric('request_count', 100)(prodConfig);

console.log();

// ============================================================================
// 练习 2: 多租户应用
// ============================================================================

console.log('\n练习 2: 多租户应用\n');
console.log('任务: 实现一个多租户应用，不同租户有不同的配置和权限\n');

// --- 类型定义 ---

interface Tenant {
  id: string;
  name: string;
  features: Set<string>;  // 启用的功能
  quotas: {
    maxUsers: number;
    maxStorage: number;  // MB
  };
}

interface TenantContext {
  tenant: Tenant;
  userId: string;
}

// --- 租户数据（模拟） ---

const tenants: Record<string, Tenant> = {
  'tenant-free': {
    id: 'tenant-free',
    name: '免费租户',
    features: new Set(['basic-features']),
    quotas: {
      maxUsers: 5,
      maxStorage: 100
    }
  },
  'tenant-pro': {
    id: 'tenant-pro',
    name: '专业租户',
    features: new Set(['basic-features', 'advanced-analytics', 'api-access']),
    quotas: {
      maxUsers: 50,
      maxStorage: 10000
    }
  },
  'tenant-enterprise': {
    id: 'tenant-enterprise',
    name: '企业租户',
    features: new Set(['basic-features', 'advanced-analytics', 'api-access', 'custom-branding', 'sso']),
    quotas: {
      maxUsers: -1,  // 无限制
      maxStorage: -1  // 无限制
    }
  }
};

// --- 练习 2.1: 实现功能检查 ---

/**
 * TODO: 实现 hasFeature
 * 检查当前租户是否启用某个功能
 */
const hasFeature = (feature: string): Reader<TenantContext, boolean> =>
  asks((ctx: TenantContext) => ctx.tenant.features.has(feature));

/**
 * TODO: 实现 requireFeature
 * 要求租户必须有某个功能，否则抛出错误
 */
const requireFeature = (feature: string): Reader<TenantContext, void> =>
  (ctx: TenantContext) => {
    if (!ctx.tenant.features.has(feature)) {
      throw new Error(`租户 ${ctx.tenant.name} 未启用功能: ${feature}`);
    }
  };

/**
 * TODO: 实现 checkQuota
 * 检查是否超出配额
 */
const checkQuota = (type: 'users' | 'storage', value: number): Reader<TenantContext, boolean> =>
  asks((ctx: TenantContext) => {
    const limit = type === 'users' ? ctx.tenant.quotas.maxUsers : ctx.tenant.quotas.maxStorage;
    if (limit === -1) return true;  // 无限制
    return value <= limit;
  });

// --- 练习 2.2: 实现业务逻辑 ---

/**
 * TODO: 实现 createUser
 * 创建用户前检查配额
 */
const createUser = (username: string, currentUserCount: number): Reader<TenantContext, string> =>
  (ctx: TenantContext) => {
    // 检查配额
    const canCreate = checkQuota('users', currentUserCount + 1)(ctx);
    
    if (!canCreate) {
      return `❌ 无法创建用户 ${username}: 已达到用户配额上限 (${ctx.tenant.quotas.maxUsers})`;
    }
    
    return `✅ 用户 ${username} 创建成功 (租户: ${ctx.tenant.name})`;
  };

/**
 * TODO: 实现 useAdvancedAnalytics
 * 使用高级分析功能（需要检查功能权限）
 */
const useAdvancedAnalytics = (query: string): Reader<TenantContext, string> =>
  (ctx: TenantContext) => {
    try {
      requireFeature('advanced-analytics')(ctx);
      return `✅ 执行高级分析: ${query}`;
    } catch (error) {
      if (error instanceof Error) {
        return `❌ ${error.message}`;
      }
      return '❌ 未知错误';
    }
  };

// --- 测试 ---

const freeContext: TenantContext = {
  tenant: tenants['tenant-free'],
  userId: 'user1'
};

const proContext: TenantContext = {
  tenant: tenants['tenant-pro'],
  userId: 'user2'
};

const enterpriseContext: TenantContext = {
  tenant: tenants['tenant-enterprise'],
  userId: 'user3'
};

console.log('免费租户:');
console.log(' ', createUser('alice', 3)(freeContext));
console.log(' ', createUser('bob', 5)(freeContext));  // 超出配额
console.log(' ', useAdvancedAnalytics('SELECT * FROM analytics')(freeContext));

console.log('\n专业租户:');
console.log(' ', createUser('charlie', 3)(proContext));
console.log(' ', createUser('david', 50)(proContext));  // 接近上限
console.log(' ', useAdvancedAnalytics('SELECT * FROM analytics')(proContext));

console.log('\n企业租户:');
console.log(' ', createUser('eve', 1000)(enterpriseContext));  // 无限制
console.log(' ', useAdvancedAnalytics('SELECT * FROM analytics')(enterpriseContext));

console.log();

// ============================================================================
// 练习 3: HTTP 客户端
// ============================================================================

console.log('\n练习 3: HTTP 客户端\n');
console.log('任务: 使用 Reader 实现可配置的 HTTP 客户端\n');

// --- 类型定义 ---

interface HttpConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
  retryAttempts: number;
}

interface HttpResponse {
  status: number;
  body: string;
}

// --- 练习 3.1: 实现 HTTP 请求函数 ---

/**
 * TODO: 实现 buildUrl
 * 构建完整的请求 URL
 */
const buildUrl = (path: string): Reader<HttpConfig, string> =>
  asks((config: HttpConfig) => {
    const base = config.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${base}/${cleanPath}`;
  });

/**
 * TODO: 实现 buildHeaders
 * 构建请求头（合并默认头和自定义头）
 */
const buildHeaders = (customHeaders: Record<string, string>): Reader<HttpConfig, Record<string, string>> =>
  asks((config: HttpConfig) => ({
    ...config.headers,
    ...customHeaders
  }));

/**
 * TODO: 实现 request (模拟)
 * 发送 HTTP 请求
 */
const request = (
  method: string,
  path: string,
  customHeaders: Record<string, string> = {}
): Reader<HttpConfig, HttpResponse> =>
  (config: HttpConfig) => {
    const url = buildUrl(path)(config);
    const headers = buildHeaders(customHeaders)(config);
    
    console.log(`  [HTTP] ${method} ${url}`);
    console.log(`  Headers:`, headers);
    console.log(`  Timeout: ${config.timeout}ms`);
    
    // 模拟响应
    return {
      status: 200,
      body: JSON.stringify({ message: 'Success' })
    };
  };

/**
 * TODO: 实现便捷方法
 */
const get = (path: string): Reader<HttpConfig, HttpResponse> =>
  request('GET', path);

const post = (path: string, headers?: Record<string, string>): Reader<HttpConfig, HttpResponse> =>
  request('POST', path, headers);

// --- 测试 ---

const httpConfig: HttpConfig = {
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/json'
  },
  retryAttempts: 3
};

console.log('HTTP 请求示例:\n');

const response1 = get('/users/123')(httpConfig);
console.log('响应:', response1);

console.log();

const response2 = post('/users', { 'Content-Type': 'application/json' })(httpConfig);
console.log('响应:', response2);

console.log();

// ============================================================================
// 练习 4: 综合应用 - 电商订单系统
// ============================================================================

console.log('\n练习 4: 综合应用 - 电商订单系统\n');
console.log('任务: 实现一个电商订单处理流程，使用 Reader 管理所有依赖\n');

// --- 类型定义 ---

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Order {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface OrderDependencies {
  productService: {
    getProduct: (id: string) => Promise<Product | null>;
    reserveStock: (id: string, quantity: number) => Promise<boolean>;
  };
  paymentService: {
    charge: (userId: string, amount: number) => Promise<boolean>;
  };
  notificationService: {
    sendOrderConfirmation: (userId: string, orderId: string) => Promise<void>;
  };
  logger: {
    log: (message: string) => void;
    error: (message: string) => void;
  };
}

type ReaderAsync<R, A> = Reader<R, Promise<A>>;

// --- 练习 4.1: 实现订单处理函数 ---

/**
 * TODO: 实现 calculateTotal
 * 计算订单总金额
 */
const calculateTotal = (
  items: Array<{ productId: string; quantity: number }>
): ReaderAsync<OrderDependencies, number> =>
  async (deps: OrderDependencies) => {
    deps.logger.log('计算订单总金额');
    
    let total = 0;
    for (const item of items) {
      const product = await deps.productService.getProduct(item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    }
    
    return total;
  };

/**
 * TODO: 实现 reserveProducts
 * 预留商品库存
 */
const reserveProducts = (
  items: Array<{ productId: string; quantity: number }>
): ReaderAsync<OrderDependencies, boolean> =>
  async (deps: OrderDependencies) => {
    deps.logger.log('预留商品库存');
    
    for (const item of items) {
      const success = await deps.productService.reserveStock(item.productId, item.quantity);
      if (!success) {
        deps.logger.error(`商品 ${item.productId} 库存不足`);
        return false;
      }
    }
    
    return true;
  };

/**
 * TODO: 实现 processPayment
 * 处理支付
 */
const processPayment = (
  userId: string,
  amount: number
): ReaderAsync<OrderDependencies, boolean> =>
  async (deps: OrderDependencies) => {
    deps.logger.log(`处理支付: 用户 ${userId}, 金额 ${amount}`);
    
    const success = await deps.paymentService.charge(userId, amount);
    if (!success) {
      deps.logger.error('支付失败');
    }
    
    return success;
  };

/**
 * TODO: 实现 sendConfirmation
 * 发送订单确认
 */
const sendConfirmation = (
  userId: string,
  orderId: string
): ReaderAsync<OrderDependencies, void> =>
  async (deps: OrderDependencies) => {
    deps.logger.log(`发送订单确认: ${orderId}`);
    await deps.notificationService.sendOrderConfirmation(userId, orderId);
  };

/**
 * TODO: 实现完整的订单创建流程
 */
const createOrder = (
  userId: string,
  items: Array<{ productId: string; quantity: number }>
): ReaderAsync<OrderDependencies, Order | null> =>
  async (deps: OrderDependencies) => {
    deps.logger.log(`开始创建订单: 用户 ${userId}`);
    
    // 1. 计算总金额
    const totalAmount = await calculateTotal(items)(deps);
    deps.logger.log(`订单总金额: ${totalAmount}`);
    
    // 2. 预留库存
    const stockReserved = await reserveProducts(items)(deps);
    if (!stockReserved) {
      deps.logger.error('库存预留失败');
      return null;
    }
    
    // 3. 处理支付
    const paymentSuccess = await processPayment(userId, totalAmount)(deps);
    if (!paymentSuccess) {
      deps.logger.error('支付失败');
      // TODO: 释放库存
      return null;
    }
    
    // 4. 创建订单
    const orderId = `order-${Date.now()}`;
    const order: Order = {
      id: orderId,
      userId,
      items,
      totalAmount,
      status: 'confirmed'
    };
    
    // 5. 发送确认
    await sendConfirmation(userId, orderId)(deps);
    
    deps.logger.log(`订单创建成功: ${orderId}`);
    return order;
  };

// --- 创建模拟依赖 ---

const orderDeps: OrderDependencies = {
  productService: {
    getProduct: async (id: string) => {
      console.log(`  [产品服务] 获取产品: ${id}`);
      // 模拟产品数据
      const products: Record<string, Product> = {
        'prod-1': { id: 'prod-1', name: 'iPhone 15', price: 5999, stock: 10 },
        'prod-2': { id: 'prod-2', name: 'MacBook Pro', price: 12999, stock: 5 }
      };
      return products[id] || null;
    },
    reserveStock: async (id: string, quantity: number) => {
      console.log(`  [产品服务] 预留库存: ${id} x ${quantity}`);
      return true;  // 模拟成功
    }
  },
  paymentService: {
    charge: async (userId: string, amount: number) => {
      console.log(`  [支付服务] 扣款: 用户 ${userId}, 金额 ¥${amount}`);
      return true;  // 模拟成功
    }
  },
  notificationService: {
    sendOrderConfirmation: async (userId: string, orderId: string) => {
      console.log(`  [通知服务] 发送确认邮件: 订单 ${orderId}`);
    }
  },
  logger: {
    log: (msg) => console.log(`  [LOG] ${msg}`),
    error: (msg) => console.error(`  [ERROR] ${msg}`)
  }
};

// --- 测试 ---

(async () => {
  console.log('创建订单示例:\n');
  
  const order = await createOrder('user-123', [
    { productId: 'prod-1', quantity: 2 },
    { productId: 'prod-2', quantity: 1 }
  ])(orderDeps);
  
  console.log('\n最终订单:', order);
  
  // ==========================================================================
  // 总结
  // ==========================================================================
  
  console.log('\n\n=== 练习总结 ===\n');
  console.log('✅ 通过这些练习，你应该掌握了:');
  console.log('  1. 使用 Reader 管理配置');
  console.log('  2. 实现多租户应用的权限控制');
  console.log('  3. 构建可配置的 HTTP 客户端');
  console.log('  4. 组合多个 Reader 实现复杂业务流程');
  console.log();
  console.log('💡 关键要点:');
  console.log('  1. Reader 让依赖变得显式和可测试');
  console.log('  2. 配置驱动的行为非常适合用 Reader');
  console.log('  3. Reader 可以很好地组合，避免重复传参');
  console.log('  4. 结合 async/await 处理异步场景');
  console.log();
  console.log('🚀 下一步:');
  console.log('  - 尝试在实际项目中使用 Reader');
  console.log('  - 探索 ReaderTaskEither 的更多场景');
  console.log('  - 学习其他 Monad (State, Writer 等)');
})();
