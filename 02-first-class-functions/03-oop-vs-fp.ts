/**
 * 第二章第三节: OOP vs FP
 * 
 * 对比面向对象编程和函数式编程的思维方式
 * 理解两种范式的优劣和适用场景
 */

console.log('=== OOP vs FP 对比 ===\n');

// ============================================================================
// 1. 基础示例: 用户管理
// ============================================================================

console.log('1. 基础示例: 用户管理\n');

// ============================================================================
// OOP 版本
// ============================================================================

console.log('--- OOP 版本 ---\n');

class User {
  private id: number;
  private name: string;
  private email: string;
  private age: number;

  constructor(id: number, name: string, email: string, age: number) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.age = age;
  }

  // 方法封装在对象内部
  updateEmail(newEmail: string): void {
    this.email = newEmail;  // 直接修改内部状态
  }

  incrementAge(): void {
    this.age++;
  }

  isAdult(): boolean {
    return this.age >= 18;
  }

  getInfo(): string {
    return `${this.name} (${this.email})`;
  }

  // 获取器
  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getAge(): number {
    return this.age;
  }
}

const oopUser = new User(1, '张三', 'zhang@example.com', 25);
console.log('初始信息:', oopUser.getInfo());
oopUser.updateEmail('zhang.new@example.com');
console.log('更新后信息:', oopUser.getInfo());
console.log('是否成年:', oopUser.isAdult());
console.log();

// ============================================================================
// FP 版本
// ============================================================================

console.log('--- FP 版本 ---\n');

type UserData = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly age: number;
};

// 函数都是独立的,操作不可变数据
function createUser(id: number, name: string, email: string, age: number): UserData {
  return { id, name, email, age };
}

function updateEmail(user: UserData, newEmail: string): UserData {
  return { ...user, email: newEmail };  // 返回新对象
}

function incrementAge(user: UserData): UserData {
  return { ...user, age: user.age + 1 };
}

function isAdult(user: UserData): boolean {
  return user.age >= 18;
}

function getInfo(user: UserData): string {
  return `${user.name} (${user.email})`;
}

const fpUser1 = createUser(1, '李四', 'li@example.com', 25);
console.log('初始信息:', getInfo(fpUser1));

const fpUser2 = updateEmail(fpUser1, 'li.new@example.com');
console.log('更新后信息:', getInfo(fpUser2));
console.log('原用户未变:', getInfo(fpUser1));
console.log('是否成年:', isAdult(fpUser2));
console.log();

// ============================================================================
// 2. 复杂示例: 购物车
// ============================================================================

console.log('2. 复杂示例: 购物车\n');

// ============================================================================
// OOP 版本
// ============================================================================

console.log('--- OOP 版本 ---\n');

class CartItem {
  public id: string;
  public name: string;
  public price: number;
  public quantity: number;

  constructor(id: string, name: string, price: number, quantity: number) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.quantity = quantity;
  }

  updateQuantity(newQuantity: number): void {
    this.quantity = newQuantity;
  }

  getSubtotal(): number {
    return this.price * this.quantity;
  }
}

class ShoppingCartOOP {
  private items: CartItem[] = [];
  private discountRate: number = 0;

  addItem(item: CartItem): void {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.updateQuantity(existing.quantity + item.quantity);
    } else {
      this.items.push(item);
    }
  }

  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
  }

  updateQuantity(id: string, quantity: number): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.updateQuantity(quantity);
    }
  }

  applyDiscount(rate: number): void {
    this.discountRate = rate;
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }

  getDiscount(): number {
    return this.getSubtotal() * this.discountRate;
  }

  getTotal(): number {
    return this.getSubtotal() - this.getDiscount();
  }

  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear(): void {
    this.items = [];
    this.discountRate = 0;
  }
}

const oopCart = new ShoppingCartOOP();
oopCart.addItem(new CartItem('1', 'iPhone', 5999, 1));
oopCart.addItem(new CartItem('2', 'AirPods', 1299, 2));
oopCart.applyDiscount(0.1);

console.log('OOP 购物车总计:', oopCart.getTotal());
console.log('商品数量:', oopCart.getItemCount());
console.log();

// ============================================================================
// FP 版本
// ============================================================================

console.log('--- FP 版本 ---\n');

type CartItemData = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
};

type ShoppingCartData = {
  readonly items: readonly CartItemData[];
  readonly discountRate: number;
};

// 纯函数: 创建购物车
function createCart(): ShoppingCartData {
  return { items: [], discountRate: 0 };
}

// 纯函数: 添加商品
function addItemToCart(
  cart: ShoppingCartData,
  item: CartItemData
): ShoppingCartData {
  const existingIndex = cart.items.findIndex(i => i.id === item.id);

  if (existingIndex !== -1) {
    const updatedItems = cart.items.map((i, index) =>
      index === existingIndex
        ? { ...i, quantity: i.quantity + item.quantity }
        : i
    );
    return { ...cart, items: updatedItems };
  } else {
    return { ...cart, items: [...cart.items, item] };
  }
}

// 纯函数: 移除商品
function removeItemFromCart(
  cart: ShoppingCartData,
  id: string
): ShoppingCartData {
  return {
    ...cart,
    items: cart.items.filter(item => item.id !== id),
  };
}

// 纯函数: 更新数量
function updateCartItemQuantity(
  cart: ShoppingCartData,
  id: string,
  quantity: number
): ShoppingCartData {
  return {
    ...cart,
    items: cart.items.map(item =>
      item.id === id ? { ...item, quantity } : item
    ),
  };
}

// 纯函数: 应用折扣
function applyDiscountToCart(
  cart: ShoppingCartData,
  rate: number
): ShoppingCartData {
  return { ...cart, discountRate: rate };
}

// 纯函数: 计算小计
function calculateSubtotal(cart: ShoppingCartData): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// 纯函数: 计算折扣
function calculateDiscount(cart: ShoppingCartData): number {
  return calculateSubtotal(cart) * cart.discountRate;
}

// 纯函数: 计算总计
function calculateTotal(cart: ShoppingCartData): number {
  return calculateSubtotal(cart) - calculateDiscount(cart);
}

// 纯函数: 计算商品数量
function getCartItemCount(cart: ShoppingCartData): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// 使用
let fpCart = createCart();
fpCart = addItemToCart(fpCart, { id: '1', name: 'iPhone', price: 5999, quantity: 1 });
fpCart = addItemToCart(fpCart, { id: '2', name: 'AirPods', price: 1299, quantity: 2 });
fpCart = applyDiscountToCart(fpCart, 0.1);

console.log('FP 购物车总计:', calculateTotal(fpCart));
console.log('商品数量:', getCartItemCount(fpCart));
console.log();

// ============================================================================
// 3. 继承 vs 组合
// ============================================================================

console.log('3. 继承 vs 组合\n');

// ============================================================================
// OOP: 继承
// ============================================================================

console.log('--- OOP 继承 ---\n');

abstract class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract makeSound(): string;

  move(): string {
    return `${this.name} is moving`;
  }
}

class Dog extends Animal {
  makeSound(): string {
    return 'Woof!';
  }

  fetch(): string {
    return `${this.name} is fetching`;
  }
}

class Cat extends Animal {
  makeSound(): string {
    return 'Meow!';
  }

  climb(): string {
    return `${this.name} is climbing`;
  }
}

const dog = new Dog('Rex');
console.log(dog.makeSound());
console.log(dog.fetch());

const cat = new Cat('Whiskers');
console.log(cat.makeSound());
console.log(cat.climb());
console.log();

// ============================================================================
// FP: 组合
// ============================================================================

console.log('--- FP 组合 ---\n');

type AnimalData = {
  readonly name: string;
  readonly type: 'dog' | 'cat' | 'bird';
};

// 能力函数 - 可以组合使用
const canMakeSound = (animal: AnimalData): string => {
  switch (animal.type) {
    case 'dog': return 'Woof!';
    case 'cat': return 'Meow!';
    case 'bird': return 'Chirp!';
  }
};

const canMove = (animal: AnimalData): string => {
  return `${animal.name} is moving`;
};

const canFetch = (animal: AnimalData): string => {
  if (animal.type !== 'dog') {
    throw new Error('Only dogs can fetch');
  }
  return `${animal.name} is fetching`;
};

const canClimb = (animal: AnimalData): string => {
  if (animal.type !== 'cat') {
    throw new Error('Only cats can climb');
  }
  return `${animal.name} is climbing`;
};

const canFly = (animal: AnimalData): string => {
  if (animal.type !== 'bird') {
    throw new Error('Only birds can fly');
  }
  return `${animal.name} is flying`;
};

const fpDog: AnimalData = { name: 'Max', type: 'dog' };
console.log(canMakeSound(fpDog));
console.log(canFetch(fpDog));

const fpCat: AnimalData = { name: 'Luna', type: 'cat' };
console.log(canMakeSound(fpCat));
console.log(canClimb(fpCat));
console.log();

// ============================================================================
// 4. 状态管理对比
// ============================================================================

console.log('4. 状态管理对比\n');

// ============================================================================
// OOP: 可变状态
// ============================================================================

console.log('--- OOP 可变状态 ---\n');

class TodoListOOP {
  private todos: Array<{ id: number; text: string; completed: boolean }> = [];
  private nextId: number = 1;

  add(text: string): void {
    this.todos.push({ id: this.nextId++, text, completed: false });
  }

  toggle(id: number): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  remove(id: number): void {
    this.todos = this.todos.filter(t => t.id !== id);
  }

  getAll() {
    return [...this.todos];  // 返回副本
  }

  getCompleted() {
    return this.todos.filter(t => t.completed);
  }
}

const oopTodos = new TodoListOOP();
oopTodos.add('学习 OOP');
oopTodos.add('学习 FP');
oopTodos.toggle(1);
console.log('OOP Todos:', oopTodos.getAll());
console.log('已完成:', oopTodos.getCompleted());
console.log();

// ============================================================================
// FP: 不可变状态
// ============================================================================

console.log('--- FP 不可变状态 ---\n');

type Todo = {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
};

type TodoListData = {
  readonly todos: readonly Todo[];
  readonly nextId: number;
};

function createTodoList(): TodoListData {
  return { todos: [], nextId: 1 };
}

function addTodo(list: TodoListData, text: string): TodoListData {
  const newTodo: Todo = { id: list.nextId, text, completed: false };
  return {
    todos: [...list.todos, newTodo],
    nextId: list.nextId + 1,
  };
}

function toggleTodo(list: TodoListData, id: number): TodoListData {
  return {
    ...list,
    todos: list.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  };
}

function removeTodo(list: TodoListData, id: number): TodoListData {
  return {
    ...list,
    todos: list.todos.filter(todo => todo.id !== id),
  };
}

function getAllTodos(list: TodoListData): readonly Todo[] {
  return list.todos;
}

function getCompletedTodos(list: TodoListData): readonly Todo[] {
  return list.todos.filter(todo => todo.completed);
}

let fpTodos = createTodoList();
fpTodos = addTodo(fpTodos, '学习 OOP');
fpTodos = addTodo(fpTodos, '学习 FP');
fpTodos = toggleTodo(fpTodos, 1);

console.log('FP Todos:', getAllTodos(fpTodos));
console.log('已完成:', getCompletedTodos(fpTodos));
console.log();

// ============================================================================
// 5. 优缺点总结
// ============================================================================

console.log('5. 优缺点总结\n');

console.log('OOP 优势:');
console.log('  ✅ 符合直觉 - 模拟真实世界的对象');
console.log('  ✅ 封装性好 - 数据和行为绑定在一起');
console.log('  ✅ 代码组织 - 类结构清晰');
console.log('  ✅ 性能高 - 原地修改,无需复制');
console.log();

console.log('OOP 劣势:');
console.log('  ❌ 状态难追踪 - 对象可以在任何地方被修改');
console.log('  ❌ 测试困难 - 需要 mock 依赖');
console.log('  ❌ 继承陷阱 - 深层继承链难以维护');
console.log('  ❌ 并发不安全 - 需要锁机制');
console.log();

console.log('FP 优势:');
console.log('  ✅ 可预测性强 - 纯函数,相同输入必然相同输出');
console.log('  ✅ 易于测试 - 无需 mock,直接测试函数');
console.log('  ✅ 并发安全 - 不可变数据天然线程安全');
console.log('  ✅ 易于组合 - 小函数组合成复杂功能');
console.log('  ✅ 时间旅行 - 可以轻松实现 undo/redo');
console.log();

console.log('FP 劣势:');
console.log('  ❌ 学习曲线陡峭 - 需要改变思维方式');
console.log('  ❌ 代码冗长 - 需要更多的函数定义');
console.log('  ❌ 性能开销 - 创建新对象(可用结构共享优化)');
console.log('  ❌ 调试困难 - 深层嵌套的函数调用');
console.log();

// ============================================================================
// 6. 实践建议: 混合使用
// ============================================================================

console.log('6. 实践建议: 混合使用两种范式\n');

/**
 * 在真实项目中,通常混合使用 OOP 和 FP
 * 
 * 建议:
 * - 用 OOP 组织代码结构(模块、服务)
 * - 用 FP 处理数据转换(业务逻辑)
 * - 核心逻辑使用纯函数
 * - 副作用隔离到边界(API 调用、数据库操作)
 */

// 示例: 混合范式的用户服务
class UserService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // 方法内部使用纯函数处理数据
  async updateUser(id: number, updates: Partial<UserData>): Promise<UserData> {
    const currentUser = await this.db.findById(id);
    
    // 使用纯函数处理数据转换
    const updatedUser = this.mergeUserData(currentUser, updates);
    const validatedUser = this.validateUser(updatedUser);
    
    // 副作用隔离在边界
    await this.db.save(validatedUser);
    
    return validatedUser;
  }

  // 纯函数: 数据合并
  private mergeUserData(
    current: UserData,
    updates: Partial<UserData>
  ): UserData {
    return { ...current, ...updates };
  }

  // 纯函数: 数据验证
  private validateUser(user: UserData): UserData {
    if (!user.email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (user.age < 0) {
      throw new Error('Invalid age');
    }
    return user;
  }
}

// 模拟数据库
class Database {
  async findById(id: number): Promise<UserData> {
    console.log(`查询用户 ${id}`);
    return { id, name: '测试用户', email: 'test@example.com', age: 25 };
  }

  async save(user: UserData): Promise<void> {
    console.log(`保存用户:`, user);
  }
}

// 使用混合范式的服务
(async () => {
  const db = new Database();
  const userService = new UserService(db);
  
  const updated = await userService.updateUser(1, { age: 26 });
  console.log('更新后的用户:', updated);
})();

console.log('\n=== 示例结束 ===');

// 导出类型和函数
export type { UserData, CartItemData, ShoppingCartData, AnimalData, Todo, TodoListData };
export {
  // FP User functions
  createUser,
  updateEmail,
  incrementAge,
  isAdult,
  getInfo,
  
  // FP Cart functions
  createCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  applyDiscountToCart,
  calculateTotal,
  getCartItemCount,
  
  // FP Animal functions
  canMakeSound,
  canMove,
  canFetch,
  canClimb,
  canFly,
  
  // FP Todo functions
  createTodoList,
  addTodo,
  toggleTodo,
  removeTodo,
  getAllTodos,
  getCompletedTodos,
  
  // OOP classes
  User,
  ShoppingCartOOP,
  UserService,
  Database,
};
