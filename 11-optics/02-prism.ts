/**
 * 第十一章第二节：Prism（棱镜）
 * 
 * 本文件从零实现 Prism
 * 展示如何使用 Prism 处理和类型（Union Types）
 */

console.log('=== Prism（棱镜）===\n');

// ============================================================================
// 基础类型定义
// ============================================================================

type Option<T> = 
  | { _tag: 'Some'; value: T }
  | { _tag: 'None' };

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None = <T>(): Option<T> => ({ _tag: 'None' });

type Either<L, R> = 
  | { _tag: 'Left'; left: L }
  | { _tag: 'Right'; right: R };

const Left = <L, R>(left: L): Either<L, R> => ({ _tag: 'Left', left });
const Right = <L, R>(right: R): Either<L, R> => ({ _tag: 'Right', right });

// ============================================================================
// 1. Prism 的定义和实现
// ============================================================================

console.log('1. Prism 的定义和实现\n');

/**
 * Prism 类型定义
 * S: 整体类型（通常是和类型/联合类型）
 * A: 部分类型（某个具体的分支）
 * 
 * Prism 与 Lens 的区别：
 * - Lens: 聚焦总是成功（product type 的字段总是存在）
 * - Prism: 聚焦可能失败（sum type 的某个分支可能不匹配）
 */
export interface Prism<S, A> {
  getOption: (s: S) => Option<A>;    // 尝试提取值（可能失败）
  reverseGet: (a: A) => S;           // 从部分构造整体（总是成功）
}

/**
 * 创建 Prism 的工厂函数
 */
export function prism<S, A>(
  getter: (s: S) => Option<A>,
  constructor: (a: A) => S
): Prism<S, A> {
  return {
    getOption: getter,
    reverseGet: constructor
  };
}

/**
 * Prism 的派生操作
 */
export function modifyOption<S, A>(
  prism: Prism<S, A>,
  s: S,
  f: (a: A) => A
): Option<S> {
  const optA = prism.getOption(s);
  if (optA._tag === 'None') {
    return None();
  }
  return Some(prism.reverseGet(f(optA.value)));
}

export function setOption<S, A>(
  prism: Prism<S, A>,
  s: S,
  a: A
): Option<S> {
  return modifyOption(prism, s, () => a);
}

// ============================================================================
// 2. Option 的 Prism
// ============================================================================

console.log('2. Option 的 Prism\n');

/**
 * Some Prism: 聚焦 Option 中的 Some 分支
 */
export function somePrism<T>(): Prism<Option<T>, T> {
  return prism(
    (opt) => opt._tag === 'Some' ? Some(opt.value) : None(),
    (value) => Some(value)
  );
}

/**
 * None Prism: 聚焦 Option 中的 None 分支
 * （实际很少用，因为 None 不包含值）
 */
export function nonePrism<T>(): Prism<Option<T>, void> {
  return prism(
    (opt) => opt._tag === 'None' ? Some(undefined) : None(),
    () => None()
  );
}

// 测试 Some Prism
const someValue = Some(42);
const noneValue = None<number>();

const someP = somePrism<number>();

console.log('someValue:', someValue);
console.log('somePrism.getOption(someValue):', someP.getOption(someValue));
console.log('somePrism.getOption(noneValue):', someP.getOption(noneValue));

console.log('\nsomePrism.reverseGet(100):', someP.reverseGet(100));

// 使用 modifyOption 修改 Some 中的值
const modified = modifyOption(someP, someValue, x => x * 2);
console.log('修改 Some 中的值 (*2):', modified);

const modifiedNone = modifyOption(someP, noneValue, x => x * 2);
console.log('修改 None（失败）:', modifiedNone);
console.log();

// ============================================================================
// 3. Either 的 Prism
// ============================================================================

console.log('3. Either 的 Prism\n');

/**
 * Right Prism: 聚焦 Either 中的 Right 分支
 */
export function rightPrism<L, R>(): Prism<Either<L, R>, R> {
  return prism(
    (either) => either._tag === 'Right' ? Some(either.right) : None(),
    (value) => Right(value)
  );
}

/**
 * Left Prism: 聚焦 Either 中的 Left 分支
 */
export function leftPrism<L, R>(): Prism<Either<L, R>, L> {
  return prism(
    (either) => either._tag === 'Left' ? Some(either.left) : None(),
    (value) => Left(value)
  );
}

// 测试 Either Prism
const rightValue: Either<string, number> = Right(42);
const leftValue: Either<string, number> = Left('error');

const rightP = rightPrism<string, number>();
const leftP = leftPrism<string, number>();

console.log('rightValue:', rightValue);
console.log('rightPrism.getOption(rightValue):', rightP.getOption(rightValue));
console.log('rightPrism.getOption(leftValue):', rightP.getOption(leftValue));

console.log('\nleftValue:', leftValue);
console.log('leftPrism.getOption(leftValue):', leftP.getOption(leftValue));
console.log('leftPrism.getOption(rightValue):', leftP.getOption(rightValue));

// 修改 Right 值
const modifiedRight = modifyOption(rightP, rightValue, x => x * 2);
console.log('\n修改 Right 值 (*2):', modifiedRight);

const modifiedLeft = modifyOption(rightP, leftValue, x => x * 2);
console.log('尝试修改 Left（失败）:', modifiedLeft);
console.log();

// ============================================================================
// 4. 自定义和类型的 Prism
// ============================================================================

console.log('4. 自定义和类型的 Prism\n');

/**
 * 支付方式联合类型
 */
type PaymentMethod =
  | { _tag: 'CreditCard'; cardNumber: string; cvv: string }
  | { _tag: 'PayPal'; email: string }
  | { _tag: 'BankTransfer'; accountNumber: string; bankCode: string };

// 构造函数
const CreditCard = (cardNumber: string, cvv: string): PaymentMethod => ({
  _tag: 'CreditCard',
  cardNumber,
  cvv
});

const PayPal = (email: string): PaymentMethod => ({
  _tag: 'PayPal',
  email
});

const BankTransfer = (accountNumber: string, bankCode: string): PaymentMethod => ({
  _tag: 'BankTransfer',
  accountNumber,
  bankCode
});

// 为每个分支创建 Prism
const creditCardPrism: Prism<PaymentMethod, { cardNumber: string; cvv: string }> = prism(
  (payment) => payment._tag === 'CreditCard' 
    ? Some({ cardNumber: payment.cardNumber, cvv: payment.cvv })
    : None(),
  ({ cardNumber, cvv }) => CreditCard(cardNumber, cvv)
);

const paypalPrism: Prism<PaymentMethod, string> = prism(
  (payment) => payment._tag === 'PayPal' ? Some(payment.email) : None(),
  (email) => PayPal(email)
);

const bankTransferPrism: Prism<PaymentMethod, { accountNumber: string; bankCode: string }> = prism(
  (payment) => payment._tag === 'BankTransfer'
    ? Some({ accountNumber: payment.accountNumber, bankCode: payment.bankCode })
    : None(),
  ({ accountNumber, bankCode }) => BankTransfer(accountNumber, bankCode)
);

// 测试
const payment1 = CreditCard('1234-5678-9012-3456', '123');
const payment2 = PayPal('user@example.com');
const payment3 = BankTransfer('9876543210', 'ABC');

console.log('支付方式 1 (CreditCard):', payment1);
console.log('提取 CreditCard 信息:', creditCardPrism.getOption(payment1));
console.log('提取 PayPal 信息（失败）:', paypalPrism.getOption(payment1));

console.log('\n支付方式 2 (PayPal):', payment2);
console.log('提取 PayPal 信息:', paypalPrism.getOption(payment2));

console.log('\n支付方式 3 (BankTransfer):', payment3);
console.log('提取 BankTransfer 信息:', bankTransferPrism.getOption(payment3));
console.log();

// ============================================================================
// 5. Prism 组合
// ============================================================================

console.log('5. Prism 组合\n');

/**
 * 组合两个 Prism
 * 如果有 Prism<S, A> 和 Prism<A, B>，可以组合成 Prism<S, B>
 */
export function composePrism<S, A, B>(
  outer: Prism<S, A>,
  inner: Prism<A, B>
): Prism<S, B> {
  return prism(
    (s) => {
      const optA = outer.getOption(s);
      if (optA._tag === 'None') return None();
      return inner.getOption(optA.value);
    },
    (b) => outer.reverseGet(inner.reverseGet(b))
  );
}

// 示例：嵌套的 Option
type NestedOption = Option<Option<number>>;

const outerSome = somePrism<Option<number>>();
const innerSome = somePrism<number>();

const nestedSomePrism = composePrism(outerSome, innerSome);

const nested1: NestedOption = Some(Some(42));
const nested2: NestedOption = Some(None());
const nested3: NestedOption = None();

console.log('nested1 (Some(Some(42))):', nested1);
console.log('提取值:', nestedSomePrism.getOption(nested1));

console.log('\nnested2 (Some(None)):', nested2);
console.log('提取值:', nestedSomePrism.getOption(nested2));

console.log('\nnested3 (None):', nested3);
console.log('提取值:', nestedSomePrism.getOption(nested3));

console.log('\n构造嵌套 Option:', nestedSomePrism.reverseGet(100));
console.log();

// ============================================================================
// 6. 实际应用：API 响应处理
// ============================================================================

console.log('6. 实际应用：API 响应处理\n');

/**
 * API 响应类型
 */
type ApiResponse<T> =
  | { _tag: 'Success'; data: T; timestamp: number }
  | { _tag: 'Error'; message: string; code: number }
  | { _tag: 'Loading' };

const Success = <T>(data: T): ApiResponse<T> => ({
  _tag: 'Success',
  data,
  timestamp: Date.now()
});

const Error = <T>(message: string, code: number): ApiResponse<T> => ({
  _tag: 'Error',
  message,
  code
});

const Loading = <T>(): ApiResponse<T> => ({
  _tag: 'Loading'
});

// 为每个响应类型创建 Prism
const successPrism = <T>(): Prism<ApiResponse<T>, T> => prism(
  (response) => response._tag === 'Success' ? Some(response.data) : None(),
  (data) => Success(data)
);

const errorPrism = <T>(): Prism<ApiResponse<T>, { message: string; code: number }> => prism(
  (response) => response._tag === 'Error' 
    ? Some({ message: response.message, code: response.code })
    : None(),
  ({ message, code }) => Error(message, code)
);

// 用户数据类型
type User = {
  id: string;
  name: string;
  email: string;
};

// 模拟 API 响应
const response1: ApiResponse<User> = Success({
  id: '1',
  name: 'Alice',
  email: 'alice@example.com'
});

const response2: ApiResponse<User> = Error('User not found', 404);

const response3: ApiResponse<User> = Loading();

const userSuccessPrism = successPrism<User>();
const userErrorPrism = errorPrism<User>();

console.log('响应 1 (Success):');
console.log('  原始响应:', response1);
console.log('  提取数据:', userSuccessPrism.getOption(response1));
console.log('  提取错误（失败）:', userErrorPrism.getOption(response1));

console.log('\n响应 2 (Error):');
console.log('  原始响应:', response2);
console.log('  提取数据（失败）:', userSuccessPrism.getOption(response2));
console.log('  提取错误:', userErrorPrism.getOption(response2));

console.log('\n响应 3 (Loading):');
console.log('  原始响应:', response3);
console.log('  提取数据（失败）:', userSuccessPrism.getOption(response3));
console.log('  提取错误（失败）:', userErrorPrism.getOption(response3));
console.log();

// ============================================================================
// 7. 实际应用：安全的类型转换
// ============================================================================

console.log('7. 实际应用：安全的类型转换\n');

/**
 * 尝试将字符串解析为数字
 */
const numberPrism: Prism<string, number> = prism(
  (s) => {
    const n = Number(s);
    return isNaN(n) ? None() : Some(n);
  },
  (n) => n.toString()
);

const str1 = '42';
const str2 = 'not a number';

console.log('解析 "42":', numberPrism.getOption(str1));
console.log('解析 "not a number":', numberPrism.getOption(str2));

console.log('从数字构造字符串:', numberPrism.reverseGet(123));
console.log();

/**
 * 尝试将字符串解析为 JSON
 */
function jsonPrism<T>(): Prism<string, T> {
  return prism(
    (s) => {
      try {
        const value = JSON.parse(s);
        return Some(value);
      } catch {
        return None();
      }
    },
    (value) => JSON.stringify(value)
  );
}

const validJson = '{"name": "Alice", "age": 30}';
const invalidJson = '{invalid json}';

const userJsonPrism = jsonPrism<{ name: string; age: number }>();

console.log('解析有效 JSON:', userJsonPrism.getOption(validJson));
console.log('解析无效 JSON:', userJsonPrism.getOption(invalidJson));

const obj = { name: 'Bob', age: 25 };
console.log('对象转 JSON:', userJsonPrism.reverseGet(obj));
console.log();

// ============================================================================
// 8. Prism 法则
// ============================================================================

console.log('8. Prism 法则\n');

/**
 * Prism 必须满足两个法则：
 * 
 * 1. 部分逆元法则 (Partial Inverse)：
 *    如果 getOption(s) = Some(a)，则 reverseGet(a) 应该等价于 s
 * 
 * 2. 逆元法则 (Reverse Inverse)：
 *    getOption(reverseGet(a)) = Some(a)
 */

console.log('验证 Prism 法则（使用 somePrism）:\n');

// 法则 1: 部分逆元
const testValue = Some(42);
const extracted = someP.getOption(testValue);
console.log('原值:', testValue);
console.log('提取:', extracted);

if (extracted._tag === 'Some') {
  const reconstructed = someP.reverseGet(extracted.value);
  console.log('重构:', reconstructed);
  console.log('法则 1 满足:', JSON.stringify(reconstructed) === JSON.stringify(testValue));
}

// 法则 2: 逆元
const value = 100;
const constructed = someP.reverseGet(value);
const extractedAgain = someP.getOption(constructed);

console.log('\n原值:', value);
console.log('构造:', constructed);
console.log('提取:', extractedAgain);
console.log('法则 2 满足:', 
  extractedAgain._tag === 'Some' && extractedAgain.value === value);
console.log();

// ============================================================================
// 9. Prism vs Lens 对比
// ============================================================================

console.log('9. Prism vs Lens 对比\n');

console.log('Lens（透镜）:');
console.log('  - 聚焦 Product Type（对象字段）');
console.log('  - get 总是成功');
console.log('  - set 总是成功');
console.log('  - 适用场景：对象字段访问');
console.log();

console.log('Prism（棱镜）:');
console.log('  - 聚焦 Sum Type（联合类型的某个分支）');
console.log('  - getOption 可能失败（返回 None）');
console.log('  - reverseGet 总是成功（构造）');
console.log('  - 适用场景：联合类型、可选值、错误处理');
console.log();

console.log('何时使用 Prism:');
console.log('  1. 处理 Option、Either 等和类型');
console.log('  2. 处理联合类型的特定分支');
console.log('  3. 安全的类型转换（解析、验证）');
console.log('  4. API 响应处理（Success/Error）');
