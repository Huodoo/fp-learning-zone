/**
 * 第四章第三节: 模式匹配 (Pattern Matching)
 * 
 * 模式匹配是处理和类型（代数数据类型）的核心技术
 * TypeScript 通过 switch、类型窄化和穷尽性检查支持模式匹配
 */

console.log('=== 模式匹配 (Pattern Matching) ===\n');

// ============================================================================
// 1. 基础模式匹配: switch 语句
// ============================================================================

console.log('1. 基础模式匹配: switch 语句\n');

// 定义一个简单的和类型
type Status = 'pending' | 'processing' | 'completed' | 'failed';

// 使用 switch 进行模式匹配
function getStatusMessage(status: Status): string {
  switch (status) {
    case 'pending':
      return '等待处理';
    case 'processing':
      return '正在处理';
    case 'completed':
      return '已完成';
    case 'failed':
      return '处理失败';
  }
}

console.log('pending:', getStatusMessage('pending'));
console.log('completed:', getStatusMessage('completed'));
console.log();

// ============================================================================
// 2. 穷尽性检查 (Exhaustiveness Checking)
// ============================================================================

console.log('2. 穷尽性检查 (Exhaustiveness Checking)\n');

// TypeScript 可以检查我们是否处理了所有情况

// ✅ 完整的模式匹配
type Color = 'red' | 'green' | 'blue';

function colorToHex(color: Color): string {
  switch (color) {
    case 'red':
      return '#FF0000';
    case 'green':
      return '#00FF00';
    case 'blue':
      return '#0000FF';
  }
  // TypeScript 知道所有情况都已处理，不需要 default
}

console.log('red:', colorToHex('red'));

// ✅ 使用 never 类型确保穷尽性
function assertNever(value: never): never {
  throw new Error(`未处理的情况: ${value}`);
}

type Shape = 
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rectangle'; width: number; height: number };

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    default:
      // 如果忘记处理某个分支，这里会报编译错误
      return assertNever(shape);
  }
}

const circle = { kind: 'circle' as const, radius: 5 };
const square = { kind: 'square' as const, size: 10 };

console.log('圆形面积:', calculateArea(circle).toFixed(2));
console.log('正方形面积:', calculateArea(square));
console.log();

// ============================================================================
// 3. 嵌套模式匹配
// ============================================================================

console.log('3. 嵌套模式匹配\n');

// 定义嵌套的和类型
type PaymentStatus = 
  | { status: 'pending'; reason: 'awaiting_approval' | 'processing' }
  | { status: 'completed'; transactionId: string; completedAt: Date }
  | { status: 'failed'; errorCode: number; errorMessage: string };

function describePaymentStatus(payment: PaymentStatus): string {
  switch (payment.status) {
    case 'pending':
      // 嵌套的模式匹配
      switch (payment.reason) {
        case 'awaiting_approval':
          return '等待审批';
        case 'processing':
          return '支付处理中';
      }
      break;
    case 'completed':
      return `支付完成 (交易ID: ${payment.transactionId})`;
    case 'failed':
      return `支付失败 (错误码 ${payment.errorCode}: ${payment.errorMessage})`;
  }
}

const pendingPayment: PaymentStatus = { status: 'pending', reason: 'awaiting_approval' };
const completedPayment: PaymentStatus = { 
  status: 'completed', 
  transactionId: 'TXN-123456',
  completedAt: new Date()
};

console.log(describePaymentStatus(pendingPayment));
console.log(describePaymentStatus(completedPayment));
console.log();

// ============================================================================
// 4. 实战: Option 类型的模式匹配
// ============================================================================

console.log('4. 实战: Option 类型的模式匹配\n');

// Option 类型: 表示可能存在或不存在的值
type Option<T> = 
  | { readonly tag: 'some'; readonly value: T }
  | { readonly tag: 'none' };

// 构造函数
function some<T>(value: T): Option<T> {
  return { tag: 'some', value };
}

function none<T>(): Option<T> {
  return { tag: 'none' };
}

// 模式匹配函数: match
function match<T, R>(
  option: Option<T>,
  patterns: {
    some: (value: T) => R;
    none: () => R;
  }
): R {
  switch (option.tag) {
    case 'some':
      return patterns.some(option.value);
    case 'none':
      return patterns.none();
  }
}

// 示例: 查找用户
interface User {
  id: number;
  name: string;
}

function findUser(id: number): Option<User> {
  // 模拟数据库查询
  const users: User[] = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
  ];
  
  const user = users.find(u => u.id === id);
  return user ? some(user) : none();
}

const user1 = findUser(1);
const user2 = findUser(999);

const message1 = match(user1, {
  some: (user) => `找到用户: ${user.name}`,
  none: () => '用户不存在'
});

const message2 = match(user2, {
  some: (user) => `找到用户: ${user.name}`,
  none: () => '用户不存在'
});

console.log('查找用户 ID 1:', message1);
console.log('查找用户 ID 999:', message2);
console.log();

// ============================================================================
// 5. 实战: Either 类型的模式匹配
// ============================================================================

console.log('5. 实战: Either 类型的模式匹配\n');

// Either 类型: 表示两种可能的值（通常用于错误处理）
type Either<L, R> = 
  | { readonly tag: 'left'; readonly value: L }
  | { readonly tag: 'right'; readonly value: R };

// 构造函数
function left<L, R>(value: L): Either<L, R> {
  return { tag: 'left', value };
}

function right<L, R>(value: R): Either<L, R> {
  return { tag: 'right', value };
}

// 模式匹配函数
function matchEither<L, R, T>(
  either: Either<L, R>,
  patterns: {
    left: (value: L) => T;
    right: (value: R) => T;
  }
): T {
  switch (either.tag) {
    case 'left':
      return patterns.left(either.value);
    case 'right':
      return patterns.right(either.value);
  }
}

// 示例: 验证年龄
type ValidationError = string;

function validateAge(age: number): Either<ValidationError, number> {
  if (age < 0) {
    return left('年龄不能为负数');
  }
  if (age > 150) {
    return left('年龄不能超过150岁');
  }
  return right(age);
}

const age1 = validateAge(25);
const age2 = validateAge(-5);
const age3 = validateAge(200);

[age1, age2, age3].forEach((result, index) => {
  const message = matchEither(result, {
    left: (error) => `❌ 验证失败: ${error}`,
    right: (age) => `✅ 验证成功: ${age} 岁`
  });
  console.log(`年龄${index + 1}:`, message);
});
console.log();

// ============================================================================
// 6. 复杂的嵌套模式匹配
// ============================================================================

console.log('6. 复杂的嵌套模式匹配\n');

// 定义表达式类型（简单的计算器）
type Expr = 
  | { type: 'number'; value: number }
  | { type: 'add'; left: Expr; right: Expr }
  | { type: 'multiply'; left: Expr; right: Expr }
  | { type: 'negate'; expr: Expr };

// 求值函数（递归模式匹配）
function evaluate(expr: Expr): number {
  switch (expr.type) {
    case 'number':
      return expr.value;
    case 'add':
      return evaluate(expr.left) + evaluate(expr.right);
    case 'multiply':
      return evaluate(expr.left) * evaluate(expr.right);
    case 'negate':
      return -evaluate(expr.expr);
  }
}

// 将表达式转为字符串（递归模式匹配）
function exprToString(expr: Expr): string {
  switch (expr.type) {
    case 'number':
      return String(expr.value);
    case 'add':
      return `(${exprToString(expr.left)} + ${exprToString(expr.right)})`;
    case 'multiply':
      return `(${exprToString(expr.left)} * ${exprToString(expr.right)})`;
    case 'negate':
      return `(-${exprToString(expr.expr)})`;
  }
}

// 构造表达式: (3 + 5) * (-2)
const expression: Expr = {
  type: 'multiply',
  left: {
    type: 'add',
    left: { type: 'number', value: 3 },
    right: { type: 'number', value: 5 }
  },
  right: {
    type: 'negate',
    expr: { type: 'number', value: 2 }
  }
};

console.log('表达式:', exprToString(expression));
console.log('结果:', evaluate(expression));
console.log();

// ============================================================================
// 7. 实战: JSON 类型的模式匹配
// ============================================================================

console.log('7. 实战: JSON 类型的模式匹配\n');

// 定义 JSON 值的类型
type JSONValue = 
  | { type: 'null' }
  | { type: 'boolean'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'array'; items: readonly JSONValue[] }
  | { type: 'object'; properties: Record<string, JSONValue> };

// 将 TypeScript 值转为 JSONValue
function toJSONValue(value: unknown): JSONValue {
  if (value === null) {
    return { type: 'null' };
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean', value };
  }
  if (typeof value === 'number') {
    return { type: 'number', value };
  }
  if (typeof value === 'string') {
    return { type: 'string', value };
  }
  if (Array.isArray(value)) {
    return { type: 'array', items: value.map(toJSONValue) };
  }
  if (typeof value === 'object') {
    const properties: Record<string, JSONValue> = {};
    for (const [key, val] of Object.entries(value as object)) {
      properties[key] = toJSONValue(val);
    }
    return { type: 'object', properties };
  }
  throw new Error(`无法转换为 JSON: ${value}`);
}

// 格式化 JSON (带缩进)
function formatJSON(json: JSONValue, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  
  switch (json.type) {
    case 'null':
      return 'null';
    case 'boolean':
      return String(json.value);
    case 'number':
      return String(json.value);
    case 'string':
      return `"${json.value}"`;
    case 'array':
      if (json.items.length === 0) {
        return '[]';
      }
      const arrayItems = json.items.map(item => 
        spaces + '  ' + formatJSON(item, indent + 2)
      ).join(',\n');
      return `[\n${arrayItems}\n${spaces}]`;
    case 'object':
      const entries = Object.entries(json.properties);
      if (entries.length === 0) {
        return '{}';
      }
      const objectProps = entries.map(([key, value]) => 
        `${spaces}  "${key}": ${formatJSON(value, indent + 2)}`
      ).join(',\n');
      return `{\n${objectProps}\n${spaces}}`;
  }
}

const sampleData = {
  name: '张三',
  age: 30,
  active: true,
  hobbies: ['读书', '编程', '旅行'],
  address: {
    city: '北京',
    street: '中关村大街'
  }
};

const jsonValue = toJSONValue(sampleData);
console.log('格式化的 JSON:');
console.log(formatJSON(jsonValue));
console.log();

// ============================================================================
// 8. 实战: 状态机的模式匹配
// ============================================================================

console.log('8. 实战: 状态机的模式匹配\n');

// 定义状态和事件
type State = 
  | { state: 'idle' }
  | { state: 'loading'; progress: number }
  | { state: 'success'; data: string }
  | { state: 'error'; message: string };

type Event = 
  | { type: 'fetch' }
  | { type: 'progress'; percent: number }
  | { type: 'complete'; data: string }
  | { type: 'fail'; message: string }
  | { type: 'reset' };

// 状态转换函数
function transition(state: State, event: Event): State {
  // 根据当前状态和事件进行模式匹配
  switch (state.state) {
    case 'idle':
      switch (event.type) {
        case 'fetch':
          return { state: 'loading', progress: 0 };
        default:
          return state;  // 忽略其他事件
      }
    
    case 'loading':
      switch (event.type) {
        case 'progress':
          return { state: 'loading', progress: event.percent };
        case 'complete':
          return { state: 'success', data: event.data };
        case 'fail':
          return { state: 'error', message: event.message };
        case 'reset':
          return { state: 'idle' };
        default:
          return state;
      }
    
    case 'success':
      switch (event.type) {
        case 'reset':
          return { state: 'idle' };
        default:
          return state;
      }
    
    case 'error':
      switch (event.type) {
        case 'reset':
          return { state: 'idle' };
        case 'fetch':
          return { state: 'loading', progress: 0 };
        default:
          return state;
      }
  }
}

// 模拟状态机运行
let currentState: State = { state: 'idle' };

function processEvent(event: Event): void {
  const oldState = currentState;
  currentState = transition(currentState, event);
  console.log(`事件: ${event.type}, 状态: ${oldState.state} → ${currentState.state}`);
}

processEvent({ type: 'fetch' });
processEvent({ type: 'progress', percent: 50 });
processEvent({ type: 'progress', percent: 100 });
processEvent({ type: 'complete', data: '数据加载完成' });
processEvent({ type: 'reset' });
console.log();

// ============================================================================
// 9. 高阶模式匹配: fold 函数
// ============================================================================

console.log('9. 高阶模式匹配: fold 函数\n');

// fold 是一种通用的模式匹配函数
// 它将和类型"折叠"为一个值

type List<T> = 
  | { type: 'empty' }
  | { type: 'cons'; head: T; tail: List<T> };

// 辅助函数
function empty<T>(): List<T> {
  return { type: 'empty' };
}

function cons<T>(head: T, tail: List<T>): List<T> {
  return { type: 'cons', head, tail };
}

// fold 函数 (也叫 catamorphism)
function foldList<T, R>(
  list: List<T>,
  patterns: {
    empty: () => R;
    cons: (head: T, tail: List<T>) => R;
  }
): R {
  switch (list.type) {
    case 'empty':
      return patterns.empty();
    case 'cons':
      return patterns.cons(list.head, list.tail);
  }
}

// 使用 fold 实现各种列表操作

// 长度
function listLength<T>(list: List<T>): number {
  return foldList(list, {
    empty: () => 0,
    cons: (_, tail) => 1 + listLength(tail)
  });
}

// 求和
function listSum(list: List<number>): number {
  return foldList(list, {
    empty: () => 0,
    cons: (head, tail) => head + listSum(tail)
  });
}

// 转为数组
function listToArray<T>(list: List<T>): T[] {
  return foldList(list, {
    empty: () => [],
    cons: (head, tail) => [head, ...listToArray(tail)]
  });
}

// 创建列表: [1, 2, 3, 4, 5]
const myList = cons(1, cons(2, cons(3, cons(4, cons(5, empty())))));

console.log('列表长度:', listLength(myList));
console.log('列表总和:', listSum(myList));
console.log('转为数组:', listToArray(myList));
console.log();

// ============================================================================
// 10. 实战: 路由匹配器
// ============================================================================

console.log('10. 实战: 路由匹配器\n');

// 定义路由类型
type Route = 
  | { path: 'home' }
  | { path: 'about' }
  | { path: 'user'; userId: string }
  | { path: 'post'; postId: string; commentId?: string }
  | { path: 'notFound' };

// 解析 URL 路径
function parseRoute(url: string): Route {
  const parts = url.split('/').filter(p => p.length > 0);
  
  if (parts.length === 0 || parts[0] === 'home') {
    return { path: 'home' };
  }
  
  if (parts[0] === 'about') {
    return { path: 'about' };
  }
  
  if (parts[0] === 'user' && parts.length >= 2) {
    return { path: 'user', userId: parts[1] };
  }
  
  if (parts[0] === 'post' && parts.length >= 2) {
    const commentId = parts.length >= 4 && parts[2] === 'comment' 
      ? parts[3] 
      : undefined;
    return { path: 'post', postId: parts[1], commentId };
  }
  
  return { path: 'notFound' };
}

// 渲染路由
function renderRoute(route: Route): string {
  switch (route.path) {
    case 'home':
      return '<首页>';
    case 'about':
      return '<关于我们>';
    case 'user':
      return `<用户页面: ${route.userId}>`;
    case 'post':
      if (route.commentId) {
        return `<文章 ${route.postId} 的评论 ${route.commentId}>`;
      }
      return `<文章页面: ${route.postId}>`;
    case 'notFound':
      return '<404 页面未找到>';
  }
}

// 测试路由
const testUrls = [
  '/',
  '/home',
  '/about',
  '/user/123',
  '/post/456',
  '/post/456/comment/789',
  '/unknown/path'
];

testUrls.forEach(url => {
  const route = parseRoute(url);
  console.log(`${url} →`, renderRoute(route));
});

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用
export type {
  Status,
  Color,
  Shape,
  PaymentStatus,
  Option,
  Either,
  Expr,
  JSONValue,
  State,
  Event,
  List,
  Route
};

export {
  getStatusMessage,
  colorToHex,
  calculateArea,
  assertNever,
  some,
  none,
  match,
  left,
  right,
  matchEither,
  validateAge,
  evaluate,
  exprToString,
  toJSONValue,
  formatJSON,
  transition,
  empty,
  cons,
  foldList,
  listLength,
  listSum,
  listToArray,
  parseRoute,
  renderRoute
};
