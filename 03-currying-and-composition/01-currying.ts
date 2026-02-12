/**
 * 第三章第一节: 柯里化 (Currying)
 * 
 * 柯里化是将多参数函数转换为一系列单参数函数的技术
 * 这是函数式编程中最重要的技巧之一
 */

console.log('=== 柯里化 (Currying) ===\n');

// ============================================================================
// 1. 基础概念: 什么是柯里化?
// ============================================================================

console.log('1. 基础概念: 什么是柯里化?\n');

// ❌ 普通多参数函数
function add(a: number, b: number, c: number): number {
  return a + b + c;
}

console.log('普通函数 add(1, 2, 3):', add(1, 2, 3));  // 6

// ✅ 手动柯里化版本
function curriedAdd(a: number) {
  return function(b: number) {
    return function(c: number) {
      return a + b + c;
    };
  };
}

console.log('柯里化 curriedAdd(1)(2)(3):', curriedAdd(1)(2)(3));  // 6

// 部分应用的优势
const add1 = curriedAdd(1);        // 固定第一个参数
const add1And2 = add1(2);          // 固定第二个参数
console.log('部分应用 add1And2(3):', add1And2(3));  // 6

// 箭头函数版本 (更简洁)
const curriedAddArrow = (a: number) => (b: number) => (c: number) => a + b + c;

console.log('箭头函数版本:', curriedAddArrow(1)(2)(3));
console.log();

// ============================================================================
// 2. 手动实现柯里化函数
// ============================================================================

console.log('2. 手动实现柯里化函数\n');

// 通用的柯里化函数 (支持任意参数数量)
type AnyFunction = (...args: any[]) => any;

function curry<T extends AnyFunction>(fn: T): any {
  return function curried(...args: any[]): any {
    // 如果参数足够,直接调用原函数
    if (args.length >= fn.length) {
      return fn.apply(null, args);
    }
    // 否则返回一个新函数,等待更多参数
    return function(...nextArgs: any[]) {
      return curried.apply(null, args.concat(nextArgs));
    };
  };
}

// 测试通用柯里化函数
function multiply(a: number, b: number, c: number): number {
  return a * b * c;
}

const curriedMultiply = curry(multiply);

console.log('curry(multiply)(2, 3, 4):', curriedMultiply(2, 3, 4));    // 24
console.log('curry(multiply)(2)(3, 4):', curriedMultiply(2)(3, 4));    // 24
console.log('curry(multiply)(2, 3)(4):', curriedMultiply(2, 3)(4));    // 24
console.log('curry(multiply)(2)(3)(4):', curriedMultiply(2)(3)(4));    // 24

// 创建专用函数
const double = curriedMultiply(2);
const triple = curriedMultiply(3);

console.log('double(5, 10):', double(5, 10));  // 100
console.log('triple(2, 3):', triple(2, 3));    // 18
console.log();

// ============================================================================
// 3. 柯里化的实际应用
// ============================================================================

console.log('3. 柯里化的实际应用\n');

// 场景1: 配置化的日志记录器
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const log = (level: LogLevel) => (prefix: string) => (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [${prefix}] ${message}`);
};

const infoLog = log('INFO');
const errorLog = log('ERROR');

const userInfoLog = infoLog('USER');
const orderInfoLog = infoLog('ORDER');

userInfoLog('用户登录成功');
orderInfoLog('订单创建成功');
errorLog('PAYMENT')('支付失败');
console.log();

// 场景2: 可配置的验证器
type ValidationRule<T> = (value: T) => boolean;

const validate = <T>(rule: ValidationRule<T>) => 
  (errorMessage: string) => 
  (value: T): { valid: boolean; error?: string } => {
    const valid = rule(value);
    return valid ? { valid: true } : { valid: false, error: errorMessage };
  };

// 创建验证规则
const minLength = (min: number) => (str: string) => str.length >= min;
const maxLength = (max: number) => (str: string) => str.length <= max;
const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// 创建验证器
const validateMinLength = validate(minLength(6))('密码至少6个字符');
const validateMaxLength = validate(maxLength(20))('密码最多20个字符');
const validateEmail = validate(isEmail)('邮箱格式不正确');

console.log('验证密码"123":', validateMinLength('123'));
console.log('验证密码"123456":', validateMinLength('123456'));
console.log('验证邮箱:', validateEmail('user@example.com'));
console.log();

// ============================================================================
// 4. 真实业务场景: 电商折扣计算
// ============================================================================

console.log('4. 真实业务场景: 电商折扣计算\n');

type DiscountType = 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y';

// 柯里化的折扣计算器
const calculateDiscount = (type: DiscountType) => 
  (config: any) => 
  (price: number): number => {
    switch (type) {
      case 'PERCENTAGE':
        return price * (1 - config.rate);
      case 'FIXED':
        return Math.max(0, price - config.amount);
      case 'BUY_X_GET_Y':
        return price;  // 简化处理
      default:
        return price;
    }
  };

// 创建不同的折扣策略
const percentage20Off = calculateDiscount('PERCENTAGE')({ rate: 0.2 });
const fixed50Off = calculateDiscount('FIXED')({ amount: 50 });

console.log('原价100, 8折:', percentage20Off(100));  // 80
console.log('原价100, 减50:', fixed50Off(100));      // 50
console.log('原价30, 减50:', fixed50Off(30));        // 0

// 批量应用折扣
const prices = [100, 200, 300];
const discountedPrices = prices.map(percentage20Off);
console.log('批量打8折:', discountedPrices);
console.log();

// ============================================================================
// 5. 真实业务场景: 数据过滤和查询
// ============================================================================

console.log('5. 真实业务场景: 数据过滤和查询\n');

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
};

const products: Product[] = [
  { id: 1, name: 'iPhone 15', price: 5999, category: '电子产品', inStock: true },
  { id: 2, name: 'MacBook Pro', price: 12999, category: '电子产品', inStock: true },
  { id: 3, name: 'AirPods', price: 1299, category: '电子产品', inStock: false },
  { id: 4, name: '咖啡机', price: 599, category: '家电', inStock: true },
  { id: 5, name: '空气炸锅', price: 399, category: '家电', inStock: true },
];

// 柯里化的过滤器工厂
const filterBy = <T>(key: keyof T) => 
  (value: T[keyof T]) => 
  (items: T[]): T[] => {
    return items.filter(item => item[key] === value);
  };

// 柯里化的范围过滤器
const filterByRange = <T>(key: keyof T) => 
  (min: number) => 
  (max: number) => 
  (items: T[]): T[] => {
    return items.filter(item => {
      const val = item[key] as unknown as number;
      return val >= min && val <= max;
    });
  };

// 创建专用过滤器
const filterByCategory = filterBy<Product>('category');
const filterByStock = filterBy<Product>('inStock');
const filterByPriceRange = filterByRange<Product>('price');

// 使用过滤器
const electronics = filterByCategory('电子产品')(products);
const inStockProducts = filterByStock(true)(products);
const affordableProducts = filterByPriceRange(0)(1000)(products);

console.log('电子产品:', electronics.map(p => p.name));
console.log('有库存:', inStockProducts.map(p => p.name));
console.log('价格0-1000:', affordableProducts.map(p => p.name));

// 组合使用 (先过滤类别,再过滤库存)
const availableElectronics = filterByStock(true)(
  filterByCategory('电子产品')(products)
);
console.log('有库存的电子产品:', availableElectronics.map(p => p.name));
console.log();

// ============================================================================
// 6. 自动柯里化 vs 手动柯里化
// ============================================================================

console.log('6. 自动柯里化 vs 手动柯里化\n');

// 手动柯里化: 完全控制,类型安全
const manualCurry = (a: number) => (b: number) => (c: number) => a + b + c;

console.log('手动柯里化:', manualCurry(1)(2)(3));

// 自动柯里化: 灵活但类型推断困难
function autoCurry(fn: Function): any {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn.apply(null, args);
    }
    return (...nextArgs: any[]) => curried.apply(null, args.concat(nextArgs));
  };
}

const autoCurried = autoCurry((a: number, b: number, c: number) => a + b + c);
console.log('自动柯里化(1)(2)(3):', autoCurried(1)(2)(3));
console.log('自动柯里化(1, 2)(3):', autoCurried(1, 2)(3));
console.log('自动柯里化(1, 2, 3):', autoCurried(1, 2, 3));
console.log();

// ============================================================================
// 7. 真实业务场景: API 请求构建器
// ============================================================================

console.log('7. 真实业务场景: API 请求构建器\n');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type RequestConfig = {
  method: HttpMethod;
  baseUrl: string;
  endpoint: string;
  params?: Record<string, any>;
};

// 柯里化的请求构建器
const buildRequest = (baseUrl: string) => 
  (method: HttpMethod) => 
  (endpoint: string) => 
  (params?: Record<string, any>): RequestConfig => ({
    method,
    baseUrl,
    endpoint,
    params,
  });

// 创建 API 客户端
const api = buildRequest('https://api.example.com');
const apiGet = api('GET');
const apiPost = api('POST');

// 创建特定端点的请求构建器
const getUsers = apiGet('/users');
const getOrders = apiGet('/orders');
const createUser = apiPost('/users');

console.log('GET /users:', getUsers());
console.log('GET /users?page=1:', getUsers({ page: 1 }));
console.log('GET /orders?status=pending:', getOrders({ status: 'pending' }));
console.log('POST /users:', createUser({ name: '张三', email: 'zhang@example.com' }));
console.log();

// ============================================================================
// 8. 柯里化的优势和注意事项
// ============================================================================

console.log('8. 柯里化的优势和注意事项\n');

/**
 * ✅ 柯里化的优势:
 * 
 * 1. 参数复用 - 固定某些参数,创建专用函数
 * 2. 延迟执行 - 逐步收集参数,最后一起执行
 * 3. 函数组合 - 更容易组合单参数函数
 * 4. 配置化 - 创建可配置的函数工厂
 * 5. 代码复用 - 减少重复代码
 * 
 * ❌ 注意事项:
 * 
 * 1. 性能开销 - 创建多层闭包会有轻微性能损失
 * 2. 调试困难 - 调用栈变深,错误信息不直观
 * 3. 类型推断 - TypeScript 对深度柯里化的类型推断有限
 * 4. 学习曲线 - 对初学者不够友好
 * 5. 过度使用 - 并非所有函数都适合柯里化
 */

// 示例: 何时使用柯里化?

// ✅ 适合柯里化: 参数有明确的层次关系
const formatCurrency = (locale: string) => 
  (currency: string) => 
  (amount: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

const formatCNY = formatCurrency('zh-CN')('CNY');
const formatUSD = formatCurrency('en-US')('USD');

console.log('格式化人民币:', formatCNY(1234.56));
console.log('格式化美元:', formatUSD(1234.56));

// ❌ 不适合柯里化: 参数没有层次关系
// 这种情况直接使用普通函数更清晰
function calculateArea(width: number, height: number): number {
  return width * height;
}

console.log('计算面积:', calculateArea(10, 20));
console.log();

// ============================================================================
// 9. 占位符柯里化 (Placeholder)
// ============================================================================

console.log('9. 占位符柯里化\n');

// 高级特性: 支持占位符的柯里化
const __ = Symbol('placeholder');

function curryWithPlaceholder<T extends AnyFunction>(fn: T): any {
  return function curried(...args: any[]): any {
    // 检查是否还有占位符
    const hasPlaceholder = args.some(arg => arg === __);
    
    if (!hasPlaceholder && args.length >= fn.length) {
      return fn.apply(null, args);
    }
    
    return function(...nextArgs: any[]) {
      // 替换占位符
      const mergedArgs = args.map(arg => arg === __ ? nextArgs.shift() : arg);
      // 添加剩余参数
      return curried.apply(null, [...mergedArgs, ...nextArgs]);
    };
  };
}

const subtract = (a: number, b: number, c: number) => a - b - c;
const curriedSubtract = curryWithPlaceholder(subtract);

// 跳过第二个参数
const subtract10 = curriedSubtract(__, 10);
console.log('占位符: subtract10(100, 5):', subtract10(100, 5));  // 100 - 10 - 5 = 85

// 只固定第二个参数
const subtractXFrom = curriedSubtract(__, 20, __);
console.log('占位符: subtractXFrom(100, 5):', subtractXFrom(100, 5));  // 100 - 20 - 5 = 75
console.log();

console.log('=== 示例结束 ===');

// 导出供其他模块使用
export {
  curry,
  curriedAdd,
  curriedMultiply,
  log,
  validate,
  calculateDiscount,
  filterBy,
  filterByRange,
  buildRequest,
  formatCurrency,
  curryWithPlaceholder,
  __,
};

export type { LogLevel, ValidationRule, Product, HttpMethod, RequestConfig };
