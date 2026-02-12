/**
 * 第六章第四节: Monad Laws（单子定律）
 * 
 * Monad Laws 是所有 Monad 必须遵守的三个数学定律
 * 这些定律保证了 Monad 的行为是可预测和可组合的
 * 理解并验证这些定律有助于正确实现自定义 Monad
 * 
 * 三大定律:
 * 1. Left Identity (左恒等)
 * 2. Right Identity (右恒等)
 * 3. Associativity (结合律)
 */

import { Option, Some, None, isSome } from './01-functor';
import { pureOption, flatMapOption } from './03-monad';

console.log('=== Monad Laws（单子定律）===\n');

// ============================================================================
// 1. 为什么需要 Monad Laws？
// ============================================================================

console.log('1. 为什么需要 Monad Laws？\n');

console.log('Monad Laws 保证了:');
console.log('✅ Monad 的行为是可预测的');
console.log('✅ 可以安全地重构代码而不改变语义');
console.log('✅ 编译器可以进行优化');
console.log('✅ 不同的 Monad 实现具有一致的行为');
console.log();

console.log('类比：就像数学中的加法满足交换律和结合律');
console.log('a + b = b + a (交换律)');
console.log('(a + b) + c = a + (b + c) (结合律)');
console.log();

// ============================================================================
// 2. Law 1: Left Identity（左恒等律）
// ============================================================================

console.log('2. Law 1: Left Identity（左恒等律）\n');

console.log('📜 定律：flatMap(f)(pure(a)) === f(a)');
console.log();
console.log('用人话说：');
console.log('- 将值包装进 Monad，然后 flatMap 一个函数');
console.log('- 应该等于直接用这个值调用函数');
console.log('- pure 不应该改变计算的结果');
console.log();

// 验证函数
const verifyLeftIdentity = <A, B>(
  value: A,
  f: (a: A) => Option<B>,
  equal: (a: Option<B>, b: Option<B>) => boolean
): boolean => {
  const left = flatMapOption(f)(pureOption(value));
  const right = f(value);
  return equal(left, right);
};

// 测试函数
const double = (n: number): Option<number> => Some(n * 2);
const safeDivideBy2 = (n: number): Option<number> =>
  n === 0 ? None : Some(n / 2);

// 相等性检查
const optionEqual = <A>(a: Option<A>, b: Option<A>): boolean => {
  if (a._tag === 'None' && b._tag === 'None') return true;
  if (a._tag === 'Some' && b._tag === 'Some') {
    return a.value === b.value;
  }
  return false;
};

console.log('✅ 验证 Left Identity:');

console.log('\n测试用例 1: value = 10, f = double');
const test1 = verifyLeftIdentity(10, double, optionEqual);
console.log('flatMap(double)(pure(10)) === double(10)?', test1);
console.log('左边:', flatMapOption(double)(pureOption(10)));
console.log('右边:', double(10));

console.log('\n测试用例 2: value = 8, f = safeDivideBy2');
const test2 = verifyLeftIdentity(8, safeDivideBy2, optionEqual);
console.log('flatMap(safeDivideBy2)(pure(8)) === safeDivideBy2(8)?', test2);
console.log('左边:', flatMapOption(safeDivideBy2)(pureOption(8)));
console.log('右边:', safeDivideBy2(8));

console.log('\n测试用例 3: value = 0, f = safeDivideBy2');
const test3 = verifyLeftIdentity(0, safeDivideBy2, optionEqual);
console.log('flatMap(safeDivideBy2)(pure(0)) === safeDivideBy2(0)?', test3);
console.log('左边:', flatMapOption(safeDivideBy2)(pureOption(0)));
console.log('右边:', safeDivideBy2(0));

console.log();

// ============================================================================
// 3. Law 2: Right Identity（右恒等律）
// ============================================================================

console.log('3. Law 2: Right Identity（右恒等律）\n');

console.log('📜 定律：flatMap(pure)(m) === m');
console.log();
console.log('用人话说：');
console.log('- 对 Monad 值 flatMap pure');
console.log('- 应该等于什么都不做');
console.log('- pure 是 flatMap 的右单位元');
console.log();

// 验证函数
const verifyRightIdentity = <A>(
  monad: Option<A>,
  equal: (a: Option<A>, b: Option<A>) => boolean
): boolean => {
  const left = flatMapOption(pureOption)(monad);
  const right = monad;
  return equal(left, right);
};

console.log('✅ 验证 Right Identity:');

console.log('\n测试用例 1: Some(42)');
const someValue = Some(42);
const test4 = verifyRightIdentity(someValue, optionEqual);
console.log('flatMap(pure)(Some(42)) === Some(42)?', test4);
console.log('左边:', flatMapOption(pureOption)(someValue));
console.log('右边:', someValue);

console.log('\n测试用例 2: None');
const noneValue = None;
const test5 = verifyRightIdentity(noneValue, optionEqual);
console.log('flatMap(pure)(None) === None?', test5);
console.log('左边:', flatMapOption(pureOption)(noneValue));
console.log('右边:', noneValue);

console.log();

// ============================================================================
// 4. Law 3: Associativity（结合律）
// ============================================================================

console.log('4. Law 3: Associativity（结合律）\n');

console.log('📜 定律：flatMap(g)(flatMap(f)(m)) === flatMap(x => flatMap(g)(f(x)))(m)');
console.log();
console.log('用人话说：');
console.log('- 先 flatMap f 再 flatMap g');
console.log('- 应该等于 flatMap 一个组合函数');
console.log('- flatMap 的结合顺序不影响结果');
console.log();

// 验证函数
const verifyAssociativity = <A, B, C>(
  monad: Option<A>,
  f: (a: A) => Option<B>,
  g: (b: B) => Option<C>,
  equal: (a: Option<C>, b: Option<C>) => boolean
): boolean => {
  // 方式1: 先 flatMap f，再 flatMap g
  const left = flatMapOption(g)(flatMapOption(f)(monad));
  
  // 方式2: flatMap 组合函数
  const right = flatMapOption((x: A) => flatMapOption(g)(f(x)))(monad);
  
  return equal(left, right);
};

// 测试函数
const parseNumber = (str: string): Option<number> => {
  const n = parseFloat(str);
  return isNaN(n) ? None : Some(n);
};

const squareRoot = (n: number): Option<number> =>
  n >= 0 ? Some(Math.sqrt(n)) : None;

const reciprocal = (n: number): Option<number> =>
  n !== 0 ? Some(1 / n) : None;

console.log('✅ 验证 Associativity:');

console.log('\n测试用例 1: Some(16), f = squareRoot, g = reciprocal');
const test6 = verifyAssociativity(Some(16), squareRoot, reciprocal, optionEqual);
console.log('结合律成立?', test6);
console.log('方式1 - flatMap(g)(flatMap(f)(m)):', 
  flatMapOption(reciprocal)(flatMapOption(squareRoot)(Some(16))));
console.log('方式2 - flatMap(x => flatMap(g)(f(x)))(m):', 
  flatMapOption((x: number) => flatMapOption(reciprocal)(squareRoot(x)))(Some(16)));

console.log('\n测试用例 2: Some(-4), f = squareRoot, g = reciprocal');
const test7 = verifyAssociativity(Some(-4), squareRoot, reciprocal, optionEqual);
console.log('结合律成立?', test7);
console.log('方式1:', 
  flatMapOption(reciprocal)(flatMapOption(squareRoot)(Some(-4))));
console.log('方式2:', 
  flatMapOption((x: number) => flatMapOption(reciprocal)(squareRoot(x)))(Some(-4)));

console.log('\n测试用例 3: Some("25"), f = parseNumber, g = squareRoot');
const test8 = verifyAssociativity(Some('25'), parseNumber, squareRoot, optionEqual);
console.log('结合律成立?', test8);
console.log('方式1:', 
  flatMapOption(squareRoot)(flatMapOption(parseNumber)(Some('25'))));
console.log('方式2:', 
  flatMapOption((x: string) => flatMapOption(squareRoot)(parseNumber(x)))(Some('25')));

console.log();

// ============================================================================
// 5. 综合验证：自动化测试套件
// ============================================================================

console.log('5. 综合验证：自动化测试套件\n');

interface MonadLawsTest<A, B, C> {
  // Left Identity 测试数据
  leftIdentityValue: A;
  leftIdentityFn: (a: A) => Option<B>;
  
  // Right Identity 测试数据
  rightIdentityValue: Option<B>;
  
  // Associativity 测试数据
  associativityValue: Option<A>;
  associativityF: (a: A) => Option<B>;
  associativityG: (b: B) => Option<C>;
}

const runMonadLawsTests = <A, B, C>(
  testName: string,
  test: MonadLawsTest<A, B, C>
): void => {
  console.log(`\n📋 测试套件: ${testName}`);
  
  // Test 1: Left Identity
  const leftOk = verifyLeftIdentity(
    test.leftIdentityValue,
    test.leftIdentityFn,
    optionEqual
  );
  console.log(`  ✓ Left Identity: ${leftOk ? '通过' : '失败'}`);
  
  // Test 2: Right Identity
  const rightOk = verifyRightIdentity(
    test.rightIdentityValue,
    optionEqual
  );
  console.log(`  ✓ Right Identity: ${rightOk ? '通过' : '失败'}`);
  
  // Test 3: Associativity
  const assocOk = verifyAssociativity(
    test.associativityValue,
    test.associativityF,
    test.associativityG,
    optionEqual
  );
  console.log(`  ✓ Associativity: ${assocOk ? '通过' : '失败'}`);
  
  const allPassed = leftOk && rightOk && assocOk;
  console.log(`  ${allPassed ? '✅ 所有定律验证通过' : '❌ 存在定律违反'}`);
};

// 测试套件 1: 数值计算
runMonadLawsTests('数值计算', {
  leftIdentityValue: 10,
  leftIdentityFn: double,
  rightIdentityValue: Some(42),
  associativityValue: Some(16),
  associativityF: squareRoot,
  associativityG: reciprocal,
});

// 测试套件 2: 字符串解析
runMonadLawsTests('字符串解析', {
  leftIdentityValue: '100',
  leftIdentityFn: parseNumber,
  rightIdentityValue: Some(50),
  associativityValue: Some('25'),
  associativityF: parseNumber,
  associativityG: squareRoot,
});

console.log();

// ============================================================================
// 6. 违反定律的例子（反例）
// ============================================================================

console.log('6. 违反定律的例子（反例）\n');

console.log('❌ 错误的 flatMap 实现（违反 Left Identity）:\n');

// 错误实现：总是返回 None
const wrongFlatMap1 = <A, B>(
  f: (a: A) => Option<B>
) => (option: Option<A>): Option<B> => {
  return None;  // 总是返回 None，违反了所有定律！
};

console.log('测试错误实现:');
const wrongResult1 = wrongFlatMap1(double)(pureOption(10));
const correctResult1 = double(10);
console.log('wrongFlatMap(double)(pure(10)):', wrongResult1);
console.log('double(10):', correctResult1);
console.log('相等?', optionEqual(wrongResult1, correctResult1));
console.log('违反了 Left Identity!\n');

// 错误实现：重复包装
const wrongFlatMap2 = <A, B>(
  f: (a: A) => Option<B>
) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    const result = f(option.value);
    // 错误：又包装了一层！
    return Some(result) as any;  
  }
  return None;
};

console.log('测试错误实现（重复包装）:');
const wrongResult2 = wrongFlatMap2(double)(pureOption(10));
console.log('wrongFlatMap2(double)(pure(10)):', wrongResult2);
console.log('应该是 Some(20)，但错误实现可能产生 Some(Some(20))');
console.log();

// ============================================================================
// 7. 实战场景：验证自定义 Monad
// ============================================================================

console.log('7. 实战场景：验证自定义 Monad\n');

/**
 * 自定义 Monad: Result<T>
 * 类似 Either，但固定错误类型为 string
 */
type Result<T> = { success: true; value: T } | { success: false; error: string };

const Ok = <T>(value: T): Result<T> => ({ success: true, value });
const Err = <T>(error: string): Result<T> => ({ success: false, error });

// Result 的 Monad 实现
const pureResult = <T>(value: T): Result<T> => Ok(value);

const flatMapResult = <A, B>(
  f: (a: A) => Result<B>
) => (result: Result<A>): Result<B> => {
  if (result.success) {
    return f(result.value);
  }
  return result as Result<B>;
};

// 相等性检查
const resultEqual = <A>(a: Result<A>, b: Result<A>): boolean => {
  if (a.success && b.success) {
    return a.value === b.value;
  }
  if (!a.success && !b.success) {
    return a.error === b.error;
  }
  return false;
};

// 验证 Result 是否遵守 Monad Laws
console.log('✅ 验证自定义 Result Monad:');

const divideBy = (divisor: number) => (n: number): Result<number> =>
  divisor === 0 ? Err('除数不能为0') : Ok(n / divisor);

console.log('\nLeft Identity:');
const resultLeft = flatMapResult(divideBy(2))(pureResult(10));
const resultRight = divideBy(2)(10);
console.log('通过?', resultEqual(resultLeft, resultRight));
console.log('左边:', resultLeft);
console.log('右边:', resultRight);

console.log('\nRight Identity:');
const resultValue = Ok(42);
const resultLeftId = flatMapResult(pureResult)(resultValue);
console.log('通过?', resultEqual(resultLeftId, resultValue));
console.log('左边:', resultLeftId);
console.log('右边:', resultValue);

console.log('\nAssociativity:');
const f = divideBy(2);
const g = divideBy(5);
const m = Ok(100);
const resultAssocLeft = flatMapResult(g)(flatMapResult(f)(m));
const resultAssocRight = flatMapResult((x: number) => flatMapResult(g)(f(x)))(m);
console.log('通过?', resultEqual(resultAssocLeft, resultAssocRight));
console.log('方式1:', resultAssocLeft);
console.log('方式2:', resultAssocRight);

console.log();

// ============================================================================
// 8. 为什么定律很重要：重构示例
// ============================================================================

console.log('8. 为什么定律很重要：重构示例\n');

console.log('因为 Monad Laws，我们可以安全地重构代码:\n');

// 版本1: 嵌套的 flatMap
const version1 = (input: string): Option<number> => {
  return flatMapOption((s: string) =>
    flatMapOption((n: number) =>
      squareRoot(n)
    )(parseNumber(s))
  )(Some(input));
};

// 版本2: 利用结合律重构
const version2 = (input: string): Option<number> => {
  return flatMapOption((s: string) =>
    flatMapOption(squareRoot)(parseNumber(s))
  )(Some(input));
};

// 版本3: 利用左恒等律简化
const version3 = (input: string): Option<number> => {
  return flatMapOption(squareRoot)(parseNumber(input));
};

console.log('三个版本的结果应该相同:');
console.log('version1("16"):', version1('16'));
console.log('version2("16"):', version2('16'));
console.log('version3("16"):', version3('16'));
console.log();
console.log('version1("abc"):', version1('abc'));
console.log('version2("abc"):', version2('abc'));
console.log('version3("abc"):', version3('abc'));

console.log();

console.log('=== Monad Laws 总结 ===');
console.log('Left Identity: pure 是 flatMap 的左单位元');
console.log('Right Identity: pure 是 flatMap 的右单位元');
console.log('Associativity: flatMap 的结合顺序不影响结果');
console.log();
console.log('这些定律保证了:');
console.log('✅ Monad 行为的可预测性');
console.log('✅ 代码重构的安全性');
console.log('✅ 编译器优化的可能性');
console.log('✅ 不同 Monad 实现的一致性');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  verifyLeftIdentity,
  verifyRightIdentity,
  verifyAssociativity,
  optionEqual,
  // Result Monad
  type Result,
  Ok,
  Err,
  pureResult,
  flatMapResult,
  resultEqual,
};
