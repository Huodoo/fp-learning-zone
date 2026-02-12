/**
 * 第四章第一节: 积类型 (Product Types)
 * 
 * 积类型表示"同时拥有"多个值的类型
 * 包括元组 (Tuple)、记录 (Record)、对象等
 * 类型代数中，积类型的可能值数量是各字段类型可能值的乘积
 */

console.log('=== 积类型 (Product Types) ===\n');

// ============================================================================
// 1. 基础概念: 什么是积类型?
// ============================================================================

console.log('1. 基础概念: 什么是积类型?\n');

// ✅ 最简单的积类型: 元组 (Tuple)
// 元组是固定长度和类型的数组
type Point2D = [number, number];  // x 和 y 坐标
type Point3D = [number, number, number];  // x, y, z 坐标

const point1: Point2D = [10, 20];
const point2: Point3D = [10, 20, 30];

console.log('2D 点:', point1);
console.log('3D 点:', point2);

// ✅ 带标签的积类型: 接口/类型
interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

const user: User = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com'
};

console.log('用户:', user);
console.log();

// ============================================================================
// 2. 类型代数: 积类型的可能值数量
// ============================================================================

console.log('2. 类型代数: 积类型的可能值数量\n');

// 布尔类型有 2 个可能值: true, false
type Bool = boolean;  // 2 个值

// 交通信号灯有 3 个可能值
type TrafficLight = 'red' | 'yellow' | 'green';  // 3 个值

// 积类型的可能值 = 各字段可能值的乘积
type LightAndBool = [TrafficLight, Bool];  // 3 × 2 = 6 个可能值

// 列举所有可能的组合
const allCombinations: LightAndBool[] = [
  ['red', true],
  ['red', false],
  ['yellow', true],
  ['yellow', false],
  ['green', true],
  ['green', false],
];

console.log('TrafficLight × Bool 的所有可能值 (6个):');
allCombinations.forEach(combo => {
  console.log(`  [${combo[0]}, ${combo[1]}]`);
});

// 更复杂的例子
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';  // 4 个值
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';  // 13 个值

interface PlayingCard {
  readonly suit: Suit;
  readonly rank: Rank;
}
// PlayingCard 有 4 × 13 = 52 个可能值（一副扑克牌）

const aceOfSpades: PlayingCard = { suit: 'spades', rank: 'A' };
console.log('\n扑克牌示例:', aceOfSpades);
console.log('扑克牌总数: 4 × 13 = 52 张');
console.log();

// ============================================================================
// 3. 元组 vs 对象: 何时使用哪种?
// ============================================================================

console.log('3. 元组 vs 对象: 何时使用哪种?\n');

// ✅ 元组: 适合临时的、位置固定的数据
type RGB = [number, number, number];  // 红、绿、蓝

function rgbToHex(color: RGB): string {
  const [r, g, b] = color;  // 解构
  return '#' + 
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
}

const red: RGB = [255, 0, 0];
console.log('RGB 元组:', red, '→', rgbToHex(red));

// ✅ 对象: 适合有语义的、需要命名的数据
interface Color {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

function colorToHex(color: Color): string {
  const { red, green, blue } = color;
  return '#' + 
    red.toString(16).padStart(2, '0') +
    green.toString(16).padStart(2, '0') +
    blue.toString(16).padStart(2, '0');
}

const blueColor: Color = { red: 0, green: 0, blue: 255 };
console.log('Color 对象:', blueColor, '→', colorToHex(blueColor));
console.log();

// ============================================================================
// 4. 实战示例: 电商订单系统
// ============================================================================

console.log('4. 实战示例: 电商订单系统\n');

// 商品信息 (Product Type)
interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly category: 'electronics' | 'clothing' | 'food' | 'books';
}

// 订单项 (Product Type)
interface OrderItem {
  readonly product: Product;  // 嵌套的积类型
  readonly quantity: number;
  readonly discount: number;  // 折扣 (0-1)
}

// 订单 (Product Type)
interface Order {
  readonly orderId: string;
  readonly customerId: string;
  readonly items: readonly OrderItem[];  // 数组也是积类型的一种
  readonly orderDate: Date;
  readonly shippingAddress: Address;
}

// 地址 (Product Type)
interface Address {
  readonly street: string;
  readonly city: string;
  readonly province: string;
  readonly postalCode: string;
}

// 计算订单项的小计
function calculateItemTotal(item: OrderItem): number {
  const basePrice = item.product.price * item.quantity;
  return basePrice * (1 - item.discount);
}

// 计算订单总额
function calculateOrderTotal(order: Order): number {
  return order.items.reduce((total, item) => total + calculateItemTotal(item), 0);
}

// 示例数据
const laptop: Product = {
  id: 'P001',
  name: 'ThinkPad X1',
  price: 8999,
  category: 'electronics'
};

const book: Product = {
  id: 'P002',
  name: '函数式编程指南',
  price: 89,
  category: 'books'
};

const sampleOrder: Order = {
  orderId: 'ORD-2024-001',
  customerId: 'CUST-123',
  items: [
    { product: laptop, quantity: 1, discount: 0.1 },  // 10% 折扣
    { product: book, quantity: 2, discount: 0 }
  ],
  orderDate: new Date('2024-01-15'),
  shippingAddress: {
    street: '中关村大街 1号',
    city: '北京',
    province: '北京',
    postalCode: '100000'
  }
};

console.log('订单信息:');
console.log('  订单号:', sampleOrder.orderId);
console.log('  商品数:', sampleOrder.items.length);
console.log('  订单总额:', calculateOrderTotal(sampleOrder).toFixed(2), '元');
console.log();

// ============================================================================
// 5. 积类型的操作: 投影 (Projection)
// ============================================================================

console.log('5. 积类型的操作: 投影 (Projection)\n');

// 投影: 从积类型中提取某个字段
function getProductName(item: OrderItem): string {
  return item.product.name;
}

function getQuantity(item: OrderItem): number {
  return item.quantity;
}

// 对所有订单项进行投影
const productNames = sampleOrder.items.map(getProductName);
const quantities = sampleOrder.items.map(getQuantity);

console.log('商品名称:', productNames);
console.log('购买数量:', quantities);
console.log();

// ============================================================================
// 6. 嵌套积类型
// ============================================================================

console.log('6. 嵌套积类型\n');

// 公司组织结构 (深度嵌套的积类型)
interface Employee {
  readonly id: string;
  readonly name: string;
  readonly position: string;
}

interface Department {
  readonly name: string;
  readonly manager: Employee;
  readonly employees: readonly Employee[];
}

interface Company {
  readonly name: string;
  readonly departments: readonly Department[];
  readonly headquarters: Address;
}

const company: Company = {
  name: '创新科技有限公司',
  departments: [
    {
      name: '研发部',
      manager: { id: 'E001', name: '李明', position: '研发总监' },
      employees: [
        { id: 'E002', name: '王芳', position: '高级工程师' },
        { id: 'E003', name: '张伟', position: '工程师' }
      ]
    },
    {
      name: '市场部',
      manager: { id: 'E004', name: '赵丽', position: '市场总监' },
      employees: [
        { id: 'E005', name: '刘洋', position: '市场专员' }
      ]
    }
  ],
  headquarters: {
    street: '科技园路 88号',
    city: '深圳',
    province: '广东',
    postalCode: '518000'
  }
};

// 统计公司总人数
function countEmployees(company: Company): number {
  return company.departments.reduce((total, dept) => 
    total + dept.employees.length + 1,  // +1 包括部门经理
    0
  );
}

console.log('公司名称:', company.name);
console.log('部门数量:', company.departments.length);
console.log('员工总数:', countEmployees(company));
console.log();

// ============================================================================
// 7. 积类型的不变性 (Immutability)
// ============================================================================

console.log('7. 积类型的不变性 (Immutability)\n');

// ✅ 使用只读属性保证不可变性
interface ImmutablePoint {
  readonly x: number;
  readonly y: number;
}

function movePoint(point: ImmutablePoint, dx: number, dy: number): ImmutablePoint {
  return {
    x: point.x + dx,
    y: point.y + dy
  };
}

const p1: ImmutablePoint = { x: 10, y: 20 };
const p2 = movePoint(p1, 5, 5);

console.log('原始点:', p1);
console.log('移动后:', p2);

// ✅ 深层嵌套的更新
interface UserProfile {
  readonly user: User;
  readonly settings: {
    readonly theme: 'light' | 'dark';
    readonly notifications: boolean;
  };
}

function updateTheme(
  profile: UserProfile,
  theme: 'light' | 'dark'
): UserProfile {
  return {
    ...profile,
    settings: {
      ...profile.settings,
      theme
    }
  };
}

const profile1: UserProfile = {
  user: { id: 1, name: '张三', email: 'zhangsan@example.com' },
  settings: { theme: 'light', notifications: true }
};

const profile2 = updateTheme(profile1, 'dark');

console.log('原配置:', profile1.settings);
console.log('新配置:', profile2.settings);
console.log();

// ============================================================================
// 8. 积类型与单位类型 (Unit Type)
// ============================================================================

console.log('8. 积类型与单位类型 (Unit Type)\n');

// 单位类型: 只有一个值的类型
type Unit = null;  // 只有 null 这一个值
type VoidType = void;  // 只有 undefined 这一个值

// 任何类型 × Unit = 原类型
type NumberAndUnit = [number, Unit];  // 实际上等价于 number

// 示例: 使用 null 表示"无额外信息"
interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

type VoidSuccess = SuccessResponse<null>;  // 成功但无数据返回

const voidResult: VoidSuccess = {
  success: true,
  data: null
};

console.log('无数据的成功响应:', voidResult);
console.log();

// ============================================================================
// 9. 积类型与零类型 (Empty Type)
// ============================================================================

console.log('9. 积类型与零类型 (Empty Type)\n');

// 零类型: 没有任何值的类型
type Never = never;  // 0 个值

// 任何类型 × Never = Never
type NumberAndNever = [number, never];  // 这个类型不可能有任何值

// 这个函数不可能返回,因为返回类型是 never
function throwError(message: string): never {
  throw new Error(message);
}

console.log('Never 类型表示不可能的值');
console.log('例如: 永远抛出错误的函数的返回类型');
console.log();

// ============================================================================
// 10. 实战: 表单验证器
// ============================================================================

console.log('10. 实战: 表单验证器\n');

// 表单数据 (Product Type)
interface RegistrationForm {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly age: number;
  readonly agreedToTerms: boolean;
}

// 验证错误 (Product Type)
interface ValidationError {
  readonly field: string;
  readonly message: string;
}

// 验证结果
type ValidationResult = readonly ValidationError[];

// 各字段的验证函数
function validateUsername(username: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (username.length < 3) {
    errors.push({ field: 'username', message: '用户名至少3个字符' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push({ field: 'username', message: '用户名只能包含字母、数字和下划线' });
  }
  return errors;
}

function validateEmail(email: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }
  return errors;
}

function validatePassword(password: string, confirmPassword: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (password.length < 8) {
    errors.push({ field: 'password', message: '密码至少8个字符' });
  }
  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: '两次密码输入不一致' });
  }
  return errors;
}

function validateAge(age: number): ValidationError[] {
  const errors: ValidationError[] = [];
  if (age < 18) {
    errors.push({ field: 'age', message: '年龄必须大于等于18岁' });
  }
  return errors;
}

function validateTerms(agreed: boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!agreed) {
    errors.push({ field: 'agreedToTerms', message: '必须同意服务条款' });
  }
  return errors;
}

// 完整的表单验证
function validateForm(form: RegistrationForm): ValidationResult {
  return [
    ...validateUsername(form.username),
    ...validateEmail(form.email),
    ...validatePassword(form.password, form.confirmPassword),
    ...validateAge(form.age),
    ...validateTerms(form.agreedToTerms)
  ];
}

// 测试数据
const validForm: RegistrationForm = {
  username: 'zhangsan123',
  email: 'zhangsan@example.com',
  password: 'securepass123',
  confirmPassword: 'securepass123',
  age: 25,
  agreedToTerms: true
};

const invalidForm: RegistrationForm = {
  username: 'ab',  // 太短
  email: 'invalid-email',  // 格式错误
  password: 'short',  // 太短
  confirmPassword: 'different',  // 不一致
  age: 16,  // 未成年
  agreedToTerms: false  // 未同意
};

console.log('验证有效表单:');
const validErrors = validateForm(validForm);
console.log(validErrors.length === 0 ? '✅ 验证通过' : '❌ 验证失败', validErrors);

console.log('\n验证无效表单:');
const invalidErrors = validateForm(invalidForm);
console.log('❌ 发现', invalidErrors.length, '个错误:');
invalidErrors.forEach(err => {
  console.log(`  - ${err.field}: ${err.message}`);
});

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用
export type {
  Point2D,
  Point3D,
  User,
  TrafficLight,
  PlayingCard,
  Product,
  OrderItem,
  Order,
  Address,
  Employee,
  Department,
  Company,
  ImmutablePoint,
  UserProfile,
  RegistrationForm,
  ValidationError,
  ValidationResult
};

export {
  rgbToHex,
  colorToHex,
  calculateItemTotal,
  calculateOrderTotal,
  getProductName,
  getQuantity,
  countEmployees,
  movePoint,
  updateTheme,
  validateForm,
  validateUsername,
  validateEmail,
  validatePassword,
  validateAge,
  validateTerms
};
