/**
 * 第九章第二节: 尾递归与 Trampoline
 * 
 * 尾递归是函数式编程中避免栈溢出的重要技术
 * Trampoline 是在不支持尾调用优化的语言中实现尾递归的技巧
 * 
 * 核心思想：
 * - 尾递归：递归调用是函数的最后一步操作
 * - Trampoline：通过迭代执行返回的函数来避免栈增长
 */

console.log('=== 尾递归与 Trampoline ===\n');

// ============================================================================
// 1. 普通递归 vs 尾递归
// ============================================================================

console.log('1. 普通递归 vs 尾递归\n');

// --- 1.1 普通递归：会累积栈帧 ---

console.log('普通递归示例: 阶乘\n');

/**
 * 普通递归：递归调用后还有乘法操作
 * 需要保存每一层的 n 值来进行最后的乘法
 */
function factorialNormal(n: number): number {
  if (n === 0) return 1;
  return n * factorialNormal(n - 1);  // ❌ 递归后还要做乘法
}

console.log('factorialNormal(5) =', factorialNormal(5));
console.log();

console.log('调用栈分析:');
console.log('  factorialNormal(5)');
console.log('  = 5 * factorialNormal(4)');
console.log('  = 5 * (4 * factorialNormal(3))');
console.log('  = 5 * (4 * (3 * factorialNormal(2)))');
console.log('  = 5 * (4 * (3 * (2 * factorialNormal(1))))');
console.log('  = 5 * (4 * (3 * (2 * (1 * factorialNormal(0)))))');
console.log('  = 5 * (4 * (3 * (2 * (1 * 1))))');
console.log('  = 120');
console.log();
console.log('❌ 问题: 需要保存 5 层栈帧！\n');

// --- 1.2 尾递归：递归调用是最后一步 ---

console.log('尾递归示例: 阶乘\n');

/**
 * 尾递归：使用累积参数，递归调用是最后一步
 * 不需要保存上下文，理论上可以优化为循环
 */
function factorialTail(n: number, acc: number = 1): number {
  if (n === 0) return acc;
  return factorialTail(n - 1, n * acc);  // ✅ 递归是最后一步
}

console.log('factorialTail(5) =', factorialTail(5));
console.log();

console.log('调用栈分析（理论上可以优化）:');
console.log('  factorialTail(5, 1)');
console.log('  = factorialTail(4, 5)      // 可以复用栈帧');
console.log('  = factorialTail(3, 20)     // 可以复用栈帧');
console.log('  = factorialTail(2, 60)     // 可以复用栈帧');
console.log('  = factorialTail(1, 120)    // 可以复用栈帧');
console.log('  = factorialTail(0, 120)    // 可以复用栈帧');
console.log('  = 120');
console.log();
console.log('✅ 优势: 理论上只需要 1 个栈帧！\n');

// ============================================================================
// 2. 尾调用优化（TCO）的问题
// ============================================================================

console.log('2. 尾调用优化（TCO）的现实\n');

console.log('JavaScript 引擎对 TCO 的支持情况:');
console.log('  ✅ Safari (JavaScriptCore) - 完全支持');
console.log('  ❌ Chrome/Node.js (V8) - 不支持');
console.log('  ❌ Firefox (SpiderMonkey) - 不支持');
console.log();
console.log('💡 结论: 不能依赖 TCO，需要 Trampoline！\n');

// 测试栈溢出
console.log('测试: 大数递归是否会栈溢出\n');

try {
  console.log('尝试计算 factorialTail(10000)...');
  // factorialTail(10000);  // 💥 会栈溢出！（取消注释试试）
  console.log('❌ 在大多数引擎中会栈溢出');
} catch (e) {
  console.log('捕获错误:', e);
}
console.log();

// ============================================================================
// 3. Trampoline: 将递归转换为迭代
// ============================================================================

console.log('3. Trampoline 技术\n');

// --- 3.1 Trampoline 的类型定义 ---

/**
 * Bounce<A>: 要么是最终结果 A，要么是返回下一步的函数
 */
type Bounce<A> = A | (() => Bounce<A>);

/**
 * Trampoline: 不断执行函数，直到得到最终结果
 * 核心思想：用循环替代递归，但保持递归的写法
 */
function trampoline<A>(bounce: Bounce<A>): A {
  let result = bounce;
  
  // 如果是函数，就执行它；如果是值，就返回
  while (typeof result === 'function') {
    result = result();
  }
  
  return result;
}

console.log('✅ Trampoline 工作原理:');
console.log('  1. 递归函数返回一个 thunk（延迟计算的函数）');
console.log('  2. Trampoline 在循环中执行这些 thunk');
console.log('  3. 栈深度始终是 O(1)\n');

// --- 3.2 使用 Trampoline 重写阶乘 ---

console.log('使用 Trampoline 的阶乘:\n');

/**
 * 返回 Bounce 而不是直接递归
 */
function factorialTrampoline(n: number, acc: number = 1): Bounce<number> {
  if (n === 0) {
    return acc;  // 基础情况：返回值
  }
  
  // 递归情况：返回一个函数（thunk）
  return () => factorialTrampoline(n - 1, n * acc);
}

console.log('计算 factorialTrampoline(10):');
const result10 = trampoline(factorialTrampoline(10));
console.log('结果:', result10);

console.log('\n计算 factorialTrampoline(100):');
const result100 = trampoline(factorialTrampoline(100));
console.log('结果:', result100);

console.log('\n计算 factorialTrampoline(1000):');
const result1000 = trampoline(factorialTrampoline(1000));
console.log('结果:', result1000 === Infinity ? 'Infinity (数值溢出)' : result1000);

console.log('\n✅ 没有栈溢出！\n');

// ============================================================================
// 4. 更多 Trampoline 示例
// ============================================================================

console.log('4. 更多 Trampoline 示例\n');

// --- 4.1 斐波那契数列 ---

console.log('示例 1: 斐波那契（带 Trampoline）\n');

/**
 * 尾递归版本的斐波那契
 */
function fibTrampoline(n: number, a: number = 0, b: number = 1): Bounce<number> {
  if (n === 0) return a;
  if (n === 1) return b;
  
  return () => fibTrampoline(n - 1, b, a + b);
}

console.log('斐波那契数列:');
for (let i = 0; i <= 10; i++) {
  console.log(`  fib(${i}) = ${trampoline(fibTrampoline(i))}`);
}

console.log('\n计算大数: fib(100) =', trampoline(fibTrampoline(100)));
console.log();

// --- 4.2 数组求和 ---

console.log('示例 2: 数组求和（带 Trampoline）\n');

/**
 * 尾递归求和
 */
function sumTrampoline(arr: number[], acc: number = 0, index: number = 0): Bounce<number> {
  if (index >= arr.length) {
    return acc;
  }
  
  return () => sumTrampoline(arr, acc + arr[index], index + 1);
}

const largeArray = Array.from({ length: 10000 }, (_, i) => i + 1);

console.log('对 10000 个元素求和:');
const sumResult = trampoline(sumTrampoline(largeArray));
console.log('结果:', sumResult);
console.log('验证:', (10000 * 10001) / 2);  // 等差数列求和公式
console.log();

// --- 4.3 列表过滤 ---

console.log('示例 3: 列表过滤（带 Trampoline）\n');

/**
 * 尾递归过滤
 */
function filterTrampoline<A>(
  arr: A[],
  predicate: (a: A) => boolean,
  acc: A[] = [],
  index: number = 0
): Bounce<A[]> {
  if (index >= arr.length) {
    return acc;
  }
  
  const newAcc = predicate(arr[index]) ? [...acc, arr[index]] : acc;
  return () => filterTrampoline(arr, predicate, newAcc, index + 1);
}

const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
const evens = trampoline(filterTrampoline(numbers, (x: number) => x % 2 === 0));

console.log('过滤出偶数（前 10 个）:', evens.slice(0, 10));
console.log('总共:', evens.length, '个偶数');
console.log();

// ============================================================================
// 5. 相互递归（Mutual Recursion）+ Trampoline
// ============================================================================

console.log('5. 相互递归 + Trampoline\n');

/**
 * 判断奇偶数（相互递归示例）
 */
function isEvenTrampoline(n: number): Bounce<boolean> {
  if (n === 0) return true;
  return () => isOddTrampoline(n - 1);
}

function isOddTrampoline(n: number): Bounce<boolean> {
  if (n === 0) return false;
  return () => isEvenTrampoline(n - 1);
}

console.log('相互递归判断奇偶:');
console.log('  isEven(4) =', trampoline(isEvenTrampoline(4)));
console.log('  isEven(7) =', trampoline(isEvenTrampoline(7)));
console.log('  isOdd(4) =', trampoline(isOddTrampoline(4)));
console.log('  isOdd(7) =', trampoline(isOddTrampoline(7)));

console.log('\n大数测试:');
console.log('  isEven(10000) =', trampoline(isEvenTrampoline(10000)));
console.log('  isOdd(10001) =', trampoline(isOddTrampoline(10001)));
console.log();

// ============================================================================
// 6. 性能对比
// ============================================================================

console.log('6. 性能对比\n');

const perfArray = Array.from({ length: 10000 }, (_, i) => i + 1);

// 循环版本（基准）
function sumLoop(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// 尾递归 + Trampoline 版本
// （已定义：sumTrampoline）

console.log('对 10000 个元素求和的性能:');

console.time('循环版本');
const loopResult = sumLoop(perfArray);
console.timeEnd('循环版本');

console.time('Trampoline 版本');
const trampolineResult = trampoline(sumTrampoline(perfArray));
console.timeEnd('Trampoline 版本');

console.log('结果相同:', loopResult === trampolineResult);
console.log();

console.log('💡 性能分析:');
console.log('  - 循环: 最快（直接）');
console.log('  - Trampoline: 较慢（有函数调用开销）');
console.log('  - 但 Trampoline 不会栈溢出！\n');

// ============================================================================
// 7. 实用工具：通用 Trampoline
// ============================================================================

console.log('7. 实用工具：更强大的 Trampoline\n');

/**
 * 带调试信息的 Trampoline
 */
function trampolineDebug<A>(bounce: Bounce<A>, maxSteps: number = 100000): A {
  let result = bounce;
  let steps = 0;
  
  while (typeof result === 'function') {
    result = result();
    steps++;
    
    if (steps >= maxSteps) {
      throw new Error(`Trampoline 超过最大步数: ${maxSteps}`);
    }
  }
  
  console.log(`  执行了 ${steps} 步`);
  return result;
}

console.log('带调试的 Trampoline:');
console.log('计算 factorial(10):');
const debugResult = trampolineDebug(factorialTrampoline(10));
console.log('结果:', debugResult);
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 总结 ===\n');
console.log('✅ 尾递归的优势:');
console.log('  1. 理论上可以优化为循环（TCO）');
console.log('  2. 空间复杂度 O(1)');
console.log('  3. 保持递归的优雅写法');
console.log();
console.log('✅ Trampoline 的作用:');
console.log('  1. 在不支持 TCO 的语言中实现尾递归');
console.log('  2. 避免栈溢出');
console.log('  3. 支持相互递归');
console.log();
console.log('💡 使用建议:');
console.log('  1. 小数据量: 直接使用递归');
console.log('  2. 中等数据量: 使用循环或 reduce');
console.log('  3. 大数据量递归: 使用 Trampoline');
console.log('  4. 性能关键: 避免递归，使用循环');
console.log();
console.log('📝 转换步骤:');
console.log('  1. 识别递归模式');
console.log('  2. 转换为尾递归（添加累积参数）');
console.log('  3. 修改返回类型为 Bounce<A>');
console.log('  4. 基础情况返回值，递归情况返回函数');
console.log('  5. 用 trampoline() 包装调用');
