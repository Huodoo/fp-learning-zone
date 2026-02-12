/**
 * 第六章第二节: Applicative Functor（应用函子）
 * 
 * Applicative Functor 是增强版的 Functor
 * 它允许我们将容器中的函数应用到容器中的值上
 * 这使得我们可以组合多个独立的计算结果
 * 
 * 核心思想：在容器的上下文中应用多个参数的函数
 */

import { Option, Some, None, isSome, Either, Left, Right, isRight } from './01-functor';

console.log('=== Applicative Functor（应用函子）===\n');

// ============================================================================
// 1. 为什么需要 Applicative？
// ============================================================================

console.log('1. 为什么需要 Applicative？\n');

console.log('问题：Functor 的 map 只能处理一元函数');
console.log('如果我们想组合多个 Option 值怎么办？\n');

// 场景：表单验证，需要组合多个字段
interface CreateUserForm {
  name: string;
  email: string;
  age: number;
}

// 每个字段的验证返回 Option
const validateName = (name: string): Option<string> =>
  name.length >= 2 ? Some(name) : None;

const validateEmail = (email: string): Option<string> =>
  email.includes('@') ? Some(email) : None;

const validateAge = (age: number): Option<number> =>
  age >= 18 && age <= 120 ? Some(age) : None;

console.log('✅ 验证单个字段:');
console.log('validateName("张三"):', validateName('张三'));
console.log('validateEmail("test@example.com"):', validateEmail('test@example.com'));
console.log('validateAge(25):', validateAge(25));
console.log();

console.log('❌ 问题：如何组合这三个 Option 来创建表单对象？');
console.log('传统的 map 无法处理多个参数！\n');

// ============================================================================
// 2. Applicative 接口定义
// ============================================================================

console.log('2. Applicative 接口定义\n');

/**
 * Applicative 类型类接口
 * 继承自 Functor，添加了 pure 和 ap 方法
 */
interface Applicative<F> {
  // pure: 将普通值提升到容器中（也叫 of、return）
  pure<A>(a: A): F<A>;
  
  // ap: 将容器中的函数应用到容器中的值
  // ap 是 apply 的缩写
  ap<A, B>(ff: F<(a: A) => B>, fa: F<A>): F<B>;
}

console.log('Applicative 的核心操作:');
console.log('1. pure(a): 将值 a 放入容器');
console.log('2. ap(ff, fa): 将容器中的函数 ff 应用到容器中的值 fa\n');

// ============================================================================
// 3. Option 的 Applicative 实现
// ============================================================================

console.log('3. Option 的 Applicative 实现\n');

// pure: 创建 Some
const pureOption = <A>(a: A): Option<A> => Some(a);

// ap: 应用容器中的函数
const apOption = <A, B>(
  ff: Option<(a: A) => B>,
  fa: Option<A>
): Option<B> => {
  // 只有当函数和值都存在时才应用
  if (isSome(ff) && isSome(fa)) {
    return Some(ff.value(fa.value));
  }
  return None;
};

console.log('✅ Option 的 ap 操作:');

// 例子1：简单的加法
const add = (a: number) => (b: number) => a + b;
const addInOption = pureOption(add);

const result1 = apOption(apOption(addInOption, Some(5)), Some(10));
console.log('ap(ap(pure(add), Some(5)), Some(10)):', result1);

// 例子2：包含 None 的情况
const result2 = apOption(apOption(addInOption, None), Some(10));
console.log('ap(ap(pure(add), None), Some(10)):', result2);
console.log();

// ============================================================================
// 4. Either 的 Applicative 实现
// ============================================================================

console.log('4. Either 的 Applicative 实现\n');

// pure: 创建 Right
const pureEither = <E, A>(a: A): Either<E, A> => Right(a);

// ap: 应用容器中的函数
const apEither = <E, A, B>(
  ff: Either<E, (a: A) => B>,
  fa: Either<E, A>
): Either<E, B> => {
  if (isRight(ff) && isRight(fa)) {
    return Right(ff.right(fa.right));
  }
  // 如果有错误，返回第一个错误
  if (ff._tag === 'Left') {
    return ff as Either<E, B>;
  }
  return fa as Either<E, B>;
};

console.log('✅ Either 的 ap 操作:');

const multiply = (a: number) => (b: number) => a * b;
const multiplyInEither = pureEither<string, (a: number) => (b: number) => number>(multiply);

const result3 = apEither(apEither(multiplyInEither, Right(3)), Right(4));
console.log('ap(ap(pure(multiply), Right(3)), Right(4)):', result3);

const result4 = apEither(apEither(multiplyInEither, Left('错误')), Right(4));
console.log('ap(ap(pure(multiply), Left("错误")), Right(4)):', result4);
console.log();

// ============================================================================
// 5. liftA2 和 liftA3 辅助函数
// ============================================================================

console.log('5. liftA2 和 liftA3 辅助函数\n');

/**
 * liftA2: 提升二元函数到 Applicative 上下文
 * 这是最常用的组合器
 */
const liftA2Option = <A, B, C>(
  f: (a: A) => (b: B) => C,
  fa: Option<A>,
  fb: Option<B>
): Option<C> => {
  return apOption(apOption(pureOption(f), fa), fb);
};

/**
 * liftA3: 提升三元函数到 Applicative 上下文
 */
const liftA3Option = <A, B, C, D>(
  f: (a: A) => (b: B) => (c: C) => D,
  fa: Option<A>,
  fb: Option<B>,
  fc: Option<C>
): Option<D> => {
  return apOption(apOption(apOption(pureOption(f), fa), fb), fc);
};

console.log('✅ 使用 liftA2 组合两个 Option:');

const concat = (a: string) => (b: string) => a + b;
const greeting = liftA2Option(concat, Some('Hello '), Some('World'));
console.log('liftA2(concat, Some("Hello "), Some("World")):', greeting);

const greetingWithNone = liftA2Option(concat, Some('Hello '), None);
console.log('liftA2(concat, Some("Hello "), None):', greetingWithNone);
console.log();

// ============================================================================
// 6. 实战场景：表单验证
// ============================================================================

console.log('6. 实战场景：表单验证\n');

// 创建用户的柯里化构造函数
const createUser = (name: string) => (email: string) => (age: number): CreateUserForm => ({
  name,
  email,
  age,
});

// 使用 liftA3 组合三个验证结果
const validateForm = (
  name: string,
  email: string,
  age: number
): Option<CreateUserForm> => {
  return liftA3Option(
    createUser,
    validateName(name),
    validateEmail(email),
    validateAge(age)
  );
};

console.log('✅ 表单验证（所有字段有效）:');
const validForm = validateForm('张三', 'zhang@example.com', 25);
console.log(validForm);

console.log('\n✅ 表单验证（姓名无效）:');
const invalidName = validateForm('A', 'zhang@example.com', 25);
console.log(invalidName);

console.log('\n✅ 表单验证（邮箱无效）:');
const invalidEmail = validateForm('张三', 'invalid-email', 25);
console.log(invalidEmail);

console.log('\n✅ 表单验证（年龄无效）:');
const invalidAge = validateForm('张三', 'zhang@example.com', 15);
console.log(invalidAge);
console.log();

// ============================================================================
// 7. 实战场景：配置文件解析
// ============================================================================

console.log('7. 实战场景：配置文件解析\n');

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
}

// 模拟从环境变量读取配置
const envVars: Record<string, string> = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'myapp',
};

const getEnv = (key: string): Option<string> => {
  const value = envVars[key];
  return value !== undefined ? Some(value) : None;
};

const parsePort = (str: string): Option<number> => {
  const port = parseInt(str, 10);
  return !isNaN(port) && port > 0 && port <= 65535 ? Some(port) : None;
};

// 创建数据库配置的柯里化构造函数
const createDbConfig = (host: string) => (port: number) => (database: string): DatabaseConfig => ({
  host,
  port,
  database,
});

// 使用 Applicative 组合配置
const loadDatabaseConfig = (): Option<DatabaseConfig> => {
  const hostOpt = getEnv('DB_HOST');
  const portStrOpt = getEnv('DB_PORT');
  const databaseOpt = getEnv('DB_NAME');

  // 需要先解析端口
  const portOpt = isSome(portStrOpt) ? parsePort(portStrOpt.value) : None;

  return liftA3Option(createDbConfig, hostOpt, portOpt, databaseOpt);
};

console.log('✅ 加载数据库配置:');
console.log(loadDatabaseConfig());
console.log();

// ============================================================================
// 8. 实战场景：并行 API 调用
// ============================================================================

console.log('8. 实战场景：并行 API 调用\n');

interface UserProfile {
  userId: number;
  username: string;
}

interface UserStats {
  userId: number;
  posts: number;
  followers: number;
}

interface UserSettings {
  userId: number;
  theme: string;
  notifications: boolean;
}

interface CompleteUserData {
  profile: UserProfile;
  stats: UserStats;
  settings: UserSettings;
}

// 模拟 API 调用
const fetchUserProfile = (userId: number): Either<string, UserProfile> => {
  if (userId === 1) {
    return Right({ userId: 1, username: 'zhangsan' });
  }
  return Left('用户不存在');
};

const fetchUserStats = (userId: number): Either<string, UserStats> => {
  if (userId === 1) {
    return Right({ userId: 1, posts: 42, followers: 150 });
  }
  return Left('统计数据不存在');
};

const fetchUserSettings = (userId: number): Either<string, UserSettings> => {
  if (userId === 1) {
    return Right({ userId: 1, theme: 'dark', notifications: true });
  }
  return Left('设置不存在');
};

// 组合完整的用户数据
const createCompleteUserData = (profile: UserProfile) => 
  (stats: UserStats) => 
  (settings: UserSettings): CompleteUserData => ({
    profile,
    stats,
    settings,
  });

// liftA3 for Either
const liftA3Either = <E, A, B, C, D>(
  f: (a: A) => (b: B) => (c: C) => D,
  fa: Either<E, A>,
  fb: Either<E, B>,
  fc: Either<E, C>
): Either<E, D> => {
  return apEither(apEither(apEither(pureEither(f), fa), fb), fc);
};

const fetchCompleteUserData = (userId: number): Either<string, CompleteUserData> => {
  return liftA3Either(
    createCompleteUserData,
    fetchUserProfile(userId),
    fetchUserStats(userId),
    fetchUserSettings(userId)
  );
};

console.log('✅ 并行获取用户数据（成功）:');
console.log(fetchCompleteUserData(1));

console.log('\n✅ 并行获取用户数据（失败）:');
console.log(fetchCompleteUserData(999));
console.log();

// ============================================================================
// 9. Applicative vs Functor vs Monad
// ============================================================================

console.log('9. Applicative vs Functor vs Monad\n');

console.log('📊 三者对比:');
console.log();
console.log('Functor (map):');
console.log('  - 只能处理一元函数');
console.log('  - F<A> + (A => B) → F<B>');
console.log('  - 用于简单的值转换');
console.log();
console.log('Applicative (ap):');
console.log('  - 可以组合多个独立的容器');
console.log('  - F<A => B> + F<A> → F<B>');
console.log('  - 用于并行验证、独立计算');
console.log();
console.log('Monad (flatMap):');
console.log('  - 可以根据前值决定下一步');
console.log('  - F<A> + (A => F<B>) → F<B>');
console.log('  - 用于依赖链、条件计算');
console.log();

// ============================================================================
// 10. 实战模式：验证累积错误
// ============================================================================

console.log('10. 实战模式：验证累积错误\n');

// 使用数组来累积所有错误
type Validation<E, A> = Either<E[], A>;

const pureValidation = <E, A>(a: A): Validation<E, A> => Right(a);

// 特殊的 ap：累积所有错误
const apValidation = <E, A, B>(
  ff: Validation<E, (a: A) => B>,
  fa: Validation<E, A>
): Validation<E, B> => {
  if (isRight(ff) && isRight(fa)) {
    return Right(ff.right(fa.right));
  }
  
  // 累积错误
  const errors: E[] = [];
  if (ff._tag === 'Left') {
    errors.push(...ff.left);
  }
  if (fa._tag === 'Left') {
    errors.push(...fa.left);
  }
  
  return Left(errors);
};

// 返回错误数组的验证函数
const validateNameV = (name: string): Validation<string, string> =>
  name.length >= 2 ? Right(name) : Left(['姓名至少2个字符']);

const validateEmailV = (email: string): Validation<string, string> =>
  email.includes('@') ? Right(email) : Left(['邮箱格式无效']);

const validateAgeV = (age: number): Validation<string, number> =>
  age >= 18 ? Right(age) : Left(['年龄必须≥18岁']);

// liftA3 for Validation
const liftA3Validation = <E, A, B, C, D>(
  f: (a: A) => (b: B) => (c: C) => D,
  fa: Validation<E, A>,
  fb: Validation<E, B>,
  fc: Validation<E, C>
): Validation<E, D> => {
  return apValidation(apValidation(apValidation(pureValidation(f), fa), fb), fc);
};

const validateFormWithErrors = (
  name: string,
  email: string,
  age: number
): Validation<string, CreateUserForm> => {
  return liftA3Validation(
    createUser,
    validateNameV(name),
    validateEmailV(email),
    validateAgeV(age)
  );
};

console.log('✅ 验证成功:');
console.log(validateFormWithErrors('张三', 'zhang@example.com', 25));

console.log('\n✅ 验证失败（累积所有错误）:');
console.log(validateFormWithErrors('A', 'invalid', 15));
console.log();

// ============================================================================
// 11. Applicative 实用工具
// ============================================================================

console.log('11. Applicative 实用工具\n');

/**
 * sequence: 将 Option 数组转换为 Option of 数组
 * 只有当所有都是 Some 时才返回 Some
 */
const sequenceOption = <A>(options: Option<A>[]): Option<A[]> => {
  const result: A[] = [];
  for (const opt of options) {
    if (isSome(opt)) {
      result.push(opt.value);
    } else {
      return None;
    }
  }
  return Some(result);
};

/**
 * traverse: map 后再 sequence
 */
const traverseOption = <A, B>(
  f: (a: A) => Option<B>,
  array: A[]
): Option<B[]> => {
  return sequenceOption(array.map(f));
};

console.log('✅ sequence: 转换 Option 数组:');
const allSome = [Some(1), Some(2), Some(3)];
console.log('sequence([Some(1), Some(2), Some(3)]):', sequenceOption(allSome));

const hasNone = [Some(1), None, Some(3)];
console.log('sequence([Some(1), None, Some(3)]):', sequenceOption(hasNone));

console.log('\n✅ traverse: map 并 sequence:');
const parseNumbers = (strs: string[]): Option<number[]> => {
  return traverseOption(
    (s) => {
      const n = parseInt(s, 10);
      return isNaN(n) ? None : Some(n);
    },
    strs
  );
};

console.log('parseNumbers(["1", "2", "3"]):', parseNumbers(['1', '2', '3']));
console.log('parseNumbers(["1", "abc", "3"]):', parseNumbers(['1', 'abc', '3']));
console.log();

console.log('=== Applicative 总结 ===');
console.log('Applicative 允许我们组合多个独立的容器');
console.log('非常适合并行验证、独立 API 调用等场景');
console.log('提供了比 Functor 更强的组合能力');
console.log('但不如 Monad 灵活（无法根据前值决定下一步）');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  pureOption,
  apOption,
  liftA2Option,
  liftA3Option,
  pureEither,
  apEither,
  liftA3Either,
  type Validation,
  pureValidation,
  apValidation,
  liftA3Validation,
  sequenceOption,
  traverseOption,
};
