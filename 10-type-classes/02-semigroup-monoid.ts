/**
 * 第十章第二节：Semigroup 和 Monoid 深入
 * 
 * 本文件深入探讨 Semigroup 和 Monoid
 * 展示各种实例和实际应用场景
 */

console.log('=== Semigroup 和 Monoid 深入 ===\n');

// ============================================================================
// 类型定义（复用）
// ============================================================================

interface Semigroup<T> {
  concat: (a: T, b: T) => T;
}

interface Monoid<T> extends Semigroup<T> {
  empty: T;
}

// ============================================================================
// 1. 基础 Monoid 实例
// ============================================================================

console.log('1. 基础 Monoid 实例\n');

// 数字加法 Monoid
const monoidSum: Monoid<number> = {
  concat: (a, b) => a + b,
  empty: 0
};

// 数字乘法 Monoid
const monoidProduct: Monoid<number> = {
  concat: (a, b) => a * b,
  empty: 1
};

// 字符串 Monoid
const monoidString: Monoid<string> = {
  concat: (a, b) => a + b,
  empty: ''
};

// 布尔值 AND Monoid
const monoidAll: Monoid<boolean> = {
  concat: (a, b) => a && b,
  empty: true
};

// 布尔值 OR Monoid
const monoidAny: Monoid<boolean> = {
  concat: (a, b) => a || b,
  empty: false
};

console.log('monoidSum.concat(3, 4):', monoidSum.concat(3, 4));
console.log('monoidProduct.concat(3, 4):', monoidProduct.concat(3, 4));
console.log('monoidAll.concat(true, false):', monoidAll.concat(true, false));
console.log('monoidAny.concat(true, false):', monoidAny.concat(true, false));
console.log();

// ============================================================================
// 2. 容器类型的 Monoid
// ============================================================================

console.log('2. 容器类型的 Monoid\n');

// 数组 Monoid
function getMonoidArray<T>(): Monoid<T[]> {
  return {
    concat: (a, b) => [...a, ...b],
    empty: []
  };
}

// Map Monoid（合并两个 Map，值冲突时使用 Semigroup 组合）
function getMonoidMap<K, V>(semigroupValue: Semigroup<V>): Monoid<Map<K, V>> {
  return {
    concat: (a, b) => {
      const result = new Map(a);
      b.forEach((value, key) => {
        const existing = result.get(key);
        result.set(
          key, 
          existing !== undefined 
            ? semigroupValue.concat(existing, value) 
            : value
        );
      });
      return result;
    },
    empty: new Map()
  };
}

// 对象 Monoid（浅合并）
function getMonoidObject<T extends Record<string, any>>(): Monoid<T> {
  return {
    concat: (a, b) => ({ ...a, ...b } as T),
    empty: {} as T
  };
}

const monoidNumberArray = getMonoidArray<number>();
console.log('数组合并:', 
  monoidNumberArray.concat([1, 2], [3, 4]));

const mapMonoid = getMonoidMap<string, number>(monoidSum);
const map1 = new Map([['a', 1], ['b', 2]]);
const map2 = new Map([['b', 3], ['c', 4]]);
console.log('Map 合并:', mapMonoid.concat(map1, map2));

const objectMonoid = getMonoidObject<{ x?: number; y?: number }>();
console.log('对象合并:', 
  objectMonoid.concat({ x: 1 }, { y: 2, x: 3 }));
console.log();

// ============================================================================
// 3. 函数的 Monoid
// ============================================================================

console.log('3. 函数的 Monoid\n');

/**
 * 如果返回值类型是 Monoid，那么函数也可以是 Monoid
 * 两个函数的 concat：先分别调用，然后用返回值的 Monoid 组合结果
 */
function getMonoidFunction<A, B>(monoidB: Monoid<B>): Monoid<(a: A) => B> {
  return {
    concat: (f, g) => (a: A) => monoidB.concat(f(a), g(a)),
    empty: () => monoidB.empty
  };
}

// 示例：组合多个计算函数
type Cart = {
  items: Array<{ price: number }>;
};

const calculateSubtotal = (cart: Cart): number => 
  cart.items.reduce((sum, item) => sum + item.price, 0);

const calculateTax = (cart: Cart): number => 
  calculateSubtotal(cart) * 0.1;

const calculateShipping = (cart: Cart): number => 
  cart.items.length > 0 ? 10 : 0;

// 使用函数 Monoid 组合所有费用计算
const monoidNumberFunction = getMonoidFunction<Cart, number>(monoidSum);

const calculateTotal = monoidNumberFunction.concat(
  monoidNumberFunction.concat(calculateSubtotal, calculateTax),
  calculateShipping
);

const cart: Cart = {
  items: [
    { price: 100 },
    { price: 200 }
  ]
};

console.log('购物车:', cart);
console.log('小计:', calculateSubtotal(cart));
console.log('税费:', calculateTax(cart));
console.log('运费:', calculateShipping(cart));
console.log('总计:', calculateTotal(cart));
console.log();

// ============================================================================
// 4. 实际应用：验证结果组合
// ============================================================================

console.log('4. 实际应用：验证结果组合\n');

/**
 * 验证结果类型
 * Success: 验证通过，包含空数组
 * Failure: 验证失败，包含错误消息数组
 */
type Validation<T> =
  | { _tag: 'Success'; value: T }
  | { _tag: 'Failure'; errors: string[] };

const Success = <T>(value: T): Validation<T> => ({
  _tag: 'Success',
  value
});

const Failure = <T>(errors: string[]): Validation<T> => ({
  _tag: 'Failure',
  errors
});

/**
 * Validation 的 Semigroup 实例
 * 组合两个验证结果：
 * - 都成功 -> 返回第二个（或组合值）
 * - 有失败 -> 收集所有错误
 */
function getSemigroupValidation<T>(): Semigroup<Validation<T>> {
  return {
    concat: (a, b) => {
      if (a._tag === 'Failure' && b._tag === 'Failure') {
        return Failure([...a.errors, ...b.errors]);
      }
      if (a._tag === 'Failure') return a;
      if (b._tag === 'Failure') return b;
      return b; // 都成功，返回第二个
    }
  };
}

// 验证函数示例
type User = {
  name: string;
  email: string;
  age: number;
};

function validateName(name: string): Validation<string> {
  if (name.length === 0) {
    return Failure(['姓名不能为空']);
  }
  if (name.length < 2) {
    return Failure(['姓名至少需要2个字符']);
  }
  return Success(name);
}

function validateEmail(email: string): Validation<string> {
  if (!email.includes('@')) {
    return Failure(['邮箱格式不正确']);
  }
  return Success(email);
}

function validateAge(age: number): Validation<number> {
  if (age < 0) {
    return Failure(['年龄不能为负数']);
  }
  if (age < 18) {
    return Failure(['年龄必须大于等于18岁']);
  }
  return Success(age);
}

// 组合验证
function validateUser(user: User): Validation<User> {
  const semigroupValidation = getSemigroupValidation<any>();
  
  const nameValidation = validateName(user.name);
  const emailValidation = validateEmail(user.email);
  const ageValidation = validateAge(user.age);
  
  const result = semigroupValidation.concat(
    semigroupValidation.concat(nameValidation, emailValidation),
    ageValidation
  );
  
  // 如果所有验证都通过，返回原对象
  if (result._tag === 'Success') {
    return Success(user);
  }
  
  return result;
}

console.log('验证有效用户:');
const validUser: User = { name: 'Alice', email: 'alice@example.com', age: 25 };
console.log(validateUser(validUser));

console.log('\n验证无效用户（多个错误）:');
const invalidUser: User = { name: 'A', email: 'invalid', age: 15 };
console.log(validateUser(invalidUser));
console.log();

// ============================================================================
// 5. 实际应用：数据聚合
// ============================================================================

console.log('5. 实际应用：数据聚合\n');

/**
 * 统计数据类型
 */
type Statistics = {
  readonly count: number;
  readonly sum: number;
  readonly min: number;
  readonly max: number;
};

/**
 * Statistics 的 Monoid 实例
 */
const monoidStatistics: Monoid<Statistics> = {
  concat: (a, b) => ({
    count: a.count + b.count,
    sum: a.sum + b.sum,
    min: Math.min(a.min, b.min),
    max: Math.max(a.max, b.max)
  }),
  empty: {
    count: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity
  }
};

// 从单个数字创建统计
function fromNumber(n: number): Statistics {
  return {
    count: 1,
    sum: n,
    min: n,
    max: n
  };
}

// 计算平均值
function average(stats: Statistics): number {
  return stats.count > 0 ? stats.sum / stats.count : 0;
}

// 使用 Monoid 聚合数据
function fold<T>(arr: T[], monoid: Monoid<T>): T {
  return arr.reduce(monoid.concat, monoid.empty);
}

const numbers = [1, 5, 3, 9, 2, 7];
const stats = fold(
  numbers.map(fromNumber),
  monoidStatistics
);

console.log('数字列表:', numbers);
console.log('统计结果:', stats);
console.log('平均值:', average(stats));
console.log();

// 实际场景：分布式日志聚合
type LogStats = {
  readonly totalRequests: number;
  readonly totalErrors: number;
  readonly avgResponseTime: number;
  readonly _responseTimeSum: number; // 内部使用
};

const monoidLogStats: Monoid<LogStats> = {
  concat: (a, b) => {
    const totalRequests = a.totalRequests + b.totalRequests;
    const responseTimeSum = a._responseTimeSum + b._responseTimeSum;
    return {
      totalRequests,
      totalErrors: a.totalErrors + b.totalErrors,
      avgResponseTime: totalRequests > 0 ? responseTimeSum / totalRequests : 0,
      _responseTimeSum: responseTimeSum
    };
  },
  empty: {
    totalRequests: 0,
    totalErrors: 0,
    avgResponseTime: 0,
    _responseTimeSum: 0
  }
};

// 模拟来自不同服务器的日志统计
const server1Stats: LogStats = {
  totalRequests: 1000,
  totalErrors: 10,
  avgResponseTime: 150,
  _responseTimeSum: 150000
};

const server2Stats: LogStats = {
  totalRequests: 1500,
  totalErrors: 20,
  avgResponseTime: 200,
  _responseTimeSum: 300000
};

const server3Stats: LogStats = {
  totalRequests: 800,
  totalErrors: 5,
  avgResponseTime: 120,
  _responseTimeSum: 96000
};

const aggregatedStats = fold(
  [server1Stats, server2Stats, server3Stats],
  monoidLogStats
);

console.log('服务器1统计:', server1Stats);
console.log('服务器2统计:', server2Stats);
console.log('服务器3统计:', server3Stats);
console.log('聚合统计:', aggregatedStats);
console.log();

// ============================================================================
// 6. 实际应用：配置层级合并
// ============================================================================

console.log('6. 实际应用：配置层级合并\n');

type AppConfig = {
  readonly database?: {
    readonly host?: string;
    readonly port?: number;
    readonly username?: string;
  };
  readonly cache?: {
    readonly enabled?: boolean;
    readonly ttl?: number;
  };
  readonly logging?: {
    readonly level?: 'debug' | 'info' | 'warn' | 'error';
    readonly format?: 'json' | 'text';
  };
};

/**
 * 深度合并 Monoid
 * 递归合并嵌套对象
 */
const monoidDeepMerge: Monoid<AppConfig> = {
  concat: (a, b) => {
    const result: AppConfig = { ...a };
    
    if (b.database) {
      result.database = { ...a.database, ...b.database };
    }
    if (b.cache) {
      result.cache = { ...a.cache, ...b.cache };
    }
    if (b.logging) {
      result.logging = { ...a.logging, ...b.logging };
    }
    
    return result;
  },
  empty: {}
};

// 配置层级：默认 < 环境 < 用户
const defaultConfig: AppConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    username: 'admin'
  },
  cache: {
    enabled: true,
    ttl: 3600
  },
  logging: {
    level: 'info',
    format: 'text'
  }
};

const envConfig: AppConfig = {
  database: {
    host: 'prod-db.example.com',
    port: 5432
  },
  logging: {
    level: 'warn'
  }
};

const userConfig: AppConfig = {
  cache: {
    ttl: 7200
  },
  logging: {
    format: 'json'
  }
};

const finalConfig = fold(
  [defaultConfig, envConfig, userConfig],
  monoidDeepMerge
);

console.log('默认配置:', JSON.stringify(defaultConfig, null, 2));
console.log('环境配置:', JSON.stringify(envConfig, null, 2));
console.log('用户配置:', JSON.stringify(userConfig, null, 2));
console.log('最终配置:', JSON.stringify(finalConfig, null, 2));
console.log();

// ============================================================================
// 7. 组合 Monoid
// ============================================================================

console.log('7. 组合 Monoid\n');

/**
 * 从多个 Monoid 构造元组 Monoid
 */
function getMonoidTuple<A, B>(
  monoidA: Monoid<A>,
  monoidB: Monoid<B>
): Monoid<[A, B]> {
  return {
    concat: ([a1, b1], [a2, b2]) => [
      monoidA.concat(a1, a2),
      monoidB.concat(b1, b2)
    ],
    empty: [monoidA.empty, monoidB.empty]
  };
}

// 示例：同时计算总和与乘积
const monoidSumProduct = getMonoidTuple(monoidSum, monoidProduct);

const nums = [2, 3, 4];
const [sum, product] = fold(
  nums.map(n => [n, n] as [number, number]),
  monoidSumProduct
);

console.log('数字列表:', nums);
console.log('总和:', sum);
console.log('乘积:', product);
console.log();

// ============================================================================
// 8. Dual Monoid - 反向组合
// ============================================================================

console.log('8. Dual Monoid - 反向组合\n');

/**
 * Dual Monoid: 反向组合顺序
 * concat(a, b) 变为 concat(b, a)
 */
function getDualMonoid<T>(monoid: Monoid<T>): Monoid<T> {
  return {
    concat: (a, b) => monoid.concat(b, a), // 反向！
    empty: monoid.empty
  };
}

// 示例：字符串拼接
const dualString = getDualMonoid(monoidString);

console.log('正常拼接:', 
  fold(['A', 'B', 'C'], monoidString));

console.log('反向拼接:', 
  fold(['A', 'B', 'C'], dualString));
console.log();

// ============================================================================
// 9. 总结：Monoid 的威力
// ============================================================================

console.log('9. 总结：Monoid 的威力\n');

console.log('Monoid 的优势:');
console.log('1. 可结合性 -> 可以并行计算');
console.log('2. 有单位元 -> 处理空集合不需要特殊逻辑');
console.log('3. 通用性 -> 一个 fold 函数适用所有 Monoid');
console.log('4. 组合性 -> 可以从简单 Monoid 构建复杂 Monoid');
console.log();

console.log('实际应用场景:');
console.log('- 数据聚合（统计、求和、求积）');
console.log('- 配置合并（多层配置组合）');
console.log('- 验证组合（收集所有错误）');
console.log('- 日志合并（分布式日志聚合）');
console.log('- 事件溯源（Event Sourcing）');
console.log('- MapReduce 计算');
