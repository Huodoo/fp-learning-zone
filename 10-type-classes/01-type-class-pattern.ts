/**
 * 第十章第一节：类型类模式 (Type Class Pattern)
 * 
 * 本文件展示如何在 TypeScript 中模拟类型类
 * 实现常见类型类：Eq、Ord、Show、Semigroup、Monoid
 */

console.log('=== 类型类模式 (Type Class Pattern) ===\n');

// ============================================================================
// 1. Eq 类型类 - 相等性比较
// ============================================================================

console.log('1. Eq 类型类 - 相等性比较\n');

/**
 * Eq 类型类定义
 * 表示可以进行相等性比较的类型
 */
interface Eq<T> {
  equals: (a: T, b: T) => boolean;
}

// Eq 实例：数字
const eqNumber: Eq<number> = {
  equals: (a, b) => a === b
};

// Eq 实例：字符串
const eqString: Eq<string> = {
  equals: (a, b) => a === b
};

// Eq 实例：布尔值
const eqBoolean: Eq<boolean> = {
  equals: (a, b) => a === b
};

// 使用 Eq 类型类的通用函数
function elem<T>(item: T, list: T[], eq: Eq<T>): boolean {
  return list.some(x => eq.equals(x, item));
}

console.log('elem(2, [1, 2, 3], eqNumber):', elem(2, [1, 2, 3], eqNumber));
console.log('elem("x", ["a", "b"], eqString):', elem('x', ['a', 'b'], eqString));
console.log();

// 为自定义类型实现 Eq
type Point = {
  readonly x: number;
  readonly y: number;
};

const eqPoint: Eq<Point> = {
  equals: (a, b) => a.x === b.x && a.y === b.y
};

const p1: Point = { x: 1, y: 2 };
const p2: Point = { x: 1, y: 2 };
const p3: Point = { x: 2, y: 3 };

console.log('eqPoint.equals(p1, p2):', eqPoint.equals(p1, p2)); // true
console.log('eqPoint.equals(p1, p3):', eqPoint.equals(p1, p3)); // false
console.log();

// 组合 Eq：为数组实现 Eq
function getEqArray<T>(eq: Eq<T>): Eq<T[]> {
  return {
    equals: (a, b) => {
      if (a.length !== b.length) return false;
      return a.every((item, index) => eq.equals(item, b[index]));
    }
  };
}

const eqNumberArray = getEqArray(eqNumber);
console.log('eqNumberArray.equals([1, 2], [1, 2]):', 
  eqNumberArray.equals([1, 2], [1, 2])); // true
console.log('eqNumberArray.equals([1, 2], [1, 3]):', 
  eqNumberArray.equals([1, 2], [1, 3])); // false
console.log();

// ============================================================================
// 2. Ord 类型类 - 排序比较
// ============================================================================

console.log('2. Ord 类型类 - 排序比较\n');

/**
 * Ord 类型类定义
 * 扩展 Eq，增加了比较操作
 * compare 返回值：< 0 表示 a < b，0 表示 a = b，> 0 表示 a > b
 */
interface Ord<T> extends Eq<T> {
  compare: (a: T, b: T) => number;
}

// Ord 实例：数字（升序）
const ordNumber: Ord<number> = {
  equals: (a, b) => a === b,
  compare: (a, b) => a - b
};

// Ord 实例：字符串
const ordString: Ord<string> = {
  equals: (a, b) => a === b,
  compare: (a, b) => a.localeCompare(b)
};

// 使用 Ord 的通用排序函数
function sort<T>(arr: T[], ord: Ord<T>): T[] {
  return [...arr].sort(ord.compare);
}

console.log('sort([3, 1, 2], ordNumber):', sort([3, 1, 2], ordNumber));
console.log('sort(["c", "a", "b"], ordString):', sort(['c', 'a', 'b'], ordString));
console.log();

// Ord 实例：数字（降序）
const ordNumberDesc: Ord<number> = {
  equals: (a, b) => a === b,
  compare: (a, b) => b - a  // 反向比较
};

console.log('sort([3, 1, 2], ordNumberDesc):', sort([3, 1, 2], ordNumberDesc));
console.log();

// 为自定义类型实现 Ord
type Person = {
  readonly name: string;
  readonly age: number;
};

// 按年龄排序
const ordPersonByAge: Ord<Person> = {
  equals: (a, b) => a.age === b.age && a.name === b.name,
  compare: (a, b) => a.age - b.age
};

// 按姓名排序
const ordPersonByName: Ord<Person> = {
  equals: (a, b) => a.age === b.age && a.name === b.name,
  compare: (a, b) => a.name.localeCompare(b.name)
};

const people: Person[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 }
];

console.log('按年龄排序:', sort(people, ordPersonByAge));
console.log('按姓名排序:', sort(people, ordPersonByName));
console.log();

// 基于 Ord 实现其他比较函数
function min<T>(a: T, b: T, ord: Ord<T>): T {
  return ord.compare(a, b) <= 0 ? a : b;
}

function max<T>(a: T, b: T, ord: Ord<T>): T {
  return ord.compare(a, b) >= 0 ? a : b;
}

console.log('min(3, 5, ordNumber):', min(3, 5, ordNumber));
console.log('max(3, 5, ordNumber):', max(3, 5, ordNumber));
console.log();

// ============================================================================
// 3. Show 类型类 - 字符串表示
// ============================================================================

console.log('3. Show 类型类 - 字符串表示\n');

/**
 * Show 类型类定义
 * 表示可以转换为字符串表示的类型
 */
interface Show<T> {
  show: (a: T) => string;
}

// Show 实例：数字
const showNumber: Show<number> = {
  show: (n) => n.toString()
};

// Show 实例：布尔值
const showBoolean: Show<boolean> = {
  show: (b) => b ? 'True' : 'False'
};

// Show 实例：Point
const showPoint: Show<Point> = {
  show: (p) => `Point(${p.x}, ${p.y})`
};

console.log('showNumber.show(42):', showNumber.show(42));
console.log('showBoolean.show(true):', showBoolean.show(true));
console.log('showPoint.show(p1):', showPoint.show(p1));
console.log();

// 为数组实现 Show
function getShowArray<T>(show: Show<T>): Show<T[]> {
  return {
    show: (arr) => '[' + arr.map(show.show).join(', ') + ']'
  };
}

const showNumberArray = getShowArray(showNumber);
console.log('showNumberArray.show([1, 2, 3]):', 
  showNumberArray.show([1, 2, 3]));
console.log();

// ============================================================================
// 4. Semigroup 类型类 - 可结合操作
// ============================================================================

console.log('4. Semigroup 类型类 - 可结合操作\n');

/**
 * Semigroup 类型类定义
 * 表示可以将两个相同类型的值组合的类型
 * 
 * 法则：结合律
 * concat(concat(a, b), c) === concat(a, concat(b, c))
 */
interface Semigroup<T> {
  concat: (a: T, b: T) => T;
}

// Semigroup 实例：数字加法
const semigroupSum: Semigroup<number> = {
  concat: (a, b) => a + b
};

// Semigroup 实例：数字乘法
const semigroupProduct: Semigroup<number> = {
  concat: (a, b) => a * b
};

// Semigroup 实例：字符串连接
const semigroupString: Semigroup<string> = {
  concat: (a, b) => a + b
};

// Semigroup 实例：数组合并
function getSemigroupArray<T>(): Semigroup<T[]> {
  return {
    concat: (a, b) => [...a, ...b]
  };
}

const semigroupNumberArray = getSemigroupArray<number>();

console.log('semigroupSum.concat(1, 2):', semigroupSum.concat(1, 2));
console.log('semigroupProduct.concat(3, 4):', semigroupProduct.concat(3, 4));
console.log('semigroupString.concat("Hello", " World"):', 
  semigroupString.concat('Hello', ' World'));
console.log('semigroupNumberArray.concat([1, 2], [3, 4]):', 
  semigroupNumberArray.concat([1, 2], [3, 4]));
console.log();

// 验证结合律
const a = 1, b = 2, c = 3;
const left = semigroupSum.concat(semigroupSum.concat(a, b), c);
const right = semigroupSum.concat(a, semigroupSum.concat(b, c));
console.log('验证结合律:');
console.log('  concat(concat(1, 2), 3) =', left);
console.log('  concat(1, concat(2, 3)) =', right);
console.log('  结果相等:', left === right);
console.log();

// 为对象实现 Semigroup
type Stats = {
  readonly views: number;
  readonly likes: number;
};

const semigroupStats: Semigroup<Stats> = {
  concat: (a, b) => ({
    views: a.views + b.views,
    likes: a.likes + b.likes
  })
};

const stats1: Stats = { views: 100, likes: 10 };
const stats2: Stats = { views: 200, likes: 20 };

console.log('semigroupStats.concat(stats1, stats2):', 
  semigroupStats.concat(stats1, stats2));
console.log();

// ============================================================================
// 5. Monoid 类型类 - 带单位元的 Semigroup
// ============================================================================

console.log('5. Monoid 类型类 - 带单位元的 Semigroup\n');

/**
 * Monoid 类型类定义
 * 扩展 Semigroup，增加了单位元（identity element）
 * 
 * 法则：
 * 1. 结合律（继承自 Semigroup）
 * 2. 左单位元：concat(empty, a) === a
 * 3. 右单位元：concat(a, empty) === a
 */
interface Monoid<T> extends Semigroup<T> {
  empty: T;  // 单位元
}

// Monoid 实例：数字加法
const monoidSum: Monoid<number> = {
  concat: (a, b) => a + b,
  empty: 0  // 加法的单位元是 0
};

// Monoid 实例：数字乘法
const monoidProduct: Monoid<number> = {
  concat: (a, b) => a * b,
  empty: 1  // 乘法的单位元是 1
};

// Monoid 实例：字符串连接
const monoidString: Monoid<string> = {
  concat: (a, b) => a + b,
  empty: ''  // 字符串连接的单位元是空字符串
};

// Monoid 实例：数组合并
function getMonoidArray<T>(): Monoid<T[]> {
  return {
    concat: (a, b) => [...a, ...b],
    empty: []  // 数组合并的单位元是空数组
  };
}

const monoidNumberArray = getMonoidArray<number>();

console.log('monoidSum.concat(5, monoidSum.empty):', 
  monoidSum.concat(5, monoidSum.empty));
console.log('monoidSum.concat(monoidSum.empty, 5):', 
  monoidSum.concat(monoidSum.empty, 5));
console.log('monoidString.concat("Hello", monoidString.empty):', 
  monoidString.concat('Hello', monoidString.empty));
console.log();

// 验证单位元法则
const x = 5;
console.log('验证单位元法则:');
console.log('  concat(empty, x) =', monoidSum.concat(monoidSum.empty, x));
console.log('  concat(x, empty) =', monoidSum.concat(x, monoidSum.empty));
console.log('  原值 x =', x);
console.log();

// Monoid 实例：Stats
const monoidStats: Monoid<Stats> = {
  concat: (a, b) => ({
    views: a.views + b.views,
    likes: a.likes + b.likes
  }),
  empty: { views: 0, likes: 0 }  // 单位元
};

console.log('monoidStats.empty:', monoidStats.empty);
console.log('monoidStats.concat(stats1, monoidStats.empty):', 
  monoidStats.concat(stats1, monoidStats.empty));
console.log();

// ============================================================================
// 6. Monoid 的强大应用：通用 fold 函数
// ============================================================================

console.log('6. Monoid 的强大应用：通用 fold 函数\n');

/**
 * 使用 Monoid 实现通用的 fold 函数
 * 可以折叠任何实现了 Monoid 的类型
 */
function fold<T>(arr: T[], monoid: Monoid<T>): T {
  return arr.reduce(monoid.concat, monoid.empty);
}

// 使用同一个 fold 函数处理不同类型
console.log('fold([1, 2, 3, 4], monoidSum):', 
  fold([1, 2, 3, 4], monoidSum));

console.log('fold([1, 2, 3, 4], monoidProduct):', 
  fold([1, 2, 3, 4], monoidProduct));

console.log('fold(["Hello", " ", "World"], monoidString):', 
  fold(['Hello', ' ', 'World'], monoidString));

console.log('fold([[1, 2], [3, 4], [5]], monoidNumberArray):', 
  fold([[1, 2], [3, 4], [5]], monoidNumberArray));

const allStats: Stats[] = [
  { views: 100, likes: 10 },
  { views: 200, likes: 20 },
  { views: 300, likes: 30 }
];

console.log('fold(allStats, monoidStats):', 
  fold(allStats, monoidStats));
console.log();

// ============================================================================
// 7. 实际应用：组合配置
// ============================================================================

console.log('7. 实际应用：组合配置\n');

type Config = {
  readonly timeout?: number;
  readonly retries?: number;
  readonly debug?: boolean;
};

/**
 * Config 的 Monoid 实例
 * 后面的配置覆盖前面的配置
 */
const monoidConfig: Monoid<Config> = {
  concat: (a, b) => ({ ...a, ...b }),
  empty: {}
};

const defaultConfig: Config = { 
  timeout: 3000, 
  retries: 3, 
  debug: false 
};

const userConfig: Config = { 
  timeout: 5000 
};

const envConfig: Config = { 
  debug: true 
};

const finalConfig = fold(
  [defaultConfig, userConfig, envConfig], 
  monoidConfig
);

console.log('默认配置:', defaultConfig);
console.log('用户配置:', userConfig);
console.log('环境配置:', envConfig);
console.log('最终配置:', finalConfig);
console.log();

// ============================================================================
// 8. OOP vs FP 对比
// ============================================================================

console.log('8. OOP vs FP 对比\n');

console.log('=== OOP 方式（紧耦合）===');

// ❌ OOP: 必须在类定义时声明实现接口
interface Comparable {
  compareTo(other: this): number;
}

class Product implements Comparable {
  constructor(
    public name: string,
    public price: number
  ) {}

  compareTo(other: Product): number {
    return this.price - other.price;
  }
}

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.compareTo(b));
}

const products = [
  new Product('Apple', 1.5),
  new Product('Banana', 0.8),
  new Product('Cherry', 2.0)
];

console.log('OOP 排序结果:', sortProducts(products));

console.log('\n=== FP 方式（松耦合）===');

// ✅ FP: 类型类外部定义，灵活扩展
type ProductData = {
  readonly name: string;
  readonly price: number;
};

const ordProductByPrice: Ord<ProductData> = {
  equals: (a, b) => a.price === b.price && a.name === b.name,
  compare: (a, b) => a.price - b.price
};

const ordProductByName: Ord<ProductData> = {
  equals: (a, b) => a.price === b.price && a.name === b.name,
  compare: (a, b) => a.name.localeCompare(b.name)
};

const productsData: ProductData[] = [
  { name: 'Apple', price: 1.5 },
  { name: 'Banana', price: 0.8 },
  { name: 'Cherry', price: 2.0 }
];

console.log('按价格排序:', sort(productsData, ordProductByPrice));
console.log('按名称排序:', sort(productsData, ordProductByName));

console.log('\nFP 优势:');
console.log('1. 可以为原生类型（number、string）实现类型类');
console.log('2. 同一类型可以有多个类型类实例（多种排序方式）');
console.log('3. 无需修改原类型定义，外部扩展能力');
console.log('4. 类型类实例可以作为参数传递，灵活组合');
