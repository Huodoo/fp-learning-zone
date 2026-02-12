/**
 * 第四章第五节: 练习题 - 代数数据类型
 * 
 * 通过实战练习巩固对 ADT、模式匹配和类型设计的理解
 */

console.log('=== 代数数据类型练习题 ===\n');

// ============================================================================
// 练习 1: 设计一个二叉搜索树 (Binary Search Tree)
// ============================================================================

console.log('练习 1: 二叉搜索树\n');

// 定义树的 ADT
type BST<T> = 
  | { type: 'empty' }
  | { type: 'node'; value: T; left: BST<T>; right: BST<T> };

// 创建空树
function empty<T>(): BST<T> {
  return { type: 'empty' };
}

// 创建节点
function node<T>(value: T, left: BST<T>, right: BST<T>): BST<T> {
  return { type: 'node', value, left, right };
}

// 插入元素
function insert<T>(tree: BST<T>, value: T, compare: (a: T, b: T) => number): BST<T> {
  switch (tree.type) {
    case 'empty':
      return node(value, empty(), empty());
    case 'node':
      const cmp = compare(value, tree.value);
      if (cmp < 0) {
        return node(tree.value, insert(tree.left, value, compare), tree.right);
      } else if (cmp > 0) {
        return node(tree.value, tree.left, insert(tree.right, value, compare));
      } else {
        return tree;  // 值已存在
      }
  }
}

// 查找元素
function contains<T>(tree: BST<T>, value: T, compare: (a: T, b: T) => number): boolean {
  switch (tree.type) {
    case 'empty':
      return false;
    case 'node':
      const cmp = compare(value, tree.value);
      if (cmp < 0) {
        return contains(tree.left, value, compare);
      } else if (cmp > 0) {
        return contains(tree.right, value, compare);
      } else {
        return true;
      }
  }
}

// 中序遍历 (得到有序数组)
function inorder<T>(tree: BST<T>): T[] {
  switch (tree.type) {
    case 'empty':
      return [];
    case 'node':
      return [...inorder(tree.left), tree.value, ...inorder(tree.right)];
  }
}

// 测试二叉搜索树
const compareNumber = (a: number, b: number) => a - b;
let bst = empty<number>();
const values = [5, 3, 7, 1, 9, 4, 6];

values.forEach(v => {
  bst = insert(bst, v, compareNumber);
});

console.log('插入的值:', values);
console.log('中序遍历:', inorder(bst));
console.log('包含 4?', contains(bst, 4, compareNumber));
console.log('包含 10?', contains(bst, 10, compareNumber));
console.log();

// ============================================================================
// 练习 2: 实现一个简单的表达式求值器
// ============================================================================

console.log('练习 2: 表达式求值器\n');

// 定义表达式类型
type Expr = 
  | { type: 'number'; value: number }
  | { type: 'add'; left: Expr; right: Expr }
  | { type: 'subtract'; left: Expr; right: Expr }
  | { type: 'multiply'; left: Expr; right: Expr }
  | { type: 'divide'; left: Expr; right: Expr }
  | { type: 'negate'; expr: Expr };

// 辅助构造函数
const num = (value: number): Expr => ({ type: 'number', value });
const add = (left: Expr, right: Expr): Expr => ({ type: 'add', left, right });
const subtract = (left: Expr, right: Expr): Expr => ({ type: 'subtract', left, right });
const multiply = (left: Expr, right: Expr): Expr => ({ type: 'multiply', left, right });
const divide = (left: Expr, right: Expr): Expr => ({ type: 'divide', left, right });
const negate = (expr: Expr): Expr => ({ type: 'negate', expr });

// 求值函数
function evaluate(expr: Expr): number {
  switch (expr.type) {
    case 'number':
      return expr.value;
    case 'add':
      return evaluate(expr.left) + evaluate(expr.right);
    case 'subtract':
      return evaluate(expr.left) - evaluate(expr.right);
    case 'multiply':
      return evaluate(expr.left) * evaluate(expr.right);
    case 'divide':
      const divisor = evaluate(expr.right);
      if (divisor === 0) {
        throw new Error('除数不能为零');
      }
      return evaluate(expr.left) / divisor;
    case 'negate':
      return -evaluate(expr.expr);
  }
}

// 转为字符串
function exprToString(expr: Expr): string {
  switch (expr.type) {
    case 'number':
      return String(expr.value);
    case 'add':
      return `(${exprToString(expr.left)} + ${exprToString(expr.right)})`;
    case 'subtract':
      return `(${exprToString(expr.left)} - ${exprToString(expr.right)})`;
    case 'multiply':
      return `(${exprToString(expr.left)} * ${exprToString(expr.right)})`;
    case 'divide':
      return `(${exprToString(expr.left)} / ${exprToString(expr.right)})`;
    case 'negate':
      return `(-${exprToString(expr.expr)})`;
  }
}

// 简化表达式
function simplify(expr: Expr): Expr {
  switch (expr.type) {
    case 'number':
      return expr;
    
    case 'add':
      const leftAdd = simplify(expr.left);
      const rightAdd = simplify(expr.right);
      // 0 + x = x, x + 0 = x
      if (leftAdd.type === 'number' && leftAdd.value === 0) return rightAdd;
      if (rightAdd.type === 'number' && rightAdd.value === 0) return leftAdd;
      // 常量折叠
      if (leftAdd.type === 'number' && rightAdd.type === 'number') {
        return num(leftAdd.value + rightAdd.value);
      }
      return add(leftAdd, rightAdd);
    
    case 'multiply':
      const leftMul = simplify(expr.left);
      const rightMul = simplify(expr.right);
      // 0 * x = 0, x * 0 = 0
      if (leftMul.type === 'number' && leftMul.value === 0) return num(0);
      if (rightMul.type === 'number' && rightMul.value === 0) return num(0);
      // 1 * x = x, x * 1 = x
      if (leftMul.type === 'number' && leftMul.value === 1) return rightMul;
      if (rightMul.type === 'number' && rightMul.value === 1) return leftMul;
      // 常量折叠
      if (leftMul.type === 'number' && rightMul.type === 'number') {
        return num(leftMul.value * rightMul.value);
      }
      return multiply(leftMul, rightMul);
    
    case 'negate':
      const inner = simplify(expr.expr);
      // 双重否定
      if (inner.type === 'negate') {
        return inner.expr;
      }
      // 常量折叠
      if (inner.type === 'number') {
        return num(-inner.value);
      }
      return negate(inner);
    
    default:
      return expr;
  }
}

// 测试表达式: (3 + 5) * 2 - 10 / 2
const expr1 = subtract(
  multiply(add(num(3), num(5)), num(2)),
  divide(num(10), num(2))
);

console.log('表达式:', exprToString(expr1));
console.log('结果:', evaluate(expr1));

// 测试简化: (0 + x) * 1 → x
const expr2 = multiply(add(num(0), num(42)), num(1));
console.log('简化前:', exprToString(expr2));
console.log('简化后:', exprToString(simplify(expr2)));
console.log();

// ============================================================================
// 练习 3: 实现一个链表 (Linked List)
// ============================================================================

console.log('练习 3: 链表\n');

// 定义链表 ADT
type List<T> = 
  | { type: 'nil' }
  | { type: 'cons'; head: T; tail: List<T> };

// 构造函数
const nil = <T>(): List<T> => ({ type: 'nil' });
const cons = <T>(head: T, tail: List<T>): List<T> => ({ type: 'cons', head, tail });

// 从数组创建链表
function fromArray<T>(arr: readonly T[]): List<T> {
  if (arr.length === 0) {
    return nil();
  }
  return cons(arr[0], fromArray(arr.slice(1)));
}

// 链表转数组
function toArray<T>(list: List<T>): T[] {
  switch (list.type) {
    case 'nil':
      return [];
    case 'cons':
      return [list.head, ...toArray(list.tail)];
  }
}

// 链表长度
function length<T>(list: List<T>): number {
  switch (list.type) {
    case 'nil':
      return 0;
    case 'cons':
      return 1 + length(list.tail);
  }
}

// 链表映射
function mapList<T, U>(list: List<T>, fn: (item: T) => U): List<U> {
  switch (list.type) {
    case 'nil':
      return nil();
    case 'cons':
      return cons(fn(list.head), mapList(list.tail, fn));
  }
}

// 链表过滤
function filterList<T>(list: List<T>, predicate: (item: T) => boolean): List<T> {
  switch (list.type) {
    case 'nil':
      return nil();
    case 'cons':
      const filteredTail = filterList(list.tail, predicate);
      return predicate(list.head) ? cons(list.head, filteredTail) : filteredTail;
  }
}

// 链表折叠
function foldList<T, R>(list: List<T>, initial: R, fn: (acc: R, item: T) => R): R {
  switch (list.type) {
    case 'nil':
      return initial;
    case 'cons':
      return foldList(list.tail, fn(initial, list.head), fn);
  }
}

// 链表反转
function reverseList<T>(list: List<T>): List<T> {
  function reverseHelper(lst: List<T>, acc: List<T>): List<T> {
    switch (lst.type) {
      case 'nil':
        return acc;
      case 'cons':
        return reverseHelper(lst.tail, cons(lst.head, acc));
    }
  }
  return reverseHelper(list, nil());
}

// 测试链表
const myList = fromArray([1, 2, 3, 4, 5]);
console.log('原始链表:', toArray(myList));
console.log('长度:', length(myList));
console.log('映射 (×2):', toArray(mapList(myList, x => x * 2)));
console.log('过滤 (偶数):', toArray(filterList(myList, x => x % 2 === 0)));
console.log('求和:', foldList(myList, 0, (acc, x) => acc + x));
console.log('反转:', toArray(reverseList(myList)));
console.log();

// ============================================================================
// 练习 4: 实现 Result 类型处理错误
// ============================================================================

console.log('练习 4: Result 类型\n');

// Result 类型
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// 构造函数
const ok = <T, E>(value: T): Result<T, E> => ({ ok: true, value });
const err = <T, E>(error: E): Result<T, E> => ({ ok: false, error });

// map: 转换成功值
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

// flatMap: 链式操作
function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

// mapError: 转换错误
function mapError<T, E1, E2>(result: Result<T, E1>, fn: (error: E1) => E2): Result<T, E2> {
  return result.ok ? result : err(fn(result.error));
}

// 获取值或默认值
function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

// 实战示例: 用户注册验证
interface ValidationError {
  field: string;
  message: string;
}

function validateUsername(username: string): Result<string, ValidationError> {
  if (username.length < 3) {
    return err({ field: 'username', message: '用户名至少3个字符' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return err({ field: 'username', message: '用户名只能包含字母、数字和下划线' });
  }
  return ok(username);
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err({ field: 'email', message: '邮箱格式不正确' });
  }
  return ok(email);
}

function validatePassword(password: string): Result<string, ValidationError> {
  if (password.length < 8) {
    return err({ field: 'password', message: '密码至少8个字符' });
  }
  return ok(password);
}

// 组合验证
function validateRegistration(
  username: string,
  email: string,
  password: string
): Result<{ username: string; email: string; password: string }, ValidationError> {
  const usernameResult = validateUsername(username);
  if (!usernameResult.ok) return usernameResult;
  
  const emailResult = validateEmail(email);
  if (!emailResult.ok) return emailResult;
  
  const passwordResult = validatePassword(password);
  if (!passwordResult.ok) return passwordResult;
  
  return ok({
    username: usernameResult.value,
    email: emailResult.value,
    password: passwordResult.value
  });
}

const validRegistration = validateRegistration('zhangsan123', 'zhangsan@example.com', 'securepass123');
const invalidRegistration = validateRegistration('ab', 'invalid', 'short');

console.log('有效注册:', validRegistration.ok ? '✅ 通过' : `❌ ${validRegistration.error.message}`);
console.log('无效注册:', invalidRegistration.ok ? '✅ 通过' : `❌ ${invalidRegistration.error.message}`);
console.log();

// ============================================================================
// 练习 5: 状态机 - 自动售货机
// ============================================================================

console.log('练习 5: 自动售货机状态机\n');

// 状态定义
type VendingMachineState = 
  | { state: 'idle'; balance: number }
  | { state: 'has_money'; balance: number; selectedItem?: string }
  | { state: 'dispensing'; item: string }
  | { state: 'out_of_stock' };

// 事件定义
type VendingMachineEvent = 
  | { type: 'insert_coin'; amount: number }
  | { type: 'select_item'; item: string; price: number }
  | { type: 'dispense_complete' }
  | { type: 'cancel' }
  | { type: 'refill' };

// 状态转换函数
function vendingMachineTransition(
  state: VendingMachineState,
  event: VendingMachineEvent
): VendingMachineState {
  switch (state.state) {
    case 'idle':
      switch (event.type) {
        case 'insert_coin':
          return { state: 'has_money', balance: event.amount };
        default:
          return state;
      }
    
    case 'has_money':
      switch (event.type) {
        case 'insert_coin':
          return { ...state, balance: state.balance + event.amount };
        case 'select_item':
          if (state.balance >= event.price) {
            return { state: 'dispensing', item: event.item };
          }
          return state;  // 余额不足，保持当前状态
        case 'cancel':
          console.log(`  退款: ${state.balance} 元`);
          return { state: 'idle', balance: 0 };
        default:
          return state;
      }
    
    case 'dispensing':
      switch (event.type) {
        case 'dispense_complete':
          return { state: 'idle', balance: 0 };
        default:
          return state;
      }
    
    case 'out_of_stock':
      switch (event.type) {
        case 'refill':
          return { state: 'idle', balance: 0 };
        default:
          return state;
      }
  }
}

// 模拟售货机操作
function describeState(state: VendingMachineState): string {
  switch (state.state) {
    case 'idle':
      return '待机中';
    case 'has_money':
      return `已投币 ${state.balance} 元${state.selectedItem ? `, 选择了 ${state.selectedItem}` : ''}`;
    case 'dispensing':
      return `正在出货: ${state.item}`;
    case 'out_of_stock':
      return '缺货';
  }
}

let vmState: VendingMachineState = { state: 'idle', balance: 0 };

console.log('初始状态:', describeState(vmState));

vmState = vendingMachineTransition(vmState, { type: 'insert_coin', amount: 5 });
console.log('投币 5 元:', describeState(vmState));

vmState = vendingMachineTransition(vmState, { type: 'insert_coin', amount: 3 });
console.log('投币 3 元:', describeState(vmState));

vmState = vendingMachineTransition(vmState, { type: 'select_item', item: '可乐', price: 6 });
console.log('选择可乐 (6元):', describeState(vmState));

vmState = vendingMachineTransition(vmState, { type: 'dispense_complete' });
console.log('出货完成:', describeState(vmState));
console.log();

// ============================================================================
// 练习 6: JSON Schema 验证器
// ============================================================================

console.log('练习 6: JSON Schema 验证器\n');

// JSON Schema 类型
type Schema = 
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'array'; items: Schema }
  | { type: 'object'; properties: Record<string, Schema> };

// 验证函数
function validate(value: unknown, schema: Schema): boolean {
  switch (schema.type) {
    case 'string':
      return typeof value === 'string';
    
    case 'number':
      return typeof value === 'number';
    
    case 'boolean':
      return typeof value === 'boolean';
    
    case 'array':
      if (!Array.isArray(value)) return false;
      return value.every(item => validate(item, schema.items));
    
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
      }
      const obj = value as Record<string, unknown>;
      return Object.entries(schema.properties).every(([key, propSchema]) => {
        return key in obj && validate(obj[key], propSchema);
      });
  }
}

// 定义 Schema
const userSchema: Schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    active: { type: 'boolean' },
    hobbies: { type: 'array', items: { type: 'string' } }
  }
};

// 测试数据
const validUser = {
  name: '张三',
  age: 30,
  active: true,
  hobbies: ['读书', '编程']
};

const invalidUser = {
  name: '李四',
  age: '25',  // 应该是 number
  active: true,
  hobbies: ['旅行']
};

console.log('验证有效用户:', validate(validUser, userSchema) ? '✅ 通过' : '❌ 失败');
console.log('验证无效用户:', validate(invalidUser, userSchema) ? '✅ 通过' : '❌ 失败');

console.log('\n=== 练习结束 ===');
console.log('\n恭喜! 你已经掌握了代数数据类型的核心概念:');
console.log('  ✅ 积类型 (Product Types) - 同时拥有多个值');
console.log('  ✅ 和类型 (Sum Types) - 多选一');
console.log('  ✅ 模式匹配 (Pattern Matching) - 处理和类型');
console.log('  ✅ 递归类型 (Recursive Types) - 树、链表等');
console.log('  ✅ 类型安全的状态机');
console.log('  ✅ 错误处理 (Result/Either)');

// 导出供其他模块使用
export type {
  BST,
  Expr,
  List,
  Result,
  ValidationError,
  VendingMachineState,
  VendingMachineEvent,
  Schema
};

export {
  empty,
  node,
  insert,
  contains,
  inorder,
  num,
  add,
  subtract,
  multiply,
  divide,
  negate,
  evaluate,
  exprToString,
  simplify,
  nil,
  cons,
  fromArray,
  toArray,
  length,
  mapList,
  filterList,
  foldList,
  reverseList,
  ok,
  err,
  mapResult,
  flatMapResult,
  mapError,
  getOrElse,
  validateUsername,
  validateEmail,
  validatePassword,
  validateRegistration,
  vendingMachineTransition,
  validate
};
