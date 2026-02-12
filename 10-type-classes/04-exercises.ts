/**
 * 第十章第四节：类型类实战练习
 * 
 * 本文件包含类型类的实际应用练习
 * 涵盖表单验证、数据聚合、配置合并等场景
 */

console.log('=== 类型类实战练习 ===\n');

// ============================================================================
// 基础类型定义
// ============================================================================

interface Semigroup<T> {
  concat: (a: T, b: T) => T;
}

interface Monoid<T> extends Semigroup<T> {
  empty: T;
}

type Option<T> = 
  | { _tag: 'Some'; value: T }
  | { _tag: 'None' };

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None = <T>(): Option<T> => ({ _tag: 'None' });

type Either<L, R> = 
  | { _tag: 'Left'; left: L }
  | { _tag: 'Right'; right: R };

const Left = <L, R>(left: L): Either<L, R> => ({ _tag: 'Left', left });
const Right = <L, R>(right: R): Either<L, R> => ({ _tag: 'Right', right });

// ============================================================================
// 练习 1：表单验证组合
// ============================================================================

console.log('练习 1：表单验证组合\n');

/**
 * 验证结果类型
 * 使用 Either，Left 包含错误列表，Right 包含验证通过的值
 */
type ValidationResult<T> = Either<string[], T>;

const ValidationSuccess = <T>(value: T): ValidationResult<T> => 
  Right(value);

const ValidationFailure = <T>(errors: string[]): ValidationResult<T> => 
  Left(errors);

/**
 * ValidationResult 的 Semigroup 实例
 * 组合两个验证结果，收集所有错误
 */
const semigroupValidation = <T>(): Semigroup<ValidationResult<T>> => ({
  concat: (a, b) => {
    if (a._tag === 'Left' && b._tag === 'Left') {
      // 两个都失败：合并错误
      return Left([...a.left, ...b.left]);
    }
    if (a._tag === 'Left') return a;
    if (b._tag === 'Left') return b;
    // 两个都成功：返回第二个（或可以合并值）
    return b;
  }
});

// 定义用户注册表单类型
type RegistrationForm = {
  username: string;
  email: string;
  password: string;
  age: number;
};

// 各字段的验证函数
function validateUsername(username: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (username.length === 0) {
    errors.push('用户名不能为空');
  }
  if (username.length < 3) {
    errors.push('用户名至少需要3个字符');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字和下划线');
  }
  
  return errors.length > 0 
    ? ValidationFailure(errors) 
    : ValidationSuccess(username);
}

function validateEmail(email: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (email.length === 0) {
    errors.push('邮箱不能为空');
  }
  if (!email.includes('@')) {
    errors.push('邮箱格式不正确');
  }
  if (!email.includes('.')) {
    errors.push('邮箱必须包含域名');
  }
  
  return errors.length > 0 
    ? ValidationFailure(errors) 
    : ValidationSuccess(email);
}

function validatePassword(password: string): ValidationResult<string> {
  const errors: string[] = [];
  
  if (password.length === 0) {
    errors.push('密码不能为空');
  }
  if (password.length < 8) {
    errors.push('密码至少需要8个字符');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  return errors.length > 0 
    ? ValidationFailure(errors) 
    : ValidationSuccess(password);
}

function validateAge(age: number): ValidationResult<number> {
  const errors: string[] = [];
  
  if (age < 0) {
    errors.push('年龄不能为负数');
  }
  if (age < 18) {
    errors.push('必须年满18岁');
  }
  if (age > 150) {
    errors.push('年龄不合理');
  }
  
  return errors.length > 0 
    ? ValidationFailure(errors) 
    : ValidationSuccess(age);
}

// 组合所有验证
function validateRegistrationForm(
  form: RegistrationForm
): ValidationResult<RegistrationForm> {
  const semigroup = semigroupValidation<any>();
  
  const usernameResult = validateUsername(form.username);
  const emailResult = validateEmail(form.email);
  const passwordResult = validatePassword(form.password);
  const ageResult = validateAge(form.age);
  
  // 组合所有验证结果
  const combined = semigroup.concat(
    semigroup.concat(
      semigroup.concat(usernameResult, emailResult),
      passwordResult
    ),
    ageResult
  );
  
  // 如果所有验证都通过，返回表单对象
  if (combined._tag === 'Right') {
    return ValidationSuccess(form);
  }
  
  return combined;
}

// 测试表单验证
console.log('测试 1: 有效的表单');
const validForm: RegistrationForm = {
  username: 'alice_2024',
  email: 'alice@example.com',
  password: 'SecurePass123',
  age: 25
};
console.log(validateRegistrationForm(validForm));

console.log('\n测试 2: 多个字段无效');
const invalidForm: RegistrationForm = {
  username: 'ab',
  email: 'invalid',
  password: 'weak',
  age: 15
};
console.log(validateRegistrationForm(invalidForm));
console.log();

// ============================================================================
// 练习 2：分布式数据聚合
// ============================================================================

console.log('练习 2：分布式数据聚合\n');

/**
 * 网站分析数据类型
 */
type WebAnalytics = {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;  // 跳出率（需要加权平均）
  avgSessionTime: number;  // 平均会话时长（需要加权平均）
  // 内部字段用于加权平均计算
  _totalSessions: number;
};

/**
 * WebAnalytics 的 Monoid 实例
 * 注意：bounceRate 和 avgSessionTime 需要加权平均
 */
const monoidWebAnalytics: Monoid<WebAnalytics> = {
  concat: (a, b) => {
    const totalSessions = a._totalSessions + b._totalSessions;
    
    // 加权平均计算
    const bounceRate = totalSessions > 0
      ? (a.bounceRate * a._totalSessions + b.bounceRate * b._totalSessions) / totalSessions
      : 0;
    
    const avgSessionTime = totalSessions > 0
      ? (a.avgSessionTime * a._totalSessions + b.avgSessionTime * b._totalSessions) / totalSessions
      : 0;
    
    return {
      pageViews: a.pageViews + b.pageViews,
      uniqueVisitors: a.uniqueVisitors + b.uniqueVisitors,
      bounceRate,
      avgSessionTime,
      _totalSessions: totalSessions
    };
  },
  
  empty: {
    pageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionTime: 0,
    _totalSessions: 0
  }
};

// 辅助函数：使用 Monoid 折叠数组
function fold<T>(arr: T[], monoid: Monoid<T>): T {
  return arr.reduce(monoid.concat, monoid.empty);
}

// 模拟来自不同区域服务器的数据
const region1Data: WebAnalytics = {
  pageViews: 10000,
  uniqueVisitors: 3000,
  bounceRate: 0.45,
  avgSessionTime: 180,
  _totalSessions: 3000
};

const region2Data: WebAnalytics = {
  pageViews: 15000,
  uniqueVisitors: 4500,
  bounceRate: 0.38,
  avgSessionTime: 220,
  _totalSessions: 4500
};

const region3Data: WebAnalytics = {
  pageViews: 8000,
  uniqueVisitors: 2500,
  bounceRate: 0.52,
  avgSessionTime: 150,
  _totalSessions: 2500
};

const globalData = fold(
  [region1Data, region2Data, region3Data],
  monoidWebAnalytics
);

console.log('区域 1 数据:', region1Data);
console.log('区域 2 数据:', region2Data);
console.log('区域 3 数据:', region3Data);
console.log('\n全球聚合数据:', {
  ...globalData,
  bounceRate: globalData.bounceRate.toFixed(2),
  avgSessionTime: globalData.avgSessionTime.toFixed(2)
});
console.log();

// ============================================================================
// 练习 3：购物车金额计算
// ============================================================================

console.log('练习 3：购物车金额计算\n');

/**
 * 金额类型（支持多币种）
 */
type Money = {
  amount: number;
  currency: 'USD' | 'EUR' | 'CNY';
};

/**
 * Money 的 Semigroup 实例
 * 只能合并相同币种的金额
 */
const semigroupMoney: Semigroup<Option<Money>> = {
  concat: (a, b) => {
    if (a._tag === 'None') return b;
    if (b._tag === 'None') return a;
    
    const moneyA = a.value;
    const moneyB = b.value;
    
    // 币种不同，无法合并
    if (moneyA.currency !== moneyB.currency) {
      return None();
    }
    
    return Some({
      amount: moneyA.amount + moneyB.amount,
      currency: moneyA.currency
    });
  }
};

const monoidMoney: Monoid<Option<Money>> = {
  ...semigroupMoney,
  empty: None()
};

// 购物车商品
type CartItem = {
  name: string;
  price: Money;
  quantity: number;
};

// 计算商品总价
function itemTotal(item: CartItem): Money {
  return {
    amount: item.price.amount * item.quantity,
    currency: item.price.currency
  };
}

// 计算购物车总价
function cartTotal(items: CartItem[]): Option<Money> {
  return fold(
    items.map(item => Some(itemTotal(item))),
    monoidMoney
  );
}

// 测试购物车
const cart1: CartItem[] = [
  { name: 'MacBook Pro', price: { amount: 2000, currency: 'USD' }, quantity: 1 },
  { name: 'iPhone', price: { amount: 1000, currency: 'USD' }, quantity: 2 },
  { name: 'AirPods', price: { amount: 200, currency: 'USD' }, quantity: 1 }
];

const cart2: CartItem[] = [
  { name: 'MacBook Pro', price: { amount: 2000, currency: 'USD' }, quantity: 1 },
  { name: 'iPhone', price: { amount: 800, currency: 'EUR' }, quantity: 1 }  // 不同币种！
];

console.log('购物车 1（单一币种）:');
console.log(cartTotal(cart1));

console.log('\n购物车 2（多币种，无法合并）:');
console.log(cartTotal(cart2));
console.log();

// ============================================================================
// 练习 4：事件日志合并
// ============================================================================

console.log('练习 4：事件日志合并\n');

/**
 * 事件类型
 */
type Event = {
  timestamp: number;
  type: string;
  data: Record<string, any>;
};

/**
 * 事件日志类型
 * 按时间排序的事件列表
 */
type EventLog = {
  events: Event[];
};

/**
 * EventLog 的 Monoid 实例
 * 合并两个日志，并按时间排序
 */
const monoidEventLog: Monoid<EventLog> = {
  concat: (a, b) => {
    const allEvents = [...a.events, ...b.events];
    // 按时间戳排序
    allEvents.sort((e1, e2) => e1.timestamp - e2.timestamp);
    return { events: allEvents };
  },
  
  empty: { events: [] }
};

// 模拟不同来源的事件日志
const userLog: EventLog = {
  events: [
    { timestamp: 1000, type: 'LOGIN', data: { userId: 'user1' } },
    { timestamp: 3000, type: 'CLICK', data: { button: 'submit' } }
  ]
};

const systemLog: EventLog = {
  events: [
    { timestamp: 2000, type: 'DB_QUERY', data: { query: 'SELECT * FROM users' } },
    { timestamp: 4000, type: 'API_CALL', data: { endpoint: '/api/users' } }
  ]
};

const errorLog: EventLog = {
  events: [
    { timestamp: 2500, type: 'ERROR', data: { message: 'Connection timeout' } }
  ]
};

const mergedLog = fold(
  [userLog, systemLog, errorLog],
  monoidEventLog
);

console.log('用户日志:', userLog);
console.log('系统日志:', systemLog);
console.log('错误日志:', errorLog);
console.log('\n合并后的日志（按时间排序）:');
mergedLog.events.forEach(event => {
  console.log(`  [${event.timestamp}] ${event.type}:`, event.data);
});
console.log();

// ============================================================================
// 练习 5：配置优先级合并
// ============================================================================

console.log('练习 5：配置优先级合并\n');

/**
 * 应用配置类型
 */
type AppConfig = {
  server?: {
    host?: string;
    port?: number;
    ssl?: boolean;
  };
  database?: {
    host?: string;
    port?: number;
    name?: string;
  };
  features?: {
    enableCache?: boolean;
    enableLogging?: boolean;
    maxRetries?: number;
  };
};

/**
 * First Monoid: 取第一个非 undefined 的值
 */
function getFirstMonoid<T>(): Monoid<T | undefined> {
  return {
    concat: (a, b) => a !== undefined ? a : b,
    empty: undefined
  };
}

/**
 * AppConfig 的 Monoid 实例
 * 使用 First 策略：优先使用第一个配置的值
 */
const monoidAppConfig: Monoid<AppConfig> = {
  concat: (a, b) => {
    const firstString = getFirstMonoid<string>();
    const firstNumber = getFirstMonoid<number>();
    const firstBoolean = getFirstMonoid<boolean>();
    
    return {
      server: {
        host: firstString.concat(a.server?.host, b.server?.host),
        port: firstNumber.concat(a.server?.port, b.server?.port),
        ssl: firstBoolean.concat(a.server?.ssl, b.server?.ssl)
      },
      database: {
        host: firstString.concat(a.database?.host, b.database?.host),
        port: firstNumber.concat(a.database?.port, b.database?.port),
        name: firstString.concat(a.database?.name, b.database?.name)
      },
      features: {
        enableCache: firstBoolean.concat(a.features?.enableCache, b.features?.enableCache),
        enableLogging: firstBoolean.concat(a.features?.enableLogging, b.features?.enableLogging),
        maxRetries: firstNumber.concat(a.features?.maxRetries, b.features?.maxRetries)
      }
    };
  },
  
  empty: {}
};

// 配置层级：命令行参数 > 环境变量 > 配置文件 > 默认值
const defaultConfig: AppConfig = {
  server: { host: 'localhost', port: 3000, ssl: false },
  database: { host: 'localhost', port: 5432, name: 'mydb' },
  features: { enableCache: true, enableLogging: false, maxRetries: 3 }
};

const fileConfig: AppConfig = {
  server: { host: 'prod-server.com', ssl: true },
  database: { name: 'production_db' }
};

const envConfig: AppConfig = {
  database: { host: 'db.example.com' },
  features: { enableLogging: true }
};

const cliConfig: AppConfig = {
  server: { port: 8080 }
};

// 注意顺序：优先级从高到低
const finalConfig = fold(
  [cliConfig, envConfig, fileConfig, defaultConfig],
  monoidAppConfig
);

console.log('默认配置:', JSON.stringify(defaultConfig, null, 2));
console.log('配置文件:', JSON.stringify(fileConfig, null, 2));
console.log('环境变量:', JSON.stringify(envConfig, null, 2));
console.log('命令行参数:', JSON.stringify(cliConfig, null, 2));
console.log('\n最终配置（优先级：CLI > ENV > File > Default）:');
console.log(JSON.stringify(finalConfig, null, 2));
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('总结：类型类在实际开发中的应用\n');

console.log('1. 表单验证：');
console.log('   - 使用 Semigroup 组合验证结果');
console.log('   - 自动收集所有错误消息');
console.log('   - 无需手动管理错误列表');
console.log();

console.log('2. 数据聚合：');
console.log('   - 使用 Monoid 聚合分布式数据');
console.log('   - 支持复杂的聚合逻辑（加权平均等）');
console.log('   - 可并行计算（利用结合律）');
console.log();

console.log('3. 金额计算：');
console.log('   - 使用 Semigroup 安全地组合金额');
console.log('   - 类型系统保证币种一致性');
console.log('   - 避免运行时错误');
console.log();

console.log('4. 事件日志：');
console.log('   - 使用 Monoid 合并多个日志源');
console.log('   - 自动处理排序逻辑');
console.log('   - 单位元处理空日志情况');
console.log();

console.log('5. 配置合并：');
console.log('   - 使用 First Monoid 实现优先级');
console.log('   - 声明式配置组合');
console.log('   - 易于扩展和测试');
