/**
 * 第五章第五节: Option 和 Either 综合练习
 * 
 * 通过真实业务场景的练习，深入理解 Option 和 Either 的应用
 * 包括：电商系统、用户管理、数据验证、API 集成等
 */

console.log('=== Option 和 Either 综合练习 ===\n');

// ============================================================================
// 类型定义
// ============================================================================

// Option 类型
type Option<T> = Some<T> | None;

interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

interface None {
  readonly _tag: 'None';
}

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None: Option<never> = { _tag: 'None' };

const isSome = <T>(option: Option<T>): option is Some<T> => option._tag === 'Some';
const isNone = <T>(option: Option<T>): option is None => option._tag === 'None';

// Either 类型
type Either<E, A> = Left<E> | Right<A>;

interface Left<E> {
  readonly _tag: 'Left';
  readonly left: E;
}

interface Right<A> {
  readonly _tag: 'Right';
  readonly right: A;
}

const Left = <E>(value: E): Either<E, never> => ({ _tag: 'Left', left: value });
const Right = <A>(value: A): Either<never, A> => ({ _tag: 'Right', right: value });

const isLeft = <E, A>(either: Either<E, A>): either is Left<E> => either._tag === 'Left';
const isRight = <E, A>(either: Either<E, A>): either is Right<A> => either._tag === 'Right';

// 工具函数
const mapOption = <A, B>(f: (a: A) => B) => (option: Option<A>): Option<B> =>
  isSome(option) ? Some(f(option.value)) : None;

const flatMapOption = <A, B>(f: (a: A) => Option<B>) => (option: Option<A>): Option<B> =>
  isSome(option) ? f(option.value) : None;

const foldOption = <A, B>(onNone: () => B, onSome: (a: A) => B) => (option: Option<A>): B =>
  isSome(option) ? onSome(option.value) : onNone();

const mapEither = <E, A, B>(f: (a: A) => B) => (either: Either<E, A>): Either<E, B> =>
  isRight(either) ? Right(f(either.right)) : either;

const flatMapEither = <E, A, B>(f: (a: A) => Either<E, B>) => (either: Either<E, A>): Either<E, B> =>
  isRight(either) ? f(either.right) : either;

const foldEither = <E, A, B>(onLeft: (e: E) => B, onRight: (a: A) => B) => (either: Either<E, A>): B =>
  isRight(either) ? onRight(either.right) : onLeft(either.left);

// ============================================================================
// 练习 1: 配置管理系统
// ============================================================================

console.log('练习 1: 配置管理系统\n');

console.log('场景: 从多个来源读取配置，优先级：环境变量 > 配置文件 > 默认值');
console.log();

interface AppConfig {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
}

// 模拟环境变量
const env: Record<string, string | undefined> = {
  API_URL: 'https://api.prod.com',
  // TIMEOUT 未设置
};

// 模拟配置文件
const configFile: Partial<AppConfig> = {
  apiUrl: 'https://api.staging.com',
  timeout: 5000,
  // maxRetries 未设置
};

// 默认配置
const defaultConfig: AppConfig = {
  apiUrl: 'https://api.dev.com',
  timeout: 3000,
  maxRetries: 3,
};

// 从环境变量读取
const readFromEnv = (key: string): Option<string> => {
  const value = env[key];
  return value !== undefined ? Some(value) : None;
};

// 从配置文件读取
const readFromFile = <K extends keyof AppConfig>(key: K): Option<AppConfig[K]> => {
  const value = configFile[key];
  return value !== undefined ? Some(value as AppConfig[K]) : None;
};

// 合并配置
const getConfig = (): AppConfig => {
  const apiUrl = foldOption(
    () => foldOption(
      () => defaultConfig.apiUrl,
      (v: string) => v
    )(readFromFile('apiUrl')),
    (v: string) => v
  )(readFromEnv('API_URL'));

  const timeout = foldOption(
    () => defaultConfig.timeout,
    (v: number) => v
  )(readFromFile('timeout'));

  const maxRetries = foldOption(
    () => defaultConfig.maxRetries,
    (v: number) => v
  )(readFromFile('maxRetries'));

  return { apiUrl, timeout, maxRetries };
};

console.log('✅ 配置管理结果:');
const config = getConfig();
console.log('API URL:', config.apiUrl, '(来自环境变量)');
console.log('Timeout:', config.timeout, '(来自配置文件)');
console.log('Max Retries:', config.maxRetries, '(来自默认值)');
console.log();

// ============================================================================
// 练习 2: 用户权限系统
// ============================================================================

console.log('练习 2: 用户权限系统\n');

console.log('场景: 检查用户权限，只有管理员才能访问某些资源');
console.log();

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'guest';
}

interface Resource {
  id: string;
  name: string;
  requiresAdmin: boolean;
}

const users: User[] = [
  { id: 1, username: 'admin', role: 'admin' },
  { id: 2, username: 'zhangsan', role: 'user' },
  { id: 3, username: 'guest', role: 'guest' },
];

const resources: Resource[] = [
  { id: 'R001', name: '用户列表', requiresAdmin: true },
  { id: 'R002', name: '个人资料', requiresAdmin: false },
];

type AuthError =
  | { type: 'UserNotFound' }
  | { type: 'ResourceNotFound' }
  | { type: 'PermissionDenied'; requiredRole: string };

const findUserById = (id: number): Either<AuthError, User> => {
  const user = users.find(u => u.id === id);
  return user ? Right(user) : Left({ type: 'UserNotFound' });
};

const findResourceById = (id: string): Either<AuthError, Resource> => {
  const resource = resources.find(r => r.id === id);
  return resource ? Right(resource) : Left({ type: 'ResourceNotFound' });
};

const checkPermission = (user: User, resource: Resource): Either<AuthError, Resource> => {
  if (resource.requiresAdmin && user.role !== 'admin') {
    return Left({ type: 'PermissionDenied', requiredRole: 'admin' });
  }
  return Right(resource);
};

const accessResource = (userId: number, resourceId: string): string => {
  const userResult = findUserById(userId);
  const result = flatMapEither((user: User) =>
    flatMapEither((resource: Resource) =>
      mapEither((res: Resource) => ({ user, resource: res }))(checkPermission(user, resource))
    )(findResourceById(resourceId))
  )(userResult);

  return foldEither(
    (error: AuthError) => {
      switch (error.type) {
        case 'UserNotFound':
          return '❌ 用户不存在';
        case 'ResourceNotFound':
          return '❌ 资源不存在';
        case 'PermissionDenied':
          return `❌ 权限不足，需要 ${error.requiredRole} 权限`;
      }
    },
    (data: { user: User; resource: Resource }) =>
      `✅ ${data.user.username} 成功访问 ${data.resource.name}`
  )(result as Either<AuthError, { user: User; resource: Resource }>);
};

console.log('✅ 权限检查结果:');
console.log('admin 访问用户列表:', accessResource(1, 'R001'));
console.log('zhangsan 访问用户列表:', accessResource(2, 'R001'));
console.log('zhangsan 访问个人资料:', accessResource(2, 'R002'));
console.log('不存在的用户:', accessResource(999, 'R001'));
console.log();

// ============================================================================
// 练习 3: 购物车价格计算
// ============================================================================

console.log('练习 3: 购物车价格计算\n');

console.log('场景: 计算购物车总价，包括折扣、优惠券、会员价等');
console.log();

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface Coupon {
  code: string;
  discount: number;  // 折扣百分比
  minAmount: number; // 最低消费金额
}

interface Membership {
  level: 'bronze' | 'silver' | 'gold';
  discount: number;  // 会员折扣百分比
}

const productsData: Product[] = [
  { id: 'P001', name: 'iPhone 15', price: 5999 },
  { id: 'P002', name: 'MacBook Pro', price: 12999 },
  { id: 'P003', name: 'AirPods', price: 1299 },
];

const coupons: Coupon[] = [
  { code: 'SAVE100', discount: 10, minAmount: 1000 },
  { code: 'SAVE200', discount: 20, minAmount: 5000 },
];

const findProductById = (id: string): Option<Product> => {
  const product = productsData.find(p => p.id === id);
  return product ? Some(product) : None;
};

const findCoupon = (code: string): Option<Coupon> => {
  const coupon = coupons.find(c => c.code === code);
  return coupon ? Some(coupon) : None;
};

// 计算购物车小计
const calculateSubtotal = (items: CartItem[]): Option<number> => {
  let total = 0;
  for (const item of items) {
    const productOption = findProductById(item.productId);
    if (isNone(productOption)) {
      return None;  // 商品不存在
    }
    total += productOption.value.price * item.quantity;
  }
  return Some(total);
};

// 应用优惠券
const applyCoupon = (subtotal: number, couponCode: Option<string>): number => {
  if (isNone(couponCode)) {
    return subtotal;
  }

  const couponOption = findCoupon(couponCode.value);
  if (isNone(couponOption)) {
    return subtotal;
  }

  const coupon = couponOption.value;
  if (subtotal < coupon.minAmount) {
    return subtotal;  // 不满足最低消费
  }

  return subtotal * (1 - coupon.discount / 100);
};

// 应用会员折扣
const applyMembership = (amount: number, membership: Option<Membership>): number => {
  return foldOption(
    () => amount,
    (m: Membership) => amount * (1 - m.discount / 100)
  )(membership);
};

// 计算最终价格
const calculateFinalPrice = (
  items: CartItem[],
  couponCode: Option<string>,
  membership: Option<Membership>
): string => {
  const subtotalOption = calculateSubtotal(items);

  return foldOption(
    () => '❌ 商品不存在',
    (subtotal: number) => {
      const afterCoupon = applyCoupon(subtotal, couponCode);
      const finalPrice = applyMembership(afterCoupon, membership);

      return `✅ 原价: ¥${subtotal.toFixed(2)} → 最终价格: ¥${finalPrice.toFixed(2)}`;
    }
  )(subtotalOption);
};

console.log('✅ 购物车价格计算:');

const cart1: CartItem[] = [
  { productId: 'P001', quantity: 2 },
  { productId: 'P003', quantity: 1 },
];

console.log('场景1: 无优惠');
console.log(calculateFinalPrice(cart1, None, None));

console.log('\n场景2: 使用优惠券 SAVE100');
console.log(calculateFinalPrice(cart1, Some('SAVE100'), None));

console.log('\n场景3: 黄金会员 + 优惠券');
console.log(calculateFinalPrice(
  cart1,
  Some('SAVE100'),
  Some({ level: 'gold', discount: 5 })
));

console.log('\n场景4: 不满足优惠券最低消费');
const cart2: CartItem[] = [{ productId: 'P003', quantity: 1 }];
console.log(calculateFinalPrice(cart2, Some('SAVE200'), None));
console.log();

// ============================================================================
// 练习 4: 表单验证组合器
// ============================================================================

console.log('练习 4: 表单验证组合器\n');

console.log('场景: 构建可组合的表单验证规则');
console.log();

type ValidationResult<T> = Either<string[], T>;

// 验证规则类型
type Validator<T> = (value: T) => ValidationResult<T>;

// 组合多个验证规则
const combineValidators = <T>(...validators: Validator<T>[]): Validator<T> => {
  return (value: T): ValidationResult<T> => {
    const errors: string[] = [];

    for (const validator of validators) {
      const result = validator(value);
      if (isLeft(result)) {
        errors.push(...result.left);
      }
    }

    return errors.length > 0 ? Left(errors) : Right(value);
  };
};

// 基础验证器
const required = (fieldName: string): Validator<string> => (value: string) =>
  value.trim() !== '' ? Right(value) : Left([`${fieldName} 不能为空`]);

const minLength = (fieldName: string, min: number): Validator<string> => (value: string) =>
  value.length >= min ? Right(value) : Left([`${fieldName} 至少 ${min} 个字符`]);

const maxLength = (fieldName: string, max: number): Validator<string> => (value: string) =>
  value.length <= max ? Right(value) : Left([`${fieldName} 最多 ${max} 个字符`]);

const pattern = (fieldName: string, regex: RegExp, message: string): Validator<string> =>
  (value: string) => regex.test(value) ? Right(value) : Left([`${fieldName} ${message}`]);

const email = (fieldName: string): Validator<string> =>
  pattern(fieldName, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '邮箱格式不正确');

// 构建验证规则
const validateUsername = combineValidators(
  required('用户名'),
  minLength('用户名', 3),
  maxLength('用户名', 20),
  pattern('用户名', /^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
);

const validateEmail = combineValidators(
  required('邮箱'),
  email('邮箱')
);

const validatePassword = combineValidators(
  required('密码'),
  minLength('密码', 8),
  pattern('密码', /[A-Z]/, '必须包含大写字母'),
  pattern('密码', /[a-z]/, '必须包含小写字母'),
  pattern('密码', /[0-9]/, '必须包含数字')
);

// 测试验证
const testValidation = (name: string, validator: Validator<string>, value: string) => {
  const result = validator(value);
  console.log(`${name}:`, value);
  if (isLeft(result)) {
    result.left.forEach(err => console.log(`  ❌ ${err}`));
  } else {
    console.log(`  ✅ 验证通过`);
  }
  console.log();
};

console.log('✅ 表单验证测试:');
testValidation('用户名验证1', validateUsername, 'zhangsan');
testValidation('用户名验证2', validateUsername, 'ab');
testValidation('邮箱验证1', validateEmail, 'test@example.com');
testValidation('邮箱验证2', validateEmail, 'invalid');
testValidation('密码验证1', validatePassword, 'Password123');
testValidation('密码验证2', validatePassword, 'weak');

// ============================================================================
// 练习 5: API 调用重试机制
// ============================================================================

console.log('练习 5: API 调用重试机制\n');

console.log('场景: 实现带重试的 API 调用，处理临时性失败');
console.log();

type ApiError = { code: number; message: string };
type ApiResponse<T> = Either<ApiError, T>;

interface ApiConfig {
  maxRetries: number;
  retryDelay: number;
}

// 模拟 API 调用（可能失败）
let callCount = 0;
const mockApiCall = <T>(shouldSucceedAfter: number, data: T): ApiResponse<T> => {
  callCount++;
  console.log(`  第 ${callCount} 次 API 调用...`);

  if (callCount >= shouldSucceedAfter) {
    callCount = 0;  // 重置计数
    return Right(data);
  }

  return Left({
    code: 503,
    message: '服务暂时不可用',
  });
};

// 重试逻辑（简化版，实际应该是异步的）
const withRetry = <T>(
  apiCall: () => ApiResponse<T>,
  config: ApiConfig
): ApiResponse<T> => {
  let attempts = 0;

  while (attempts <= config.maxRetries) {
    const result = apiCall();
    if (isRight(result)) {
      return result;
    }

    attempts++;
    if (attempts <= config.maxRetries) {
      console.log(`  ⚠️  失败，${config.retryDelay}ms 后重试...`);
    }
  }

  return Left({
    code: 500,
    message: `重试 ${config.maxRetries} 次后仍然失败`,
  });
};

console.log('✅ API 重试测试:');

console.log('\n场景1: 第2次调用成功');
const result1 = withRetry(
  () => mockApiCall(2, { userId: 1, name: '张三' }),
  { maxRetries: 3, retryDelay: 100 }
);
console.log('结果:', foldEither(
  (error: ApiError) => `❌ [${error.code}] ${error.message}`,
  (data: { userId: number; name: string }) => `✅ 成功: ${data.name}`
)(result1));

console.log('\n场景2: 重试全部失败');
const result2 = withRetry(
  () => mockApiCall(10, { userId: 2, name: '李四' }),
  { maxRetries: 2, retryDelay: 100 }
);
console.log('结果:', foldEither(
  (error: ApiError) => `❌ [${error.code}] ${error.message}`,
  (data: { userId: number; name: string }) => `✅ 成功: ${data.name}`
)(result2));
console.log();

// ============================================================================
// 练习 6: 数据转换管道
// ============================================================================

console.log('练习 6: 数据转换管道\n');

console.log('场景: 从外部 API 获取数据，验证、转换、存储');
console.log();

interface ExternalUser {
  id: string;
  full_name: string;
  email_address: string;
  age_years: string;
}

interface InternalUser {
  id: number;
  name: string;
  email: string;
  age: number;
}

type TransformError = string;

// 验证和转换 ID
const transformId = (id: string): Either<TransformError, number> => {
  const numId = parseInt(id);
  if (isNaN(numId) || numId <= 0) {
    return Left(`无效的 ID: ${id}`);
  }
  return Right(numId);
};

// 验证姓名
const transformName = (name: string): Either<TransformError, string> => {
  const trimmed = name.trim();
  if (trimmed === '') {
    return Left('姓名不能为空');
  }
  return Right(trimmed);
};

// 验证邮箱
const transformEmail = (email: string): Either<TransformError, string> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Left(`无效的邮箱: ${email}`);
  }
  return Right(email);
};

// 验证和转换年龄
const transformAge = (ageStr: string): Either<TransformError, number> => {
  const age = parseInt(ageStr);
  if (isNaN(age) || age < 0 || age > 150) {
    return Left(`无效的年龄: ${ageStr}`);
  }
  return Right(age);
};

// 完整的转换管道
const transformUser = (external: ExternalUser): Either<TransformError, InternalUser> => {
  const idResult = transformId(external.id);
  if (isLeft(idResult)) return idResult;

  const nameResult = transformName(external.full_name);
  if (isLeft(nameResult)) return nameResult;

  const emailResult = transformEmail(external.email_address);
  if (isLeft(emailResult)) return emailResult;

  const ageResult = transformAge(external.age_years);
  if (isLeft(ageResult)) return ageResult;

  return Right({
    id: idResult.right,
    name: nameResult.right,
    email: emailResult.right,
    age: ageResult.right,
  });
};

console.log('✅ 数据转换测试:');

const externalUser1: ExternalUser = {
  id: '123',
  full_name: '张三',
  email_address: 'zhang@example.com',
  age_years: '28',
};

const externalUser2: ExternalUser = {
  id: 'invalid',
  full_name: '',
  email_address: 'not-an-email',
  age_years: '999',
};

console.log('转换合法数据:');
console.log(foldEither(
  (error: TransformError) => `❌ ${error}`,
  (user: InternalUser) => `✅ 成功: ${JSON.stringify(user)}`
)(transformUser(externalUser1)));

console.log('\n转换非法数据:');
console.log(foldEither(
  (error: TransformError) => `❌ ${error}`,
  (user: InternalUser) => `✅ 成功: ${JSON.stringify(user)}`
)(transformUser(externalUser2)));
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 练习总结 ===\n');

console.log('通过这些练习，我们学会了:');
console.log('1. 使用 Option 处理可能不存在的值');
console.log('2. 使用 Either 进行错误处理和验证');
console.log('3. 组合多个验证规则');
console.log('4. 构建数据处理管道');
console.log('5. 实现重试机制');
console.log('6. 权限检查和资源访问控制');
console.log();

console.log('关键要点:');
console.log('- Option 和 Either 让空值和错误处理类型安全');
console.log('- 使用 map/flatMap/fold 构建声明式的数据流');
console.log('- 小的、可组合的函数更容易测试和维护');
console.log('- 函数式错误处理比异常更可控、更可预测');
console.log();

// ============================================================================
// 导出
// ============================================================================

export type { 
  Option, 
  Some as SomeType, 
  None as NoneType, 
  Either, 
  Left as LeftType, 
  Right as RightType,
  Validator 
};
export {
  Some,
  None,
  Left,
  Right,
  combineValidators,
  required,
  minLength,
  maxLength,
  pattern,
  email,
};
