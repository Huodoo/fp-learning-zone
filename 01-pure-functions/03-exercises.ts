/**
 * 第一章练习：将命令式/OOP 代码重构为纯函数式代码
 * 
 * 每个练习都有：
 * 1. 命令式/OOP 版本（有问题的代码）
 * 2. 练习要求
 * 3. 函数式版本（答案，但先自己尝试！）
 */

console.log('=== 第一章练习题 ===\n');

// ============================================================================
// 练习 1: 重构用户管理类
// ============================================================================

console.log('练习 1: 重构用户管理类\n');

/**
 * ❌ OOP 版本：可变状态
 */
class UserManagerOOP {
  private users: Array<{ id: number; name: string; email: string }> = [];
  private nextId = 1;

  addUser(name: string, email: string): void {
    this.users.push({
      id: this.nextId++,
      name,
      email,
    });
  }

  removeUser(id: number): void {
    this.users = this.users.filter(u => u.id !== id);
  }

  updateUserEmail(id: number, newEmail: string): void {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.email = newEmail;
    }
  }

  getUsers() {
    return this.users;
  }
}

console.log('OOP 版本：');
const manager = new UserManagerOOP();
manager.addUser('Alice', 'alice@example.com');
manager.addUser('Bob', 'bob@example.com');
manager.updateUserEmail(1, 'alice.new@example.com');
console.log(manager.getUsers());

/**
 * 练习要求：
 * 将上面的 UserManagerOOP 重构为纯函数式风格
 * 提示：
 * - 状态作为参数传入和返回值
 * - 所有操作都返回新状态，不修改原状态
 * - 使用 readonly 类型确保不可变性
 */

// ✅ 你的答案写在这里：

type UserState = {
  readonly users: readonly User[];
  readonly nextId: number;
};

type User = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
};

function createUserState(): UserState {
  return {
    users: [],
    nextId: 1,
  };
}

function addUser(state: UserState, name: string, email: string): UserState {
  const newUser: User = {
    id: state.nextId,
    name,
    email,
  };
  return {
    users: [...state.users, newUser],
    nextId: state.nextId + 1,
  };
}

function removeUser(state: UserState, id: number): UserState {
  return {
    ...state,
    users: state.users.filter(u => u.id !== id),
  };
}

function updateUserEmail(state: UserState, id: number, newEmail: string): UserState {
  return {
    ...state,
    users: state.users.map(u =>
      u.id === id ? { ...u, email: newEmail } : u
    ),
  };
}

// 测试纯函数版本
console.log('\n纯函数版本：');
let userState = createUserState();
userState = addUser(userState, 'Alice', 'alice@example.com');
userState = addUser(userState, 'Bob', 'bob@example.com');
userState = updateUserEmail(userState, 1, 'alice.new@example.com');
console.log(userState.users);
console.log();

// ============================================================================
// 练习 2: 重构购物车
// ============================================================================

console.log('练习 2: 重构购物车\n');

/**
 * ❌ 命令式版本：直接修改数组
 */
type CartItemMutable = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

function updateCartImperative(cart: CartItemMutable[], productId: number, quantity: number): void {
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity += quantity;
    if (item.quantity <= 0) {
      const index = cart.indexOf(item);
      cart.splice(index, 1);
    }
  } else {
    // 假设从某处获取商品信息...
    cart.push({ productId, name: `Product ${productId}`, price: 100, quantity });
  }
}

const cartImperative: CartItemMutable[] = [];
updateCartImperative(cartImperative, 1, 2);
updateCartImperative(cartImperative, 2, 1);
updateCartImperative(cartImperative, 1, 1);
console.log('命令式版本:', cartImperative);

/**
 * 练习要求：
 * 重构为纯函数式版本
 * 提示：
 * - 返回新的购物车数组
 * - 处理添加、更新、删除三种情况
 * - 使用 readonly 类型
 */

// ✅ 你的答案：

type CartItem = {
  readonly productId: number;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
};

type Cart = readonly CartItem[];

type Product = {
  readonly id: number;
  readonly name: string;
  readonly price: number;
};

function updateCart(
  cart: Cart,
  productId: number,
  quantity: number,
  getProduct: (id: number) => Product  // 依赖注入
): Cart {
  const existingItem = cart.find(i => i.productId === productId);

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    
    if (newQuantity <= 0) {
      // 删除商品
      return cart.filter(i => i.productId !== productId);
    } else {
      // 更新数量
      return cart.map(i =>
        i.productId === productId
          ? { ...i, quantity: newQuantity }
          : i
      );
    }
  } else {
    // 添加新商品
    if (quantity > 0) {
      const product = getProduct(productId);
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      };
      return [...cart, newItem];
    }
    return cart;
  }
}

// 测试
const mockGetProduct = (id: number): Product => ({
  id,
  name: `Product ${id}`,
  price: 100,
});

let cart: Cart = [];
cart = updateCart(cart, 1, 2, mockGetProduct);
cart = updateCart(cart, 2, 1, mockGetProduct);
cart = updateCart(cart, 1, 1, mockGetProduct);
console.log('\n纯函数版本:', cart);
console.log();

// ============================================================================
// 练习 3: 重构表单验证
// ============================================================================

console.log('练习 3: 重构表单验证\n');

/**
 * ❌ 非纯函数版本：依赖外部状态和 I/O
 */
const validationErrors: string[] = [];

function validateFormImperative(data: { username: string; email: string; password: string }): boolean {
  validationErrors.length = 0;  // 清空错误数组

  if (data.username.length < 3) {
    validationErrors.push('用户名至少 3 个字符');
  }

  if (!data.email.includes('@')) {
    validationErrors.push('邮箱格式不正确');
  }

  if (data.password.length < 6) {
    validationErrors.push('密码至少 6 个字符');
  }

  if (validationErrors.length > 0) {
    console.log('验证失败:', validationErrors);  // I/O 副作用
    return false;
  }

  console.log('验证成功');  // I/O 副作用
  return true;
}

validateFormImperative({ username: 'ab', email: 'invalid', password: '123' });

/**
 * 练习要求：
 * 重构为纯函数式版本
 * 提示：
 * - 返回验证结果和错误信息（不要修改外部状态）
 * - 不使用 console.log
 * - 考虑使用 ADT（代数数据类型）表示结果
 */

// ✅ 你的答案：

type ValidationResult =
  | { success: true; data: ValidatedFormData }
  | { success: false; errors: readonly string[] };

type FormData = {
  readonly username: string;
  readonly email: string;
  readonly password: string;
};

type ValidatedFormData = FormData;  // 可以是更严格的类型

function validateForm(data: FormData): ValidationResult {
  const errors: string[] = [];

  if (data.username.length < 3) {
    errors.push('用户名至少 3 个字符');
  }

  if (!data.email.includes('@')) {
    errors.push('邮箱格式不正确');
  }

  if (data.password.length < 6) {
    errors.push('密码至少 6 个字符');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

// 测试
console.log('\n纯函数版本：');
const result1 = validateForm({ username: 'ab', email: 'invalid', password: '123' });
console.log(result1);

const result2 = validateForm({ username: 'alice', email: 'alice@example.com', password: 'password123' });
console.log(result2);

// 使用验证结果（副作用在外部）
if (!result1.success) {
  console.log('验证失败:', result1.errors);
}
if (result2.success) {
  console.log('验证成功:', result2.data);
}
console.log();

// ============================================================================
// 练习 4: 重构数据转换管道
// ============================================================================

console.log('练习 4: 重构数据转换管道\n');

/**
 * ❌ 命令式版本：多步骤修改同一个数组
 */
function processDataImperative(numbers: number[]): number[] {
  const result: number[] = [];
  
  // 步骤 1: 过滤偶数
  for (const num of numbers) {
    if (num % 2 === 0) {
      result.push(num);
    }
  }
  
  // 步骤 2: 平方
  for (let i = 0; i < result.length; i++) {
    result[i] = result[i] * result[i];
  }
  
  // 步骤 3: 过滤大于 10 的
  const filtered: number[] = [];
  for (const num of result) {
    if (num > 10) {
      filtered.push(num);
    }
  }
  
  return filtered;
}

console.log('命令式版本:', processDataImperative([1, 2, 3, 4, 5, 6]));

/**
 * 练习要求：
 * 使用函数式风格重构，利用链式调用
 * 提示：使用 filter、map 等高阶函数
 */

// ✅ 你的答案：

function processDataFunctional(numbers: readonly number[]): number[] {
  return numbers
    .filter(n => n % 2 === 0)   // 过滤偶数
    .map(n => n * n)             // 平方
    .filter(n => n > 10);        // 过滤大于 10
}

console.log('\n纯函数版本:', processDataFunctional([1, 2, 3, 4, 5, 6]));
console.log();

// ============================================================================
// 练习 5: 重构配置合并
// ============================================================================

console.log('练习 5: 重构配置合并\n');

/**
 * ❌ 可变版本：直接修改对象
 */
type ConfigMutable = {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    darkMode: boolean;
    analytics: boolean;
  };
};

function mergeConfigMutable(base: ConfigMutable, override: Partial<ConfigMutable>): void {
  if (override.api) {
    Object.assign(base.api, override.api);
  }
  if (override.features) {
    Object.assign(base.features, override.features);
  }
}

const config: ConfigMutable = {
  api: { baseUrl: 'https://api.example.com', timeout: 5000 },
  features: { darkMode: false, analytics: true },
};

mergeConfigMutable(config, {
  api: { timeout: 10000 },
  features: { darkMode: true },
});

console.log('可变版本:', config);

/**
 * 练习要求：
 * 实现不可变的深度合并
 * 提示：
 * - 返回新对象
 * - 正确处理嵌套对象
 * - 使用 readonly 和 Partial 类型
 */

// ✅ 你的答案：

type Config = {
  readonly api: {
    readonly baseUrl: string;
    readonly timeout: number;
  };
  readonly features: {
    readonly darkMode: boolean;
    readonly analytics: boolean;
  };
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function mergeConfig(base: Config, override: DeepPartial<Config>): Config {
  return {
    api: {
      ...base.api,
      ...(override.api || {}),
    },
    features: {
      ...base.features,
      ...(override.features || {}),
    },
  };
}

const baseConfig: Config = {
  api: { baseUrl: 'https://api.example.com', timeout: 5000 },
  features: { darkMode: false, analytics: true },
};

const newConfig = mergeConfig(baseConfig, {
  api: { timeout: 10000 },
  features: { darkMode: true },
});

console.log('\n纯函数版本 - 原配置:', baseConfig);
console.log('纯函数版本 - 新配置:', newConfig);
console.log();

// ============================================================================
// 练习 6: 重构日志记录
// ============================================================================

console.log('练习 6: 重构日志记录\n');

/**
 * ❌ 有副作用版本：直接写日志
 */
function calculateWithLogging(a: number, b: number): number {
  console.log(`计算开始: ${a} + ${b}`);  // 副作用
  const result = a + b;
  console.log(`计算结果: ${result}`);    // 副作用
  return result;
}

calculateWithLogging(2, 3);

/**
 * 练习要求：
 * 将计算和日志分离
 * 提示：
 * - 计算函数保持纯净
 * - 返回计算结果和日志信息
 * - 实际的日志输出在函数外部
 */

// ✅ 你的答案：

type ComputationResult<T> = {
  readonly value: T;
  readonly logs: readonly string[];
};

function calculatePure(a: number, b: number): ComputationResult<number> {
  const logs = [
    `计算开始: ${a} + ${b}`,
    `计算结果: ${a + b}`,
  ];
  
  return {
    value: a + b,
    logs,
  };
}

// 测试
console.log('\n纯函数版本：');
const computation = calculatePure(2, 3);
console.log('结果:', computation.value);
// 副作用在外部处理
computation.logs.forEach(log => console.log(log));
console.log();

// ============================================================================
// 挑战练习: 实现不可变的 Undo/Redo
// ============================================================================

console.log('挑战练习: 实现 Undo/Redo\n');

/**
 * 练习要求：
 * 实现一个支持 undo/redo 的状态管理器
 * 提示：
 * - 维护状态历史栈
 * - 所有操作都是不可变的
 * - 支持 undo, redo, 和状态更新
 */

// ✅ 你的答案：

type History<T> = {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
};

function createHistory<T>(initialState: T): History<T> {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

function updateState<T>(history: History<T>, newState: T): History<T> {
  return {
    past: [...history.past, history.present],
    present: newState,
    future: [],  // 新操作会清空 future
  };
}

function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) {
    return history;
  }

  const previous = history.past[history.past.length - 1]!;
  const newPast = history.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) {
    return history;
  }

  const next = history.future[0]!;
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}

// 测试
console.log('Undo/Redo 测试：');
let history = createHistory<number>(0);
console.log('初始:', history.present);

history = updateState(history, 1);
console.log('更新到 1:', history.present);

history = updateState(history, 2);
console.log('更新到 2:', history.present);

history = updateState(history, 3);
console.log('更新到 3:', history.present);

history = undo(history);
console.log('Undo:', history.present);  // 2

history = undo(history);
console.log('Undo:', history.present);  // 1

history = redo(history);
console.log('Redo:', history.present);  // 2

history = updateState(history, 99);
console.log('新操作:', history.present);  // 99
console.log('Future 已清空:', history.future);  // []

console.log('\n=== 练习结束 ===');
console.log('🎉 恭喜完成第一章所有练习！');
console.log('📝 重点回顾：');
console.log('  1. 纯函数：相同输入 → 相同输出，无副作用');
console.log('  2. 不可变性：不修改原数据，总是返回新数据');
console.log('  3. 状态外部化：将状态作为参数传入和返回值');
console.log('  4. 副作用隔离：将副作用推到函数边界');
console.log('\n➡️  继续学习第二章：函数是一等公民');

// 导出供测试使用
export type { UserState, User, CartItem, Cart, Product, ValidationResult, FormData, Config, History };
export {
  createUserState,
  addUser,
  removeUser,
  updateUserEmail,
  updateCart,
  validateForm,
  processDataFunctional,
  mergeConfig,
  calculatePure,
  createHistory,
  updateState,
  undo,
  redo,
};
