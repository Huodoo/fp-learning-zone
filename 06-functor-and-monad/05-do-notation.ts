/**
 * 第六章第五节: Do-Notation 模拟
 * 
 * do-notation 是 Haskell 中用于简化 Monad 操作的语法糖
 * 它让链式的 flatMap 看起来像命令式代码
 * 在 TypeScript 中，我们可以用 Generator 函数模拟这个特性
 * 
 * 核心思想：让函数式代码看起来像命令式代码，但保持纯函数的本质
 */

import { Option, Some, None, isSome } from './01-functor';
import { Either, Right, Left, isRight } from './01-functor';

console.log('=== Do-Notation 模拟 ===\n');

// ============================================================================
// 1. 问题：嵌套的 flatMap 难以阅读
// ============================================================================

console.log('1. 问题：嵌套的 flatMap 难以阅读\n');

console.log('❌ 深度嵌套的 flatMap:');
console.log(`
const result = flatMap((a: number) =>
  flatMap((b: number) =>
    flatMap((c: number) =>
      Some(a + b + c)
    )(parseNumber(input3))
  )(parseNumber(input2))
)(parseNumber(input1));
`);

console.log('\n这种嵌套很难阅读和维护！\n');

// ============================================================================
// 2. Haskell 的 do-notation
// ============================================================================

console.log('2. Haskell 的 do-notation\n');

console.log('在 Haskell 中，do-notation 让 Monad 操作看起来像命令式代码:');
console.log(`
-- Haskell 代码
getUserCity :: Int -> Maybe String
getUserCity userId = do
  user <- findUser userId
  address <- findAddress (addressId user)
  city <- findCity (cityId address)
  return (cityName city)
`);

console.log('\n看起来像在写普通的赋值语句，但实际上是纯函数链！\n');

// ============================================================================
// 3. 使用 Generator 模拟 do-notation
// ============================================================================

console.log('3. 使用 Generator 模拟 do-notation\n');

/**
 * Do: 运行 Option Monad 的 do-notation
 * 
 * 使用 Generator 函数来模拟 Haskell 的 do-notation
 * yield* 表达式从 Option 中"提取"值
 * 如果遇到 None，整个计算立即返回 None
 */
const Do = <T>(gen: () => Generator<Option<any>, T, any>): Option<T> => {
  const iterator = gen();
  let state = iterator.next();

  while (!state.done) {
    const option = state.value;
    
    if (isSome(option)) {
      // 将值传递给 generator
      state = iterator.next(option.value);
    } else {
      // 遇到 None，立即停止
      return None;
    }
  }

  // generator 正常结束，返回最终值
  return Some(state.value);
};

console.log('✅ Do 函数实现了 Option 的 do-notation 模拟');
console.log();

// ============================================================================
// 4. 基本示例：计算器
// ============================================================================

console.log('4. 基本示例：计算器\n');

const parseNumber = (str: string): Option<number> => {
  const n = parseFloat(str);
  return isNaN(n) ? None : Some(n);
};

const safeDivide = (a: number, b: number): Option<number> =>
  b === 0 ? None : Some(a / b);

// ❌ 传统 flatMap 方式
const calculateOld = (input1: string, input2: string): Option<number> => {
  return isSome(parseNumber(input1))
    ? isSome(parseNumber(parseNumber(input1).value.toString()))
      ? safeDivide(parseNumber(input1).value, parseNumber(input2).value!)
      : None
    : None;
};

// ✅ 使用 do-notation
const calculate = (input1: string, input2: string): Option<number> => {
  return Do(function*() {
    const a = yield* parseNumber(input1);  // "提取" Option 中的值
    const b = yield* parseNumber(input2);
    const result = yield* safeDivide(a, b);
    return result;
  });
};

console.log('✅ 使用 do-notation 的计算器:');
console.log('calculate("10", "2"):', calculate('10', '2'));
console.log('calculate("10", "0"):', calculate('10', '0'));
console.log('calculate("abc", "2"):', calculate('abc', '2'));
console.log();

// ============================================================================
// 5. 实战场景：用户查询链
// ============================================================================

console.log('5. 实战场景：用户查询链\n');

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

// ✅ 使用 do-notation 的查询链
const getUserCityInfo = (userId: number): Option<string> => {
  return Do(function*() {
    const user = yield* findUser(userId);
    const address = yield* findAddress(user.addressId);
    const city = yield* findCity(address.cityId);
    
    return `${user.name} 住在 ${city.name} ${address.street}`;
  });
};

console.log('✅ 用户查询链:');
console.log('用户1:', getUserCityInfo(1));
console.log('用户2:', getUserCityInfo(2));
console.log('用户999:', getUserCityInfo(999));
console.log();

// ============================================================================
// 6. Either 的 do-notation
// ============================================================================

console.log('6. Either 的 do-notation\n');

/**
 * DoEither: 运行 Either Monad 的 do-notation
 */
const DoEither = <E, T>(
  gen: () => Generator<Either<E, any>, T, any>
): Either<E, T> => {
  const iterator = gen();
  let state = iterator.next();

  while (!state.done) {
    const either = state.value;
    
    if (isRight(either)) {
      state = iterator.next(either.right);
    } else {
      // 遇到 Left，立即返回错误
      return either as Either<E, T>;
    }
  }

  return Right(state.value);
};

// 验证函数
const validateName = (name: string): Either<string, string> =>
  name.length >= 2 ? Right(name) : Left('姓名至少2个字符');

const validateEmail = (email: string): Either<string, string> =>
  email.includes('@') ? Right(email) : Left('邮箱格式无效');

const validateAge = (age: number): Either<string, number> =>
  age >= 18 ? Right(age) : Left('年龄必须≥18岁');

interface UserForm {
  name: string;
  email: string;
  age: number;
}

// ✅ 使用 do-notation 的表单验证
const validateUserForm = (
  name: string,
  email: string,
  age: number
): Either<string, UserForm> => {
  return DoEither(function*() {
    const validName = yield* validateName(name);
    const validEmail = yield* validateEmail(email);
    const validAge = yield* validateAge(age);
    
    return {
      name: validName,
      email: validEmail,
      age: validAge,
    };
  });
};

console.log('✅ 表单验证（成功）:');
console.log(validateUserForm('张三', 'zhang@example.com', 25));

console.log('\n✅ 表单验证（失败 - 姓名太短）:');
console.log(validateUserForm('A', 'zhang@example.com', 25));

console.log('\n✅ 表单验证（失败 - 邮箱无效）:');
console.log(validateUserForm('张三', 'invalid-email', 25));

console.log('\n✅ 表单验证（失败 - 年龄不够）:');
console.log(validateUserForm('张三', 'zhang@example.com', 16));

console.log();

// ============================================================================
// 7. 实战场景：订单处理流程
// ============================================================================

console.log('7. 实战场景：订单处理流程\n');

interface Order {
  id: string;
  userId: number;
  amount: number;
}

interface Payment {
  orderId: string;
  amount: number;
  success: boolean;
}

interface Shipment {
  orderId: string;
  trackingNumber: string;
}

interface Receipt {
  orderId: string;
  amount: number;
  trackingNumber: string;
  timestamp: number;
}

const findOrder = (orderId: string): Either<string, Order> => {
  if (orderId === 'O1') {
    return Right({ id: 'O1', userId: 1, amount: 299 });
  }
  return Left(`订单 ${orderId} 不存在`);
};

const processPayment = (order: Order): Either<string, Payment> => {
  if (order.amount > 0) {
    return Right({
      orderId: order.id,
      amount: order.amount,
      success: true,
    });
  }
  return Left('订单金额无效');
};

const createShipment = (payment: Payment): Either<string, Shipment> => {
  if (payment.success) {
    return Right({
      orderId: payment.orderId,
      trackingNumber: `TRACK-${Date.now()}`,
    });
  }
  return Left('支付未成功');
};

const generateReceipt = (
  order: Order,
  payment: Payment,
  shipment: Shipment
): Receipt => ({
  orderId: order.id,
  amount: payment.amount,
  trackingNumber: shipment.trackingNumber,
  timestamp: Date.now(),
});

// ✅ 使用 do-notation 的订单处理
const processOrderComplete = (orderId: string): Either<string, Receipt> => {
  return DoEither(function*() {
    // 依次执行各个步骤，任何一步失败都会立即返回错误
    const order = yield* findOrder(orderId);
    const payment = yield* processPayment(order);
    const shipment = yield* createShipment(payment);
    
    // 所有步骤成功，生成收据
    return generateReceipt(order, payment, shipment);
  });
};

console.log('✅ 订单处理（成功）:');
console.log(processOrderComplete('O1'));

console.log('\n✅ 订单处理（失败）:');
console.log(processOrderComplete('O999'));

console.log();

// ============================================================================
// 8. 实战场景：复杂的数据转换
// ============================================================================

console.log('8. 实战场景：复杂的数据转换\n');

interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  birth_year: number;
}

interface ValidatedUser {
  id: number;
  fullName: string;
  email: string;
  age: number;
}

const validateApiUser = (user: ApiUser): Either<string, ApiUser> => {
  if (user.id <= 0) {
    return Left('用户ID无效');
  }
  if (!user.first_name || !user.last_name) {
    return Left('姓名不完整');
  }
  if (!user.email_address.includes('@')) {
    return Left('邮箱格式无效');
  }
  if (user.birth_year < 1900 || user.birth_year > new Date().getFullYear()) {
    return Left('出生年份无效');
  }
  return Right(user);
};

const calculateAge = (birthYear: number): Either<string, number> => {
  const age = new Date().getFullYear() - birthYear;
  return age >= 0 && age <= 150 ? Right(age) : Left('年龄计算错误');
};

const transformUser = (user: ApiUser): Either<string, ValidatedUser> => {
  return DoEither(function*() {
    // 验证原始数据
    const validated = yield* validateApiUser(user);
    
    // 计算年龄
    const age = yield* calculateAge(validated.birth_year);
    
    // 检查成年
    if (age < 18) {
      return yield* Left('用户未成年');
    }
    
    // 转换为目标格式
    return {
      id: validated.id,
      fullName: `${validated.first_name} ${validated.last_name}`,
      email: validated.email_address,
      age: age,
    };
  });
};

console.log('✅ API 数据转换（成功）:');
const apiUser1: ApiUser = {
  id: 1,
  first_name: 'Zhang',
  last_name: 'San',
  email_address: 'zhang@example.com',
  birth_year: 1990,
};
console.log(transformUser(apiUser1));

console.log('\n✅ API 数据转换（失败 - 未成年）:');
const apiUser2: ApiUser = {
  id: 2,
  first_name: 'Li',
  last_name: 'Si',
  email_address: 'li@example.com',
  birth_year: 2010,
};
console.log(transformUser(apiUser2));

console.log();

// ============================================================================
// 9. do-notation vs 传统方式对比
// ============================================================================

console.log('9. do-notation vs 传统方式对比\n');

console.log('❌ 传统 flatMap 方式:');
console.log(`
const result = flatMap((a: number) =>
  flatMap((b: number) =>
    flatMap((c: number) =>
      Some(a + b + c)
    )(step3())
  )(step2())
)(step1());
`);

console.log('\n✅ do-notation 方式:');
console.log(`
const result = Do(function*() {
  const a = yield* step1();
  const b = yield* step2();
  const c = yield* step3();
  return a + b + c;
});
`);

console.log('\n优势:');
console.log('✅ 更接近命令式思维，容易理解');
console.log('✅ 避免深度嵌套，提高可读性');
console.log('✅ 可以使用中间变量，便于调试');
console.log('✅ 保持了函数式的纯粹性');
console.log();

// ============================================================================
// 10. 高级用法：条件和循环
// ============================================================================

console.log('10. 高级用法：条件和循环\n');

// 示例：查找第一个有效的配置源
const sources = ['config1', 'config2', 'config3'];

const loadConfig = (source: string): Option<string> => {
  if (source === 'config2') {
    return Some(`从 ${source} 加载的配置`);
  }
  return None;
};

const findFirstValidConfig = (): Option<string> => {
  return Do(function*() {
    // 可以使用普通的控制流
    for (const source of sources) {
      const config = yield* loadConfig(source);
      // 注意：这里如果 loadConfig 返回 None，会立即退出
      return config;
    }
    return '默认配置';
  });
};

console.log('✅ 查找第一个有效配置:');
console.log(findFirstValidConfig());
console.log();

// 示例：条件逻辑
const processWithCondition = (value: number): Option<string> => {
  return Do(function*() {
    const n = yield* Some(value);
    
    if (n > 100) {
      return '大于100';
    } else if (n > 50) {
      const doubled = yield* Some(n * 2);
      return `50-100之间，翻倍后: ${doubled}`;
    } else {
      return '小于等于50';
    }
  });
};

console.log('✅ 条件逻辑:');
console.log('processWithCondition(150):', processWithCondition(150));
console.log('processWithCondition(75):', processWithCondition(75));
console.log('processWithCondition(30):', processWithCondition(30));
console.log();

console.log('=== Do-Notation 总结 ===');
console.log('do-notation 让 Monad 操作看起来像命令式代码');
console.log('通过 Generator 函数，我们可以在 TypeScript 中模拟这个特性');
console.log('它大大提高了代码的可读性和可维护性');
console.log('同时保持了函数式编程的纯粹性和组合性');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  Do,
  DoEither,
};
