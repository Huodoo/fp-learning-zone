/**
 * 第六章第三节: Monad（单子）
 * 
 * Monad 是函数式编程中最重要的抽象之一
 * 它在 Functor 和 Applicative 的基础上增加了 flatMap（也叫 bind、chain）
 * flatMap 允许我们链式调用返回 Monad 的函数，避免嵌套
 * 
 * 核心思想：可以根据前一个计算的结果决定下一步计算
 */

import { Option, Some, None, isSome, Either, Left, Right, isRight } from './01-functor';

console.log('=== Monad（单子）===\n');

// ============================================================================
// 1. 为什么需要 Monad？
// ============================================================================

console.log('1. 为什么需要 Monad？\n');

console.log('问题：当函数返回 Monad 时，使用 map 会导致嵌套\n');

// 场景：数据库查询链
interface User {
  id: number;
  name: string;
  addressId: number;
}

interface Address {
  id: number;
  street: string;
  cityId: number;
}

interface City {
  id: number;
  name: string;
}

// 模拟数据库
const users: User[] = [
  { id: 1, name: '张三', addressId: 101 },
  { id: 2, name: '李四', addressId: 102 },
];

const addresses: Address[] = [
  { id: 101, street: '中关村大街1号', cityId: 1 },
  { id: 102, street: '浦东新区2号', cityId: 2 },
];

const cities: City[] = [
  { id: 1, name: '北京' },
  { id: 2, name: '上海' },
];

// 返回 Option 的查询函数
const findUser = (id: number): Option<User> => {
  const user = users.find(u => u.id === id);
  return user ? Some(user) : None;
};

const findAddress = (id: number): Option<Address> => {
  const addr = addresses.find(a => a.id === id);
  return addr ? Some(addr) : None;
};

const findCity = (id: number): Option<City> => {
  const city = cities.find(c => c.id === id);
  return city ? Some(city) : None;
};

console.log('❌ 使用 map 会产生嵌套:');
console.log(`
const mapOption = <A, B>(f: (a: A) => B) => (opt: Option<A>): Option<B> => ...

const userOpt = findUser(1);                    // Option<User>
const addressOpt = mapOption(u => findAddress(u.addressId))(userOpt);
// 结果是 Option<Option<Address>> - 嵌套了！
`);
console.log();

// ============================================================================
// 2. Monad 接口定义
// ============================================================================

console.log('2. Monad 接口定义\n');

/**
 * Monad 类型类接口
 * 继承自 Applicative，添加了 flatMap 方法
 */
interface Monad<M> {
  // pure: 将普通值提升到 Monad 中（从 Applicative 继承）
  pure<A>(a: A): M<A>;
  
  // flatMap: 链式调用返回 Monad 的函数
  // 别名: bind, chain, >>=
  flatMap<A, B>(f: (a: A) => M<B>, ma: M<A>): M<B>;
}

console.log('Monad 的核心操作:');
console.log('1. pure(a): 将值 a 放入 Monad（与 Applicative 相同）');
console.log('2. flatMap(f, ma): 将函数 f 应用到 ma，并自动展平结果\n');

console.log('flatMap 的类型签名:');
console.log('  flatMap<A, B>(f: (a: A) => M<B>): (ma: M<A>) => M<B>');
console.log();
console.log('对比 map 的类型签名:');
console.log('  map<A, B>(f: (a: A) => B): (ma: M<A>) => M<B>');
console.log();
console.log('关键区别: f 返回 M<B> 而不是 B，flatMap 会自动展平！\n');

// ============================================================================
// 3. Option 的 Monad 实现
// ============================================================================

console.log('3. Option 的 Monad 实现\n');

// pure（已在 Applicative 中定义）
const pureOption = <A>(a: A): Option<A> => Some(a);

// flatMap: 关键操作！
const flatMapOption = <A, B>(
  f: (a: A) => Option<B>
) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    return f(option.value);  // 直接返回 f 的结果，不包装
  }
  return None;
};

console.log('✅ Option 的 flatMap 操作:');

// 例子：安全的除法链
const safeDivide = (a: number, b: number): Option<number> =>
  b === 0 ? None : Some(a / b);

const calculate = (x: number): Option<number> => {
  return flatMapOption((a: number) =>
    flatMapOption((b: number) =>
      safeDivide(b, 2)
    )(safeDivide(a, 3))
  )(safeDivide(x, 2));
};

console.log('calculate(12):', calculate(12));
console.log('calculate(0):', calculate(0));
console.log();

// ============================================================================
// 4. Either 的 Monad 实现
// ============================================================================

console.log('4. Either 的 Monad 实现\n');

// pure（已在 Applicative 中定义）
const pureEither = <E, A>(a: A): Either<E, A> => Right(a);

// flatMap
const flatMapEither = <E, A, B>(
  f: (a: A) => Either<E, B>
) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return f(either.right);
  }
  return either as Either<E, B>;
};

console.log('✅ Either 的 flatMap 操作:');

// 例子：用户输入验证和转换
const parseNumber = (str: string): Either<string, number> => {
  const num = parseFloat(str);
  return isNaN(num) ? Left(`"${str}" 不是有效数字`) : Right(num);
};

const checkPositive = (n: number): Either<string, number> =>
  n > 0 ? Right(n) : Left(`${n} 不是正数`);

const squareRoot = (n: number): Either<string, number> =>
  Right(Math.sqrt(n));

const parseAndSqrt = (input: string): Either<string, number> => {
  return flatMapEither((n1: number) =>
    flatMapEither((n2: number) =>
      squareRoot(n2)
    )(checkPositive(n1))
  )(parseNumber(input));
};

console.log('parseAndSqrt("16"):', parseAndSqrt('16'));
console.log('parseAndSqrt("-4"):', parseAndSqrt('-4'));
console.log('parseAndSqrt("abc"):', parseAndSqrt('abc'));
console.log();

// ============================================================================
// 5. 链式调用：解决嵌套问题
// ============================================================================

console.log('5. 链式调用：解决嵌套问题\n');

// 使用 flatMap 查询用户的城市
const getUserCity = (userId: number): Option<string> => {
  return flatMapOption((user: User) =>
    flatMapOption((address: Address) =>
      flatMapOption((city: City) =>
        Some(city.name)
      )(findCity(address.cityId))
    )(findAddress(user.addressId))
  )(findUser(userId));
};

console.log('✅ 使用 flatMap 链式查询:');
console.log('用户1的城市:', getUserCity(1));
console.log('用户2的城市:', getUserCity(2));
console.log('用户999的城市:', getUserCity(999));
console.log();

// ============================================================================
// 6. pipe 工具：更优雅的链式调用
// ============================================================================

console.log('6. pipe 工具：更优雅的链式调用\n');

/**
 * pipe: 将多个函数从左到右组合
 */
const pipe = <A, B, C, D, E>(
  a: A,
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3?: (c: C) => D,
  f4?: (d: D) => E
): B | C | D | E => {
  let result: any = f1(a);
  result = f2(result);
  if (f3) result = f3(result);
  if (f4) result = f4(result);
  return result;
};

// 使用 pipe 重写 getUserCity
const getUserCityPipe = (userId: number): Option<string> => {
  return pipe(
    findUser(userId),
    flatMapOption((user: User) => findAddress(user.addressId)),
    flatMapOption((address: Address) => findCity(address.cityId)),
    flatMapOption((city: City) => Some(city.name))
  );
};

console.log('✅ 使用 pipe 的链式调用:');
console.log('用户1的城市:', getUserCityPipe(1));
console.log();

// ============================================================================
// 7. 实战场景：订单处理流程
// ============================================================================

console.log('7. 实战场景：订单处理流程\n');

interface Order {
  id: string;
  userId: number;
  amount: number;
  status: 'pending' | 'paid' | 'shipped';
}

interface Payment {
  orderId: string;
  amount: number;
  paid: boolean;
}

interface Shipment {
  orderId: string;
  trackingNumber: string;
}

// 模拟数据
const orders: Order[] = [
  { id: 'O1', userId: 1, amount: 299, status: 'pending' },
  { id: 'O2', userId: 2, amount: 599, status: 'paid' },
];

// 查询订单
const findOrder = (id: string): Either<string, Order> => {
  const order = orders.find(o => o.id === id);
  return order ? Right(order) : Left(`订单 ${id} 不存在`);
};

// 验证订单金额
const validateAmount = (order: Order): Either<string, Order> => {
  return order.amount > 0 && order.amount < 10000
    ? Right(order)
    : Left(`订单金额 ${order.amount} 无效`);
};

// 处理支付
const processPayment = (order: Order): Either<string, Payment> => {
  if (order.status === 'pending') {
    return Right({
      orderId: order.id,
      amount: order.amount,
      paid: true,
    });
  }
  return Left(`订单 ${order.id} 状态不正确: ${order.status}`);
};

// 创建发货单
const createShipment = (payment: Payment): Either<string, Shipment> => {
  if (payment.paid) {
    return Right({
      orderId: payment.orderId,
      trackingNumber: `TRACK-${Date.now()}`,
    });
  }
  return Left(`订单 ${payment.orderId} 未支付`);
};

// 完整的订单处理流程
const processOrder = (orderId: string): Either<string, Shipment> => {
  return pipe(
    findOrder(orderId),
    flatMapEither(validateAmount),
    flatMapEither(processPayment),
    flatMapEither(createShipment)
  );
};

console.log('✅ 处理订单（成功）:');
console.log(processOrder('O1'));

console.log('\n✅ 处理订单（失败 - 状态不正确）:');
console.log(processOrder('O2'));

console.log('\n✅ 处理订单（失败 - 订单不存在）:');
console.log(processOrder('O999'));
console.log();

// ============================================================================
// 8. 实战场景：用户权限检查链
// ============================================================================

console.log('8. 实战场景：用户权限检查链\n');

interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'guest';
  active: boolean;
}

interface Session {
  userId: number;
  token: string;
  expiresAt: number;
}

// 模拟数据
const userAccounts: UserAccount[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', active: true },
  { id: 2, username: 'user1', email: 'user1@example.com', role: 'user', active: true },
  { id: 3, username: 'guest', email: 'guest@example.com', role: 'guest', active: false },
];

// 查找会话
const findSession = (token: string): Either<string, Session> => {
  if (token === 'valid-token') {
    return Right({ userId: 1, token, expiresAt: Date.now() + 3600000 });
  }
  return Left('无效的 token');
};

// 检查会话是否过期
const checkExpiration = (session: Session): Either<string, Session> => {
  return session.expiresAt > Date.now()
    ? Right(session)
    : Left('会话已过期');
};

// 查找用户账户
const findUserAccount = (session: Session): Either<string, UserAccount> => {
  const user = userAccounts.find(u => u.id === session.userId);
  return user ? Right(user) : Left('用户不存在');
};

// 检查用户是否激活
const checkActive = (user: UserAccount): Either<string, UserAccount> => {
  return user.active ? Right(user) : Left('用户账户未激活');
};

// 检查管理员权限
const checkAdmin = (user: UserAccount): Either<string, UserAccount> => {
  return user.role === 'admin' ? Right(user) : Left('需要管理员权限');
};

// 完整的权限检查链
const authenticateAdmin = (token: string): Either<string, UserAccount> => {
  return pipe(
    findSession(token),
    flatMapEither(checkExpiration),
    flatMapEither(findUserAccount),
    flatMapEither(checkActive),
    flatMapEither(checkAdmin)
  );
};

console.log('✅ 管理员认证（成功）:');
console.log(authenticateAdmin('valid-token'));

console.log('\n✅ 管理员认证（失败 - 无效 token）:');
console.log(authenticateAdmin('invalid-token'));
console.log();

// ============================================================================
// 9. Monad vs Applicative
// ============================================================================

console.log('9. Monad vs Applicative\n');

console.log('📊 Monad vs Applicative:');
console.log();
console.log('Applicative:');
console.log('  - 用于组合多个独立的计算');
console.log('  - 后续计算不依赖前面的结果');
console.log('  - 可以并行执行');
console.log('  - 例如: 表单验证（各字段独立）');
console.log();
console.log('Monad:');
console.log('  - 用于链式依赖的计算');
console.log('  - 后续计算依赖前面的结果');
console.log('  - 必须串行执行');
console.log('  - 例如: 数据库查询链（需要前一个结果）');
console.log();

// ============================================================================
// 10. Array 作为 Monad
// ============================================================================

console.log('10. Array 作为 Monad\n');

console.log('JavaScript 的 Array.flatMap 就是 Monad 的 flatMap!');

// 例子：生成所有可能的配对
const boys = ['张三', '李四'];
const girls = ['小红', '小芳'];

const pairs = boys.flatMap(boy =>
  girls.map(girl => `${boy} ❤ ${girl}`)
);

console.log('所有可能的配对:', pairs);

// 例子：路径生成
const paths = ['/', '/users', '/products'].flatMap(base =>
  ['', '/list', '/detail'].map(suffix => base + suffix)
);

console.log('所有路径:', paths);
console.log();

// ============================================================================
// 11. 实用辅助函数
// ============================================================================

console.log('11. 实用辅助函数\n');

/**
 * flatten: 展平嵌套的 Monad
 * flatten(M<M<A>>) => M<A>
 */
const flattenOption = <A>(option: Option<Option<A>>): Option<A> => {
  return flatMapOption((inner: Option<A>) => inner)(option);
};

console.log('✅ flatten: 展平嵌套 Option');
const nested = Some(Some(42));
console.log('Some(Some(42)) flatten:', flattenOption(nested));
console.log();

/**
 * filterM: Monad 的 filter
 */
const filterOption = <A>(
  predicate: (a: A) => boolean
) => (option: Option<A>): Option<A> => {
  return flatMapOption((a: A) => predicate(a) ? Some(a) : None)(option);
};

console.log('✅ filterM: 带条件的过滤');
console.log('filter(x => x > 10)(Some(20)):', filterOption((x: number) => x > 10)(Some(20)));
console.log('filter(x => x > 10)(Some(5)):', filterOption((x: number) => x > 10)(Some(5)));
console.log();

console.log('=== Monad 总结 ===');
console.log('Monad 的 flatMap 解决了嵌套问题');
console.log('允许我们优雅地链式调用返回 Monad 的函数');
console.log('是处理依赖计算链的完美工具');
console.log('理解 Monad 是掌握函数式编程的关键');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  pureOption,
  flatMapOption,
  pureEither,
  flatMapEither,
  pipe,
  flattenOption,
  filterOption,
};
