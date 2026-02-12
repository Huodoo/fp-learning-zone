/**
 * 第四章第二节: 和类型 (Sum Types)
 * 
 * 和类型表示"多选一"的类型，也称为联合类型 (Union Types)
 * 在 TypeScript 中通过 discriminated unions (可辨识联合) 实现
 * 类型代数中，和类型的可能值数量是各分支类型可能值的和
 */

console.log('=== 和类型 (Sum Types) ===\n');

// ============================================================================
// 1. 基础概念: 什么是和类型?
// ============================================================================

console.log('1. 基础概念: 什么是和类型?\n');

// ✅ 最简单的和类型: 字面量联合
type Direction = 'north' | 'south' | 'east' | 'west';  // 4 个可能值

const d1: Direction = 'north';
const d2: Direction = 'east';

console.log('方向1:', d1);
console.log('方向2:', d2);

// ✅ 布尔类型本质上是和类型
type Bool = true | false;  // 1 + 1 = 2 个值

// ✅ 可选类型 (Optional) 是和类型
type Optional<T> = T | null;  // T 的值数量 + 1

const num1: Optional<number> = 42;
const num2: Optional<number> = null;

console.log('可选数字1:', num1);
console.log('可选数字2:', num2);
console.log();

// ============================================================================
// 2. 类型代数: 和类型的可能值数量
// ============================================================================

console.log('2. 类型代数: 和类型的可能值数量\n');

// 交通信号灯
type TrafficLight = 'red' | 'yellow' | 'green';  // 3 个值

// 布尔类型
type Boolean = true | false;  // 2 个值

// 和类型的可能值 = 各分支可能值的和
type LightOrBool = TrafficLight | Boolean;  // 3 + 2 = 5 个值

// 列举所有可能值
const allLightOrBool: LightOrBool[] = ['red', 'yellow', 'green', true, false];

console.log('TrafficLight | Boolean 的所有可能值 (5个):');
allLightOrBool.forEach(value => {
  console.log(`  ${value}`);
});
console.log();

// ============================================================================
// 3. 可辨识联合 (Discriminated Unions)
// ============================================================================

console.log('3. 可辨识联合 (Discriminated Unions)\n');

// ✅ 使用 tag/kind 字段作为判别器
interface Circle {
  readonly kind: 'circle';
  readonly radius: number;
}

interface Rectangle {
  readonly kind: 'rectangle';
  readonly width: number;
  readonly height: number;
}

interface Triangle {
  readonly kind: 'triangle';
  readonly base: number;
  readonly height: number;
}

// 和类型: Shape 可以是 Circle、Rectangle 或 Triangle 之一
type Shape = Circle | Rectangle | Triangle;

// 基于 kind 字段进行模式匹配
function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
  }
}

const circle: Circle = { kind: 'circle', radius: 5 };
const rectangle: Rectangle = { kind: 'rectangle', width: 10, height: 20 };
const triangle: Triangle = { kind: 'triangle', base: 10, height: 15 };

console.log('圆形面积:', calculateArea(circle).toFixed(2));
console.log('矩形面积:', calculateArea(rectangle));
console.log('三角形面积:', calculateArea(triangle));
console.log();

// ============================================================================
// 4. 实战示例: HTTP 响应类型
// ============================================================================

console.log('4. 实战示例: HTTP 响应类型\n');

// 成功响应
interface Success<T> {
  readonly status: 'success';
  readonly data: T;
  readonly timestamp: number;
}

// 错误响应
interface Failure {
  readonly status: 'error';
  readonly error: string;
  readonly code: number;
}

// 加载中状态
interface Loading {
  readonly status: 'loading';
  readonly progress?: number;  // 可选的进度信息
}

// HTTP 响应是三种状态之一
type ApiResponse<T> = Success<T> | Failure | Loading;

// 处理 API 响应
function handleResponse<T>(response: ApiResponse<T>): string {
  switch (response.status) {
    case 'success':
      return `成功获取数据: ${JSON.stringify(response.data)}`;
    case 'error':
      return `错误 ${response.code}: ${response.error}`;
    case 'loading':
      const progress = response.progress ?? 0;
      return `加载中... ${progress}%`;
  }
}

const successResponse: ApiResponse<{ id: number; name: string }> = {
  status: 'success',
  data: { id: 1, name: '张三' },
  timestamp: Date.now()
};

const errorResponse: ApiResponse<never> = {
  status: 'error',
  error: '未找到资源',
  code: 404
};

const loadingResponse: ApiResponse<never> = {
  status: 'loading',
  progress: 65
};

console.log(handleResponse(successResponse));
console.log(handleResponse(errorResponse));
console.log(handleResponse(loadingResponse));
console.log();

// ============================================================================
// 5. 实战示例: 支付方式
// ============================================================================

console.log('5. 实战示例: 支付方式\n');

// 信用卡支付
interface CreditCardPayment {
  readonly type: 'credit_card';
  readonly cardNumber: string;
  readonly expiryDate: string;
  readonly cvv: string;
}

// 支付宝支付
interface AlipayPayment {
  readonly type: 'alipay';
  readonly account: string;
}

// 微信支付
interface WechatPayment {
  readonly type: 'wechat';
  readonly openId: string;
}

// 银行转账
interface BankTransferPayment {
  readonly type: 'bank_transfer';
  readonly bankName: string;
  readonly accountNumber: string;
}

// 支付方式是以上四种之一
type PaymentMethod = 
  | CreditCardPayment 
  | AlipayPayment 
  | WechatPayment 
  | BankTransferPayment;

// 处理支付
function processPayment(payment: PaymentMethod, amount: number): string {
  switch (payment.type) {
    case 'credit_card':
      return `信用卡支付 ${amount} 元，卡号: ${maskCardNumber(payment.cardNumber)}`;
    case 'alipay':
      return `支付宝支付 ${amount} 元，账号: ${payment.account}`;
    case 'wechat':
      return `微信支付 ${amount} 元，OpenID: ${payment.openId}`;
    case 'bank_transfer':
      return `银行转账 ${amount} 元，银行: ${payment.bankName}`;
  }
}

// 辅助函数: 隐藏卡号中间部分
function maskCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return `****-****-****-${last4}`;
}

const payment1: PaymentMethod = {
  type: 'credit_card',
  cardNumber: '1234567812345678',
  expiryDate: '12/25',
  cvv: '123'
};

const payment2: PaymentMethod = {
  type: 'alipay',
  account: 'zhangsan@example.com'
};

console.log(processPayment(payment1, 999.99));
console.log(processPayment(payment2, 1500));
console.log();

// ============================================================================
// 6. 递归的和类型: 树结构
// ============================================================================

console.log('6. 递归的和类型: 树结构\n');

// 叶子节点
interface Leaf {
  readonly type: 'leaf';
  readonly value: number;
}

// 分支节点
interface Branch {
  readonly type: 'branch';
  readonly left: Tree;
  readonly right: Tree;
}

// 树是叶子或分支之一 (递归定义)
type Tree = Leaf | Branch;

// 创建树的辅助函数
function leaf(value: number): Leaf {
  return { type: 'leaf', value };
}

function branch(left: Tree, right: Tree): Branch {
  return { type: 'branch', left, right };
}

// 计算树的所有叶子值之和
function sumTree(tree: Tree): number {
  switch (tree.type) {
    case 'leaf':
      return tree.value;
    case 'branch':
      return sumTree(tree.left) + sumTree(tree.right);
  }
}

// 计算树的深度
function treeDepth(tree: Tree): number {
  switch (tree.type) {
    case 'leaf':
      return 1;
    case 'branch':
      return 1 + Math.max(treeDepth(tree.left), treeDepth(tree.right));
  }
}

// 示例树:       +
//             /   \
//            +     7
//           / \
//          3   5
const exampleTree: Tree = branch(
  branch(leaf(3), leaf(5)),
  leaf(7)
);

console.log('树的结构:', JSON.stringify(exampleTree, null, 2));
console.log('树的总和:', sumTree(exampleTree));
console.log('树的深度:', treeDepth(exampleTree));
console.log();

// ============================================================================
// 7. 实战示例: 用户认证状态
// ============================================================================

console.log('7. 实战示例: 用户认证状态\n');

// 未登录
interface NotAuthenticated {
  readonly state: 'not_authenticated';
}

// 登录中
interface Authenticating {
  readonly state: 'authenticating';
  readonly provider: 'email' | 'google' | 'github';
}

// 已登录
interface Authenticated {
  readonly state: 'authenticated';
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
  readonly token: string;
}

// 认证失败
interface AuthenticationFailed {
  readonly state: 'authentication_failed';
  readonly error: string;
  readonly retryCount: number;
}

// 认证状态是以上四种之一
type AuthState = 
  | NotAuthenticated 
  | Authenticating 
  | Authenticated 
  | AuthenticationFailed;

// 根据认证状态渲染 UI
function renderAuthUI(authState: AuthState): string {
  switch (authState.state) {
    case 'not_authenticated':
      return '请登录';
    case 'authenticating':
      return `正在通过 ${authState.provider} 登录...`;
    case 'authenticated':
      return `欢迎, ${authState.user.name}!`;
    case 'authentication_failed':
      return `登录失败: ${authState.error} (重试次数: ${authState.retryCount})`;
  }
}

const authStates: AuthState[] = [
  { state: 'not_authenticated' },
  { state: 'authenticating', provider: 'google' },
  { 
    state: 'authenticated', 
    user: { id: '123', name: '张三', email: 'zhangsan@example.com' },
    token: 'abc123xyz'
  },
  { 
    state: 'authentication_failed', 
    error: '密码错误', 
    retryCount: 2 
  }
];

authStates.forEach((state, index) => {
  console.log(`状态 ${index + 1}:`, renderAuthUI(state));
});
console.log();

// ============================================================================
// 8. 和类型 vs 可选字段
// ============================================================================

console.log('8. 和类型 vs 可选字段\n');

// ❌ 不好的设计: 使用可选字段
interface BadShape {
  readonly kind: 'circle' | 'rectangle';
  readonly radius?: number;  // 只有 circle 需要
  readonly width?: number;   // 只有 rectangle 需要
  readonly height?: number;  // 只有 rectangle 需要
}

// 问题: 无法保证类型安全
function badCalculateArea(shape: BadShape): number {
  if (shape.kind === 'circle') {
    // TypeScript 不知道 radius 一定存在
    return Math.PI * (shape.radius ?? 0) ** 2;
  } else {
    // 需要手动检查 width 和 height
    return (shape.width ?? 0) * (shape.height ?? 0);
  }
}

// ✅ 好的设计: 使用和类型 (前面已定义的 Shape)
// 每个分支都有明确的字段，TypeScript 可以保证类型安全

console.log('使用和类型可以获得更好的类型安全性');
console.log('编译器可以确保每个分支都有正确的字段');
console.log();

// ============================================================================
// 9. 实战示例: 表单字段类型
// ============================================================================

console.log('9. 实战示例: 表单字段类型\n');

// 文本输入框
interface TextField {
  readonly fieldType: 'text';
  readonly name: string;
  readonly label: string;
  readonly placeholder: string;
  readonly maxLength?: number;
}

// 数字输入框
interface NumberField {
  readonly fieldType: 'number';
  readonly name: string;
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

// 选择框
interface SelectField {
  readonly fieldType: 'select';
  readonly name: string;
  readonly label: string;
  readonly options: readonly { value: string; label: string }[];
}

// 复选框
interface CheckboxField {
  readonly fieldType: 'checkbox';
  readonly name: string;
  readonly label: string;
  readonly checked: boolean;
}

// 日期选择器
interface DateField {
  readonly fieldType: 'date';
  readonly name: string;
  readonly label: string;
  readonly minDate?: string;
  readonly maxDate?: string;
}

// 表单字段是以上五种之一
type FormField = TextField | NumberField | SelectField | CheckboxField | DateField;

// 渲染表单字段
function renderField(field: FormField): string {
  switch (field.fieldType) {
    case 'text':
      return `<input type="text" name="${field.name}" placeholder="${field.placeholder}" maxlength="${field.maxLength ?? ''}" />`;
    case 'number':
      return `<input type="number" name="${field.name}" min="${field.min ?? ''}" max="${field.max ?? ''}" />`;
    case 'select':
      const options = field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
      return `<select name="${field.name}">${options}</select>`;
    case 'checkbox':
      return `<input type="checkbox" name="${field.name}" ${field.checked ? 'checked' : ''} />`;
    case 'date':
      return `<input type="date" name="${field.name}" min="${field.minDate ?? ''}" max="${field.maxDate ?? ''}" />`;
  }
}

const formFields: FormField[] = [
  { fieldType: 'text', name: 'username', label: '用户名', placeholder: '请输入用户名', maxLength: 20 },
  { fieldType: 'number', name: 'age', label: '年龄', min: 18, max: 100 },
  { fieldType: 'select', name: 'city', label: '城市', options: [
    { value: 'beijing', label: '北京' },
    { value: 'shanghai', label: '上海' }
  ]},
  { fieldType: 'checkbox', name: 'agree', label: '同意条款', checked: false },
  { fieldType: 'date', name: 'birthdate', label: '出生日期', maxDate: '2006-01-01' }
];

console.log('表单字段渲染:');
formFields.forEach(field => {
  console.log(`  ${field.label}:`, renderField(field));
});
console.log();

// ============================================================================
// 10. 和类型的组合
// ============================================================================

console.log('10. 和类型的组合\n');

// 成功或失败
type Result<T, E> = 
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

// 辅助函数
function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// 示例: 安全的除法
function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('除数不能为零');
  }
  return ok(a / b);
}

// 示例: 解析整数
function parseInt(s: string): Result<number, string> {
  const num = Number(s);
  if (isNaN(num)) {
    return err(`无法解析为数字: ${s}`);
  }
  return ok(num);
}

// 使用 Result
const division1 = safeDivide(10, 2);
const division2 = safeDivide(10, 0);

console.log('10 / 2 =', division1.ok ? division1.value : `错误: ${division1.error}`);
console.log('10 / 0 =', division2.ok ? division2.value : `错误: ${division2.error}`);

const parse1 = parseInt('42');
const parse2 = parseInt('abc');

console.log("parseInt('42') =", parse1.ok ? parse1.value : `错误: ${parse1.error}`);
console.log("parseInt('abc') =", parse2.ok ? parse2.value : `错误: ${parse2.error}`);

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用
export type {
  Direction,
  Shape,
  Circle,
  Rectangle,
  Triangle,
  ApiResponse,
  Success,
  Failure,
  Loading,
  PaymentMethod,
  Tree,
  Leaf,
  Branch,
  AuthState,
  FormField,
  Result
};

export {
  calculateArea,
  handleResponse,
  processPayment,
  leaf,
  branch,
  sumTree,
  treeDepth,
  renderAuthUI,
  renderField,
  ok,
  err,
  safeDivide,
  parseInt
};
