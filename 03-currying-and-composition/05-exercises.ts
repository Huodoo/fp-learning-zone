/**
 * 第三章练习题: 柯里化、部分应用和函数组合
 * 
 * 通过这些练习巩固你对柯里化、部分应用、函数组合和Point-Free风格的理解
 */

console.log('=== 第三章练习题 ===\n');

// ============================================================================
// 练习 1: 实现柯里化函数
// ============================================================================

console.log('练习 1: 实现柯里化函数\n');

/**
 * 任务: 实现一个通用的 curry 函数
 * 要求:
 * - 支持任意数量的参数
 * - 可以一次传入一个参数,也可以传入多个参数
 * - 当参数数量达到原函数要求时,执行原函数
 */

// 你的实现:
function curry(fn: Function): any {
  // TODO: 实现这个函数
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn.apply(null, args);
    }
    return function(...nextArgs: any[]) {
      return curried.apply(null, args.concat(nextArgs));
    };
  };
}

// 测试
function add3Numbers(a: number, b: number, c: number): number {
  return a + b + c;
}

const curriedAdd = curry(add3Numbers);

console.log('✅ 测试 curry(add)(1)(2)(3):', curriedAdd(1)(2)(3));  // 应该输出 6
console.log('✅ 测试 curry(add)(1, 2)(3):', curriedAdd(1, 2)(3));  // 应该输出 6
console.log('✅ 测试 curry(add)(1)(2, 3):', curriedAdd(1)(2, 3));  // 应该输出 6
console.log();

// ============================================================================
// 练习 2: 实现 pipe 函数
// ============================================================================

console.log('练习 2: 实现 pipe 函数\n');

/**
 * 任务: 实现一个 pipe 函数,从左到右组合函数
 * 要求:
 * - 接受任意数量的函数
 * - 返回一个新函数
 * - 从左到右依次执行函数
 */

// 你的实现:
function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  // TODO: 实现这个函数
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

// 测试
const add1 = (x: number) => x + 1;
const multiply2 = (x: number) => x * 2;
const subtract3 = (x: number) => x - 3;

const operation = pipe(add1, multiply2, subtract3);

console.log('✅ 测试 pipe(+1, *2, -3)(5):', operation(5));  // ((5+1)*2)-3 = 9
console.log();

// ============================================================================
// 练习 3: 创建可配置的折扣计算器
// ============================================================================

console.log('练习 3: 创建可配置的折扣计算器\n');

/**
 * 任务: 使用柯里化创建一个折扣计算器
 * 要求:
 * - 第一层: 接受折扣类型 ('percentage' | 'fixed')
 * - 第二层: 接受折扣配置 (百分比或固定金额)
 * - 第三层: 接受价格,返回折后价
 */

type DiscountType = 'percentage' | 'fixed';

// 你的实现:
const createDiscountCalculator = (type: DiscountType) =>
  (config: number) =>
  (price: number): number => {
    // TODO: 实现这个函数
    if (type === 'percentage') {
      return price * (1 - config);
    } else {
      return Math.max(0, price - config);
    }
  };

// 测试
const percentage20Off = createDiscountCalculator('percentage')(0.2);  // 8折
const fixed50Off = createDiscountCalculator('fixed')(50);             // 减50元

console.log('✅ 原价100,打8折:', percentage20Off(100));  // 80
console.log('✅ 原价100,减50:', fixed50Off(100));        // 50
console.log('✅ 原价30,减50:', fixed50Off(30));          // 0
console.log();

// ============================================================================
// 练习 4: 实现数据处理管道
// ============================================================================

console.log('练习 4: 实现数据处理管道\n');

/**
 * 任务: 使用 pipe 和 Point-Free 风格处理用户数据
 * 要求:
 * - 过滤出活跃用户
 * - 过滤出成年人
 * - 提取邮箱地址
 * - 转换为小写
 */

type User = {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
};

const users: User[] = [
  { name: 'Alice', email: 'ALICE@EXAMPLE.COM', age: 25, isActive: true },
  { name: 'Bob', email: 'BOB@EXAMPLE.COM', age: 17, isActive: true },
  { name: 'Charlie', email: 'CHARLIE@EXAMPLE.COM', age: 30, isActive: false },
  { name: 'David', email: 'DAVID@EXAMPLE.COM', age: 28, isActive: true },
];

// 你的实现:
const isActive = (user: User) => user.isActive;
const isAdult = (user: User) => user.age >= 18;
const getEmail = (user: User) => user.email;
const toLowerCase = (str: string) => str.toLowerCase();

const filter = <T>(predicate: (item: T) => boolean) => (arr: T[]) => arr.filter(predicate);
const map = <T, U>(mapper: (item: T) => U) => (arr: T[]) => arr.map(mapper);

const getActiveAdultEmails = pipe(
  filter(isActive),
  filter(isAdult),
  map(getEmail),
  (emails: string[]) => emails.map(toLowerCase)
);

console.log('✅ 活跃成年用户邮箱:', getActiveAdultEmails(users));
// 应该输出: ['alice@example.com', 'david@example.com']
console.log();

// ============================================================================
// 练习 5: 实现购物车价格计算器
// ============================================================================

console.log('练习 5: 实现购物车价格计算器\n');

/**
 * 任务: 使用函数组合实现购物车价格计算
 * 要求:
 * - 应用会员折扣 (9折)
 * - 应用税费 (13%)
 * - 添加运费 (满100免运费,否则加15元)
 * - 四舍五入到小数点后2位
 */

type CartItem = {
  name: string;
  price: number;
  quantity: number;
};

const cart: CartItem[] = [
  { name: 'iPhone', price: 100, quantity: 2 },
  { name: 'Book', price: 30, quantity: 1 },
];

// 你的实现:
const calculateSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const applyMemberDiscount = (subtotal: number) => subtotal * 0.9;

const applyTax = (amount: number) => amount * 1.13;

const applyShipping = (amount: number) => {
  const originalAmount = amount / 1.13 / 0.9;  // 反推原价判断
  return originalAmount >= 100 ? amount : amount + 15;
};

const roundToTwoDecimals = (amount: number) => Math.round(amount * 100) / 100;

const calculateCartTotal = pipe(
  calculateSubtotal,
  applyMemberDiscount,
  applyTax,
  applyShipping,
  roundToTwoDecimals
);

console.log('✅ 购物车总价:', calculateCartTotal(cart));
console.log();

// ============================================================================
// 练习 6: 实现通用的验证器
// ============================================================================

console.log('练习 6: 实现通用的验证器\n');

/**
 * 任务: 使用柯里化创建可组合的验证器
 * 要求:
 * - 实现 minLength, maxLength, pattern 验证器
 * - 验证器应该返回 { valid: boolean, error?: string }
 * - 使用柯里化使验证器可配置
 */

type ValidationResult = {
  valid: boolean;
  error?: string;
};

// 你的实现:
const createValidator = (
  validate: (value: string) => boolean,
  errorMessage: string
) => (value: string): ValidationResult => {
  return validate(value)
    ? { valid: true }
    : { valid: false, error: errorMessage };
};

const minLength = (min: number) =>
  createValidator(
    (value) => value.length >= min,
    `至少${min}个字符`
  );

const maxLength = (max: number) =>
  createValidator(
    (value) => value.length <= max,
    `最多${max}个字符`
  );

const pattern = (regex: RegExp, message: string) =>
  createValidator(
    (value) => regex.test(value),
    message
  );

// 组合验证器
const validateAll = (...validators: Array<(value: string) => ValidationResult>) =>
  (value: string): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };

const validatePassword = validateAll(
  minLength(6),
  maxLength(20),
  pattern(/[A-Z]/, '必须包含大写字母'),
  pattern(/[0-9]/, '必须包含数字')
);

console.log('✅ 验证"123":', validatePassword('123'));
console.log('✅ 验证"Abc123":', validatePassword('Abc123'));
console.log();

// ============================================================================
// 练习 7: 实现 compose 函数
// ============================================================================

console.log('练习 7: 实现 compose 函数\n');

/**
 * 任务: 实现 compose 函数(从右到左执行)
 * 要求:
 * - 与 pipe 相反,从右到左执行函数
 * - 接受任意数量的函数
 */

// 你的实现:
function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  // TODO: 实现这个函数
  return (arg: T) => fns.reduceRight((result, fn) => fn(result), arg);
}

// 测试
const composedOperation = compose(subtract3, multiply2, add1);

console.log('✅ compose(-3, *2, +1)(5):', composedOperation(5));  // ((5+1)*2)-3 = 9
console.log();

// ============================================================================
// 练习 8: 实现异步管道
// ============================================================================

console.log('练习 8: 实现异步管道\n');

/**
 * 任务: 实现支持异步函数的 pipeAsync
 * 要求:
 * - 支持 Promise
 * - 按顺序执行异步操作
 */

// 你的实现:
function pipeAsync<T>(
  ...fns: Array<(arg: T) => Promise<T> | T>
): (arg: T) => Promise<T> {
  // TODO: 实现这个函数
  return async (arg: T) => {
    let result = arg;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}

// 测试
const asyncAdd1 = async (x: number) => {
  await new Promise(resolve => setTimeout(resolve, 10));
  return x + 1;
};

const asyncMultiply2 = async (x: number) => {
  await new Promise(resolve => setTimeout(resolve, 10));
  return x * 2;
};

const asyncOperation = pipeAsync(asyncAdd1, asyncMultiply2);

// Async test
  
  // ============================================================================
  // 练习 9: 实现日志装饰器
  // ============================================================================
  
  console.log('练习 9: 实现日志装饰器\n');
  
  /**
   * 任务: 实现一个日志装饰器,用于调试管道
   * 要求:
   * - 打印函数名和输入/输出值
   * - 不改变函数的行为
   */
  
  // 你的实现:
function trace<T>(label: string) {
  return (value: T): T => {
    console.log(`[${label}]`, value);
    return value;
  };
}
  
  // 测试
const operationWithTrace = pipe(
  trace('输入'),
  add1,
  trace('加1后'),
  multiply2,
  trace('乘2后')
);

console.log('带日志的管道:');
operationWithTrace(5);
console.log();
  
  // ============================================================================
  // 练习 10: 真实场景 - API 数据处理
  // ============================================================================
  
  console.log('练习 10: 真实场景 - API 数据处理\n');
  
  /**
   * 任务: 处理从 API 获取的商品数据
   * 要求:
   * - 过滤出有库存的商品
   * - 过滤出价格在1000以下的商品
   * - 按价格降序排序
   * - 取前3个
   * - 提取商品名称
   * 
   * 使用 Point-Free 风格实现
   */
  
type Product = {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
};
  
const products: Product[] = [
  { id: 1, name: 'iPhone 15', price: 5999, inStock: true },
  { id: 2, name: 'AirPods', price: 899, inStock: true },
  { id: 3, name: 'MacBook', price: 9999, inStock: false },
  { id: 4, name: 'iPad', price: 2999, inStock: true },
  { id: 5, name: 'Apple Watch', price: 1999, inStock: true },
  { id: 6, name: 'Magic Mouse', price: 599, inStock: true },
];
  
  // 你的实现:
const inStock = (p: Product) => p.inStock;
const affordable = (p: Product) => p.price < 1000;
const sortByPriceDesc = (products: Product[]) =>
  [...products].sort((a, b) => b.price - a.price);
const take = (n: number) => <T>(arr: T[]) => arr.slice(0, n);
const getName = (p: Product) => p.name;
  
const getTopAffordableProducts = pipe(
  filter(inStock),
  filter(affordable),
  sortByPriceDesc,
  take(3),
  map(getName)
);
  
console.log('✅ 前3个有库存且价格<1000的商品:', getTopAffordableProducts(products));
  // 应该输出: ['AirPods', 'Magic Mouse']
  console.log();
  
console.log('=== 练习完成! ===');
  console.log('\n💡 提示: 如果某些练习有困难,可以回顾本章的示例代码');
});

// 导出供测试使用
export {
  curry,
  pipe,
  compose,
  pipeAsync,
  createDiscountCalculator,
  getActiveAdultEmails,
  calculateCartTotal,
  validatePassword,
  trace,
  getTopAffordableProducts,
};

export type { User, CartItem, ValidationResult, Product };
