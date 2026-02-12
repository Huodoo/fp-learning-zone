/**
 * 第五章第二节: Either/Result 类型
 * 
 * Either 类型用于表示可能失败的计算，是函数式编程中处理错误的标准方式
 * Left 代表错误，Right 代表成功
 * 相比于异常抛出，Either 类型在类型系统中明确表达了"可能失败"的语义
 */

console.log('=== Either/Result 类型 ===\n');

// ============================================================================
// 1. 为什么需要 Either 类型？
// ============================================================================

console.log('1. 为什么需要 Either 类型？\n');

// ❌ 传统错误处理: try-catch 的问题
function parseAgeOld(input: string): number {
  const age = parseInt(input);
  if (isNaN(age)) {
    throw new Error('无效的年龄格式');  // 抛出异常
  }
  if (age < 0 || age > 150) {
    throw new Error('年龄超出范围');
  }
  return age;
}

console.log('❌ try-catch 的问题:');
try {
  console.log('解析 "25":', parseAgeOld('25'));
  console.log('解析 "abc":', parseAgeOld('abc'));  // 这会抛出异常
} catch (error) {
  console.log('捕获错误:', (error as Error).message);
}
console.log('- 异常抛出会中断控制流');
console.log('- 类型签名不能表达"可能失败"');
console.log('- 难以组合多个可能失败的操作');
console.log();

// ============================================================================
// 2. Either 类型的实现
// ============================================================================

console.log('2. Either 类型的实现\n');

// Either 是一个和类型，有两种可能: Left(错误) 或 Right(成功)
type Either<E, A> = Left<E> | Right<A>;

// Left: 表示错误/失败
interface Left<E> {
  readonly _tag: 'Left';
  readonly left: E;
}

// Right: 表示成功/正确
interface Right<A> {
  readonly _tag: 'Right';
  readonly right: A;
}

// 构造函数 (Constructor)
const Left = <E>(value: E): Either<E, never> => ({
  _tag: 'Left',
  left: value,
});

const Right = <A>(value: A): Either<never, A> => ({
  _tag: 'Right',
  right: value,
});

// 类型守卫 (Type Guards)
const isLeft = <E, A>(either: Either<E, A>): either is Left<E> =>
  either._tag === 'Left';

const isRight = <E, A>(either: Either<E, A>): either is Right<A> =>
  either._tag === 'Right';

console.log('✅ Left 和 Right 的创建:');
const errorResult = Left('发生错误');
const successResult = Right(42);

console.log('Left("发生错误"):', errorResult);
console.log('Right(42):', successResult);
console.log('isLeft(Left(...)):', isLeft(errorResult));
console.log('isRight(Right(...)):', isRight(successResult));
console.log();

// ============================================================================
// 3. Either 的基本操作
// ============================================================================

console.log('3. Either 的基本操作\n');

// map: 转换成功值 (Functor)
const map = <E, A, B>(f: (a: A) => B) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return Right(f(either.right));
  }
  return either;
};

// mapLeft: 转换错误值
const mapLeft = <E, F, A>(f: (e: E) => F) => (either: Either<E, A>): Either<F, A> => {
  if (isLeft(either)) {
    return Left(f(either.left));
  }
  return either;
};

// flatMap (chain/bind): 链接可能失败的操作 (Monad)
const flatMap = <E, A, B>(f: (a: A) => Either<E, B>) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return f(either.right);
  }
  return either;
};

// fold: 模式匹配，处理两种情况
const fold = <E, A, B>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B
) => (either: Either<E, A>): B => {
  if (isRight(either)) {
    return onRight(either.right);
  }
  return onLeft(either.left);
};

// getOrElse: 获取值或使用默认值
const getOrElse = <A>(defaultValue: A) => <E>(either: Either<E, A>): A => {
  if (isRight(either)) {
    return either.right;
  }
  return defaultValue;
};

console.log('✅ map 操作: 将 Right(5) 的值乘以 2');
const doubled = map((x: number) => x * 2)(Right(5));
console.log('结果:', doubled);

console.log('\n✅ map 操作在 Left 上:');
const doubledLeft = map((x: number) => x * 2)(Left('错误'));
console.log('结果:', doubledLeft);

console.log('\n✅ fold: 处理两种情况');
const message = fold(
  (error: string) => `错误: ${error}`,
  (value: number) => `成功: ${value}`
)(Right(42));
console.log('结果:', message);
console.log();

// ============================================================================
// 4. 实际业务场景: 年龄验证
// ============================================================================

console.log('4. 实际业务场景: 年龄验证\n');

// ✅ 使用 Either 的验证函数
const parseAge = (input: string): Either<string, number> => {
  const age = parseInt(input);
  if (isNaN(age)) {
    return Left('无效的年龄格式');
  }
  if (age < 0) {
    return Left('年龄不能为负数');
  }
  if (age > 150) {
    return Left('年龄超出合理范围');
  }
  return Right(age);
};

// 检查是否成年
const checkAdult = (age: number): Either<string, number> => {
  if (age < 18) {
    return Left('用户未成年');
  }
  return Right(age);
};

// 组合验证
const validateAdultAge = (input: string): string => {
  const result = flatMap(checkAdult)(parseAge(input));
  return fold(
    (error: string) => `❌ ${error}`,
    (age: number) => `✅ 有效年龄: ${age}`
  )(result);
};

console.log('✅ 年龄验证:');
console.log('"25":', validateAdultAge('25'));
console.log('"16":', validateAdultAge('16'));
console.log('"abc":', validateAdultAge('abc'));
console.log('"-5":', validateAdultAge('-5'));
console.log();

// ============================================================================
// 5. 错误类型建模
// ============================================================================

console.log('5. 错误类型建模\n');

// 定义具体的错误类型
type ValidationError =
  | { type: 'EmptyField'; field: string }
  | { type: 'InvalidFormat'; field: string; message: string }
  | { type: 'OutOfRange'; field: string; min: number; max: number };

// 用户注册数据
interface RegistrationData {
  username: string;
  email: string;
  age: string;
}

// 验证用户名
const validateUsername = (username: string): Either<ValidationError, string> => {
  if (username.trim() === '') {
    return Left({ type: 'EmptyField', field: 'username' });
  }
  if (username.length < 3) {
    return Left({ 
      type: 'InvalidFormat', 
      field: 'username', 
      message: '用户名至少3个字符' 
    });
  }
  return Right(username);
};

// 验证邮箱
const validateEmail = (email: string): Either<ValidationError, string> => {
  if (email.trim() === '') {
    return Left({ type: 'EmptyField', field: 'email' });
  }
  if (email.indexOf('@') === -1) {
    return Left({ 
      type: 'InvalidFormat', 
      field: 'email', 
      message: '邮箱格式不正确' 
    });
  }
  return Right(email);
};

// 验证年龄（使用具体错误类型）
const validateAgeTyped = (ageStr: string): Either<ValidationError, number> => {
  if (ageStr.trim() === '') {
    return Left({ type: 'EmptyField', field: 'age' });
  }
  const age = parseInt(ageStr);
  if (isNaN(age)) {
    return Left({ 
      type: 'InvalidFormat', 
      field: 'age', 
      message: '年龄必须是数字' 
    });
  }
  if (age < 18 || age > 100) {
    return Left({ 
      type: 'OutOfRange', 
      field: 'age', 
      min: 18, 
      max: 100 
    });
  }
  return Right(age);
};

// 格式化错误消息
const formatValidationError = (error: ValidationError): string => {
  switch (error.type) {
    case 'EmptyField':
      return `${error.field} 不能为空`;
    case 'InvalidFormat':
      return `${error.field} 格式错误: ${error.message}`;
    case 'OutOfRange':
      return `${error.field} 必须在 ${error.min} 到 ${error.max} 之间`;
  }
};

console.log('✅ 结构化错误类型:');
const result1 = validateUsername('ab');
console.log('用户名 "ab":', fold(formatValidationError, (v: string) => `成功: ${v}`)(result1));

const result2 = validateEmail('invalid');
console.log('邮箱 "invalid":', fold(formatValidationError, (v: string) => `成功: ${v}`)(result2));

const result3 = validateAgeTyped('200');
console.log('年龄 "200":', fold(formatValidationError, (v: number) => `成功: ${v}`)(result3));
console.log();

// ============================================================================
// 6. 复杂场景: 用户注册流程
// ============================================================================

console.log('6. 复杂场景: 用户注册流程\n');

interface ValidatedUser {
  username: string;
  email: string;
  age: number;
}

// 验证所有字段 (使用 applicative 风格会更好，这里简化)
const validateRegistration = (data: RegistrationData): Either<ValidationError, ValidatedUser> => {
  // 验证用户名
  const usernameResult = validateUsername(data.username);
  if (isLeft(usernameResult)) return usernameResult;

  // 验证邮箱
  const emailResult = validateEmail(data.email);
  if (isLeft(emailResult)) return emailResult;

  // 验证年龄
  const ageResult = validateAgeTyped(data.age);
  if (isLeft(ageResult)) return ageResult;

  return Right({
    username: usernameResult.right,
    email: emailResult.right,
    age: ageResult.right,
  });
};

// 保存用户（模拟可能失败的 IO 操作）
const saveUser = (user: ValidatedUser): Either<string, ValidatedUser> => {
  // 模拟：检查用户名是否已存在
  if (user.username === 'admin') {
    return Left('用户名已被占用');
  }
  return Right(user);
};

// 完整注册流程
const registerUser = (data: RegistrationData): string => {
  const validationResult = validateRegistration(data);
  const result = flatMap(saveUser)(
    mapLeft(formatValidationError)(validationResult as Either<string, ValidatedUser>)
  );

  return fold(
    (error: string) => `注册失败: ${error}`,
    (user: ValidatedUser) => `注册成功: ${user.username} (${user.email})`
  )(result);
};

console.log('✅ 用户注册流程:');
console.log(registerUser({ 
  username: 'zhangsan', 
  email: 'zhang@example.com', 
  age: '25' 
}));

console.log(registerUser({ 
  username: 'ab', 
  email: 'li@example.com', 
  age: '30' 
}));

console.log(registerUser({ 
  username: 'wangwu', 
  email: 'invalid-email', 
  age: '28' 
}));

console.log(registerUser({ 
  username: 'admin', 
  email: 'admin@example.com', 
  age: '35' 
}));
console.log();

// ============================================================================
// 7. Either 工具函数
// ============================================================================

console.log('7. Either 工具函数\n');

// orElse: 提供备选 Either
const orElse = <E, A>(alternative: () => Either<E, A>) => (either: Either<E, A>): Either<E, A> => {
  if (isRight(either)) {
    return either;
  }
  return alternative();
};

// fromPredicate: 根据条件创建 Either
const fromPredicate = <E, A>(
  predicate: (a: A) => boolean,
  onFalse: (a: A) => E
) => (value: A): Either<E, A> => {
  return predicate(value) ? Right(value) : Left(onFalse(value));
};

// tryCatch: 捕获异常并转换为 Either
const tryCatch = <E, A>(
  f: () => A,
  onError: (error: unknown) => E
): Either<E, A> => {
  try {
    return Right(f());
  } catch (error) {
    return Left(onError(error));
  }
};

// sequence: 将 Either 数组转换为数组的 Either
const sequence = <E, A>(eithers: Either<E, A>[]): Either<E, A[]> => {
  const result: A[] = [];
  for (const either of eithers) {
    if (isLeft(either)) {
      return either;
    }
    result.push(either.right);
  }
  return Right(result);
};

console.log('✅ fromPredicate:');
const checkPositive = fromPredicate(
  (n: number) => n > 0,
  (n: number) => `${n} 不是正数`
);
console.log('checkPositive(5):', checkPositive(5));
console.log('checkPositive(-3):', checkPositive(-3));

console.log('\n✅ tryCatch:');
const parseJSON = (json: string): Either<string, unknown> =>
  tryCatch(
    () => JSON.parse(json),
    (error) => `JSON 解析失败: ${error}`
  );

console.log('parseJSON("{\\"name\\":\\"张三\\"}"):', parseJSON('{"name":"张三"}'));
console.log('parseJSON("{invalid}"):', parseJSON('{invalid}'));
console.log();

// ============================================================================
// 8. 实战: API 调用链
// ============================================================================

console.log('8. 实战: API 调用链\n');

interface ApiError {
  code: number;
  message: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Inventory {
  productId: string;
  quantity: number;
}

// 模拟 API 调用
const fetchProduct = (id: string): Either<ApiError, Product> => {
  if (id === 'P001') {
    return Right({ id: 'P001', name: 'iPhone 15', price: 5999 });
  }
  return Left({ code: 404, message: '商品不存在' });
};

const fetchInventory = (productId: string): Either<ApiError, Inventory> => {
  if (productId === 'P001') {
    return Right({ productId: 'P001', quantity: 10 });
  }
  return Left({ code: 404, message: '库存信息不存在' });
};

const checkAvailability = (inventory: Inventory): Either<ApiError, Inventory> => {
  if (inventory.quantity > 0) {
    return Right(inventory);
  }
  return Left({ code: 400, message: '商品无库存' });
};

// 完整的库存检查流程
const getProductAvailability = (productId: string): string => {
  const result = flatMap((product: Product) =>
    flatMap((inventory: Inventory) =>
      map((inv: Inventory) => ({
        product,
        quantity: inv.quantity,
      }))(checkAvailability(inventory))
    )(fetchInventory(product.id))
  )(fetchProduct(productId));

  return fold(
    (error: ApiError) => `❌ [${error.code}] ${error.message}`,
    (data: { product: Product; quantity: number }) => 
      `✅ ${data.product.name} 有 ${data.quantity} 件库存`
  )(result as Either<ApiError, { product: Product; quantity: number }>);
};

console.log('✅ API 调用链:');
console.log(getProductAvailability('P001'));
console.log(getProductAvailability('P999'));
console.log();

// ============================================================================
// 9. Either vs try-catch 对比
// ============================================================================

console.log('9. Either vs try-catch 对比\n');

console.log('❌ try-catch:');
console.log('- 异常抛出会中断控制流');
console.log('- 类型签名不能表达"可能失败"');
console.log('- 难以组合多个可能失败的操作');
console.log('- 性能开销较大');
console.log();

console.log('✅ Either:');
console.log('- 明确表达"可能失败"的语义');
console.log('- 类型系统强制处理错误情况');
console.log('- 易于组合和链式调用');
console.log('- 可以携带丰富的错误信息');
console.log('- 函数式、声明式的错误处理');
console.log();

// ============================================================================
// 10. 总结
// ============================================================================

console.log('10. 总结\n');

console.log('Either 类型的优势:');
console.log('1. 类型安全: 强制处理错误情况');
console.log('2. 可组合: 使用 flatMap 链接多个操作');
console.log('3. 表达力强: 可以定义具体的错误类型');
console.log('4. 声明式: 代码更清晰、更易读');
console.log();

console.log('使用场景:');
console.log('- 表单验证');
console.log('- API 调用');
console.log('- 数据解析');
console.log('- 业务规则检查');
console.log('- 任何可能失败的计算');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  Either,
  Left,
  Right,
  isLeft,
  isRight,
  map,
  mapLeft,
  flatMap,
  fold,
  getOrElse,
  orElse,
  fromPredicate,
  tryCatch,
  sequence,
  ValidationError,
};
