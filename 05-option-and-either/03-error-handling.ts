/**
 * 第五章第三节: 错误处理与 Railway-Oriented Programming
 * 
 * Railway-Oriented Programming (铁路导向编程) 是一种函数式错误处理模式
 * 将程序流程想象成铁路轨道：成功轨道和失败轨道
 * 一旦进入失败轨道，就会一直沿着失败轨道前进，直到最后统一处理
 */

console.log('=== Railway-Oriented Programming ===\n');

// ============================================================================
// 1. Railway-Oriented Programming 核心概念
// ============================================================================

console.log('1. Railway-Oriented Programming 核心概念\n');

console.log('可视化表示:');
console.log(`
  输入 ──→ [验证1] ──→ [验证2] ──→ [验证3] ──→ 成功输出
             ↓            ↓            ↓
             失败 ───────→ 失败 ───────→ 失败输出

  - 绿色轨道 (Right): 成功路径
  - 红色轨道 (Left): 失败路径
  - 一旦进入失败轨道，后续验证都会被跳过
`);
console.log();

// ============================================================================
// 2. Either 类型定义（复用）
// ============================================================================

type Either<E, A> = Left<E> | Right<A>;

interface Left<E> {
  readonly _tag: 'Left';
  readonly left: E;
}

interface Right<A> {
  readonly _tag: 'Right';
  readonly right: A;
}

const Left = <E>(value: E): Either<E, never> => ({
  _tag: 'Left',
  left: value,
});

const Right = <A>(value: A): Either<never, A> => ({
  _tag: 'Right',
  right: value,
});

const isLeft = <E, A>(either: Either<E, A>): either is Left<E> =>
  either._tag === 'Left';

const isRight = <E, A>(either: Either<E, A>): either is Right<A> =>
  either._tag === 'Right';

// ============================================================================
// 3. Railway 基础操作
// ============================================================================

console.log('2. Railway 基础操作\n');

// map: 在成功轨道上转换值
// Success Track -> Success Track
const map = <E, A, B>(f: (a: A) => B) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return Right(f(either.right));
  }
  return either;
};

// flatMap: 链接可能切换轨道的函数
// Success Track -> Two-Track (可能失败)
const flatMap = <E, A, B>(f: (a: A) => Either<E, B>) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return f(either.right);
  }
  return either;
};

// tee: 执行副作用但不改变值（用于日志、调试）
// Success Track -> Success Track (with side effect)
const tee = <E, A>(f: (a: A) => void) => (either: Either<E, A>): Either<E, A> => {
  if (isRight(either)) {
    f(either.right);
  }
  return either;
};

// tryCatch: 将可能抛出异常的函数转换为 Two-Track
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

console.log('✅ Railway 操作演示:');

const double = (x: number) => x * 2;
const increment = (x: number) => Right(x + 1);

const result1 = map(double)(Right(5));
console.log('map(double)(Right(5)):', result1);

const result2 = flatMap(increment)(Right(10));
console.log('flatMap(increment)(Right(10)):', result2);

const result3 = tee((x: number) => console.log('  调试输出:', x))(Right(42));
console.log('tee 后的结果:', result3);
console.log();

// ============================================================================
// 4. 实战场景: 用户注册验证链
// ============================================================================

console.log('3. 实战场景: 用户注册验证链\n');

// 定义错误类型
type RegistrationError =
  | { type: 'InvalidUsername'; reason: string }
  | { type: 'InvalidEmail'; reason: string }
  | { type: 'InvalidPassword'; reason: string }
  | { type: 'DatabaseError'; reason: string };

interface UserInput {
  username: string;
  email: string;
  password: string;
}

interface ValidatedUser {
  username: string;
  email: string;
  passwordHash: string;
}

// 验证函数：Single-Track -> Two-Track

// 验证用户名
const validateUsername = (input: UserInput): Either<RegistrationError, UserInput> => {
  if (input.username.length < 3) {
    return Left({ type: 'InvalidUsername', reason: '用户名至少3个字符' });
  }
  if (input.username.length > 20) {
    return Left({ type: 'InvalidUsername', reason: '用户名最多20个字符' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
    return Left({ type: 'InvalidUsername', reason: '用户名只能包含字母、数字和下划线' });
  }
  return Right(input);
};

// 验证邮箱
const validateEmail = (input: UserInput): Either<RegistrationError, UserInput> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    return Left({ type: 'InvalidEmail', reason: '邮箱格式不正确' });
  }
  return Right(input);
};

// 验证密码
const validatePassword = (input: UserInput): Either<RegistrationError, UserInput> => {
  if (input.password.length < 8) {
    return Left({ type: 'InvalidPassword', reason: '密码至少8个字符' });
  }
  if (!/[A-Z]/.test(input.password)) {
    return Left({ type: 'InvalidPassword', reason: '密码必须包含大写字母' });
  }
  if (!/[0-9]/.test(input.password)) {
    return Left({ type: 'InvalidPassword', reason: '密码必须包含数字' });
  }
  return Right(input);
};

// 哈希密码（模拟）
const hashPassword = (input: UserInput): Either<RegistrationError, ValidatedUser> => {
  return tryCatch(
    () => ({
      username: input.username,
      email: input.email,
      passwordHash: `hashed_${input.password}`,  // 实际应使用 bcrypt
    }),
    () => ({ type: 'DatabaseError', reason: '密码哈希失败' } as RegistrationError)
  );
};

// 保存到数据库（模拟）
const saveToDatabase = (user: ValidatedUser): Either<RegistrationError, ValidatedUser> => {
  // 模拟检查用户名是否已存在
  if (user.username === 'admin') {
    return Left({ type: 'DatabaseError', reason: '用户名已被占用' });
  }
  return Right(user);
};

// 组合验证链 - Railway-Oriented Programming
const registerUser = (input: UserInput): Either<RegistrationError, ValidatedUser> => {
  return flatMap(saveToDatabase)(
    flatMap(hashPassword)(
      flatMap(validatePassword)(
        flatMap(validateEmail)(
          validateUsername(input)
        )
      )
    )
  );
};

// 使用 pipe 风格（更清晰）
const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value);

// 格式化错误消息
const formatError = (error: RegistrationError): string => {
  switch (error.type) {
    case 'InvalidUsername':
      return `用户名验证失败: ${error.reason}`;
    case 'InvalidEmail':
      return `邮箱验证失败: ${error.reason}`;
    case 'InvalidPassword':
      return `密码验证失败: ${error.reason}`;
    case 'DatabaseError':
      return `数据库错误: ${error.reason}`;
  }
};

// 格式化成功消息
const formatSuccess = (user: ValidatedUser): string => {
  return `✅ 注册成功: ${user.username} (${user.email})`;
};

// 执行注册并格式化结果
const register = (input: UserInput): string => {
  const result = registerUser(input);
  return isRight(result) 
    ? formatSuccess(result.right) 
    : `❌ ${formatError(result.left)}`;
};

console.log('✅ Railway-Oriented 验证链:');
console.log();

console.log('测试1: 合法输入');
console.log(register({
  username: 'zhangsan',
  email: 'zhang@example.com',
  password: 'Password123',
}));

console.log('\n测试2: 用户名过短');
console.log(register({
  username: 'ab',
  email: 'test@example.com',
  password: 'Password123',
}));

console.log('\n测试3: 邮箱格式错误');
console.log(register({
  username: 'lisi',
  email: 'invalid-email',
  password: 'Password123',
}));

console.log('\n测试4: 密码无大写字母');
console.log(register({
  username: 'wangwu',
  email: 'wang@example.com',
  password: 'password123',
}));

console.log('\n测试5: 用户名已存在');
console.log(register({
  username: 'admin',
  email: 'admin@example.com',
  password: 'Password123',
}));
console.log();

// ============================================================================
// 5. 错误累积 (Error Accumulation)
// ============================================================================

console.log('4. 错误累积 (Error Accumulation)\n');

console.log('前面的例子一遇到错误就停止，但有时我们想收集所有错误');
console.log('这需要 Validation 类型（Applicative Functor）\n');

// Validation 类型：可以累积错误
type Validation<E, A> = Failure<E> | Success<A>;

interface Failure<E> {
  readonly _tag: 'Failure';
  readonly errors: E[];
}

interface Success<A> {
  readonly _tag: 'Success';
  readonly value: A;
}

const Failure = <E>(errors: E[]): Validation<E, never> => ({
  _tag: 'Failure',
  errors,
});

const Success = <A>(value: A): Validation<never, A> => ({
  _tag: 'Success',
  value,
});

const isFailure = <E, A>(v: Validation<E, A>): v is Failure<E> =>
  v._tag === 'Failure';

const isSuccess = <E, A>(v: Validation<E, A>): v is Success<A> =>
  v._tag === 'Success';

// 并行验证（累积错误）
const validateAll = <E, A>(validations: Validation<E, A>[]): Validation<E, A[]> => {
  const errors: E[] = [];
  const values: A[] = [];

  for (const v of validations) {
    if (isFailure(v)) {
      errors.push(...v.errors);
    } else {
      values.push(v.value);
    }
  }

  return errors.length > 0 ? Failure(errors) : Success(values);
};

// 独立的字段验证
const validateUsernameField = (username: string): Validation<string, string> => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('用户名至少3个字符');
  }
  if (username.length > 20) {
    errors.push('用户名最多20个字符');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字和下划线');
  }

  return errors.length > 0 ? Failure(errors) : Success(username);
};

const validateEmailField = (email: string): Validation<string, string> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) 
    ? Success(email) 
    : Failure(['邮箱格式不正确']);
};

const validatePasswordField = (password: string): Validation<string, string> => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('密码至少8个字符');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }

  return errors.length > 0 ? Failure(errors) : Success(password);
};

// 并行验证所有字段
const validateUserInputParallel = (input: UserInput): Validation<string, UserInput> => {
  const usernameResult = validateUsernameField(input.username);
  const emailResult = validateEmailField(input.email);
  const passwordResult = validatePasswordField(input.password);

  const allResults = validateAll([usernameResult, emailResult, passwordResult]);

  if (isSuccess(allResults)) {
    return Success(input);
  }
  return Failure(allResults.errors);
};

console.log('✅ 错误累积验证:');

const input1: UserInput = {
  username: 'ab',
  email: 'invalid',
  password: 'short',
};

const validationResult = validateUserInputParallel(input1);
console.log('验证输入:', input1);
if (isFailure(validationResult)) {
  console.log('所有错误:');
  validationResult.errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. ${err}`);
  });
} else {
  console.log('验证通过');
}
console.log();

// ============================================================================
// 6. 实战: 表单验证
// ============================================================================

console.log('5. 实战: 表单验证\n');

interface ContactForm {
  name: string;
  phone: string;
  address: string;
  zipCode: string;
}

const validateName = (name: string): Validation<string, string> => {
  return name.trim().length > 0 
    ? Success(name) 
    : Failure(['姓名不能为空']);
};

const validatePhone = (phone: string): Validation<string, string> => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone)
    ? Success(phone)
    : Failure(['手机号码格式不正确']);
};

const validateAddress = (address: string): Validation<string, string> => {
  return address.trim().length >= 10
    ? Success(address)
    : Failure(['地址至少10个字符']);
};

const validateZipCode = (zipCode: string): Validation<string, string> => {
  const zipRegex = /^\d{6}$/;
  return zipRegex.test(zipCode)
    ? Success(zipCode)
    : Failure(['邮编必须是6位数字']);
};

const validateContactForm = (form: ContactForm): Validation<string, ContactForm> => {
  const results = validateAll([
    validateName(form.name),
    validatePhone(form.phone),
    validateAddress(form.address),
    validateZipCode(form.zipCode),
  ]);

  return isSuccess(results) ? Success(form) : Failure(results.errors);
};

console.log('✅ 表单验证示例:');

const form1: ContactForm = {
  name: '张三',
  phone: '13812345678',
  address: '北京市朝阳区某某街道123号',
  zipCode: '100000',
};

const form2: ContactForm = {
  name: '',
  phone: '123',
  address: '太短',
  zipCode: '12345',
};

console.log('表单1:');
const formResult1 = validateContactForm(form1);
console.log(isSuccess(formResult1) ? '✅ 验证通过' : '❌ 验证失败');

console.log('\n表单2:');
const formResult2 = validateContactForm(form2);
if (isFailure(formResult2)) {
  console.log('错误列表:');
  formResult2.errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. ${err}`);
  });
}
console.log();

// ============================================================================
// 7. Either vs Validation 对比
// ============================================================================

console.log('6. Either vs Validation 对比\n');

console.log('Either (短路行为):');
console.log('- 遇到第一个错误就停止');
console.log('- 适合有依赖关系的验证');
console.log('- 符合 Monad 定律');
console.log('- 示例: 注册流程（用户名验证失败后无需验证密码）');
console.log();

console.log('Validation (错误累积):');
console.log('- 收集所有错误');
console.log('- 适合独立字段的验证');
console.log('- 符合 Applicative Functor 定律');
console.log('- 示例: 表单验证（一次性显示所有错误）');
console.log();

// ============================================================================
// 8. 最佳实践
// ============================================================================

console.log('7. 最佳实践\n');

console.log('1. 选择合适的错误处理方式:');
console.log('   - 有依赖关系 → Either (短路)');
console.log('   - 独立验证 → Validation (累积)');
console.log();

console.log('2. 定义具体的错误类型:');
console.log('   - 使用 discriminated unions');
console.log('   - 携带足够的上下文信息');
console.log();

console.log('3. 保持函数纯粹:');
console.log('   - 验证函数不应有副作用');
console.log('   - 使用 tee 函数添加日志');
console.log();

console.log('4. 组合优于命令式:');
console.log('   - 使用 flatMap 链接操作');
console.log('   - 使用 pipe/compose 提高可读性');
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
  Validation,
  Failure,
  Success,
  isFailure,
  isSuccess,
  map,
  flatMap,
  tee,
  tryCatch,
  validateAll,
  RegistrationError,
};
