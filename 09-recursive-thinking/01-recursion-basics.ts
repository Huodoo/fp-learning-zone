/**
 * 第九章第一节: 递归基础
 * 
 * 递归是函数式编程的核心思想之一
 * 递归让我们能用声明式的方式描述问题，而不是命令式的步骤
 * 
 * 核心思想：将问题分解为更小的子问题，直到遇到最简单的基础情况
 */

console.log('=== 递归基础 ===\n');

// ============================================================================
// 1. 递归的三要素
// ============================================================================

console.log('1. 递归的三要素\n');

console.log('递归函数必须包含:');
console.log('  1️⃣ 基础情况 (Base Case) - 递归的终止条件');
console.log('  2️⃣ 递归情况 (Recursive Case) - 问题的分解');
console.log('  3️⃣ 组合结果 - 将子问题的结果组合\n');

// --- 示例 1: 阶乘 ---

console.log('示例 1: 阶乘 (Factorial)\n');

/**
 * 阶乘的数学定义:
 * factorial(0) = 1                      // 基础情况
 * factorial(n) = n * factorial(n - 1)   // 递归情况
 */
function factorial(n: number): number {
  // 1. 基础情况: 0! = 1
  if (n === 0) {
    console.log(`  基础情况: factorial(0) = 1`);
    return 1;
  }
  
  // 2. 递归情况: n! = n * (n-1)!
  console.log(`  递归: factorial(${n}) = ${n} * factorial(${n - 1})`);
  const result = n * factorial(n - 1);
  
  // 3. 组合结果
  console.log(`  返回: factorial(${n}) = ${result}`);
  return result;
}

console.log('计算 factorial(5):');
const fact5 = factorial(5);
console.log(`结果: 5! = ${fact5}\n`);

// --- 示例 2: 斐波那契数列 ---

console.log('示例 2: 斐波那契数列 (Fibonacci)\n');

/**
 * 斐波那契的数学定义:
 * fib(0) = 0
 * fib(1) = 1
 * fib(n) = fib(n-1) + fib(n-2)
 */
function fibonacci(n: number): number {
  // 基础情况
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  // 递归情况：分解为两个子问题
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('斐波那契数列的前 10 项:');
for (let i = 0; i < 10; i++) {
  console.log(`  fib(${i}) = ${fibonacci(i)}`);
}
console.log();

// ============================================================================
// 2. 递归 vs 循环
// ============================================================================

console.log('2. 递归 vs 循环\n');

// --- 示例: 数组求和 ---

/**
 * 命令式: 使用循环
 */
function sumImperative(numbers: number[]): number {
  let sum = 0;  // 可变状态
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];  // 修改状态
  }
  return sum;
}

/**
 * 函数式: 使用递归
 */
function sumRecursive(numbers: number[]): number {
  // 基础情况: 空数组的和是 0
  if (numbers.length === 0) {
    return 0;
  }
  
  // 递归情况: 第一个元素 + 剩余元素的和
  return numbers[0] + sumRecursive(numbers.slice(1));
}

const testArray = [1, 2, 3, 4, 5];

console.log('数组求和对比:');
console.log('  数组:', testArray);
console.log('  循环方式:', sumImperative(testArray));
console.log('  递归方式:', sumRecursive(testArray));
console.log();

console.log('✅ 递归的优势:');
console.log('  - 无可变状态');
console.log('  - 代码更简洁');
console.log('  - 更接近数学定义');
console.log();
console.log('❌ 递归的劣势:');
console.log('  - 可能有性能开销（函数调用）');
console.log('  - 可能栈溢出（大数据）');
console.log();

// ============================================================================
// 3. 列表的递归操作
// ============================================================================

console.log('3. 列表的递归操作\n');

// --- 3.1 map: 转换每个元素 ---

/**
 * 递归实现 map
 */
function mapRecursive<A, B>(f: (a: A) => B, list: A[]): B[] {
  // 基础情况: 空数组
  if (list.length === 0) {
    return [];
  }
  
  // 递归情况: 转换第一个元素，然后递归处理剩余元素
  return [f(list[0]), ...mapRecursive(f, list.slice(1))];
}

console.log('map 示例:');
const numbers = [1, 2, 3, 4, 5];
const doubled = mapRecursive((x: number) => x * 2, numbers);
console.log('  原数组:', numbers);
console.log('  翻倍后:', doubled);
console.log();

// --- 3.2 filter: 过滤元素 ---

/**
 * 递归实现 filter
 */
function filterRecursive<A>(predicate: (a: A) => boolean, list: A[]): A[] {
  // 基础情况
  if (list.length === 0) {
    return [];
  }
  
  // 递归情况
  const head = list[0];
  const tail = list.slice(1);
  
  if (predicate(head)) {
    return [head, ...filterRecursive(predicate, tail)];
  } else {
    return filterRecursive(predicate, tail);
  }
}

console.log('filter 示例:');
const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evens = filterRecursive((x: number) => x % 2 === 0, allNumbers);
console.log('  原数组:', allNumbers);
console.log('  偶数:', evens);
console.log();

// --- 3.3 reduce: 归约/折叠 ---

/**
 * 递归实现 reduce
 */
function reduceRecursive<A, B>(
  f: (acc: B, curr: A) => B,
  init: B,
  list: A[]
): B {
  // 基础情况: 空数组返回初始值
  if (list.length === 0) {
    return init;
  }
  
  // 递归情况: 用当前元素更新累积值，然后递归处理剩余元素
  const newAcc = f(init, list[0]);
  return reduceRecursive(f, newAcc, list.slice(1));
}

console.log('reduce 示例:');
const sum = reduceRecursive((acc: number, x: number) => acc + x, 0, [1, 2, 3, 4, 5]);
const product = reduceRecursive((acc: number, x: number) => acc * x, 1, [1, 2, 3, 4, 5]);
console.log('  求和:', sum);
console.log('  求积:', product);
console.log();

// ============================================================================
// 4. 字符串的递归处理
// ============================================================================

console.log('4. 字符串的递归处理\n');

// --- 4.1 反转字符串 ---

/**
 * 递归反转字符串
 */
function reverseString(str: string): string {
  // 基础情况: 空字符串或单字符
  if (str.length <= 1) {
    return str;
  }
  
  // 递归情况: 最后一个字符 + 反转剩余部分
  return str[str.length - 1] + reverseString(str.slice(0, -1));
}

console.log('反转字符串:');
console.log('  "hello" =>', reverseString('hello'));
console.log('  "recursion" =>', reverseString('recursion'));
console.log();

// --- 4.2 判断回文 ---

/**
 * 递归判断回文
 */
function isPalindrome(str: string): boolean {
  // 基础情况: 0 或 1 个字符必定是回文
  if (str.length <= 1) {
    return true;
  }
  
  // 递归情况: 首尾相同 且 中间部分是回文
  if (str[0] === str[str.length - 1]) {
    return isPalindrome(str.slice(1, -1));
  }
  
  return false;
}

console.log('判断回文:');
console.log('  "radar" =>', isPalindrome('radar'));
console.log('  "hello" =>', isPalindrome('hello'));
console.log('  "level" =>', isPalindrome('level'));
console.log();

// ============================================================================
// 5. 数字的递归处理
// ============================================================================

console.log('5. 数字的递归处理\n');

// --- 5.1 数字求和 (sum of digits) ---

/**
 * 递归计算数字各位之和
 */
function sumDigits(n: number): number {
  // 基础情况: 单个数字
  if (n < 10) {
    return n;
  }
  
  // 递归情况: 最后一位 + 其余位的和
  return (n % 10) + sumDigits(Math.floor(n / 10));
}

console.log('数字各位求和:');
console.log('  123 =>', sumDigits(123));  // 1 + 2 + 3 = 6
console.log('  9875 =>', sumDigits(9875));  // 9 + 8 + 7 + 5 = 29
console.log();

// --- 5.2 幂运算 ---

/**
 * 递归实现幂运算
 * power(x, n) = x^n
 */
function power(base: number, exp: number): number {
  // 基础情况: 任何数的 0 次方都是 1
  if (exp === 0) {
    return 1;
  }
  
  // 递归情况: x^n = x * x^(n-1)
  return base * power(base, exp - 1);
}

console.log('幂运算:');
console.log('  2^5 =>', power(2, 5));
console.log('  3^4 =>', power(3, 4));
console.log();

// --- 5.3 优化的幂运算（分治法） ---

/**
 * 优化的幂运算（对数时间复杂度）
 * 利用: x^n = (x^(n/2))^2 (当 n 是偶数)
 */
function powerOptimized(base: number, exp: number): number {
  // 基础情况
  if (exp === 0) return 1;
  if (exp === 1) return base;
  
  // 递归情况: 分治
  if (exp % 2 === 0) {
    // 偶数: x^n = (x^(n/2))^2
    const half = powerOptimized(base, exp / 2);
    return half * half;
  } else {
    // 奇数: x^n = x * x^(n-1)
    return base * powerOptimized(base, exp - 1);
  }
}

console.log('优化的幂运算（分治法）:');
console.log('  2^10 =>', powerOptimized(2, 10));
console.log('  3^15 =>', powerOptimized(3, 15));
console.log();

// ============================================================================
// 6. 最大公约数（GCD）
// ============================================================================

console.log('6. 最大公约数（GCD）- 辗转相除法\n');

/**
 * 欧几里得算法（递归版本）
 * gcd(a, b) = gcd(b, a % b)
 */
function gcd(a: number, b: number): number {
  console.log(`  gcd(${a}, ${b})`);
  
  // 基础情况: b = 0 时，最大公约数是 a
  if (b === 0) {
    console.log(`  -> 返回 ${a}`);
    return a;
  }
  
  // 递归情况: gcd(a, b) = gcd(b, a % b)
  return gcd(b, a % b);
}

console.log('计算 gcd(48, 18):');
const result = gcd(48, 18);
console.log(`结果: ${result}\n`);

// ============================================================================
// 7. 扁平化数组（Flatten）
// ============================================================================

console.log('7. 扁平化嵌套数组\n');

/**
 * 递归扁平化嵌套数组
 */
function flatten<T>(arr: (T | T[])[]): T[] {
  // 基础情况: 空数组
  if (arr.length === 0) {
    return [];
  }
  
  const head = arr[0];
  const tail = arr.slice(1);
  
  // 递归情况: 如果第一个元素是数组，递归扁平化它
  if (Array.isArray(head)) {
    return [...flatten(head), ...flatten(tail)];
  } else {
    return [head, ...flatten(tail)];
  }
}

console.log('扁平化嵌套数组:');
const nested = [1, [2, 3], [4, [5, 6]], 7];
const flat = flatten(nested);
console.log('  嵌套:', JSON.stringify(nested));
console.log('  扁平:', flat);
console.log();

// ============================================================================
// 8. 性能对比：递归 vs 循环
// ============================================================================

console.log('8. 性能对比：递归 vs 循环\n');

// 测试数据
const largeArray = Array.from({ length: 1000 }, (_, i) => i + 1);

// 递归求和
function sumRecursivePerf(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr[0] + sumRecursivePerf(arr.slice(1));
}

// 循环求和
function sumLoopPerf(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

console.log('对 1000 个元素求和:');

console.time('递归版本');
const recursiveResult = sumRecursivePerf(largeArray);
console.timeEnd('递归版本');
console.log('  结果:', recursiveResult);

console.time('循环版本');
const loopResult = sumLoopPerf(largeArray);
console.timeEnd('循环版本');
console.log('  结果:', loopResult);

console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 总结 ===\n');
console.log('✅ 递归的核心要素:');
console.log('  1. 基础情况 - 递归的终止条件');
console.log('  2. 递归情况 - 问题的分解');
console.log('  3. 组合结果 - 将子问题结果组合');
console.log();
console.log('✅ 递归的优势:');
console.log('  1. 代码简洁优雅');
console.log('  2. 更接近数学定义');
console.log('  3. 无可变状态');
console.log('  4. 易于理解和证明正确性');
console.log();
console.log('❌ 递归的注意事项:');
console.log('  1. 可能有栈溢出风险（需要尾递归优化）');
console.log('  2. 性能可能不如循环（需要优化）');
console.log('  3. 重复计算问题（如斐波那契，需要记忆化）');
console.log();
console.log('💡 使用建议:');
console.log('  - 树形结构、分治算法 → 使用递归');
console.log('  - 简单线性遍历 → 使用循环或 reduce');
console.log('  - 大数据递归 → 使用尾递归 + Trampoline');
