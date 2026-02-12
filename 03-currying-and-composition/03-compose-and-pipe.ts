/**
 * 第三章第三节: 函数组合 (Compose) 和管道 (Pipe)
 * 
 * 函数组合是将多个简单函数组合成复杂函数的技术
 * 这是函数式编程中最强大的工具之一
 */

console.log('=== 函数组合 (Compose) 和管道 (Pipe) ===\n');

// ============================================================================
// 1. 基础概念: 什么是函数组合?
// ============================================================================

console.log('1. 基础概念: 什么是函数组合?\n');

/**
 * 数学中的函数组合:
 * 如果有 f(x) = x + 1 和 g(x) = x * 2
 * 那么 (f ∘ g)(x) = f(g(x)) = (x * 2) + 1
 * 
 * 在编程中,我们将这个概念应用于数据转换
 */

// 简单示例: 不使用组合
const add1 = (x: number): number => x + 1;
const multiply2 = (x: number): number => x * 2;
const square = (x: number): number => x * x;

const result1 = add1(multiply2(square(5)));  // ((5^2) * 2) + 1 = 51
console.log('嵌套调用:', result1);

// 问题: 嵌套调用难以阅读,从内向外读

// ============================================================================
// 2. 实现 compose (从右到左)
// ============================================================================

console.log('\n2. 实现 compose (从右到左)\n');

// 简单版本: 只支持两个函数
function compose<A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B
): (a: A) => C {
  return (a: A) => f(g(a));
}

const operation1 = compose(add1, multiply2);
console.log('compose(+1, *2)(5):', operation1(5));  // (5 * 2) + 1 = 11

// 通用版本: 支持任意数量的函数
function composeMany<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((result, fn) => fn(result), arg);
}

const operation2 = composeMany(add1, multiply2, square);
console.log('composeMany(+1, *2, ^2)(5):', operation2(5));  // ((5^2) * 2) + 1 = 51

// 执行顺序: square(5) -> multiply2(25) -> add1(50) = 51
// 从右到左执行!
console.log();

// ============================================================================
// 3. 实现 pipe (从左到右)
// ============================================================================

console.log('3. 实现 pipe (从左到右)\n');

// pipe 和 compose 的区别: 执行顺序相反
// pipe 从左到右,更符合阅读习惯

function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

const operation3 = pipe(square, multiply2, add1);
console.log('pipe(^2, *2, +1)(5):', operation3(5));  // ((5^2) * 2) + 1 = 51

// 执行顺序: square(5) -> multiply2(25) -> add1(50) = 51
// 从左到右执行,更直观!

// 比较 compose 和 pipe
const withCompose = composeMany(add1, multiply2, square);
const withPipe = pipe(square, multiply2, add1);

console.log('compose 结果:', withCompose(5));
console.log('pipe 结果:', withPipe(5));
console.log('两者等价:', withCompose(5) === withPipe(5));
console.log();

// ============================================================================
// 4. 类型安全的 pipe 实现
// ============================================================================

console.log('4. 类型安全的 pipe\n');

// 重载版本: 支持不同类型的函数链
function pipeTypeSafe<A, B>(f1: (a: A) => B): (a: A) => B;
function pipeTypeSafe<A, B, C>(
  f1: (a: A) => B,
  f2: (b: B) => C
): (a: A) => C;
function pipeTypeSafe<A, B, C, D>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D
): (a: A) => D;
function pipeTypeSafe<A, B, C, D, E>(
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E
): (a: A) => E;
function pipeTypeSafe(...fns: Array<(arg: any) => any>): (arg: any) => any {
  return (arg: any) => fns.reduce((result, fn) => fn(result), arg);
}

// 类型安全: 每个函数的输出类型必须匹配下一个函数的输入类型
const toNumber = (s: string): number => parseInt(s, 10);
const double = (n: number): number => n * 2;
const toString = (n: number): string => n.toString();

const processString = pipeTypeSafe(toNumber, double, toString);
console.log('类型安全的 pipe("5"):', processString('5'));  // "10"
console.log();

// ============================================================================
// 5. 真实业务场景: 用户数据处理
// ============================================================================

console.log('5. 真实业务场景: 用户数据处理\n');

type User = {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
};

type UserDTO = {
  id: number;
  name: string;
  email: string;
};

const users: User[] = [
  { id: 1, name: 'alice', email: 'ALICE@EXAMPLE.COM', age: 25, isActive: true },
  { id: 2, name: 'bob', email: 'BOB@EXAMPLE.COM', age: 17, isActive: true },
  { id: 3, name: 'charlie', email: 'CHARLIE@EXAMPLE.COM', age: 30, isActive: false },
  { id: 4, name: 'david', email: 'DAVID@EXAMPLE.COM', age: 28, isActive: true },
];

// 定义小的转换函数
const filterActiveUsers = (users: User[]): User[] =>
  users.filter(u => u.isActive);

const filterAdults = (users: User[]): User[] =>
  users.filter(u => u.age >= 18);

const normalizeNames = (users: User[]): User[] =>
  users.map(u => ({
    ...u,
    name: u.name.charAt(0).toUpperCase() + u.name.slice(1),
  }));

const normalizeEmails = (users: User[]): User[] =>
  users.map(u => ({ ...u, email: u.email.toLowerCase() }));

const toDTO = (users: User[]): UserDTO[] =>
  users.map(({ id, name, email }) => ({ id, name, email }));

// 使用 pipe 组合数据处理管道
const processUsers = pipe(
  filterActiveUsers,
  filterAdults,
  normalizeNames,
  normalizeEmails,
  toDTO
);

const processedUsers = processUsers(users);
console.log('处理后的用户:', processedUsers);
console.log();

// ============================================================================
// 6. 真实业务场景: 价格计算管道
// ============================================================================

console.log('6. 真实业务场景: 价格计算管道\n');

type Product = {
  name: string;
  basePrice: number;
};

type PricedProduct = Product & {
  finalPrice: number;
};

// 定义价格转换函数
const applyDiscount = (rate: number) => (product: Product): Product => ({
  ...product,
  basePrice: product.basePrice * (1 - rate),
});

const applyTax = (rate: number) => (product: Product): Product => ({
  ...product,
  basePrice: product.basePrice * (1 + rate),
});

const addShippingFee = (fee: number) => (product: Product): Product => ({
  ...product,
  basePrice: product.basePrice + fee,
});

const roundPrice = (product: Product): PricedProduct => ({
  ...product,
  finalPrice: Math.round(product.basePrice * 100) / 100,
});

// 组合价格计算管道
const calculatePrice = pipe(
  applyDiscount(0.1),    // 9折
  applyTax(0.13),        // 13% 税
  addShippingFee(15),    // 15元运费
  roundPrice
);

const product: Product = { name: 'iPhone 15', basePrice: 5999 };
const pricedProduct = calculatePrice(product);

console.log('商品:', product.name);
console.log('基础价格:', product.basePrice);
console.log('最终价格:', pricedProduct.finalPrice);
console.log();

// ============================================================================
// 7. 真实业务场景: 表单验证管道
// ============================================================================

console.log('7. 真实业务场景: 表单验证管道\n');

type ValidationError = {
  field: string;
  message: string;
};

type FormData = {
  username: string;
  email: string;
  password: string;
};

type ValidationResult = {
  data: FormData;
  errors: ValidationError[];
};

// 定义验证函数
const validateUsername = (result: ValidationResult): ValidationResult => {
  const { username } = result.data;
  if (username.length < 3) {
    result.errors.push({ field: 'username', message: '用户名至少3个字符' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    result.errors.push({ field: 'username', message: '用户名只能包含字母、数字和下划线' });
  }
  return result;
};

const validateEmail = (result: ValidationResult): ValidationResult => {
  const { email } = result.data;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    result.errors.push({ field: 'email', message: '邮箱格式不正确' });
  }
  return result;
};

const validatePassword = (result: ValidationResult): ValidationResult => {
  const { password } = result.data;
  if (password.length < 6) {
    result.errors.push({ field: 'password', message: '密码至少6个字符' });
  }
  if (!/[A-Z]/.test(password)) {
    result.errors.push({ field: 'password', message: '密码必须包含大写字母' });
  }
  return result;
};

// 组合验证管道
const validateForm = pipe(
  validateUsername,
  validateEmail,
  validatePassword
);

// 测试验证
const validData: FormData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Secret123',
};

const invalidData: FormData = {
  username: 'ab',
  email: 'invalid-email',
  password: '123',
};

const result1 = validateForm({ data: validData, errors: [] });
const result2 = validateForm({ data: invalidData, errors: [] });

console.log('有效数据验证:', result1.errors.length === 0 ? '通过' : '失败');
console.log('无效数据验证:', result2.errors);
console.log();

// ============================================================================
// 8. 真实业务场景: 日志和监控管道
// ============================================================================

console.log('8. 真实业务场景: 日志和监控管道\n');

// 装饰器: 在管道中添加日志
function trace<T>(label: string) {
  return (value: T): T => {
    console.log(`[${label}]`, value);
    return value;
  };
}

// 计时装饰器
function time<T>(label: string) {
  const start = Date.now();
  return (value: T): T => {
    const duration = Date.now() - start;
    console.log(`[${label}] 耗时: ${duration}ms`);
    return value;
  };
}

// 使用装饰器的管道
const processWithLogging = pipe(
  trace('输入'),
  square,
  trace('平方后'),
  multiply2,
  trace('翻倍后'),
  add1,
  trace('输出')
);

console.log('带日志的管道:');
processWithLogging(5);
console.log();

// ============================================================================
// 9. 异步管道 (Async Pipe)
// ============================================================================

console.log('9. 异步管道 (Async Pipe)\n');

// 异步版本的 pipe
function pipeAsync<T>(
  ...fns: Array<(arg: T) => Promise<T> | T>
): (arg: T) => Promise<T> {
  return async (arg: T) => {
    let result = arg;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}

// 模拟异步操作
const fetchUserData = async (userId: number): Promise<{ id: number; name: string }> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  return { id: userId, name: `User${userId}` };
};

const enrichUserData = async (user: { id: number; name: string }) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { ...user, email: `${user.name.toLowerCase()}@example.com` };
};

const validateUserData = (user: any) => {
  if (!user.email) throw new Error('缺少邮箱');
  return user;
};

// 组合异步管道
const processUserData = pipeAsync(
  fetchUserData,
  enrichUserData,
  validateUserData
);

// 使用异步管道
processUserData(1)
  .then(user => console.log('处理后的用户数据:', user))
  .catch(err => console.error('错误:', err));

// 给异步操作一些时间完成
setTimeout(() => {
  console.log();
  console.log('=== 示例结束 ===');
}, 500);

// ============================================================================
// 10. 组合的最佳实践
// ============================================================================

/**
 * ✅ 函数组合的优势:
 * 
 * 1. 可读性 - pipe 从左到右,符合阅读习惯
 * 2. 可维护性 - 小函数易于理解和测试
 * 3. 可重用性 - 函数可以在多个管道中复用
 * 4. 可组合性 - 管道本身也可以组合
 * 5. 声明式 - 关注"做什么"而非"怎么做"
 * 
 * ✅ 最佳实践:
 * 
 * 1. 保持函数单一职责
 * 2. 使用有意义的函数名
 * 3. 优先使用 pipe (更直观)
 * 4. 每个步骤都应该是纯函数
 * 5. 考虑类型安全
 * 
 * ❌ 注意事项:
 * 
 * 1. 不要过度组合 - 太长的管道难以理解
 * 2. 注意性能 - 多次遍历数组可能影响性能
 * 3. 错误处理 - 管道中的错误可能难以定位
 * 4. 调试困难 - 使用 trace 等工具辅助调试
 */

// 导出供其他模块使用
export {
  compose,
  composeMany,
  pipe,
  pipeTypeSafe,
  pipeAsync,
  trace,
  time,
  processUsers,
  calculatePrice,
  validateForm,
};

export type { User, UserDTO, Product, PricedProduct, ValidationError, FormData, ValidationResult };
