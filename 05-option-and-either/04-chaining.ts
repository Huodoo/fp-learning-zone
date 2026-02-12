/**
 * 第五章第四节: 链式操作详解 (Chaining Operations)
 * 
 * 深入讲解 Option 和 Either 的链式操作
 * 包括 map、flatMap、fold 等操作的原理和使用场景
 * 以及如何构建复杂的数据处理管道
 */

console.log('=== 链式操作详解 ===\n');

// ============================================================================
// 1. 类型定义
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

// ============================================================================
// 2. map 详解 - Functor 操作
// ============================================================================

console.log('1. map 详解 - Functor 操作\n');

console.log('map 的作用: 在容器内部转换值，不改变容器结构');
console.log('类型签名: <A, B>(f: A -> B) -> Option<A> -> Option<B>');
console.log();

// Option 的 map
const mapOption = <A, B>(f: (a: A) => B) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    return Some(f(option.value));
  }
  return None;
};

// Either 的 map
const mapEither = <E, A, B>(f: (a: A) => B) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return Right(f(either.right));
  }
  return either;
};

console.log('✅ Option map 示例:');
const double = (x: number) => x * 2;
const toString = (x: number) => `值是 ${x}`;

console.log('mapOption(double)(Some(5)):', mapOption(double)(Some(5)));
console.log('mapOption(double)(None):', mapOption(double)(None));
console.log('mapOption(toString)(Some(42)):', mapOption(toString)(Some(42)));
console.log();

console.log('✅ Either map 示例:');
console.log('mapEither(double)(Right(10)):', mapEither(double)(Right(10)));
console.log('mapEither(double)(Left("错误")):', mapEither(double)(Left('错误')));
console.log();

// map 的链式调用
const increment = (x: number) => x + 1;
const square = (x: number) => x * x;

const composedMap = (x: number) => 
  mapOption(toString)(
    mapOption(square)(
      mapOption(increment)(Some(x))
    )
  );

console.log('✅ map 链式调用:');
console.log('increment -> square -> toString 应用于 5:');
console.log(composedMap(5)); // Some("值是 36")
console.log();

// ============================================================================
// 3. flatMap 详解 - Monad 操作
// ============================================================================

console.log('2. flatMap 详解 - Monad 操作\n');

console.log('flatMap 的作用: 链接返回容器的函数，避免嵌套');
console.log('类型签名: <A, B>(f: A -> Option<B>) -> Option<A> -> Option<B>');
console.log('也叫 chain、bind、>>= (Haskell)');
console.log();

// Option 的 flatMap
const flatMapOption = <A, B>(f: (a: A) => Option<B>) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    return f(option.value);
  }
  return None;
};

// Either 的 flatMap
const flatMapEither = <E, A, B>(f: (a: A) => Either<E, B>) => (either: Either<E, A>): Either<E, B> => {
  if (isRight(either)) {
    return f(either.right);
  }
  return either;
};

// ❌ 问题: 使用 map 会导致嵌套
const divide = (x: number, y: number): Option<number> => {
  return y === 0 ? None : Some(x / y);
};

const nestedResult = mapOption((x: number) => divide(x, 2))(Some(10));
console.log('❌ 使用 map 导致嵌套:');
console.log('mapOption(divide(_, 2))(Some(10)):', nestedResult);
console.log('类型是 Option<Option<number>>，不是我们想要的!');
console.log();

// ✅ 解决: 使用 flatMap 避免嵌套
const flatResult = flatMapOption((x: number) => divide(x, 2))(Some(10));
console.log('✅ 使用 flatMap 避免嵌套:');
console.log('flatMapOption(divide(_, 2))(Some(10)):', flatResult);
console.log('类型是 Option<number>');
console.log();

// ============================================================================
// 4. 实战: 用户数据查询链
// ============================================================================

console.log('3. 实战: 用户数据查询链\n');

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
  country: string;
}

const users: User[] = [
  { id: 1, name: '张三', addressId: 101 },
  { id: 2, name: '李四', addressId: 102 },
];

const addresses: Address[] = [
  { id: 101, street: '中关村大街1号', cityId: 1001 },
  { id: 102, street: '浦东新区2号', cityId: 1002 },
];

const cities: City[] = [
  { id: 1001, name: '北京', country: '中国' },
  { id: 1002, name: '上海', country: '中国' },
];

// 查询函数
const findUser = (id: number): Option<User> => {
  const user = users.find(u => u.id === id);
  return user ? Some(user) : None;
};

const findAddress = (id: number): Option<Address> => {
  const address = addresses.find(a => a.id === id);
  return address ? Some(address) : None;
};

const findCity = (id: number): Option<City> => {
  const city = cities.find(c => c.id === id);
  return city ? Some(city) : None;
};

// ❌ 不使用 flatMap（嵌套地狱）
const getUserCityNested = (userId: number): Option<Option<Option<City>>> => {
  return mapOption((user: User) =>
    mapOption((address: Address) =>
      findCity(address.cityId)
    )(findAddress(user.addressId))
  )(findUser(userId));
};

console.log('❌ 嵌套地狱:');
console.log('getUserCityNested(1):', getUserCityNested(1));
console.log('类型是 Option<Option<Option<City>>>，难以使用!');
console.log();

// ✅ 使用 flatMap 链式调用
const getUserCity = (userId: number): Option<City> => {
  return flatMapOption((user: User) =>
    flatMapOption((address: Address) =>
      findCity(address.cityId)
    )(findAddress(user.addressId))
  )(findUser(userId));
};

console.log('✅ 使用 flatMap:');
console.log('getUserCity(1):', getUserCity(1));
console.log('getUserCity(999):', getUserCity(999));
console.log();

// ============================================================================
// 5. fold 详解 - 消费容器
// ============================================================================

console.log('4. fold 详解 - 消费容器\n');

console.log('fold 的作用: 从容器中提取值，处理所有可能情况');
console.log('也叫 match、cata、eliminator');
console.log();

// Option 的 fold
const foldOption = <A, B>(
  onNone: () => B,
  onSome: (a: A) => B
) => (option: Option<A>): B => {
  if (isSome(option)) {
    return onSome(option.value);
  }
  return onNone();
};

// Either 的 fold
const foldEither = <E, A, B>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B
) => (either: Either<E, A>): B => {
  if (isRight(either)) {
    return onRight(either.right);
  }
  return onLeft(either.left);
};

console.log('✅ Option fold 示例:');
const describeOption = foldOption(
  () => '无值',
  (x: number) => `有值: ${x}`
);

console.log('describeOption(Some(42)):', describeOption(Some(42)));
console.log('describeOption(None):', describeOption(None));
console.log();

console.log('✅ Either fold 示例:');
const describeEither = foldEither(
  (error: string) => `错误: ${error}`,
  (value: number) => `成功: ${value}`
);

console.log('describeEither(Right(100)):', describeEither(Right(100)));
console.log('describeEither(Left("失败")):', describeEither(Left('失败')));
console.log();

// ============================================================================
// 6. 完整示例: 订单处理管道
// ============================================================================

console.log('5. 完整示例: 订单处理管道\n');

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface Order {
  items: { product: Product; quantity: number }[];
  total: number;
}

const products: Product[] = [
  { id: 'P001', name: 'iPhone 15', price: 5999, stock: 10 },
  { id: 'P002', name: 'MacBook Pro', price: 12999, stock: 3 },
  { id: 'P003', name: 'AirPods', price: 1299, stock: 0 },
];

// 查找商品
const findProduct = (id: string): Either<string, Product> => {
  const product = products.find(p => p.id === id);
  return product ? Right(product) : Left(`商品 ${id} 不存在`);
};

// 检查库存
const checkStock = (product: Product, quantity: number): Either<string, Product> => {
  if (product.stock < quantity) {
    return Left(`${product.name} 库存不足 (需要 ${quantity}，只有 ${product.stock})`);
  }
  return Right(product);
};

// 计算小计
const calculateSubtotal = (product: Product, quantity: number): number => {
  return product.price * quantity;
};

// 处理单个购物车项目
const processCartItem = (item: CartItem): Either<string, { product: Product; quantity: number; subtotal: number }> => {
  const productResult = findProduct(item.productId);
  return flatMapEither((product: Product) =>
    mapEither((validProduct: Product) => ({
      product: validProduct,
      quantity: item.quantity,
      subtotal: calculateSubtotal(validProduct, item.quantity),
    }))(checkStock(product, item.quantity))
  )(productResult as Either<string, Product>);
};

// 处理整个购物车
const processCart = (items: CartItem[]): Either<string, Order> => {
  const processedItems: { product: Product; quantity: number; subtotal: number }[] = [];
  let total = 0;

  for (const item of items) {
    const result = processCartItem(item);
    if (isLeft(result)) {
      return result;  // 遇到错误立即返回
    }
    processedItems.push(result.right);
    total += result.right.subtotal;
  }

  return Right({
    items: processedItems.map(item => ({
      product: item.product,
      quantity: item.quantity,
    })),
    total,
  });
};

// 格式化订单
const formatOrder = (order: Order): string => {
  const itemsStr = order.items
    .map(item => `  - ${item.product.name} x ${item.quantity} = ¥${item.product.price * item.quantity}`)
    .join('\n');
  return `订单详情:\n${itemsStr}\n总计: ¥${order.total}`;
};

// 完整流程
const checkout = (items: CartItem[]): string => {
  return foldEither(
    (error: string) => `❌ 结算失败: ${error}`,
    (order: Order) => `✅ 结算成功\n${formatOrder(order)}`
  )(processCart(items));
};

console.log('✅ 订单处理管道:');
console.log();

console.log('场景1: 正常购买');
console.log(checkout([
  { productId: 'P001', quantity: 2 },
  { productId: 'P002', quantity: 1 },
]));
console.log();

console.log('场景2: 商品不存在');
console.log(checkout([
  { productId: 'P001', quantity: 1 },
  { productId: 'P999', quantity: 1 },
]));
console.log();

console.log('场景3: 库存不足');
console.log(checkout([
  { productId: 'P002', quantity: 5 },  // 只有 3 件库存
]));
console.log();

console.log('场景4: 无库存商品');
console.log(checkout([
  { productId: 'P003', quantity: 1 },  // 0 库存
]));
console.log();

// ============================================================================
// 7. 高阶组合子
// ============================================================================

console.log('6. 高阶组合子\n');

// getOrElse: 提供默认值
const getOrElse = <A>(defaultValue: A) => (option: Option<A>): A => {
  return isSome(option) ? option.value : defaultValue;
};

// orElse: 提供备选 Option
const orElse = <A>(alternative: () => Option<A>) => (option: Option<A>): Option<A> => {
  return isSome(option) ? option : alternative();
};

// filter: 根据条件过滤
const filter = <A>(predicate: (a: A) => boolean) => (option: Option<A>): Option<A> => {
  if (isSome(option) && predicate(option.value)) {
    return option;
  }
  return None;
};

// exists: 检查是否满足条件
const exists = <A>(predicate: (a: A) => boolean) => (option: Option<A>): boolean => {
  return isSome(option) && predicate(option.value);
};

// sequence: 将 Option 数组转换为数组的 Option
const sequence = <T>(options: Option<T>[]): Option<T[]> => {
  const result: T[] = [];
  for (const option of options) {
    if (isNone(option)) {
      return None;
    }
    result.push(option.value);
  }
  return Some(result);
};

console.log('✅ 高阶组合子示例:');
console.log();

console.log('getOrElse:');
console.log('getOrElse(0)(Some(42)):', getOrElse(0)(Some(42)));
console.log('getOrElse(0)(None):', getOrElse(0)(None));
console.log();

console.log('orElse:');
console.log('orElse(() => Some(100))(Some(42)):', orElse(() => Some(100))(Some(42)));
console.log('orElse(() => Some(100))(None):', orElse(() => Some(100))(None));
console.log();

console.log('filter:');
const isEven = (x: number) => x % 2 === 0;
console.log('filter(isEven)(Some(42)):', filter(isEven)(Some(42)));
console.log('filter(isEven)(Some(43)):', filter(isEven)(Some(43)));
console.log();

console.log('sequence:');
console.log('sequence([Some(1), Some(2), Some(3)]):', sequence([Some(1), Some(2), Some(3)]));
console.log('sequence([Some(1), None, Some(3)]):', sequence([Some(1), None, Some(3)]));
console.log();

// ============================================================================
// 8. do notation 模拟（类似 Haskell）
// ============================================================================

console.log('7. do notation 模拟\n');

console.log('do notation 可以让链式调用更清晰');
console.log();

// 使用函数式风格模拟 do notation
const doOption = <A>(f: () => Option<A>): Option<A> => f();

const exampleDoNotation = doOption(() => {
  const user = findUser(1);
  if (isNone(user)) return None;
  
  const address = findAddress(user.value.addressId);
  if (isNone(address)) return None;
  
  const city = findCity(address.value.cityId);
  if (isNone(city)) return None;
  
  return Some(`${user.value.name} 住在 ${city.value.name}`);
});

console.log('✅ do notation 风格:');
console.log(exampleDoNotation);
console.log();

// 对比：使用 flatMap
const exampleFlatMap = flatMapOption((user: User) =>
  flatMapOption((address: Address) =>
    mapOption((city: City) =>
      `${user.name} 住在 ${city.name}`
    )(findCity(address.cityId))
  )(findAddress(user.addressId))
)(findUser(1));

console.log('✅ flatMap 风格:');
console.log(exampleFlatMap);
console.log();

// ============================================================================
// 9. 总结
// ============================================================================

console.log('8. 总结\n');

console.log('map vs flatMap vs fold:');
console.log();
console.log('map:');
console.log('  - 转换容器内的值');
console.log('  - 不改变容器结构');
console.log('  - 函数: A -> B');
console.log('  - 示例: map(x => x * 2)(Some(5)) = Some(10)');
console.log();
console.log('flatMap:');
console.log('  - 链接返回容器的函数');
console.log('  - 避免嵌套容器');
console.log('  - 函数: A -> Option<B>');
console.log('  - 示例: flatMap(x => divide(x, 2))(Some(10)) = Some(5)');
console.log();
console.log('fold:');
console.log('  - 从容器中提取值');
console.log('  - 处理所有可能情况');
console.log('  - 函数: (A -> B, () -> B)');
console.log('  - 示例: fold(() => 0, x => x)(Some(42)) = 42');
console.log();

console.log('何时使用哪个:');
console.log('  - 转换值但保持在容器中 → map');
console.log('  - 链接可能失败的操作 → flatMap');
console.log('  - 最终提取值并处理 → fold');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
export type { 
  Option, 
  Some as SomeType, 
  None as NoneType,
  Either,
  Left as LeftType,
  Right as RightType
};
export {
  Some,
  None,
  Left,
  Right,
  mapOption,
  mapEither,
  flatMapOption,
  flatMapEither,
  foldOption,
  foldEither,
  getOrElse,
  orElse,
  filter,
  exists,
  sequence,
};
