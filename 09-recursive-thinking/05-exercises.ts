/**
 * 第九章练习: 递归思维综合练习
 * 
 * 通过实际问题掌握递归思维
 * 涵盖树遍历、解析器、文件系统等经典递归场景
 */

console.log('=== 递归思维练习 ===\n');

// ============================================================================
// 练习 1: 二叉搜索树（BST）
// ============================================================================

console.log('练习 1: 实现二叉搜索树\n');
console.log('任务: 实现插入、查找、删除等操作\n');

// --- 类型定义 ---

type BST<A> = Empty | Node<A>;

interface Empty {
  readonly _tag: 'Empty';
}

interface Node<A> {
  readonly _tag: 'Node';
  readonly value: A;
  readonly left: BST<A>;
  readonly right: BST<A>;
}

const Empty: BST<never> = { _tag: 'Empty' };

const Node = <A>(value: A, left: BST<A>, right: BST<A>): BST<A> => ({
  _tag: 'Node',
  value,
  left,
  right
});

const isEmpty = <A>(bst: BST<A>): bst is Empty => bst._tag === 'Empty';
const isNode = <A>(bst: BST<A>): bst is Node<A> => bst._tag === 'Node';

// --- 练习 1.1: 插入元素 ---

/**
 * TODO: 实现 insert
 * 在 BST 中插入元素（保持 BST 性质）
 */
function insert<A>(cmp: (a: A, b: A) => number, value: A, bst: BST<A>): BST<A> {
  if (isEmpty(bst)) {
    return Node(value, Empty, Empty);
  }
  
  const comparison = cmp(value, bst.value);
  
  if (comparison < 0) {
    // 插入左子树
    return Node(bst.value, insert(cmp, value, bst.left), bst.right);
  } else if (comparison > 0) {
    // 插入右子树
    return Node(bst.value, bst.left, insert(cmp, value, bst.right));
  } else {
    // 值已存在，不插入
    return bst;
  }
}

// --- 练习 1.2: 查找元素 ---

/**
 * TODO: 实现 search
 * 在 BST 中查找元素
 */
function search<A>(cmp: (a: A, b: A) => number, value: A, bst: BST<A>): boolean {
  if (isEmpty(bst)) {
    return false;
  }
  
  const comparison = cmp(value, bst.value);
  
  if (comparison === 0) {
    return true;
  } else if (comparison < 0) {
    return search(cmp, value, bst.left);
  } else {
    return search(cmp, value, bst.right);
  }
}

// --- 练习 1.3: 中序遍历（得到有序序列） ---

/**
 * TODO: 实现 inOrder
 * 中序遍历 BST，返回有序数组
 */
function inOrder<A>(bst: BST<A>): A[] {
  if (isEmpty(bst)) {
    return [];
  }
  
  return [
    ...inOrder(bst.left),
    bst.value,
    ...inOrder(bst.right)
  ];
}

// --- 测试 ---

const numberCmp = (a: number, b: number) => a - b;

let bst: BST<number> = Empty;
bst = insert(numberCmp, 5, bst);
bst = insert(numberCmp, 3, bst);
bst = insert(numberCmp, 7, bst);
bst = insert(numberCmp, 1, bst);
bst = insert(numberCmp, 9, bst);
bst = insert(numberCmp, 4, bst);

console.log('BST 测试:');
console.log('  插入顺序: [5, 3, 7, 1, 9, 4]');
console.log('  中序遍历:', inOrder(bst));
console.log('  查找 7:', search(numberCmp, 7, bst));
console.log('  查找 6:', search(numberCmp, 6, bst));
console.log();

// ============================================================================
// 练习 2: 表达式求值
// ============================================================================

console.log('练习 2: 表达式求值\n');
console.log('任务: 实现一个简单的表达式解析和求值器\n');

// --- 类型定义 ---

type Expr =
  | { type: 'Num'; value: number }
  | { type: 'Add'; left: Expr; right: Expr }
  | { type: 'Sub'; left: Expr; right: Expr }
  | { type: 'Mul'; left: Expr; right: Expr }
  | { type: 'Div'; left: Expr; right: Expr };

// 构造函数
const Num = (value: number): Expr => ({ type: 'Num', value });
const Add = (left: Expr, right: Expr): Expr => ({ type: 'Add', left, right });
const Sub = (left: Expr, right: Expr): Expr => ({ type: 'Sub', left, right });
const Mul = (left: Expr, right: Expr): Expr => ({ type: 'Mul', left, right });
const Div = (left: Expr, right: Expr): Expr => ({ type: 'Div', left, right });

// --- 练习 2.1: 表达式求值 ---

/**
 * TODO: 实现 eval
 * 递归求值表达式
 */
function evalExpr(expr: Expr): number {
  switch (expr.type) {
    case 'Num':
      return expr.value;
    
    case 'Add':
      return evalExpr(expr.left) + evalExpr(expr.right);
    
    case 'Sub':
      return evalExpr(expr.left) - evalExpr(expr.right);
    
    case 'Mul':
      return evalExpr(expr.left) * evalExpr(expr.right);
    
    case 'Div':
      return evalExpr(expr.left) / evalExpr(expr.right);
  }
}

// --- 练习 2.2: 表达式转字符串 ---

/**
 * TODO: 实现 toString
 * 将表达式转换为中缀表达式字符串
 */
function exprToString(expr: Expr): string {
  switch (expr.type) {
    case 'Num':
      return expr.value.toString();
    
    case 'Add':
      return `(${exprToString(expr.left)} + ${exprToString(expr.right)})`;
    
    case 'Sub':
      return `(${exprToString(expr.left)} - ${exprToString(expr.right)})`;
    
    case 'Mul':
      return `(${exprToString(expr.left)} * ${exprToString(expr.right)})`;
    
    case 'Div':
      return `(${exprToString(expr.left)} / ${exprToString(expr.right)})`;
  }
}

// --- 测试 ---

// 表达式: (3 + 5) * (10 - 2)
const expr1 = Mul(
  Add(Num(3), Num(5)),
  Sub(Num(10), Num(2))
);

// 表达式: ((2 + 3) * 4) / (5 - 1)
const expr2 = Div(
  Mul(Add(Num(2), Num(3)), Num(4)),
  Sub(Num(5), Num(1))
);

console.log('表达式求值测试:');
console.log('  expr1:', exprToString(expr1));
console.log('  结果:', evalExpr(expr1));
console.log();
console.log('  expr2:', exprToString(expr2));
console.log('  结果:', evalExpr(expr2));
console.log();

// ============================================================================
// 练习 3: JSON 解析器（简化版）
// ============================================================================

console.log('练习 3: 简单的 JSON 解析器\n');
console.log('任务: 解析简单的 JSON 结构\n');

// --- 类型定义 ---

type JsonValue =
  | { type: 'Null' }
  | { type: 'Bool'; value: boolean }
  | { type: 'Number'; value: number }
  | { type: 'String'; value: string }
  | { type: 'Array'; items: JsonValue[] }
  | { type: 'Object'; fields: Record<string, JsonValue> };

// --- 练习 3.1: JSON 求深度 ---

/**
 * TODO: 实现 depth
 * 计算 JSON 结构的最大嵌套深度
 */
function jsonDepth(json: JsonValue): number {
  switch (json.type) {
    case 'Null':
    case 'Bool':
    case 'Number':
    case 'String':
      return 1;
    
    case 'Array':
      if (json.items.length === 0) return 1;
      const maxItemDepth = Math.max(...json.items.map(jsonDepth));
      return 1 + maxItemDepth;
    
    case 'Object':
      const values = Object.values(json.fields);
      if (values.length === 0) return 1;
      const maxFieldDepth = Math.max(...values.map(jsonDepth));
      return 1 + maxFieldDepth;
  }
}

// --- 练习 3.2: JSON 转字符串 ---

/**
 * TODO: 实现 stringify
 * 将 JsonValue 转换为字符串
 */
function jsonStringify(json: JsonValue): string {
  switch (json.type) {
    case 'Null':
      return 'null';
    
    case 'Bool':
      return json.value.toString();
    
    case 'Number':
      return json.value.toString();
    
    case 'String':
      return `"${json.value}"`;
    
    case 'Array':
      const items = json.items.map(jsonStringify).join(', ');
      return `[${items}]`;
    
    case 'Object':
      const fields = Object.entries(json.fields)
        .map(([key, value]) => `"${key}": ${jsonStringify(value)}`)
        .join(', ');
      return `{${fields}}`;
  }
}

// --- 测试 ---

const json1: JsonValue = {
  type: 'Object',
  fields: {
    name: { type: 'String', value: 'Alice' },
    age: { type: 'Number', value: 30 },
    active: { type: 'Bool', value: true }
  }
};

const json2: JsonValue = {
  type: 'Array',
  items: [
    { type: 'Number', value: 1 },
    { type: 'Array', items: [
      { type: 'Number', value: 2 },
      { type: 'Number', value: 3 }
    ]},
    { type: 'Number', value: 4 }
  ]
};

console.log('JSON 解析器测试:');
console.log('  json1:', jsonStringify(json1));
console.log('  深度:', jsonDepth(json1));
console.log();
console.log('  json2:', jsonStringify(json2));
console.log('  深度:', jsonDepth(json2));
console.log();

// ============================================================================
// 练习 4: 文件系统模拟
// ============================================================================

console.log('练习 4: 文件系统模拟\n');
console.log('任务: 实现一个简单的文件系统树结构\n');

// --- 类型定义 ---

type FileSystem =
  | { type: 'File'; name: string; size: number }
  | { type: 'Directory'; name: string; children: FileSystem[] };

const File = (name: string, size: number): FileSystem => ({
  type: 'File',
  name,
  size
});

const Directory = (name: string, children: FileSystem[]): FileSystem => ({
  type: 'Directory',
  name,
  children
});

// --- 练习 4.1: 计算总大小 ---

/**
 * TODO: 实现 totalSize
 * 递归计算文件系统的总大小
 */
function totalSize(fs: FileSystem): number {
  if (fs.type === 'File') {
    return fs.size;
  }
  
  return fs.children.reduce((acc, child) => acc + totalSize(child), 0);
}

// --- 练习 4.2: 查找文件 ---

/**
 * TODO: 实现 findFile
 * 在文件系统中查找文件
 */
function findFile(name: string, fs: FileSystem): FileSystem | null {
  if (fs.type === 'File') {
    return fs.name === name ? fs : null;
  }
  
  for (const child of fs.children) {
    const result = findFile(name, child);
    if (result !== null) {
      return result;
    }
  }
  
  return null;
}

// --- 练习 4.3: 列出所有文件路径 ---

/**
 * TODO: 实现 listPaths
 * 列出所有文件的完整路径
 */
function listPaths(fs: FileSystem, prefix: string = ''): string[] {
  const currentPath = prefix ? `${prefix}/${fs.name}` : fs.name;
  
  if (fs.type === 'File') {
    return [currentPath];
  }
  
  return fs.children.flatMap(child => listPaths(child, currentPath));
}

// --- 测试 ---

const fileSystem: FileSystem = Directory('root', [
  File('readme.txt', 100),
  Directory('src', [
    File('index.ts', 500),
    File('utils.ts', 300),
    Directory('components', [
      File('Button.tsx', 200),
      File('Input.tsx', 150)
    ])
  ]),
  Directory('tests', [
    File('test.ts', 250)
  ])
]);

console.log('文件系统测试:');
console.log('  总大小:', totalSize(fileSystem), 'bytes');
console.log();

const found = findFile('Button.tsx', fileSystem);
console.log('  查找 Button.tsx:', found ? `找到 (${found.type === 'File' ? found.size : 0} bytes)` : '未找到');
console.log();

console.log('  所有文件路径:');
listPaths(fileSystem).forEach(path => console.log(`    ${path}`));
console.log();

// ============================================================================
// 练习 5: 河内塔（Hanoi Tower）
// ============================================================================

console.log('练习 5: 河内塔问题\n');
console.log('任务: 用递归解决经典的河内塔问题\n');

// --- 练习 5.1: 河内塔求解 ---

/**
 * TODO: 实现 hanoi
 * 求解河内塔问题，返回移动步骤
 */
type Move = {
  from: string;
  to: string;
  disk: number;
};

function hanoi(n: number, from: string, to: string, aux: string): Move[] {
  if (n === 0) {
    return [];
  }
  
  if (n === 1) {
    return [{ from, to, disk: 1 }];
  }
  
  // 1. 将 n-1 个盘子从 from 移到 aux（借助 to）
  const step1 = hanoi(n - 1, from, aux, to);
  
  // 2. 将最大的盘子从 from 移到 to
  const step2: Move = { from, to, disk: n };
  
  // 3. 将 n-1 个盘子从 aux 移到 to（借助 from）
  const step3 = hanoi(n - 1, aux, to, from);
  
  return [...step1, step2, ...step3];
}

// --- 测试 ---

console.log('河内塔问题（3 个盘子）:');
const moves = hanoi(3, 'A', 'C', 'B');
moves.forEach((move, i) => {
  console.log(`  步骤 ${i + 1}: 将盘子 ${move.disk} 从 ${move.from} 移到 ${move.to}`);
});
console.log(`  总共 ${moves.length} 步\n`);

// ============================================================================
// 练习 6: 组合问题
// ============================================================================

console.log('练习 6: 组合与排列\n');

// --- 练习 6.1: 生成所有子集 ---

/**
 * TODO: 实现 subsets
 * 生成数组的所有子集（幂集）
 */
function subsets<A>(arr: A[]): A[][] {
  if (arr.length === 0) {
    return [[]];
  }
  
  const [head, ...tail] = arr;
  const tailSubsets = subsets(tail);
  
  // 每个子集要么包含 head，要么不包含
  const withHead = tailSubsets.map(subset => [head, ...subset]);
  
  return [...tailSubsets, ...withHead];
}

console.log('生成子集:');
const set = [1, 2, 3];
console.log('  集合:', set);
console.log('  子集:', subsets(set));
console.log();

// --- 练习 6.2: 生成排列 ---

/**
 * TODO: 实现 permutations
 * 生成数组的所有排列
 */
function permutations<A>(arr: A[]): A[][] {
  if (arr.length === 0) {
    return [[]];
  }
  
  if (arr.length === 1) {
    return [arr];
  }
  
  const result: A[][] = [];
  
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = permutations(remaining);
    
    for (const perm of remainingPerms) {
      result.push([current, ...perm]);
    }
  }
  
  return result;
}

console.log('生成排列:');
const arr = [1, 2, 3];
console.log('  数组:', arr);
console.log('  排列:', permutations(arr));
console.log();

// --- 练习 6.3: 生成组合 ---

/**
 * TODO: 实现 combinations
 * 从 n 个元素中选 k 个的所有组合
 */
function combinations<A>(arr: A[], k: number): A[][] {
  if (k === 0) {
    return [[]];
  }
  
  if (arr.length === 0) {
    return [];
  }
  
  const [head, ...tail] = arr;
  
  // 包含 head 的组合
  const withHead = combinations(tail, k - 1).map(comb => [head, ...comb]);
  
  // 不包含 head 的组合
  const withoutHead = combinations(tail, k);
  
  return [...withHead, ...withoutHead];
}

console.log('生成组合:');
console.log('  从 [1,2,3,4] 中选 2 个:');
console.log('  ', combinations([1, 2, 3, 4], 2));
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 练习总结 ===\n');
console.log('✅ 通过这些练习，你应该掌握了:');
console.log('  1. 树结构的递归处理（BST、表达式树）');
console.log('  2. 递归解析和求值（表达式、JSON）');
console.log('  3. 文件系统等实际应用场景');
console.log('  4. 经典递归问题（河内塔）');
console.log('  5. 组合数学问题（子集、排列、组合）');
console.log();
console.log('💡 关键要点:');
console.log('  1. 找到基础情况（递归终止条件）');
console.log('  2. 分解问题为更小的子问题');
console.log('  3. 组合子问题的结果');
console.log('  4. 保持数据不可变');
console.log();
console.log('🚀 继续提升:');
console.log('  - 尝试优化递归（尾递归、记忆化）');
console.log('  - 探索递归模式（Recursion Schemes）');
console.log('  - 应用到实际项目中');
