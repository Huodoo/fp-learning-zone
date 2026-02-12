/**
 * 第一章第一节：纯函数 vs 非纯函数
 * 
 * 本文件通过大量实例对比展示纯函数和非纯函数的区别
 * 帮助你建立识别纯函数的直觉
 */

console.log('=== 纯函数 vs 非纯函数 ===\n');

// ============================================================================
// 1. 基础示例：相同输入 → 相同输出
// ============================================================================

console.log('1. 基础示例：相同输入 → 相同输出\n');

// ✅ 纯函数：完全确定性
function add(a: number, b: number): number {
  return a + b;
}

console.log('纯函数 add(2, 3):', add(2, 3));  // 总是 5
console.log('纯函数 add(2, 3):', add(2, 3));  // 总是 5
console.log('纯函数 add(2, 3):', add(2, 3));  // 总是 5

// ❌ 非纯函数：依赖外部状态
let counter = 0;

function increment(): number {
  return ++counter;  // 每次调用结果不同！
}

console.log('非纯函数 increment():', increment());  // 1
console.log('非纯函数 increment():', increment());  // 2
console.log('非纯函数 increment():', increment());  // 3
console.log();

// ============================================================================
// 2. 副作用：修改外部状态
// ============================================================================

console.log('2. 副作用：修改外部状态\n');

// ❌ 非纯函数：修改全局变量
let globalConfig = { debug: false };

function enableDebug(): void {
  globalConfig.debug = true;  // 副作用：修改外部对象
}

console.log('修改前:', globalConfig);
enableDebug();
console.log('修改后:', globalConfig);

// ✅ 纯函数：返回新对象，不修改原对象
type Config = {
  readonly debug: boolean;
};

function setDebug(config: Config, value: boolean): Config {
  return { ...config, debug: value };  // 返回新对象
}

const config1: Config = { debug: false };
const config2 = setDebug(config1, true);

console.log('原对象:', config1);  // { debug: false } - 未改变
console.log('新对象:', config2);  // { debug: true }
console.log();

// ============================================================================
// 3. 副作用：修改传入的参数
// ============================================================================

console.log('3. 副作用：修改传入的参数\n');

// ❌ 非纯函数：直接修改数组参数
function addItemImpure(arr: number[], item: number): number[] {
  arr.push(item);  // 副作用：修改了传入的数组
  return arr;
}

const numbers1 = [1, 2, 3];
const result1 = addItemImpure(numbers1, 4);

console.log('原数组被修改了:', numbers1);  // [1, 2, 3, 4]
console.log('返回的数组:', result1);      // [1, 2, 3, 4]
console.log('它们是同一个引用:', numbers1 === result1);  // true

// ✅ 纯函数：创建新数组，不修改原数组
function addItemPure(arr: readonly number[], item: number): number[] {
  return [...arr, item];  // 返回新数组
}

const numbers2 = [1, 2, 3];
const result2 = addItemPure(numbers2, 4);

console.log('原数组未改变:', numbers2);     // [1, 2, 3]
console.log('返回的新数组:', result2);     // [1, 2, 3, 4]
console.log('它们不是同一个引用:', numbers2 !== result2);  // true
console.log();

// ============================================================================
// 4. 副作用：I/O 操作（console.log 也是副作用！）
// ============================================================================

console.log('4. 副作用：I/O 操作\n');

// ❌ 非纯函数：包含 I/O 操作
function calculateAndLog(a: number, b: number): number {
  const result = a + b;
  console.log(`计算结果: ${result}`);  // 副作用：I/O
  return result;
}

// 虽然相同输入产生相同输出，但它不是纯函数，因为有副作用
calculateAndLog(2, 3);

// ✅ 纯函数：只做计算
function calculate(a: number, b: number): number {
  return a + b;  // 无副作用
}

// 副作用在函数外部处理
const calcResult = calculate(2, 3);
console.log(`计算结果: ${calcResult}`);  // 副作用在外部
console.log();

// ============================================================================
// 5. 引用透明性演示
// ============================================================================

console.log('5. 引用透明性演示\n');

// ✅ 纯函数具有引用透明性
function multiply(a: number, b: number): number {
  return a * b;
}

// 这两个表达式完全等价
const expr1 = multiply(3, 4) + multiply(3, 4);
const expr2 = 12 + 12;  // 可以直接替换函数调用

console.log('表达式1:', expr1);  // 24
console.log('表达式2:', expr2);  // 24

// ❌ 非纯函数不具有引用透明性
let count = 0;
function incrementAndGet(): number {
  return ++count;
}

const expr3 = incrementAndGet() + incrementAndGet();  // 1 + 2 = 3
// 无法简单替换为 1 + 1，因为每次调用结果不同
console.log('非引用透明的表达式:', expr3);  // 3
console.log();

// ============================================================================
// 6. 真实业务场景示例
// ============================================================================

console.log('6. 真实业务场景示例\n');

// 场景：计算购物车总价

type CartItem = {
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
};

type DiscountRule = {
  readonly minAmount: number;
  readonly discountRate: number;
};

// ❌ 非纯函数版本：依赖全局折扣规则
const globalDiscountRules: DiscountRule[] = [
  { minAmount: 100, discountRate: 0.1 },
  { minAmount: 200, discountRate: 0.2 },
];

function calculateTotalImpure(items: CartItem[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // 依赖外部状态
  const applicableRule = globalDiscountRules
    .filter(rule => subtotal >= rule.minAmount)
    .sort((a, b) => b.discountRate - a.discountRate)[0];
  
  const discount = applicableRule ? subtotal * applicableRule.discountRate : 0;
  return subtotal - discount;
}

// ✅ 纯函数版本：所有依赖都作为参数传入
function calculateTotalPure(
  items: readonly CartItem[],
  discountRules: readonly DiscountRule[]
): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const applicableRule = discountRules
    .filter(rule => subtotal >= rule.minAmount)
    .sort((a, b) => b.discountRate - a.discountRate)[0];
  
  const discount = applicableRule ? subtotal * applicableRule.discountRate : 0;
  return subtotal - discount;
}

const cart: CartItem[] = [
  { name: '商品A', price: 50, quantity: 2 },
  { name: '商品B', price: 80, quantity: 1 },
];

const discountRules: DiscountRule[] = [
  { minAmount: 100, discountRate: 0.1 },
  { minAmount: 200, discountRate: 0.2 },
];

console.log('非纯函数计算结果:', calculateTotalImpure(cart));
console.log('纯函数计算结果:', calculateTotalPure(cart, discountRules));

// 纯函数的优势：可测试性强
// 如果要测试不同的折扣规则，只需传入不同的参数
const noDiscountRules: DiscountRule[] = [];
console.log('无折扣规则时:', calculateTotalPure(cart, noDiscountRules));
console.log();

// ============================================================================
// 7. 不确定性函数（时间、随机数）
// ============================================================================

console.log('7. 不确定性函数\n');

// ❌ 非纯函数：使用 Date.now()
function getCurrentTimestamp(): number {
  return Date.now();  // 每次调用结果不同
}

console.log('当前时间戳1:', getCurrentTimestamp());
console.log('当前时间戳2:', getCurrentTimestamp());

// ✅ 纯函数：将时间作为参数传入
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

const now = Date.now();
console.log('格式化时间1:', formatTimestamp(now));
console.log('格式化时间2:', formatTimestamp(now));  // 相同输入，相同输出

// ❌ 非纯函数：使用 Math.random()
function generateRandomId(): string {
  return Math.random().toString(36).substring(7);  // 每次不同
}

console.log('随机ID1:', generateRandomId());
console.log('随机ID2:', generateRandomId());

// ✅ 纯函数：将随机数生成器作为参数
type RandomGenerator = () => number;

function generateIdPure(rng: RandomGenerator): string {
  return rng().toString(36).substring(7);
}

// 可以传入真随机数生成器
console.log('使用Math.random:', generateIdPure(Math.random));

// 也可以传入假随机数生成器（用于测试）
const mockRandom = () => 0.123456;
console.log('使用mock随机数:', generateIdPure(mockRandom));
console.log('使用mock随机数:', generateIdPure(mockRandom));  // 总是相同
console.log();

// ============================================================================
// 8. 总结：如何判断一个函数是否纯？
// ============================================================================

console.log('8. 判断函数是否纯的检查清单\n');

/**
 * 检查清单：函数是纯的吗？
 * 
 * ❓ 相同的输入是否总是产生相同的输出？
 * ❓ 函数是否依赖任何外部状态（全局变量、this、闭包变量）？
 * ❓ 函数是否修改任何外部状态？
 * ❓ 函数是否修改传入的参数？
 * ❓ 函数是否执行 I/O 操作？
 * ❓ 函数是否调用其他非纯函数？
 * ❓ 函数是否抛出异常？
 * ❓ 函数是否使用不确定性 API（Date.now, Math.random 等）？
 * 
 * 如果以上问题的答案都是"否"，那么它是纯函数！
 */

// 示例：判断以下函数是否纯

// 函数 A
function processData(data: readonly number[]): number[] {
  return data.map(x => x * 2);
}
console.log('✅ processData 是纯函数');

// 函数 B
let cache: Record<string, unknown> = {};
function memoizedCalc(key: string, value: number): number {
  if (cache[key]) {
    return cache[key] as number;
  }
  const result = value * 2;
  cache[key] = result;  // 修改外部状态
  return result;
}
console.log('❌ memoizedCalc 不是纯函数（修改外部状态）');

// 函数 C
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
console.log('✅ validateEmail 是纯函数');

// 函数 D
function sendEmail(to: string, subject: string): void {
  console.log(`发送邮件到 ${to}: ${subject}`);
  // 实际发送邮件...
}
console.log('❌ sendEmail 不是纯函数（I/O 操作）');

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用（虽然本文件主要用于演示）
export type { CartItem, DiscountRule, Config, RandomGenerator };
export { 
  add, 
  setDebug, 
  addItemPure, 
  calculate, 
  multiply, 
  calculateTotalPure, 
  formatTimestamp, 
  generateIdPure,
  processData,
  validateEmail
};
