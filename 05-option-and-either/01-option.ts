/**
 * 第五章第一节: Option/Maybe 类型
 * 
 * Option 类型用于表示可能不存在的值，是函数式编程中处理空值的标准方式
 * 相比于 null/undefined，Option 类型在类型系统中明确表达了"可能无值"的语义
 * 它强制开发者在编译时处理空值情况，避免运行时的 null pointer 异常
 */

console.log('=== Option/Maybe 类型 ===\n');

// ============================================================================
// 1. 为什么需要 Option 类型？
// ============================================================================

console.log('1. 为什么需要 Option 类型？\n');

// ❌ 传统做法的问题: null/undefined 不安全
interface User {
  id: number;
  name: string;
  email: string | null;  // 可能为空，但容易忘记检查
}

function findUserById(id: number): User | null {
  // 模拟数据库查询
  if (id === 1) {
    return { id: 1, name: '张三', email: 'zhang@example.com' };
  }
  return null;  // 可能返回 null
}

// 容易出错：忘记检查 null
function getUserEmailOld(id: number): string {
  const user = findUserById(id);
  // 💥 潜在的运行时错误！
  return user.email || '';  // 如果 user 是 null，这里会崩溃
}

console.log('❌ 传统做法: 容易忘记 null 检查');
console.log('查找用户1的邮箱:', getUserEmailOld(1));
// console.log('查找用户999的邮箱:', getUserEmailOld(999)); // 这会崩溃！
console.log();

// ============================================================================
// 2. Option 类型的实现
// ============================================================================

console.log('2. Option 类型的实现\n');

// Option 是一个和类型 (Sum Type)，有两种可能: Some(value) 或 None
type Option<T> = Some<T> | None;

// Some: 表示有值
interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

// None: 表示无值
interface None {
  readonly _tag: 'None';
}

// 构造函数 (Constructor)
const Some = <T>(value: T): Option<T> => ({
  _tag: 'Some',
  value,
});

const None: Option<never> = {
  _tag: 'None',
};

// 类型守卫 (Type Guards)
const isSome = <T>(option: Option<T>): option is Some<T> => 
  option._tag === 'Some';

const isNone = <T>(option: Option<T>): option is None => 
  option._tag === 'None';

console.log('✅ Some 和 None 的创建:');
const someValue = Some(42);
const noneValue = None;

console.log('Some(42):', someValue);
console.log('None:', noneValue);
console.log('isSome(Some(42)):', isSome(someValue));
console.log('isNone(None):', isNone(noneValue));
console.log();

// ============================================================================
// 3. Option 的基本操作
// ============================================================================

console.log('3. Option 的基本操作\n');

// map: 转换 Option 中的值 (Functor)
const map = <A, B>(f: (a: A) => B) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    return Some(f(option.value));
  }
  return None;
};

// flatMap (chain/bind): 避免嵌套 Option (Monad)
const flatMap = <A, B>(f: (a: A) => Option<B>) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    return f(option.value);
  }
  return None;
};

// getOrElse: 提供默认值
const getOrElse = <A>(defaultValue: A) => (option: Option<A>): A => {
  if (isSome(option)) {
    return option.value;
  }
  return defaultValue;
};

// fold: 模式匹配，处理两种情况
const fold = <A, B>(onNone: () => B, onSome: (a: A) => B) => (option: Option<A>): B => {
  if (isSome(option)) {
    return onSome(option.value);
  }
  return onNone();
};

console.log('✅ map 操作: 将 Some(5) 的值乘以 2');
const doubled = map((x: number) => x * 2)(Some(5));
console.log('结果:', doubled);

console.log('\n✅ map 操作在 None 上:');
const doubledNone = map((x: number) => x * 2)(None);
console.log('结果:', doubledNone);

console.log('\n✅ getOrElse: 获取值或使用默认值');
console.log('Some(42) 或默认值 0:', getOrElse(0)(Some(42)));
console.log('None 或默认值 0:', getOrElse(0)(None));
console.log();

// ============================================================================
// 4. 实际业务场景: 用户查询
// ============================================================================

console.log('4. 实际业务场景: 用户查询\n');

interface UserData {
  id: number;
  name: string;
  email: string;
  age: number;
}

// 数据库模拟
const database: UserData[] = [
  { id: 1, name: '张三', email: 'zhang@example.com', age: 28 },
  { id: 2, name: '李四', email: 'li@example.com', age: 35 },
  { id: 3, name: '王五', email: 'wang@example.com', age: 22 },
];

// ✅ 使用 Option 的查询函数
const findUser = (id: number): Option<UserData> => {
  const user = database.find(u => u.id === id);
  return user ? Some(user) : None;
};

// 获取用户邮箱
const getUserEmail = (id: number): string => {
  return fold(
    () => '未找到用户',
    (user: UserData) => user.email
  )(findUser(id));
};

console.log('✅ 安全的用户查询:');
console.log('用户1的邮箱:', getUserEmail(1));
console.log('用户999的邮箱:', getUserEmail(999));
console.log();

// ============================================================================
// 5. 链式操作 (Chaining)
// ============================================================================

console.log('5. 链式操作 (Chaining)\n');

// filter: 根据条件过滤
const filter = <A>(predicate: (a: A) => boolean) => (option: Option<A>): Option<A> => {
  if (isSome(option) && predicate(option.value)) {
    return option;
  }
  return None;
};

// orElse: 提供备选 Option
const orElse = <A>(alternative: () => Option<A>) => (option: Option<A>): Option<A> => {
  if (isSome(option)) {
    return option;
  }
  return alternative();
};

// 场景: 查找成年用户的邮箱
const getAdultUserEmail = (id: number): string => {
  const adultUser = filter((user: UserData) => user.age >= 18)(findUser(id));
  
  return fold(
    () => '用户不存在或未成年',
    (user: UserData) => user.email
  )(adultUser);
};

console.log('✅ 查找成年用户:');
console.log('用户1 (28岁):', getAdultUserEmail(1));
console.log('用户3 (22岁):', getAdultUserEmail(3));

// 模拟未成年用户
database.push({ id: 4, name: '小明', email: 'xiaoming@example.com', age: 16 });
console.log('用户4 (16岁):', getAdultUserEmail(4));
console.log();

// ============================================================================
// 6. 复杂场景: 电商订单处理
// ============================================================================

console.log('6. 复杂场景: 电商订单处理\n');

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Discount {
  code: string;
  percentage: number;
}

const products: Product[] = [
  { id: 'P001', name: 'iPhone 15', price: 5999, stock: 10 },
  { id: 'P002', name: 'MacBook Pro', price: 12999, stock: 5 },
  { id: 'P003', name: 'AirPods', price: 1299, stock: 0 },
];

const discounts: Discount[] = [
  { code: 'SUMMER20', percentage: 20 },
  { code: 'VIP10', percentage: 10 },
];

// 查找产品
const findProduct = (id: string): Option<Product> => {
  const product = products.find(p => p.id === id);
  return product ? Some(product) : None;
};

// 检查库存
const checkStock = (product: Product): Option<Product> => {
  return product.stock > 0 ? Some(product) : None;
};

// 查找折扣码
const findDiscount = (code: string): Option<Discount> => {
  const discount = discounts.find(d => d.code === code);
  return discount ? Some(discount) : None;
};

// 计算折扣后价格
const applyDiscount = (product: Product, discount: Discount): number => {
  return product.price * (1 - discount.percentage / 100);
};

// 完整的购买流程
const calculateFinalPrice = (productId: string, discountCode: string): string => {
  const result = flatMap((product: Product) =>
    map((stock: Product) =>
      fold(
        () => stock.price,  // 没有折扣码
        (discount: Discount) => applyDiscount(stock, discount)
      )(findDiscount(discountCode))
    )(checkStock(product))
  )(findProduct(productId));

  return fold(
    () => '商品不存在或无库存',
    (price: number) => `最终价格: ¥${price.toFixed(2)}`
  )(result);
};

console.log('✅ 电商订单价格计算:');
console.log('iPhone 15 + SUMMER20:', calculateFinalPrice('P001', 'SUMMER20'));
console.log('MacBook Pro + VIP10:', calculateFinalPrice('P002', 'VIP10'));
console.log('AirPods (无库存) + SUMMER20:', calculateFinalPrice('P003', 'SUMMER20'));
console.log('无效商品 + SUMMER20:', calculateFinalPrice('P999', 'SUMMER20'));
console.log();

// ============================================================================
// 7. Option 工具函数库
// ============================================================================

console.log('7. Option 工具函数库\n');

// fromNullable: 从可能为 null/undefined 的值创建 Option
const fromNullable = <T>(value: T | null | undefined): Option<T> => {
  return value != null ? Some(value) : None;
};

// toNullable: 将 Option 转换为 null
const toNullable = <T>(option: Option<T>): T | null => {
  return isSome(option) ? option.value : null;
};

// sequence: 将 Option 数组转换为数组的 Option
// 只有当所有都是 Some 时，才返回 Some(数组)
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

// traverse: map 后再 sequence
const traverse = <A, B>(f: (a: A) => Option<B>) => (array: A[]): Option<B[]> => {
  return sequence(array.map(f));
};

console.log('✅ fromNullable:');
console.log('fromNullable(42):', fromNullable(42));
console.log('fromNullable(null):', fromNullable(null));
console.log('fromNullable(undefined):', fromNullable(undefined));

console.log('\n✅ sequence:');
const allSome = [Some(1), Some(2), Some(3)];
const hasNone = [Some(1), None, Some(3)];
console.log('sequence([Some(1), Some(2), Some(3)]):', sequence(allSome));
console.log('sequence([Some(1), None, Some(3)]):', sequence(hasNone));
console.log();

// ============================================================================
// 8. 实战: API 响应处理
// ============================================================================

console.log('8. 实战: API 响应处理\n');

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 模拟 API 调用
const mockFetch = <T>(url: string): ApiResponse<T> => {
  if (url.indexOf('success') !== -1) {
    return { data: { message: '成功获取数据' } as T };
  }
  return { error: '网络错误' };
};

// 使用 Option 处理 API 响应
const parseApiResponse = <T>(response: ApiResponse<T>): Option<T> => {
  return fromNullable(response.data);
};

// 获取用户配置
const fetchUserConfig = (userId: number): Option<{ theme: string }> => {
  const response = mockFetch<{ theme: string }>(`/api/user/${userId}/config/success`);
  return parseApiResponse(response);
};

// 获取主题设置
const getTheme = (userId: number): string => {
  return fold(
    () => 'default',  // 默认主题
    (config: { theme: string }) => config.theme
  )(fetchUserConfig(userId));
};

console.log('✅ API 响应处理:');
console.log('用户1的主题:', getTheme(1));
console.log();

// ============================================================================
// 9. Option vs null/undefined 对比
// ============================================================================

console.log('9. Option vs null/undefined 对比\n');

console.log('❌ 使用 null/undefined:');
console.log('- 容易忘记检查，导致运行时错误');
console.log('- null 和 undefined 两种"空值"，容易混淆');
console.log('- 类型系统无法强制处理空值情况');
console.log();

console.log('✅ 使用 Option:');
console.log('- 类型系统强制处理空值情况');
console.log('- 明确表达"可能无值"的语义');
console.log('- 提供丰富的组合子 (map, flatMap, fold 等)');
console.log('- 避免防御性编程，代码更简洁');
console.log();

// ============================================================================
// 10. 实战练习场景
// ============================================================================

console.log('10. 实战练习场景\n');

// 场景: 获取用户的第一个订单的第一个商品的名称
interface Order {
  id: string;
  items: string[];
}

interface Customer {
  name: string;
  orders: Order[];
}

const getFirstProductName = (customer: Customer): string => {
  const firstOrder = fromNullable(customer.orders[0]);
  const firstProduct = flatMap((order: Order) => 
    fromNullable(order.items[0])
  )(firstOrder);
  
  return getOrElse('无商品')(firstProduct);
};

const customer1: Customer = {
  name: '张三',
  orders: [
    { id: 'O1', items: ['iPhone', 'AirPods'] },
    { id: 'O2', items: ['MacBook'] },
  ],
};

const customer2: Customer = {
  name: '李四',
  orders: [],
};

console.log('✅ 获取第一个商品名称:');
console.log('张三:', getFirstProductName(customer1));
console.log('李四:', getFirstProductName(customer2));
console.log();

console.log('=== Option 类型总结 ===');
console.log('Option 类型是函数式编程中处理空值的标准方式');
console.log('通过类型系统强制处理空值，避免 null pointer 异常');
console.log('提供丰富的组合子，使代码更简洁、更安全');
console.log();

// ============================================================================
// 导出
// ============================================================================

export type { Option, Some as SomeType, None as NoneType };
export {
  Some,
  None,
  isSome,
  isNone,
  map,
  flatMap,
  getOrElse,
  fold,
  filter,
  orElse,
  fromNullable,
  toNullable,
  sequence,
  traverse,
};
