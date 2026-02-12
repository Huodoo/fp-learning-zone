/**
 * 第二章第二节: 闭包 (Closures)
 * 
 * 闭包是函数和其词法环境的组合
 * 即使外部函数已经返回,内部函数仍然可以访问外部函数的变量
 */

console.log('=== 闭包 (Closures) ===\n');

// ============================================================================
// 1. 什么是闭包?
// ============================================================================

console.log('1. 什么是闭包?\n');

// 最简单的闭包示例
function outerFunction() {
  const outerVariable = '我是外部变量';
  
  function innerFunction() {
    console.log(outerVariable);  // 内部函数可以访问外部变量
  }
  
  return innerFunction;
}

const closure = outerFunction();
closure();  // '我是外部变量' - 即使 outerFunction 已经返回
console.log();

// ============================================================================
// 2. 闭包的实际应用: 数据隐藏
// ============================================================================

console.log('2. 数据隐藏和封装\n');

// 创建一个计数器 - 封装私有状态
function createCounter(initialValue: number = 0) {
  let count = initialValue;  // 私有变量,外部无法直接访问
  
  return {
    increment(): number {
      return ++count;
    },
    decrement(): number {
      return --count;
    },
    getCount(): number {
      return count;
    },
    reset(): void {
      count = initialValue;
    }
  };
}

const counter1 = createCounter(10);
console.log('初始值:', counter1.getCount());
console.log('increment:', counter1.increment());
console.log('increment:', counter1.increment());
console.log('decrement:', counter1.decrement());
console.log('当前值:', counter1.getCount());

// 每个计数器都有自己的独立状态
const counter2 = createCounter(100);
console.log('counter2:', counter2.getCount());
console.log('counter1 不受影响:', counter1.getCount());
console.log();

// ============================================================================
// 3. 闭包的应用: 函数工厂
// ============================================================================

console.log('3. 函数工厂\n');

// 创建带前缀的日志记录器
function createLogger(prefix: string) {
  return function(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${prefix}] ${message}`);
  };
}

const errorLogger = createLogger('ERROR');
const infoLogger = createLogger('INFO');
const debugLogger = createLogger('DEBUG');

errorLogger('发生了一个错误');
infoLogger('操作成功完成');
debugLogger('调试信息');

// 创建定制的数学运算器
function createMathOperation(
  operation: string,
  fn: (a: number, b: number) => number
) {
  return function(a: number, b: number): void {
    const result = fn(a, b);
    console.log(`${a} ${operation} ${b} = ${result}`);
  };
}

const add = createMathOperation('+', (a, b) => a + b);
const multiply = createMathOperation('×', (a, b) => a * b);

add(5, 3);
multiply(5, 3);
console.log();

// ============================================================================
// 4. 闭包的应用: 偏函数应用 (Partial Application)
// ============================================================================

console.log('4. 偏函数应用\n');

// 通用的偏应用函数
function partial<A, B, C>(
  fn: (a: A, b: B) => C,
  a: A
): (b: B) => C {
  return function(b: B): C {
    return fn(a, b);
  };
}

function multiplyNums(a: number, b: number): number {
  return a * b;
}

// 固定第一个参数
const multiplyBy5 = partial(multiplyNums, 5);
const multiplyBy10 = partial(multiplyNums, 10);

console.log('multiplyBy5(3):', multiplyBy5(3));
console.log('multiplyBy10(3):', multiplyBy10(3));

// 更实用的例子: 配置化的 fetch
type FetchConfig = {
  baseURL: string;
  headers: Record<string, string>;
};

function createFetchWithConfig(config: FetchConfig) {
  return async function(endpoint: string, options: RequestInit = {}) {
    const url = `${config.baseURL}${endpoint}`;
    const headers = { ...config.headers, ...options.headers };
    
    console.log(`模拟请求: ${url}`);
    console.log('请求头:', headers);
    
    // 实际项目中这里会调用 fetch
    return { ok: true, data: 'mock data' };
  };
}

const apiFetch = createFetchWithConfig({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
  },
});

apiFetch('/users', { method: 'GET' });
apiFetch('/posts', { method: 'POST' });
console.log();

// ============================================================================
// 5. 闭包的应用: 记忆化 (Memoization)
// ============================================================================

console.log('5. 记忆化 (缓存函数结果)\n');

/**
 * 创建一个记忆化版本的函数
 * 缓存之前计算过的结果,避免重复计算
 */
function memoize<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  const cache = new Map<string, R>();
  
  return function(...args: T): R {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      console.log(`缓存命中: ${key}`);
      return cache.get(key)!;
    }
    
    console.log(`计算中: ${key}`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// 斐波那契数列 - 经典的记忆化示例
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFibonacci = memoize(fibonacci);

console.log('第一次计算 fib(10):', memoizedFibonacci(10));
console.log('第二次计算 fib(10):', memoizedFibonacci(10));  // 从缓存读取

// 更实用的例子: 缓存API请求结果
function createCachedFetch<T>(
  fetcher: (id: string) => Promise<T>,
  ttl: number = 5000  // 缓存有效期(毫秒)
) {
  const cache = new Map<string, { data: T; timestamp: number }>();
  
  return async function(id: string): Promise<T> {
    const now = Date.now();
    const cached = cache.get(id);
    
    // 如果缓存存在且未过期
    if (cached && now - cached.timestamp < ttl) {
      console.log(`使用缓存数据: ${id}`);
      return cached.data;
    }
    
    console.log(`获取新数据: ${id}`);
    const data = await fetcher(id);
    cache.set(id, { data, timestamp: now });
    return data;
  };
}

// 模拟API调用
async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ id, name: `User ${id}` });
    }, 100);
  });
}

const cachedFetchUser = createCachedFetch(fetchUser, 10000);

// 连续调用会使用缓存
(async () => {
  await cachedFetchUser('123');
  await cachedFetchUser('123');  // 使用缓存
  await cachedFetchUser('456');  // 新数据
})();

console.log();

// ============================================================================
// 6. 闭包的应用: 事件处理器
// ============================================================================

console.log('6. 事件处理器中的闭包\n');

/**
 * 创建一个带防抖的事件处理器
 */
function createDebounced<T extends unknown[]>(
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

// 模拟搜索输入
function handleSearch(query: string): void {
  console.log(`搜索: ${query}`);
}

const debouncedSearch = createDebounced(handleSearch, 300);

// 模拟用户快速输入
console.log('模拟快速输入:');
debouncedSearch('a');
debouncedSearch('ab');
debouncedSearch('abc');
// 只有最后一次会真正执行

setTimeout(() => {
  console.log('(300ms后)');
}, 350);

/**
 * 创建一个节流的事件处理器
 */
function createThrottled<T extends unknown[]>(
  fn: (...args: T) => void,
  interval: number
): (...args: T) => void {
  let lastCallTime = 0;
  
  return function(...args: T): void {
    const now = Date.now();
    
    if (now - lastCallTime >= interval) {
      fn(...args);
      lastCallTime = now;
    } else {
      console.log('节流中,跳过调用');
    }
  };
}

function handleScroll(position: number): void {
  console.log(`滚动位置: ${position}`);
}

const throttledScroll = createThrottled(handleScroll, 1000);

console.log('\n模拟快速滚动:');
throttledScroll(100);
throttledScroll(200);  // 被跳过
throttledScroll(300);  // 被跳过
console.log();

// ============================================================================
// 7. 闭包的应用: 模块模式
// ============================================================================

console.log('7. 模块模式\n');

/**
 * 使用闭包实现模块化
 * 只暴露公共 API,隐藏内部实现
 */
const ShoppingCart = (function() {
  // 私有状态
  let items: Array<{ id: string; name: string; price: number; quantity: number }> = [];
  
  // 私有方法
  function findItem(id: string) {
    return items.find(item => item.id === id);
  }
  
  function calculateTotal(): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  
  // 公共 API
  return {
    addItem(id: string, name: string, price: number, quantity: number = 1) {
      const existingItem = findItem(id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.push({ id, name, price, quantity });
      }
      
      console.log(`添加商品: ${name} x${quantity}`);
    },
    
    removeItem(id: string) {
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        const removed = items.splice(index, 1)[0];
        console.log(`移除商品: ${removed!.name}`);
      }
    },
    
    updateQuantity(id: string, quantity: number) {
      const item = findItem(id);
      if (item) {
        item.quantity = quantity;
        console.log(`更新数量: ${item.name} -> ${quantity}`);
      }
    },
    
    getTotal(): number {
      return calculateTotal();
    },
    
    getItems() {
      return [...items];  // 返回副本,防止外部修改
    },
    
    clear() {
      items = [];
      console.log('清空购物车');
    }
  };
})();

// 使用购物车模块
ShoppingCart.addItem('1', 'iPhone', 5999, 1);
ShoppingCart.addItem('2', 'AirPods', 1299, 2);
console.log('总价:', ShoppingCart.getTotal());
console.log('商品列表:', ShoppingCart.getItems());
ShoppingCart.removeItem('2');
console.log('移除后总价:', ShoppingCart.getTotal());
console.log();

// ============================================================================
// 8. 闭包的陷阱: 循环中的闭包
// ============================================================================

console.log('8. 闭包的常见陷阱\n');

// ❌ 错误示例: 循环中的闭包
console.log('❌ 错误的循环闭包:');
const functions1: Array<() => void> = [];

for (var i = 0; i < 3; i++) {
  functions1.push(function() {
    console.log(i);
  });
}

// 预期: 0, 1, 2
// 实际: 3, 3, 3
functions1.forEach(fn => fn());

// ✅ 解决方案1: 使用 let (块级作用域)
console.log('\n✅ 使用 let:');
const functions2: Array<() => void> = [];

for (let i = 0; i < 3; i++) {
  functions2.push(function() {
    console.log(i);
  });
}

functions2.forEach(fn => fn());

// ✅ 解决方案2: 使用 IIFE 创建新作用域
console.log('\n✅ 使用 IIFE:');
const functions3: Array<() => void> = [];

for (var j = 0; j < 3; j++) {
  (function(index) {
    functions3.push(function() {
      console.log(index);
    });
  })(j);
}

functions3.forEach(fn => fn());
console.log();

// ============================================================================
// 9. 闭包的内存管理
// ============================================================================

console.log('9. 闭包与内存管理\n');

/**
 * 闭包会持有对外部变量的引用
 * 如果不小心,可能导致内存泄漏
 */

// ❌ 潜在的内存泄漏
function createLeakyHandler() {
  const hugeArray = new Array(1000000).fill('data');  // 大数据
  
  return function() {
    // 即使不使用 hugeArray,它也会被保留在内存中
    console.log('处理某些事情');
  };
}

// ✅ 避免内存泄漏: 只引用需要的数据
function createEfficientHandler() {
  const hugeArray = new Array(1000000).fill('data');
  const neededData = hugeArray[0];  // 只提取需要的数据
  
  return function() {
    console.log('使用数据:', neededData);
    // hugeArray 可以被垃圾回收
  };
}

console.log('创建高效的处理器...');
const handler = createEfficientHandler();
handler();
console.log();

// ============================================================================
// 10. 真实业务场景: 配置管理器
// ============================================================================

console.log('10. 真实业务场景: 配置管理器\n');

type Config = {
  apiUrl: string;
  timeout: number;
  retryCount: number;
  debug: boolean;
};

function createConfigManager(initialConfig: Config) {
  let config = { ...initialConfig };
  const listeners: Array<(config: Config) => void> = [];
  
  return {
    get<K extends keyof Config>(key: K): Config[K] {
      return config[key];
    },
    
    set<K extends keyof Config>(key: K, value: Config[K]): void {
      const oldValue = config[key];
      config = { ...config, [key]: value };
      
      console.log(`配置更新: ${String(key)} = ${oldValue} -> ${value}`);
      
      // 通知所有监听器
      listeners.forEach(listener => listener(config));
    },
    
    getAll(): Readonly<Config> {
      return { ...config };
    },
    
    subscribe(listener: (config: Config) => void): () => void {
      listeners.push(listener);
      
      // 返回取消订阅函数
      return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };
}

const configManager = createConfigManager({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retryCount: 3,
  debug: false,
});

// 订阅配置变化
const unsubscribe = configManager.subscribe((config) => {
  console.log('配置变化通知:', config.debug);
});

console.log('当前 API URL:', configManager.get('apiUrl'));
configManager.set('debug', true);
configManager.set('timeout', 10000);

// 取消订阅
unsubscribe();
configManager.set('debug', false);  // 不会触发通知

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用
export {
  createCounter,
  createLogger,
  createMathOperation,
  partial,
  memoize,
  createCachedFetch,
  createDebounced,
  createThrottled,
  ShoppingCart,
  createConfigManager,
};

export type { Config };
