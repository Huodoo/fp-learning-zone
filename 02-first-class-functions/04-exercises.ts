/**
 * 第二章练习题: 函数是一等公民
 * 
 * 完成以下练习,加深对高阶函数和闭包的理解
 */

console.log('=== 第二章练习题 ===\n');

// ============================================================================
// 练习 1: 实现自己的数组方法
// ============================================================================

console.log('练习 1: 实现自己的数组方法\n');

/**
 * 任务: 实现以下数组方法(不使用内置方法)
 * - myMap
 * - myFilter
 * - myReduce
 * - myFind
 * - myFindIndex
 */

// TODO: 实现 myMap
function myMap<T, U>(
  arr: readonly T[],
  mapper: (item: T, index: number) => U
): U[] {
  const result: U[] = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(mapper(arr[i]!, i));
  }
  return result;
}

// TODO: 实现 myFilter
function myFilter<T>(
  arr: readonly T[],
  predicate: (item: T, index: number) => boolean
): T[] {
  const result: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i]!, i)) {
      result.push(arr[i]!);
    }
  }
  return result;
}

// TODO: 实现 myReduce
function myReduce<T, U>(
  arr: readonly T[],
  reducer: (acc: U, item: T, index: number) => U,
  initialValue: U
): U {
  let acc = initialValue;
  for (let i = 0; i < arr.length; i++) {
    acc = reducer(acc, arr[i]!, i);
  }
  return acc;
}

// TODO: 实现 myFind
function myFind<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): T | undefined {
  for (const item of arr) {
    if (predicate(item)) {
      return item;
    }
  }
  return undefined;
}

// TODO: 实现 myFindIndex
function myFindIndex<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): number {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i]!)) {
      return i;
    }
  }
  return -1;
}

// 测试
const numbers = [1, 2, 3, 4, 5];

console.log('myMap 测试:', myMap(numbers, x => x * 2));
console.log('myFilter 测试:', myFilter(numbers, x => x > 3));
console.log('myReduce 测试:', myReduce(numbers, (sum, x) => sum + x, 0));
console.log('myFind 测试:', myFind(numbers, x => x > 3));
console.log('myFindIndex 测试:', myFindIndex(numbers, x => x > 3));
console.log();

// ============================================================================
// 练习 2: 实现函数组合
// ============================================================================

console.log('练习 2: 实现函数组合\n');

/**
 * 任务: 实现一个通用的 compose 函数,支持任意数量的函数组合
 * 
 * 提示: 使用 reduce 从右到左组合函数
 */

// TODO: 实现 compose
function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

// TODO: 实现 pipe (从左到右)
function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

// 测试
const add10 = (x: number) => x + 10;
const multiply2 = (x: number) => x * 2;
const subtract5 = (x: number) => x - 5;

const composedFn = compose(subtract5, multiply2, add10);
const pipedFn = pipe(add10, multiply2, subtract5);

console.log('compose 测试 (5):', composedFn(5));  // ((5 + 10) * 2) - 5 = 25
console.log('pipe 测试 (5):', pipedFn(5));        // ((5 + 10) * 2) - 5 = 25
console.log();

// ============================================================================
// 练习 3: 实现柯里化
// ============================================================================

console.log('练习 3: 实现柯里化\n');

/**
 * 任务: 实现一个通用的 curry 函数
 * 将多参数函数转换为单参数函数的嵌套
 */

// TODO: 实现 curry (简化版,固定3个参数)
function curry3<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (a: A) => (b: B) => (c: C) => R {
  return (a: A) => (b: B) => (c: C) => fn(a, b, c);
}

// 测试
function sum3(a: number, b: number, c: number): number {
  return a + b + c;
}

const curriedSum = curry3(sum3);
console.log('柯里化测试:', curriedSum(1)(2)(3));  // 6
console.log('部分应用:', curriedSum(10)(20)(30));  // 60

// 部分应用示例
const add5 = curriedSum(5);
const add5and10 = add5(10);
console.log('部分应用结果:', add5and10(15));  // 30
console.log();

// ============================================================================
// 练习 4: 实现防抖和节流
// ============================================================================

console.log('练习 4: 实现防抖和节流\n');

/**
 * 任务: 实现 debounce 和 throttle 函数
 */

// TODO: 实现 debounce
function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function(...args: T): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// TODO: 实现 throttle
function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  interval: number
): (...args: T) => void {
  let lastCallTime = 0;
  
  return function(...args: T): void {
    const now = Date.now();
    
    if (now - lastCallTime >= interval) {
      fn(...args);
      lastCallTime = now;
    }
  };
}

// 测试 (简单模拟)
let debounceCount = 0;
const debouncedFn = debounce(() => {
  debounceCount++;
  console.log('防抖函数执行:', debounceCount);
}, 100);

debouncedFn();
debouncedFn();
debouncedFn();

setTimeout(() => {
  console.log('防抖测试完成,执行次数:', debounceCount);  // 应该只执行1次
}, 200);

let throttleCount = 0;
const throttledFn = throttle(() => {
  throttleCount++;
  console.log('节流函数执行:', throttleCount);
}, 100);

throttledFn();  // 执行
setTimeout(() => throttledFn(), 50);   // 跳过
setTimeout(() => throttledFn(), 120);  // 执行
setTimeout(() => {
  console.log('节流测试完成,执行次数:', throttleCount);  // 应该执行2次
}, 250);

console.log();

// ============================================================================
// 练习 5: 实现记忆化
// ============================================================================

console.log('练习 5: 实现记忆化\n');

/**
 * 任务: 实现一个通用的 memoize 函数,支持多参数
 */

// TODO: 实现 memoize
function memoize<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  const cache = new Map<string, R>();
  
  return function(...args: T): R {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      console.log(`  缓存命中: ${fn.name}(${args.join(', ')})`);
      return cache.get(key)!;
    }
    
    console.log(`  计算中: ${fn.name}(${args.join(', ')})`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// 测试: 斐波那契数列
function slowFibonacci(n: number): number {
  if (n <= 1) return n;
  return slowFibonacci(n - 1) + slowFibonacci(n - 2);
}

// 创建记忆化版本
const fastFibonacci = memoize(function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fastFibonacci(n - 1) + fastFibonacci(n - 2);
});

console.log('斐波那契(10):', fastFibonacci(10));
console.log('再次计算斐波那契(10):');
fastFibonacci(10);  // 应该直接从缓存读取
console.log();

// ============================================================================
// 练习 6: 实现 once 函数
// ============================================================================

console.log('练习 6: 实现 once 函数\n');

/**
 * 任务: 实现一个 once 函数,确保传入的函数只执行一次
 */

// TODO: 实现 once
function once<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R | undefined {
  let called = false;
  let result: R;
  
  return function(...args: T): R | undefined {
    if (!called) {
      called = true;
      result = fn(...args);
      return result;
    }
    return result;
  };
}

// 测试
const initialize = once((name: string) => {
  console.log(`初始化: ${name}`);
  return `已初始化: ${name}`;
});

console.log(initialize('App'));  // 执行
console.log(initialize('App'));  // 不执行,返回之前的结果
console.log(initialize('App'));  // 不执行,返回之前的结果
console.log();

// ============================================================================
// 练习 7: 实现 partial 函数
// ============================================================================

console.log('练习 7: 实现 partial 函数\n');

/**
 * 任务: 实现 partial 函数,固定函数的部分参数
 */

// TODO: 实现 partial (2个参数版本)
function partial2<A, B, R>(
  fn: (a: A, b: B) => R,
  a: A
): (b: B) => R {
  return (b: B) => fn(a, b);
}

// TODO: 实现 partial (3个参数版本)
function partial3<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R,
  a: A,
  b: B
): (c: C) => R {
  return (c: C) => fn(a, b, c);
}

// 测试
function greet(greeting: string, name: string): string {
  return `${greeting}, ${name}!`;
}

const sayHello = partial2(greet, 'Hello');
console.log(sayHello('Alice'));  // Hello, Alice!
console.log(sayHello('Bob'));    // Hello, Bob!

function sum(a: number, b: number, c: number): number {
  return a + b + c;
}

const sum5and10 = partial3(sum, 5, 10);
console.log('5 + 10 + 15 =', sum5and10(15));  // 30
console.log();

// ============================================================================
// 练习 8: 实现链式调用
// ============================================================================

console.log('练习 8: 实现链式调用\n');

/**
 * 任务: 实现一个支持链式调用的数组包装器
 */

class ArrayWrapper<T> {
  private data: readonly T[];

  constructor(data: readonly T[]) {
    this.data = data;
  }

  // TODO: 实现 map
  map<U>(fn: (item: T) => U): ArrayWrapper<U> {
    return new ArrayWrapper(this.data.map(fn));
  }

  // TODO: 实现 filter
  filter(predicate: (item: T) => boolean): ArrayWrapper<T> {
    return new ArrayWrapper(this.data.filter(predicate));
  }

  // TODO: 实现 reduce
  reduce<U>(reducer: (acc: U, item: T) => U, initial: U): U {
    return this.data.reduce(reducer, initial);
  }

  // TODO: 实现 take
  take(count: number): ArrayWrapper<T> {
    return new ArrayWrapper(this.data.slice(0, count));
  }

  // TODO: 实现 value (获取结果)
  value(): readonly T[] {
    return this.data;
  }
}

// 辅助函数
function wrap<T>(data: readonly T[]): ArrayWrapper<T> {
  return new ArrayWrapper(data);
}

// 测试
const result = wrap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .filter(x => x > 3)
  .map(x => x * 2)
  .take(3)
  .value();

console.log('链式调用结果:', result);  // [8, 10, 12]

const sumResult = wrap([1, 2, 3, 4, 5])
  .map(x => x * 2)
  .reduce((acc, x) => acc + x, 0);

console.log('链式调用求和:', sumResult);  // 30
console.log();

// ============================================================================
// 练习 9: 实现重试逻辑
// ============================================================================

console.log('练习 9: 实现重试逻辑\n');

/**
 * 任务: 实现一个 retry 函数,支持失败重试
 */

// TODO: 实现 retry
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`尝试 ${attempt + 1} 失败: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError!.message}`);
}

// 测试
let attempts = 0;
async function unreliableFunction(): Promise<string> {
  attempts++;
  if (attempts < 3) {
    throw new Error('Network error');
  }
  return 'Success!';
}

(async () => {
  try {
    const result = await retry(unreliableFunction, 3, 100);
    console.log('重试成功:', result);
  } catch (error) {
    console.log('重试失败:', (error as Error).message);
  }
})();

console.log();

// ============================================================================
// 练习 10: 综合应用 - 数据处理管道
// ============================================================================

console.log('练习 10: 综合应用 - 数据处理管道\n');

/**
 * 任务: 使用高阶函数处理以下业务场景
 * 
 * 场景: 电商订单数据分析
 * 1. 过滤出已完成的订单
 * 2. 提取订单金额
 * 3. 计算总收入
 * 4. 按用户分组统计
 */

type Order = {
  readonly id: string;
  readonly userId: string;
  readonly amount: number;
  readonly status: 'pending' | 'completed' | 'cancelled';
  readonly items: readonly string[];
};

const orders: readonly Order[] = [
  { id: '1', userId: 'user1', amount: 100, status: 'completed', items: ['A', 'B'] },
  { id: '2', userId: 'user2', amount: 200, status: 'completed', items: ['C'] },
  { id: '3', userId: 'user1', amount: 150, status: 'pending', items: ['D'] },
  { id: '4', userId: 'user3', amount: 300, status: 'completed', items: ['E', 'F'] },
  { id: '5', userId: 'user2', amount: 250, status: 'cancelled', items: ['G'] },
  { id: '6', userId: 'user1', amount: 180, status: 'completed', items: ['H'] },
];

// TODO: 计算总收入(只统计已完成的订单)
const totalRevenue = orders
  .filter(order => order.status === 'completed')
  .map(order => order.amount)
  .reduce((sum, amount) => sum + amount, 0);

console.log('总收入:', totalRevenue);

// TODO: 按用户统计已完成订单的总金额
type UserStats = {
  userId: string;
  totalAmount: number;
  orderCount: number;
};

const userStats = orders
  .filter(order => order.status === 'completed')
  .reduce((stats, order) => {
    const existing = stats.find(s => s.userId === order.userId);
    
    if (existing) {
      existing.totalAmount += order.amount;
      existing.orderCount += 1;
    } else {
      stats.push({
        userId: order.userId,
        totalAmount: order.amount,
        orderCount: 1,
      });
    }
    
    return stats;
  }, [] as UserStats[]);

console.log('用户统计:', userStats);

// TODO: 找出消费最多的用户
const topUser = userStats.reduce((max, current) =>
  current.totalAmount > max.totalAmount ? current : max
);

console.log('消费最多的用户:', topUser);

// TODO: 计算平均订单金额
const completedOrders = orders.filter(order => order.status === 'completed');
const averageOrderAmount = completedOrders.reduce((sum, order) => sum + order.amount, 0) / completedOrders.length;

console.log('平均订单金额:', averageOrderAmount.toFixed(2));

console.log('\n=== 练习结束 ===');
console.log('\n💡 提示: 尝试运行 `npm run test:chapter2` 查看所有示例');

// 导出供测试使用
export {
  myMap,
  myFilter,
  myReduce,
  myFind,
  myFindIndex,
  compose,
  pipe,
  curry3,
  debounce,
  throttle,
  memoize,
  once,
  partial2,
  partial3,
  ArrayWrapper,
  wrap,
  retry,
};

export type { Order, UserStats };
