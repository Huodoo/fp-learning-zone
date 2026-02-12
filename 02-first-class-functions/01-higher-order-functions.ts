/**
 * 第二章第一节: 高阶函数 (Higher-Order Functions)
 * 
 * 高阶函数是接受函数作为参数或返回函数的函数
 * 它们是函数式编程的核心工具
 */

console.log('=== 高阶函数 (Higher-Order Functions) ===\n');

// ============================================================================
// 1. 基础概念: 函数作为一等公民
// ============================================================================

console.log('1. 函数作为一等公民\n');

// ✅ 函数可以赋值给变量
const add = (a: number, b: number): number => a + b;
const subtract = (a: number, b: number): number => a - b;

console.log('add 是一个变量:', typeof add);  // 'function'
console.log('add(5, 3) =', add(5, 3));

// ✅ 函数可以存储在数据结构中
const operations = {
  add,
  subtract,
  multiply: (a: number, b: number) => a * b,
  divide: (a: number, b: number) => a / b,
};

console.log('operations.multiply(4, 3) =', operations.multiply(4, 3));

// ✅ 函数可以作为参数传递
function calculate(
  operation: (a: number, b: number) => number,
  a: number,
  b: number
): number {
  return operation(a, b);
}

console.log('calculate(add, 10, 5) =', calculate(add, 10, 5));
console.log('calculate(subtract, 10, 5) =', calculate(subtract, 10, 5));
console.log();

// ============================================================================
// 2. 接受函数作为参数的高阶函数
// ============================================================================

console.log('2. 接受函数作为参数的高阶函数\n');

// 示例: 通用的数组过滤器
function filter<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): T[] {
  const result: T[] = [];
  for (const item of arr) {
    if (predicate(item)) {
      result.push(item);
    }
  }
  return result;
}

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const evenNumbers = filter(numbers, x => x % 2 === 0);
const greaterThan5 = filter(numbers, x => x > 5);

console.log('偶数:', evenNumbers);
console.log('大于5:', greaterThan5);

// 示例: 通用的数组映射器
function map<T, U>(
  arr: readonly T[],
  transform: (item: T) => U
): U[] {
  const result: U[] = [];
  for (const item of arr) {
    result.push(transform(item));
  }
  return result;
}

const doubled = map(numbers, x => x * 2);
const stringified = map(numbers, x => `数字${x}`);

console.log('翻倍:', doubled);
console.log('字符串化:', stringified);
console.log();

// ============================================================================
// 3. 返回函数的高阶函数
// ============================================================================

console.log('3. 返回函数的高阶函数\n');

// 示例: 函数工厂
function createMultiplier(factor: number): (x: number) => number {
  return (x: number) => x * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
const quadruple = createMultiplier(4);

console.log('double(5) =', double(5));      // 10
console.log('triple(5) =', triple(5));      // 15
console.log('quadruple(5) =', quadruple(5));  // 20

// 示例: 创建验证器
function createValidator<T>(
  rule: (value: T) => boolean,
  errorMessage: string
): (value: T) => { valid: boolean; error?: string } {
  return (value: T) => {
    const valid = rule(value);
    return valid ? { valid: true } : { valid: false, error: errorMessage };
  };
}

const isAdult = createValidator<number>(
  age => age >= 18,
  '年龄必须大于等于18岁'
);

const isValidEmail = createValidator<string>(
  email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  '邮箱格式不正确'
);

console.log('验证年龄15:', isAdult(15));
console.log('验证年龄20:', isAdult(20));
console.log('验证邮箱:', isValidEmail('test@example.com'));
console.log();

// ============================================================================
// 4. 函数组合器
// ============================================================================

console.log('4. 函数组合器\n');

// 示例: 简单的 compose (从右到左执行)
function compose<A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B
): (a: A) => C {
  return (a: A) => f(g(a));
}

const addOne = (x: number) => x + 1;
const multiplyByTwo = (x: number) => x * 2;

// 先乘以2,再加1
const operation1 = compose(addOne, multiplyByTwo);
console.log('compose(+1, *2)(5) =', operation1(5));  // (5 * 2) + 1 = 11

// 先加1,再乘以2
const operation2 = compose(multiplyByTwo, addOne);
console.log('compose(*2, +1)(5) =', operation2(5));  // (5 + 1) * 2 = 12

// 示例: pipe (从左到右执行)
function pipe<A, B, C>(
  f: (a: A) => B,
  g: (b: B) => C
): (a: A) => C {
  return (a: A) => g(f(a));
}

// 先加1,再乘以2
const operation3 = pipe(addOne, multiplyByTwo);
console.log('pipe(+1, *2)(5) =', operation3(5));  // (5 + 1) * 2 = 12
console.log();

// ============================================================================
// 5. 实用的高阶函数: forEach, some, every
// ============================================================================

console.log('5. 实用的高阶函数\n');

// 自实现 forEach (注意: 有副作用)
function forEach<T>(
  arr: readonly T[],
  action: (item: T, index: number) => void
): void {
  for (let i = 0; i < arr.length; i++) {
    action(arr[i]!, i);
  }
}

console.log('forEach 打印:');
forEach([1, 2, 3], (x, i) => console.log(`  索引${i}: ${x}`));

// 自实现 some (至少一个满足条件)
function some<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): boolean {
  for (const item of arr) {
    if (predicate(item)) {
      return true;
    }
  }
  return false;
}

console.log('some(>5):', some(numbers, x => x > 5));  // true
console.log('some(>100):', some(numbers, x => x > 100));  // false

// 自实现 every (所有都满足条件)
function every<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean
): boolean {
  for (const item of arr) {
    if (!predicate(item)) {
      return false;
    }
  }
  return true;
}

console.log('every(<20):', every(numbers, x => x < 20));  // true
console.log('every(<5):', every(numbers, x => x < 5));    // false
console.log();

// ============================================================================
// 6. 实用的高阶函数: reduce
// ============================================================================

console.log('6. reduce - 最强大的高阶函数\n');

// 自实现 reduce
function reduce<T, U>(
  arr: readonly T[],
  reducer: (accumulator: U, current: T, index: number) => U,
  initialValue: U
): U {
  let accumulator = initialValue;
  for (let i = 0; i < arr.length; i++) {
    accumulator = reducer(accumulator, arr[i]!, i);
  }
  return accumulator;
}

// 示例1: 求和
const sum = reduce(numbers, (acc, x) => acc + x, 0);
console.log('求和:', sum);

// 示例2: 求最大值
const max = reduce(numbers, (acc, x) => Math.max(acc, x), -Infinity);
console.log('最大值:', max);

// 示例3: 分组
type Person = {
  name: string;
  age: number;
  city: string;
};

const people: Person[] = [
  { name: '张三', age: 25, city: '北京' },
  { name: '李四', age: 30, city: '上海' },
  { name: '王五', age: 25, city: '北京' },
  { name: '赵六', age: 30, city: '上海' },
];

const groupedByAge = reduce(
  people,
  (acc, person) => {
    const key = person.age.toString();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(person);
    return acc;
  },
  {} as Record<string, Person[]>
);

console.log('按年龄分组:', groupedByAge);
console.log();

// ============================================================================
// 7. 真实业务场景: 数据处理管道
// ============================================================================

console.log('7. 真实业务场景: 数据处理管道\n');

type Product = {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly category: string;
  readonly inStock: boolean;
};

const products: readonly Product[] = [
  { id: 1, name: 'iPhone 15', price: 5999, category: '电子产品', inStock: true },
  { id: 2, name: 'MacBook Pro', price: 12999, category: '电子产品', inStock: true },
  { id: 3, name: 'AirPods', price: 1299, category: '电子产品', inStock: false },
  { id: 4, name: '咖啡机', price: 599, category: '家电', inStock: true },
  { id: 5, name: '空气炸锅', price: 399, category: '家电', inStock: true },
];

// 数据处理管道: 筛选 -> 转换 -> 聚合
const electronicsTotal = products
  .filter(p => p.category === '电子产品')  // 筛选电子产品
  .filter(p => p.inStock)                  // 筛选库存充足的
  .map(p => p.price)                       // 提取价格
  .reduce((sum, price) => sum + price, 0);  // 求和

console.log('电子产品(有库存)总价:', electronicsTotal);

// 更复杂的场景: 生成报告
type CategoryReport = {
  category: string;
  count: number;
  totalValue: number;
  averagePrice: number;
};

function generateCategoryReport(products: readonly Product[]): CategoryReport[] {
  // 先按类别分组
  const grouped = reduce(
    products,
    (acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    },
    {} as Record<string, Product[]>
  );

  // 转换为报告格式
  return Object.entries(grouped).map(([category, items]) => ({
    category,
    count: items.length,
    totalValue: items.reduce((sum, item) => sum + item.price, 0),
    averagePrice: items.reduce((sum, item) => sum + item.price, 0) / items.length,
  }));
}

const report = generateCategoryReport(products);
console.log('分类报告:', report);
console.log();

// ============================================================================
// 8. 高阶函数的组合应用
// ============================================================================

console.log('8. 高阶函数的组合应用\n');

// 创建一个通用的查询构建器
type QueryBuilder<T> = {
  data: readonly T[];
  where: (predicate: (item: T) => boolean) => QueryBuilder<T>;
  select: <U>(mapper: (item: T) => U) => QueryBuilder<U>;
  orderBy: (compareFn: (a: T, b: T) => number) => QueryBuilder<T>;
  take: (count: number) => QueryBuilder<T>;
  toArray: () => T[];
};

function query<T>(data: readonly T[]): QueryBuilder<T> {
  return {
    data,
    where(predicate) {
      return query(this.data.filter(predicate));
    },
    select<U>(mapper: (item: T) => U) {
      return query(this.data.map(mapper));
    },
    orderBy(compareFn) {
      return query([...this.data].sort(compareFn));
    },
    take(count) {
      return query(this.data.slice(0, count));
    },
    toArray() {
      return [...this.data];
    },
  };
}

// 使用查询构建器
const topExpensiveElectronics = query(products)
  .where(p => p.category === '电子产品')
  .where(p => p.inStock)
  .orderBy((a, b) => b.price - a.price)
  .take(2)
  .select(p => ({ name: p.name, price: p.price }))
  .toArray();

console.log('最贵的两个电子产品(有库存):', topExpensiveElectronics);
console.log();

// ============================================================================
// 9. 性能优化: 惰性求值 (Lazy Evaluation)
// ============================================================================

console.log('9. 惰性求值\n');

/**
 * 生成器版本的 map/filter - 惰性求值
 * 只在真正需要结果时才计算
 */
function* lazyMap<T, U>(
  items: Iterable<T>,
  mapper: (item: T) => U
): Generator<U> {
  for (const item of items) {
    yield mapper(item);
  }
}

function* lazyFilter<T>(
  items: Iterable<T>,
  predicate: (item: T) => boolean
): Generator<T> {
  for (const item of items) {
    if (predicate(item)) {
      yield item;
    }
  }
}

// 惰性求值: 链式调用不会立即执行
const lazyResult = lazyMap(
  lazyFilter(numbers, x => x > 5),
  x => x * 2
);

console.log('惰性结果(未求值):', lazyResult);

// 只在需要时才计算
console.log('取第一个结果:', lazyResult.next().value);
console.log('取第二个结果:', lazyResult.next().value);

// 或者一次性获取所有结果
const allResults = [...lazyMap(
  lazyFilter(numbers, x => x > 5),
  x => x * 2
)];
console.log('所有结果:', allResults);
console.log();

console.log('=== 示例结束 ===');

// 导出供其他模块使用
export {
  filter,
  map,
  reduce,
  forEach,
  some,
  every,
  compose,
  pipe,
  createMultiplier,
  createValidator,
  query,
  generateCategoryReport,
  lazyMap,
  lazyFilter,
};

export type { Person, Product, CategoryReport, QueryBuilder };
