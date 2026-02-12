/**
 * 第十一章第一节：Lens（透镜）
 * 
 * 本文件从零实现 Lens
 * 展示如何使用 Lens 优雅地操作嵌套不可变数据
 */

console.log('=== Lens（透镜）===\n');

// ============================================================================
// 1. Lens 的定义和实现
// ============================================================================

console.log('1. Lens 的定义和实现\n');

/**
 * Lens 类型定义
 * S: 整体类型 (Source)
 * A: 部分类型 (Focus/Target)
 */
export interface Lens<S, A> {
  get: (s: S) => A;              // 获取聚焦的值
  set: (s: S, a: A) => S;        // 设置聚焦的值（不可变）
  modify: (s: S, f: (a: A) => A) => S;  // 修改聚焦的值（应用函数）
}

/**
 * 创建 Lens 的工厂函数
 */
export function lens<S, A>(
  getter: (s: S) => A,
  setter: (s: S, a: A) => S
): Lens<S, A> {
  return {
    get: getter,
    set: setter,
    modify: (s, f) => setter(s, f(getter(s)))
  };
}

// ============================================================================
// 2. 简单示例：操作对象字段
// ============================================================================

console.log('2. 简单示例：操作对象字段\n');

type Person = {
  readonly name: string;
  readonly age: number;
};

// 为 Person 的 name 字段创建 Lens
const nameLens: Lens<Person, string> = lens(
  (person) => person.name,
  (person, name) => ({ ...person, name })
);

// 为 Person 的 age 字段创建 Lens
const ageLens: Lens<Person, number> = lens(
  (person) => person.age,
  (person, age) => ({ ...person, age })
);

const alice: Person = { name: 'Alice', age: 30 };

console.log('原始对象:', alice);

// 使用 get 读取
console.log('nameLens.get(alice):', nameLens.get(alice));
console.log('ageLens.get(alice):', ageLens.get(alice));

// 使用 set 更新
const alice2 = nameLens.set(alice, 'Alice Smith');
console.log('更新姓名后:', alice2);
console.log('原对象未改变:', alice);

// 使用 modify 修改（应用函数）
const alice3 = ageLens.modify(alice, age => age + 1);
console.log('年龄 +1 后:', alice3);
console.log();

// ============================================================================
// 3. 验证 Lens 法则
// ============================================================================

console.log('3. 验证 Lens 法则\n');

// 法则 1: GetSet - set(s, get(s)) === s
const getSetResult = nameLens.set(alice, nameLens.get(alice));
console.log('GetSet 法则: set(s, get(s)) === s');
console.log('  结果:', getSetResult);
console.log('  原值:', alice);
console.log('  相等:', JSON.stringify(getSetResult) === JSON.stringify(alice));

// 法则 2: SetGet - get(set(s, a)) === a
const newName = 'Bob';
const setGetResult = nameLens.get(nameLens.set(alice, newName));
console.log('\nSetGet 法则: get(set(s, a)) === a');
console.log('  设置的值:', newName);
console.log('  读取的值:', setGetResult);
console.log('  相等:', setGetResult === newName);

// 法则 3: SetSet - set(set(s, a1), a2) === set(s, a2)
const name1 = 'Charlie';
const name2 = 'David';
const setSet1 = nameLens.set(nameLens.set(alice, name1), name2);
const setSet2 = nameLens.set(alice, name2);
console.log('\nSetSet 法则: set(set(s, a1), a2) === set(s, a2)');
console.log('  连续设置:', setSet1);
console.log('  直接设置:', setSet2);
console.log('  相等:', JSON.stringify(setSet1) === JSON.stringify(setSet2));
console.log();

// ============================================================================
// 4. 嵌套对象的 Lens
// ============================================================================

console.log('4. 嵌套对象的 Lens\n');

type Address = {
  readonly city: string;
  readonly street: string;
};

type Employee = {
  readonly name: string;
  readonly address: Address;
};

// Employee.address 的 Lens
const addressLens: Lens<Employee, Address> = lens(
  (emp) => emp.address,
  (emp, address) => ({ ...emp, address })
);

// Address.city 的 Lens
const cityLens: Lens<Address, string> = lens(
  (addr) => addr.city,
  (addr, city) => ({ ...addr, city })
);

// Address.street 的 Lens
const streetLens: Lens<Address, string> = lens(
  (addr) => addr.street,
  (addr, street) => ({ ...addr, street })
);

const employee: Employee = {
  name: 'Bob',
  address: {
    city: 'Beijing',
    street: 'Main St'
  }
};

console.log('原始员工:', employee);

// 更新嵌套字段：需要组合 Lens（下一节会讲）
// 先手动操作：更新 city
const updatedAddress = cityLens.set(employee.address, 'Shanghai');
const updatedEmployee = addressLens.set(employee, updatedAddress);

console.log('更新城市后:', updatedEmployee);
console.log('原对象未改变:', employee);
console.log();

// ============================================================================
// 5. Lens 组合
// ============================================================================

console.log('5. Lens 组合\n');

/**
 * 组合两个 Lens
 * 如果有 Lens<S, A> 和 Lens<A, B>，可以组合成 Lens<S, B>
 */
export function composeLens<S, A, B>(
  outer: Lens<S, A>,
  inner: Lens<A, B>
): Lens<S, B> {
  return lens(
    (s) => inner.get(outer.get(s)),
    (s, b) => outer.set(s, inner.set(outer.get(s), b))
  );
}

// 组合 addressLens 和 cityLens，得到直接操作 Employee.address.city 的 Lens
const employeeCityLens = composeLens(addressLens, cityLens);

console.log('使用组合 Lens 读取 city:', employeeCityLens.get(employee));

const employee2 = employeeCityLens.set(employee, 'Shenzhen');
console.log('使用组合 Lens 更新 city:', employee2);

const employee3 = employeeCityLens.modify(employee, city => city.toUpperCase());
console.log('使用组合 Lens 修改 city:', employee3);
console.log();

// ============================================================================
// 6. 实际应用：处理深层嵌套数据
// ============================================================================

console.log('6. 实际应用：处理深层嵌套数据\n');

type Street = {
  readonly name: string;
  readonly number: number;
};

type DetailedAddress = {
  readonly city: string;
  readonly street: Street;
};

type User = {
  readonly name: string;
  readonly address: DetailedAddress;
};

// 定义各层的 Lens
const userAddressLens: Lens<User, DetailedAddress> = lens(
  (user) => user.address,
  (user, address) => ({ ...user, address })
);

const detailedAddressStreetLens: Lens<DetailedAddress, Street> = lens(
  (addr) => addr.street,
  (addr, street) => ({ ...addr, street })
);

const streetNumberLens: Lens<Street, number> = lens(
  (street) => street.number,
  (street, number) => ({ ...street, number })
);

// 组合得到直接操作 User.address.street.number 的 Lens
const userStreetNumberLens = composeLens(
  composeLens(userAddressLens, detailedAddressStreetLens),
  streetNumberLens
);

const user: User = {
  name: 'Charlie',
  address: {
    city: 'Beijing',
    street: {
      name: 'Main St',
      number: 123
    }
  }
};

console.log('原始用户:', JSON.stringify(user, null, 2));

// ❌ 传统方式更新 street.number
const traditionalUpdate: User = {
  ...user,
  address: {
    ...user.address,
    street: {
      ...user.address.street,
      number: 456
    }
  }
};

console.log('\n传统方式更新 street.number:', 
  JSON.stringify(traditionalUpdate, null, 2));

// ✅ 使用 Lens 更新 street.number
const lensUpdate = userStreetNumberLens.set(user, 456);

console.log('\n使用 Lens 更新 street.number:', 
  JSON.stringify(lensUpdate, null, 2));

console.log('\n对比：');
console.log('  传统方式：需要手动展开 3 层');
console.log('  Lens 方式：一行代码，意图清晰');
console.log();

// ============================================================================
// 7. 通用 Lens 工具函数
// ============================================================================

console.log('7. 通用 Lens 工具函数\n');

/**
 * 为对象的任意属性自动创建 Lens
 */
export function prop<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return lens(
    (s) => s[key],
    (s, a) => ({ ...s, [key]: a } as S)
  );
}

// 使用 prop 快速创建 Lens
type Product = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
};

const productIdLens = prop<Product, 'id'>('id');
const productNameLens = prop<Product, 'name'>('name');
const productPriceLens = prop<Product, 'price'>('price');

const product: Product = {
  id: 'p1',
  name: 'MacBook Pro',
  price: 2000
};

console.log('原始产品:', product);
console.log('读取价格:', productPriceLens.get(product));

const discountedProduct = productPriceLens.modify(product, price => price * 0.8);
console.log('打折后:', discountedProduct);
console.log();

// ============================================================================
// 8. 数组元素的 Lens
// ============================================================================

console.log('8. 数组元素的 Lens\n');

/**
 * 为数组的指定索引创建 Lens
 * 注意：如果索引不存在，返回 undefined
 */
export function index<A>(i: number): Lens<A[], A | undefined> {
  return lens(
    (arr) => arr[i],
    (arr, a) => {
      if (a === undefined) return arr;
      const result = [...arr];
      result[i] = a;
      return result;
    }
  );
}

const numbers = [1, 2, 3, 4, 5];

const firstLens = index<number>(0);
const thirdLens = index<number>(2);

console.log('原始数组:', numbers);
console.log('读取第一个元素:', firstLens.get(numbers));
console.log('读取第三个元素:', thirdLens.get(numbers));

const updatedNumbers = thirdLens.set(numbers, 30);
console.log('更新第三个元素:', updatedNumbers);
console.log('原数组未改变:', numbers);
console.log();

// ============================================================================
// 9. 实际应用：购物车管理
// ============================================================================

console.log('9. 实际应用：购物车管理\n');

type CartItem = {
  readonly productId: string;
  readonly quantity: number;
  readonly price: number;
};

type ShoppingCart = {
  readonly items: CartItem[];
  readonly total: number;
};

// 定义 Lens
const cartItemsLens = prop<ShoppingCart, 'items'>('items');
const cartTotalLens = prop<ShoppingCart, 'total'>('total');

const itemQuantityLens = prop<CartItem, 'quantity'>('quantity');

// 辅助函数：重新计算总价
function recalculateTotal(cart: ShoppingCart): ShoppingCart {
  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return cartTotalLens.set(cart, total);
}

// 更新指定商品的数量
function updateItemQuantity(
  cart: ShoppingCart,
  itemIndex: number,
  newQuantity: number
): ShoppingCart {
  // 组合 Lens：cart.items[itemIndex].quantity
  const specificItemLens = composeLens(
    cartItemsLens,
    index<CartItem>(itemIndex)
  );
  
  const itemOrUndefined = specificItemLens.get(cart);
  if (itemOrUndefined === undefined) {
    return cart;
  }
  
  const updatedItem = itemQuantityLens.set(itemOrUndefined, newQuantity);
  const cartWithUpdatedItem = specificItemLens.set(cart, updatedItem);
  
  return recalculateTotal(cartWithUpdatedItem);
}

const cart: ShoppingCart = {
  items: [
    { productId: 'p1', quantity: 2, price: 100 },
    { productId: 'p2', quantity: 1, price: 200 },
    { productId: 'p3', quantity: 3, price: 50 }
  ],
  total: 550  // 2*100 + 1*200 + 3*50
};

console.log('原始购物车:', JSON.stringify(cart, null, 2));

const updatedCart = updateItemQuantity(cart, 0, 5);  // 将第一个商品数量改为 5
console.log('\n更新第一个商品数量为 5:', JSON.stringify(updatedCart, null, 2));
console.log();

// ============================================================================
// 10. OOP vs FP 对比
// ============================================================================

console.log('10. OOP vs FP 对比\n');

console.log('=== OOP 方式（可变）===');

class MutablePerson {
  constructor(
    public name: string,
    public age: number
  ) {}

  setName(name: string): void {
    this.name = name;  // 直接修改
  }

  setAge(age: number): void {
    this.age = age;
  }
}

const mutablePerson = new MutablePerson('Alice', 30);
console.log('原对象:', mutablePerson);

mutablePerson.setName('Bob');
console.log('修改后:', mutablePerson);  // 对象被修改了

console.log('\n=== FP 方式（不可变 + Lens）===');

const immutablePerson: Person = { name: 'Alice', age: 30 };
console.log('原对象:', immutablePerson);

const newPerson = nameLens.set(immutablePerson, 'Bob');
console.log('修改后:', newPerson);
console.log('原对象未改变:', immutablePerson);

console.log('\nFP + Lens 优势:');
console.log('1. 不可变性 - 避免意外修改');
console.log('2. 可组合 - 组合简单 Lens 处理复杂嵌套');
console.log('3. 类型安全 - 编译期检查');
console.log('4. 可测试 - 纯函数，易于测试');
console.log('5. 可追溯 - 保留历史状态');
