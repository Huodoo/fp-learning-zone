/**
 * 第三章第四节: 无参数风格 (Point-Free Style)
 * 
 * Point-Free (也叫 Tacit Programming) 是一种不显式声明参数的编程风格
 * 通过函数组合来定义新函数,而不是通过操作参数
 */

console.log('=== 无参数风格 (Point-Free Style) ===\n');

// ============================================================================
// 1. 什么是 Point-Free?
// ============================================================================

console.log('1. 什么是 Point-Free?\n');

// ❌ Pointed Style (显式参数风格)
const addOnePointed = (x: number): number => x + 1;
const doublePointed = (x: number): number => x * 2;

const processPointed = (x: number): number => {
  return doublePointed(addOnePointed(x));
};

console.log('Pointed style:', processPointed(5));  // 12

// ✅ Point-Free Style (无参数风格)
// 不提及参数 x,直接组合函数
const addOne = (x: number): number => x + 1;
const double = (x: number): number => x * 2;

const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A) => f(g(a));

const processPointFree = compose(double, addOne);

console.log('Point-Free style:', processPointFree(5));  // 12

/**
 * 关键区别:
 * - Pointed: 显式声明参数 x,然后在函数体中使用它
 * - Point-Free: 不提及参数,通过组合已有函数来定义新函数
 */
console.log();

// ============================================================================
// 2. Point-Free 的基本模式
// ============================================================================

console.log('2. Point-Free 的基本模式\n');

// 模式1: 简单的函数引用
const numbers = [1, 2, 3, 4, 5];

// ❌ Pointed
const doubledPointed = numbers.map(x => x * 2);

// ✅ Point-Free
const timesTwo = (x: number) => x * 2;
const doubledPointFree = numbers.map(timesTwo);

console.log('Pointed:', doubledPointed);
console.log('Point-Free:', doubledPointFree);

// 模式2: 使用柯里化
const multiply = (a: number) => (b: number) => a * b;
const multiplyBy2 = multiply(2);

// ✅ Point-Free
const doubledWithCurry = numbers.map(multiplyBy2);
console.log('使用柯里化:', doubledWithCurry);

// 模式3: 函数组合
const pipe = <T>(...fns: Array<(arg: T) => T>) => (arg: T) =>
  fns.reduce((result, fn) => fn(result), arg);

const increment = (x: number) => x + 1;
const square = (x: number) => x * x;

// ✅ Point-Free: 不提及参数
const incrementThenSquare = pipe(increment, square);

console.log('函数组合:', incrementThenSquare(5));  // (5 + 1)^2 = 36
console.log();

// ============================================================================
// 3. 数组方法的 Point-Free 应用
// ============================================================================

console.log('3. 数组方法的 Point-Free 应用\n');

const products = [
  { name: 'iPhone', price: 5999, category: 'electronics' },
  { name: 'Book', price: 59, category: 'books' },
  { name: 'MacBook', price: 12999, category: 'electronics' },
  { name: 'Pen', price: 9, category: 'stationery' },
];

// ❌ Pointed Style
const expensiveProductsPointed = products
  .filter(p => p.price > 1000)
  .map(p => p.name);

console.log('Pointed:', expensiveProductsPointed);

// ✅ Point-Free Style
const isExpensive = (p: { price: number }) => p.price > 1000;
const getName = (p: { name: string }) => p.name;

const expensiveProductsPointFree = products
  .filter(isExpensive)
  .map(getName);

console.log('Point-Free:', expensiveProductsPointFree);

// 更进一步: 柯里化的通用函数
const prop = <T, K extends keyof T>(key: K) => (obj: T): T[K] => obj[key];
const gt = (threshold: number) => (value: number) => value > threshold;

const getPrice = prop<{ price: number }, 'price'>('price');
const isExpensivePointFree = (p: { price: number }) => gt(1000)(getPrice(p));

const expensiveProductsAdvanced = products
  .filter(isExpensivePointFree)
  .map(prop('name'));

console.log('高级 Point-Free:', expensiveProductsAdvanced);
console.log();

// ============================================================================
// 4. 真实业务场景: 用户数据处理
// ============================================================================

console.log('4. 真实业务场景: 用户数据处理\n');

type User = {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
};

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 17, isActive: true },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 30, isActive: false },
  { id: 4, name: 'David', email: 'david@example.com', age: 28, isActive: true },
];

// 定义可重用的谓词函数
const isActive = (user: User) => user.isActive;
const isAdult = (user: User) => user.age >= 18;
const getEmail = (user: User) => user.email;

// ❌ Pointed Style
const getActiveAdultEmailsPointed = (users: User[]) => {
  return users
    .filter(u => u.isActive)
    .filter(u => u.age >= 18)
    .map(u => u.email);
};

// ✅ Point-Free Style
const getActiveAdultEmails = pipe(
  (users: User[]) => users.filter(isActive),
  (users: User[]) => users.filter(isAdult),
  (users: User[]) => users.map(getEmail)
);

console.log('Active adult emails:', getActiveAdultEmails(users));

// 更简洁的辅助函数
const filter = <T>(predicate: (item: T) => boolean) => (arr: T[]) => arr.filter(predicate);
const map = <T, U>(mapper: (item: T) => U) => (arr: T[]) => arr.map(mapper);

const getActiveAdultEmailsClean = pipe(
  filter(isActive),
  filter(isAdult),
  map(getEmail)
);

console.log('Clean Point-Free:', getActiveAdultEmailsClean(users));
console.log();

// ============================================================================
// 5. 真实业务场景: 价格计算
// ============================================================================

console.log('5. 真实业务场景: 价格计算\n');

type PriceConfig = {
  discountRate: number;
  taxRate: number;
  shippingFee: number;
};

// ❌ Pointed Style
const calculateFinalPricePointed = (config: PriceConfig, basePrice: number): number => {
  const afterDiscount = basePrice * (1 - config.discountRate);
  const afterTax = afterDiscount * (1 + config.taxRate);
  return afterTax + config.shippingFee;
};

// ✅ Point-Free Style
const applyDiscount = (rate: number) => (price: number) => price * (1 - rate);
const applyTax = (rate: number) => (price: number) => price * (1 + rate);
const addShipping = (fee: number) => (price: number) => price + fee;

const createPriceCalculator = (config: PriceConfig) =>
  pipe(
    applyDiscount(config.discountRate),
    applyTax(config.taxRate),
    addShipping(config.shippingFee)
  );

const config: PriceConfig = {
  discountRate: 0.1,   // 9折
  taxRate: 0.13,       // 13% 税
  shippingFee: 15,     // 15元运费
};

const calculateFinalPrice = createPriceCalculator(config);

console.log('Pointed:', calculateFinalPricePointed(config, 100));
console.log('Point-Free:', calculateFinalPrice(100));
console.log();

// ============================================================================
// 6. 真实业务场景: 字符串处理
// ============================================================================

console.log('6. 真实业务场景: 字符串处理\n');

// ❌ Pointed Style
const sanitizeInputPointed = (input: string): string => {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
};

// ✅ Point-Free Style
const trim = (s: string) => s.trim();
const toLowerCase = (s: string) => s.toLowerCase();
const replaceSpecialChars = (s: string) => s.replace(/[^a-z0-9]/g, '-');

const sanitizeInput = pipe(trim, toLowerCase, replaceSpecialChars);

const input = '  Hello World! @123  ';
console.log('Pointed:', sanitizeInputPointed(input));
console.log('Point-Free:', sanitizeInput(input));

// 更进一步: URL slug 生成器
const removeMultipleDashes = (s: string) => s.replace(/-+/g, '-');
const removeLeadingTrailingDashes = (s: string) => s.replace(/^-|-$/g, '');

const createSlug = pipe(
  trim,
  toLowerCase,
  replaceSpecialChars,
  removeMultipleDashes,
  removeLeadingTrailingDashes
);

console.log('Slug:', createSlug('  Hello World! @123  '));
console.log();

// ============================================================================
// 7. Point-Free 的优势与劣势
// ============================================================================

console.log('7. Point-Free 的优势与劣势\n');

/**
 * ✅ 优势:
 * 
 * 1. 简洁性 - 减少参数声明的样板代码
 * 2. 可组合性 - 更容易组合小函数
 * 3. 可重用性 - 函数作为构建块可以重用
 * 4. 声明式 - 关注"做什么"而非"怎么做"
 * 5. 可测试性 - 小函数易于单独测试
 * 
 * ❌ 劣势:
 * 
 * 1. 学习曲线 - 对初学者不友好
 * 2. 可读性 - 过度使用会降低代码可读性
 * 3. 调试困难 - 错误信息不直观
 * 4. 类型推断 - TypeScript 对深度组合的类型推断有限
 * 5. 性能 - 额外的函数调用有轻微开销
 */

// ✅ 好的使用场景: 简单的转换链
const processNumbers = pipe(
  (arr: number[]) => arr.filter(x => x > 0),
  (arr: number[]) => arr.map(x => x * 2),
  (arr: number[]) => arr.reduce((sum, x) => sum + x, 0)
);

console.log('好的 Point-Free:', processNumbers([1, -2, 3, -4, 5]));

// ❌ 不好的使用场景: 复杂逻辑
// 这种情况 Pointed Style 更清晰
const complexCalculation = (a: number, b: number, c: number): number => {
  if (a > b) {
    return a * c;
  } else if (b > c) {
    return b * c;
  } else {
    return a + b + c;
  }
};

console.log('复杂逻辑应该用 Pointed:', complexCalculation(5, 3, 2));
console.log();

// ============================================================================
// 8. Point-Free 的最佳实践
// ============================================================================

console.log('8. Point-Free 的最佳实践\n');

/**
 * ✅ 何时使用 Point-Free:
 * 
 * 1. 简单的数据转换管道
 * 2. 函数组合清晰表达意图时
 * 3. 可重用的工具函数
 * 4. 函数参数直接传递给另一个函数
 * 
 * ❌ 何时避免:
 * 
 * 1. 复杂的条件逻辑
 * 2. 需要多个参数且参数间有复杂关系
 * 3. 调试关键路径的代码
 * 4. 团队成员不熟悉函数式编程
 */

// ✅ 好的例子: 清晰的意图
const sumOfSquares = pipe(
  (arr: number[]) => arr.map(x => x * x),
  (arr: number[]) => arr.reduce((sum, x) => sum + x, 0)
);

console.log('平方和:', sumOfSquares([1, 2, 3, 4, 5]));

// ✅ 好的例子: 有意义的函数名
const activeUsers = users.filter(isActive);
const adultUsers = users.filter(isAdult);

console.log('活跃用户数:', activeUsers.length);
console.log('成年用户数:', adultUsers.length);

// ❌ 不好的例子: 过度抽象
// 这样写反而降低了可读性
const mystery = pipe(
  (x: number) => x + 1,
  (x: number) => x * 2,
  (x: number) => x - 3,
  (x: number) => x / 4
);
console.log('过度抽象:', mystery(10));
// 不如直接: (((10 + 1) * 2) - 3) / 4

console.log();

// ============================================================================
// 9. 混合使用 Point-Free 和 Pointed
// ============================================================================

console.log('9. 混合使用 Point-Free 和 Pointed\n');

/**
 * 实际项目中,应该灵活混用两种风格
 * 以可读性和可维护性为首要目标
 */

// 示例: 订单处理系统
type Order = {
  id: number;
  userId: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped';
  createdAt: Date;
};

const orders: Order[] = [
  { id: 1, userId: 1, total: 100, status: 'paid', createdAt: new Date('2024-01-01') },
  { id: 2, userId: 2, total: 200, status: 'pending', createdAt: new Date('2024-01-02') },
  { id: 3, userId: 1, total: 150, status: 'shipped', createdAt: new Date('2024-01-03') },
];

// Point-Free: 简单的过滤器
const isPaid = (order: Order) => order.status === 'paid';
const isShipped = (order: Order) => order.status === 'shipped';

// Pointed: 复杂的业务逻辑
const calculateUserTotalSpent = (userId: number, orders: Order[]): number => {
  return orders
    .filter(order => order.userId === userId)
    .filter(order => order.status === 'paid' || order.status === 'shipped')
    .reduce((total, order) => total + order.total, 0);
};

console.log('用户1总消费:', calculateUserTotalSpent(1, orders));

// Point-Free: 可重用的转换
const getTotal = (order: Order) => order.total;
const sum = (numbers: number[]) => numbers.reduce((a, b) => a + b, 0);

const calculateTotalRevenue = pipe(
  (orders: Order[]) => orders.filter(isPaid),
  (orders: Order[]) => orders.map(getTotal),
  sum
);

console.log('总收入:', calculateTotalRevenue(orders));
console.log();

console.log('=== 示例结束 ===');

// 导出供其他模块使用
export {
  compose,
  pipe,
  prop,
  filter,
  map,
  isActive,
  isAdult,
  getEmail,
  createPriceCalculator,
  sanitizeInput,
  createSlug,
  sumOfSquares,
};

export type { User, PriceConfig, Order };
