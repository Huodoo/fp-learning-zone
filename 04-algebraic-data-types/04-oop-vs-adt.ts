/**
 * 第四章第四节: OOP vs ADT (面向对象 vs 代数数据类型)
 * 
 * 对比面向对象编程和函数式编程在数据建模方面的不同方法
 * 展示"表达式问题" (Expression Problem) 及两种范式的优劣
 */

console.log('=== OOP vs ADT ===\n');

// ============================================================================
// 1. 经典示例: 图形系统
// ============================================================================

console.log('1. 经典示例: 图形系统\n');

console.log('--- OOP 方法 ---\n');

// ❌ OOP: 使用类和继承
abstract class ShapeOOP {
  abstract area(): number;
  abstract perimeter(): number;
  
  // 所有图形共享的方法
  describe(): string {
    return `面积: ${this.area().toFixed(2)}, 周长: ${this.perimeter().toFixed(2)}`;
  }
}

class CircleOOP extends ShapeOOP {
  private radius: number;
  
  constructor(radius: number) {
    super();
    this.radius = radius;
  }
  
  area(): number {
    return Math.PI * this.radius ** 2;
  }
  
  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class RectangleOOP extends ShapeOOP {
  private width: number;
  private height: number;
  
  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }
  
  area(): number {
    return this.width * this.height;
  }
  
  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

const circleOOP = new CircleOOP(5);
const rectOOP = new RectangleOOP(10, 20);

console.log('圆形:', circleOOP.describe());
console.log('矩形:', rectOOP.describe());
console.log();

console.log('--- FP 方法 (ADT) ---\n');

// ✅ FP: 使用代数数据类型
type ShapeADT = 
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

// 函数独立于数据
function area(shape: ShapeADT): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
  }
}

function perimeter(shape: ShapeADT): number {
  switch (shape.kind) {
    case 'circle':
      return 2 * Math.PI * shape.radius;
    case 'rectangle':
      return 2 * (shape.width + shape.height);
  }
}

function describe(shape: ShapeADT): string {
  return `面积: ${area(shape).toFixed(2)}, 周长: ${perimeter(shape).toFixed(2)}`;
}

const circleADT: ShapeADT = { kind: 'circle', radius: 5 };
const rectADT: ShapeADT = { kind: 'rectangle', width: 10, height: 20 };

console.log('圆形:', describe(circleADT));
console.log('矩形:', describe(rectADT));
console.log();

// ============================================================================
// 2. 表达式问题 (Expression Problem)
// ============================================================================

console.log('2. 表达式问题 (Expression Problem)\n');

// 表达式问题: 在不修改现有代码的情况下:
// 1. 添加新的数据类型
// 2. 添加新的操作

console.log('--- 场景1: 添加新的图形类型 (三角形) ---\n');

// OOP: 需要创建新的类，但不需要修改现有代码
class TriangleOOP extends ShapeOOP {
  private base: number;
  private height: number;
  private side1: number;
  private side2: number;
  
  constructor(base: number, height: number, side1: number, side2: number) {
    super();
    this.base = base;
    this.height = height;
    this.side1 = side1;
    this.side2 = side2;
  }
  
  area(): number {
    return (this.base * this.height) / 2;
  }
  
  perimeter(): number {
    return this.base + this.side1 + this.side2;
  }
}

const triangleOOP = new TriangleOOP(10, 15, 12, 12);
console.log('OOP - 三角形:', triangleOOP.describe());

// FP: 需要修改类型定义和所有函数
type ShapeADT2 = 
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number; side1: number; side2: number };

function area2(shape: ShapeADT2): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':  // 新增
      return (shape.base * shape.height) / 2;
  }
}

function perimeter2(shape: ShapeADT2): number {
  switch (shape.kind) {
    case 'circle':
      return 2 * Math.PI * shape.radius;
    case 'rectangle':
      return 2 * (shape.width + shape.height);
    case 'triangle':  // 新增
      return shape.base + shape.side1 + shape.side2;
  }
}

const triangleADT: ShapeADT2 = { kind: 'triangle', base: 10, height: 15, side1: 12, side2: 12 };
console.log('FP - 三角形:', `面积: ${area2(triangleADT).toFixed(2)}, 周长: ${perimeter2(triangleADT).toFixed(2)}`);
console.log();

console.log('--- 场景2: 添加新的操作 (draw 方法) ---\n');

// OOP: 需要修改所有现有类，添加新方法
// (这里演示需要改动基类和所有子类)

// FP: 只需添加新函数，无需修改现有代码
function draw(shape: ShapeADT): string {
  switch (shape.kind) {
    case 'circle':
      return `绘制圆形，半径 ${shape.radius}`;
    case 'rectangle':
      return `绘制矩形，${shape.width} x ${shape.height}`;
  }
}

console.log('FP - 绘制:', draw(circleADT));
console.log('FP - 绘制:', draw(rectADT));
console.log();

// ============================================================================
// 3. 实战对比: 电商订单系统
// ============================================================================

console.log('3. 实战对比: 电商订单系统\n');

console.log('--- OOP 方法 ---\n');

// OOP: 订单状态作为类层次结构
abstract class OrderStatus {
  abstract canCancel(): boolean;
  abstract canRefund(): boolean;
  abstract statusMessage(): string;
}

class PendingOrder extends OrderStatus {
  canCancel(): boolean { return true; }
  canRefund(): boolean { return false; }
  statusMessage(): string { return '订单待处理'; }
}

class ShippedOrder extends OrderStatus {
  private trackingNumber: string;

  constructor(trackingNumber: string) {
    super();
    this.trackingNumber = trackingNumber;
  }
  
  canCancel(): boolean { return false; }
  canRefund(): boolean { return true; }
  statusMessage(): string { return `订单已发货，物流单号: ${this.trackingNumber}`; }
  
  getTrackingNumber(): string { return this.trackingNumber; }
}

class DeliveredOrder extends OrderStatus {
  private deliveredAt: Date;

  constructor(deliveredAt: Date) {
    super();
    this.deliveredAt = deliveredAt;
  }
  
  canCancel(): boolean { return false; }
  canRefund(): boolean { return true; }
  statusMessage(): string { return `订单已送达，签收时间: ${this.deliveredAt.toLocaleDateString()}`; }
}

class CancelledOrder extends OrderStatus {
  private reason: string;

  constructor(reason: string) {
    super();
    this.reason = reason;
  }
  
  canCancel(): boolean { return false; }
  canRefund(): boolean { return false; }
  statusMessage(): string { return `订单已取消，原因: ${this.reason}`; }
}

const orderOOP1 = new PendingOrder();
const orderOOP2 = new ShippedOrder('SF1234567890');
const orderOOP3 = new DeliveredOrder(new Date());

console.log('待处理:', orderOOP1.statusMessage(), '| 可取消:', orderOOP1.canCancel());
console.log('已发货:', orderOOP2.statusMessage(), '| 可退款:', orderOOP2.canRefund());
console.log('已送达:', orderOOP3.statusMessage(), '| 可取消:', orderOOP3.canCancel());
console.log();

console.log('--- FP 方法 (ADT) ---\n');

// FP: 订单状态作为和类型
type OrderStatusADT = 
  | { status: 'pending' }
  | { status: 'shipped'; trackingNumber: string }
  | { status: 'delivered'; deliveredAt: Date }
  | { status: 'cancelled'; reason: string };

function canCancel(orderStatus: OrderStatusADT): boolean {
  switch (orderStatus.status) {
    case 'pending':
      return true;
    case 'shipped':
    case 'delivered':
    case 'cancelled':
      return false;
  }
}

function canRefund(orderStatus: OrderStatusADT): boolean {
  switch (orderStatus.status) {
    case 'pending':
    case 'cancelled':
      return false;
    case 'shipped':
    case 'delivered':
      return true;
  }
}

function statusMessage(orderStatus: OrderStatusADT): string {
  switch (orderStatus.status) {
    case 'pending':
      return '订单待处理';
    case 'shipped':
      return `订单已发货，物流单号: ${orderStatus.trackingNumber}`;
    case 'delivered':
      return `订单已送达，签收时间: ${orderStatus.deliveredAt.toLocaleDateString()}`;
    case 'cancelled':
      return `订单已取消，原因: ${orderStatus.reason}`;
  }
}

const orderADT1: OrderStatusADT = { status: 'pending' };
const orderADT2: OrderStatusADT = { status: 'shipped', trackingNumber: 'SF1234567890' };
const orderADT3: OrderStatusADT = { status: 'delivered', deliveredAt: new Date() };

console.log('待处理:', statusMessage(orderADT1), '| 可取消:', canCancel(orderADT1));
console.log('已发货:', statusMessage(orderADT2), '| 可退款:', canRefund(orderADT2));
console.log('已送达:', statusMessage(orderADT3), '| 可取消:', canCancel(orderADT3));
console.log();

// ============================================================================
// 4. 不可能状态的表示
// ============================================================================

console.log('4. 不可能状态的表示\n');

console.log('--- OOP: 容易产生非法状态 ---\n');

// ❌ OOP: 使用可选字段，可能产生非法状态
class Order {
  public orderId: string;
  public status: 'pending' | 'shipped' | 'delivered';
  public trackingNumber?: string;  // 只在 shipped/delivered 时有值
  public deliveredAt?: Date;         // 只在 delivered 时有值

  constructor(
    orderId: string,
    status: 'pending' | 'shipped' | 'delivered',
    trackingNumber?: string,
    deliveredAt?: Date
  ) {
    this.orderId = orderId;
    this.status = status;
    this.trackingNumber = trackingNumber;
    this.deliveredAt = deliveredAt;
  }
}

// 问题: 可以创建非法状态
const invalidOrder = new Order('ORD-001', 'pending', 'SF123');  // pending 状态不应有物流单号!

console.log('非法订单 (pending 却有物流单号):', invalidOrder);
console.log();

console.log('--- FP: 类型系统保证状态合法 ---\n');

// ✅ FP: 使用 ADT，类型系统保证状态合法
type Order2 = 
  | { orderId: string; status: 'pending' }
  | { orderId: string; status: 'shipped'; trackingNumber: string }
  | { orderId: string; status: 'delivered'; trackingNumber: string; deliveredAt: Date };

// 无法创建非法状态! TypeScript 会报错:
// const invalidOrder2: Order2 = { orderId: 'ORD-001', status: 'pending', trackingNumber: 'SF123' };

const validOrder: Order2 = { orderId: 'ORD-001', status: 'pending' };
console.log('合法订单:', validOrder);
console.log('FP 方法通过类型系统防止非法状态');
console.log();

// ============================================================================
// 5. 实战: 用户权限系统
// ============================================================================

console.log('5. 实战: 用户权限系统\n');

console.log('--- OOP 方法 ---\n');

// OOP: 使用继承表示不同权限级别
abstract class User {
  protected name: string;
  protected email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
  
  abstract getPermissions(): string[];
  abstract canAccessAdmin(): boolean;
}

class GuestUser extends User {
  getPermissions(): string[] {
    return ['read'];
  }
  
  canAccessAdmin(): boolean {
    return false;
  }
}

class RegisteredUser extends User {
  getPermissions(): string[] {
    return ['read', 'write', 'comment'];
  }
  
  canAccessAdmin(): boolean {
    return false;
  }
}

class AdminUser extends User {
  private adminLevel: number;

  constructor(name: string, email: string, adminLevel: number) {
    super(name, email);
    this.adminLevel = adminLevel;
  }
  
  getPermissions(): string[] {
    return ['read', 'write', 'comment', 'delete', 'manage_users'];
  }
  
  canAccessAdmin(): boolean {
    return true;
  }
  
  getAdminLevel(): number {
    return this.adminLevel;
  }
}

const guest = new GuestUser('访客', 'guest@example.com');
const registered = new RegisteredUser('张三', 'zhangsan@example.com');
const admin = new AdminUser('管理员', 'admin@example.com', 5);

console.log('访客权限:', guest.getPermissions());
console.log('注册用户权限:', registered.getPermissions());
console.log('管理员权限:', admin.getPermissions(), '| 级别:', admin.getAdminLevel());
console.log();

console.log('--- FP 方法 (ADT) ---\n');

// FP: 使用和类型表示不同权限级别
type UserADT = 
  | { type: 'guest'; name: string }
  | { type: 'registered'; name: string; email: string }
  | { type: 'admin'; name: string; email: string; adminLevel: number };

function getPermissions(user: UserADT): string[] {
  switch (user.type) {
    case 'guest':
      return ['read'];
    case 'registered':
      return ['read', 'write', 'comment'];
    case 'admin':
      return ['read', 'write', 'comment', 'delete', 'manage_users'];
  }
}

function canAccessAdmin(user: UserADT): boolean {
  return user.type === 'admin';
}

const guestADT: UserADT = { type: 'guest', name: '访客' };
const registeredADT: UserADT = { type: 'registered', name: '张三', email: 'zhangsan@example.com' };
const adminADT: UserADT = { type: 'admin', name: '管理员', email: 'admin@example.com', adminLevel: 5 };

console.log('访客权限:', getPermissions(guestADT));
console.log('注册用户权限:', getPermissions(registeredADT));
console.log('管理员权限:', getPermissions(adminADT), '| 级别:', adminADT.adminLevel);
console.log();

// ============================================================================
// 6. 组合 vs 继承
// ============================================================================

console.log('6. 组合 vs 继承\n');

console.log('--- OOP: 继承层次结构 ---\n');

// OOP: 深层继承可能导致脆弱基类问题
class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }
  
  makeSound(): string {
    return '某种声音';
  }
}

class Dog extends Animal {
  makeSound(): string {
    return '汪汪';
  }
  
  fetch(): string {
    return `${this.name} 正在捡球`;
  }
}

class Cat extends Animal {
  makeSound(): string {
    return '喵喵';
  }
  
  scratch(): string {
    return `${this.name} 正在抓挠`;
  }
}

const dog = new Dog('旺财');
const cat = new Cat('咪咪');

console.log(dog.makeSound(), '|', dog.fetch());
console.log(cat.makeSound(), '|', cat.scratch());
console.log();

console.log('--- FP: 组合函数 ---\n');

// FP: 使用组合而非继承
type AnimalADT = 
  | { species: 'dog'; name: string }
  | { species: 'cat'; name: string };

function makeSound(animal: AnimalADT): string {
  switch (animal.species) {
    case 'dog':
      return '汪汪';
    case 'cat':
      return '喵喵';
  }
}

function doAction(animal: AnimalADT): string {
  switch (animal.species) {
    case 'dog':
      return `${animal.name} 正在捡球`;
    case 'cat':
      return `${animal.name} 正在抓挠`;
  }
}

const dogADT: AnimalADT = { species: 'dog', name: '旺财' };
const catADT: AnimalADT = { species: 'cat', name: '咪咪' };

console.log(makeSound(dogADT), '|', doAction(dogADT));
console.log(makeSound(catADT), '|', doAction(catADT));
console.log();

// ============================================================================
// 7. 总结: OOP vs FP 的权衡
// ============================================================================

console.log('7. 总结: OOP vs FP 的权衡\n');

console.log('OOP (面向对象) 的优势:');
console.log('  ✅ 添加新类型容易 (只需创建新类)');
console.log('  ✅ 封装数据和行为在一起');
console.log('  ✅ 多态性通过继承自然实现');
console.log('  ❌ 添加新操作困难 (需要修改所有类)');
console.log('  ❌ 容易产生深层继承结构');
console.log('  ❌ 可能出现非法状态 (可选字段)');
console.log();

console.log('FP (函数式/ADT) 的优势:');
console.log('  ✅ 添加新操作容易 (只需添加新函数)');
console.log('  ✅ 类型系统保证状态合法');
console.log('  ✅ 模式匹配确保穷尽性');
console.log('  ✅ 数据和行为分离，易于测试');
console.log('  ❌ 添加新类型需要修改所有函数');
console.log('  ❌ 对于复杂的状态管理可能不直观');
console.log();

console.log('选择建议:');
console.log('  • 如果需要频繁添加新类型: 考虑 OOP');
console.log('  • 如果需要频繁添加新操作: 考虑 FP/ADT');
console.log('  • 如果状态机和流程控制复杂: 考虑 FP/ADT');
console.log('  • 如果需要严格的类型安全: 考虑 FP/ADT');
console.log('  • 实际项目中可以混合使用两种方法');

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用
export type {
  ShapeOOP,
  ShapeADT,
  ShapeADT2,
  OrderStatus,
  OrderStatusADT,
  Order,
  Order2,
  User,
  UserADT,
  Animal,
  AnimalADT
};

export {
  CircleOOP,
  RectangleOOP,
  TriangleOOP,
  area,
  perimeter,
  describe,
  area2,
  perimeter2,
  draw,
  PendingOrder,
  ShippedOrder,
  DeliveredOrder,
  CancelledOrder,
  canCancel,
  canRefund,
  statusMessage,
  GuestUser,
  RegisteredUser,
  AdminUser,
  getPermissions,
  canAccessAdmin,
  Dog,
  Cat,
  makeSound,
  doAction
};
