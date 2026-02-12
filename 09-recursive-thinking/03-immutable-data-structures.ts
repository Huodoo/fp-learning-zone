/**
 * 第九章第三节: 不可变数据结构
 * 
 * 在函数式编程中，数据是不可变的
 * 所有的"修改"操作都会创建新的数据结构
 * 通过结构共享（Structural Sharing）优化性能
 * 
 * 本节手写实现：
 * 1. 不可变链表（Immutable Linked List）
 * 2. 不可变二叉树（Immutable Binary Tree）
 */

console.log('=== 不可变数据结构 ===\n');

// ============================================================================
// 1. 不可变链表（Linked List）
// ============================================================================

console.log('1. 不可变链表\n');

// --- 1.1 类型定义 ---

/**
 * List<A> 是一个递归类型
 * - Nil: 空链表
 * - Cons: 包含头元素和尾链表的节点
 */
type List<A> = Nil | Cons<A>;

interface Nil {
  readonly _tag: 'Nil';
}

interface Cons<A> {
  readonly _tag: 'Cons';
  readonly head: A;      // 当前元素
  readonly tail: List<A>; // 剩余链表
}

// 构造函数
const Nil: List<never> = { _tag: 'Nil' };

const Cons = <A>(head: A, tail: List<A>): List<A> => ({
  _tag: 'Cons',
  head,
  tail
});

// 类型守卫
const isNil = <A>(list: List<A>): list is Nil =>
  list._tag === 'Nil';

const isCons = <A>(list: List<A>): list is Cons<A> =>
  list._tag === 'Cons';

console.log('✅ 链表类型定义完成\n');

// --- 1.2 创建链表 ---

console.log('创建链表:\n');

// 手动构造: [1, 2, 3]
const list1 = Cons(1, Cons(2, Cons(3, Nil)));
console.log('手动构造:', list1);

// 从数组创建链表
function fromArray<A>(arr: A[]): List<A> {
  if (arr.length === 0) return Nil;
  return Cons(arr[0], fromArray(arr.slice(1)));
}

const list2 = fromArray([10, 20, 30, 40]);
console.log('从数组创建:', list2);
console.log();

// --- 1.3 链表转数组（用于展示） ---

function toArray<A>(list: List<A>): A[] {
  if (isNil(list)) return [];
  return [list.head, ...toArray(list.tail)];
}

console.log('链表转数组:');
console.log('  list1:', toArray(list1));
console.log('  list2:', toArray(list2));
console.log();

// --- 1.4 链表的基本操作 ---

console.log('链表的基本操作:\n');

/**
 * prepend: 在链表头部添加元素
 * 时间复杂度: O(1)
 */
const prepend = <A>(elem: A, list: List<A>): List<A> =>
  Cons(elem, list);

console.log('prepend 示例:');
const list3 = prepend(0, list1);
console.log('  原链表:', toArray(list1));
console.log('  添加 0:', toArray(list3));
console.log('  原链表未变:', toArray(list1));
console.log();

/**
 * head: 获取第一个元素
 */
const head = <A>(list: List<A>): A | undefined => {
  if (isNil(list)) return undefined;
  return list.head;
};

/**
 * tail: 获取除第一个元素外的剩余链表
 */
const tail = <A>(list: List<A>): List<A> => {
  if (isNil(list)) return Nil;
  return list.tail;
};

console.log('head 和 tail:');
console.log('  head(list1):', head(list1));
console.log('  tail(list1):', toArray(tail(list1)));
console.log();

/**
 * length: 计算链表长度（递归）
 */
const length = <A>(list: List<A>): number => {
  if (isNil(list)) return 0;
  return 1 + length(list.tail);
};

console.log('length:');
console.log('  length(list1):', length(list1));
console.log('  length(list2):', length(list2));
console.log();

/**
 * map: 转换链表中的每个元素
 */
const map = <A, B>(f: (a: A) => B, list: List<A>): List<B> => {
  if (isNil(list)) return Nil;
  return Cons(f(list.head), map(f, list.tail));
};

console.log('map 示例:');
const doubled = map((x: number) => x * 2, list1);
console.log('  原链表:', toArray(list1));
console.log('  翻倍后:', toArray(doubled));
console.log();

/**
 * filter: 过滤链表元素
 */
const filter = <A>(predicate: (a: A) => boolean, list: List<A>): List<A> => {
  if (isNil(list)) return Nil;
  
  if (predicate(list.head)) {
    return Cons(list.head, filter(predicate, list.tail));
  } else {
    return filter(predicate, list.tail);
  }
};

console.log('filter 示例:');
const evens = filter((x: number) => x % 2 === 0, list2);
console.log('  原链表:', toArray(list2));
console.log('  偶数:', toArray(evens));
console.log();

/**
 * append: 连接两个链表
 */
const append = <A>(list1: List<A>, list2: List<A>): List<A> => {
  if (isNil(list1)) return list2;
  return Cons(list1.head, append(list1.tail, list2));
};

console.log('append 示例:');
const combined = append(fromArray([1, 2]), fromArray([3, 4]));
console.log('  [1,2] + [3,4] =', toArray(combined));
console.log();

/**
 * reverse: 反转链表
 */
const reverse = <A>(list: List<A>, acc: List<A> = Nil): List<A> => {
  if (isNil(list)) return acc;
  return reverse(list.tail, Cons(list.head, acc));
};

console.log('reverse 示例:');
const reversed = reverse(list1);
console.log('  原链表:', toArray(list1));
console.log('  反转后:', toArray(reversed));
console.log();

// ============================================================================
// 2. 不可变二叉树（Binary Tree）
// ============================================================================

console.log('\n2. 不可变二叉树\n');

// --- 2.1 类型定义 ---

/**
 * Tree<A> 是一个递归类型
 * - Leaf: 叶子节点（包含值）
 * - Branch: 分支节点（包含左右子树）
 */
type Tree<A> = Leaf<A> | Branch<A>;

interface Leaf<A> {
  readonly _tag: 'Leaf';
  readonly value: A;
}

interface Branch<A> {
  readonly _tag: 'Branch';
  readonly left: Tree<A>;
  readonly right: Tree<A>;
}

// 构造函数
const Leaf = <A>(value: A): Tree<A> => ({
  _tag: 'Leaf',
  value
});

const Branch = <A>(left: Tree<A>, right: Tree<A>): Tree<A> => ({
  _tag: 'Branch',
  left,
  right
});

// 类型守卫
const isLeaf = <A>(tree: Tree<A>): tree is Leaf<A> =>
  tree._tag === 'Leaf';

const isBranch = <A>(tree: Tree<A>): tree is Branch<A> =>
  tree._tag === 'Branch';

console.log('✅ 二叉树类型定义完成\n');

// --- 2.2 创建树 ---

console.log('创建二叉树:\n');

/**
 * 示例树:
 *       Branch
 *       /    \
 *    Leaf(1)  Branch
 *            /     \
 *         Leaf(2) Leaf(3)
 */
const tree1 = Branch(
  Leaf(1),
  Branch(
    Leaf(2),
    Leaf(3)
  )
);

console.log('tree1:', tree1);
console.log();

/**
 * 更大的树:
 *           Branch
 *          /      \
 *      Branch    Branch
 *      /    \    /    \
 *   Leaf(1) L(2) L(3) L(4)
 */
const tree2 = Branch(
  Branch(Leaf(1), Leaf(2)),
  Branch(Leaf(3), Leaf(4))
);

console.log('tree2:', tree2);
console.log();

// --- 2.3 树的基本操作 ---

console.log('树的基本操作:\n');

/**
 * size: 计算树的节点数
 */
const sizeTree = <A>(tree: Tree<A>): number => {
  if (isLeaf(tree)) return 1;
  return sizeTree(tree.left) + sizeTree(tree.right);
};

console.log('size:');
console.log('  tree1 节点数:', sizeTree(tree1));
console.log('  tree2 节点数:', sizeTree(tree2));
console.log();

/**
 * depth: 计算树的深度
 */
const depthTree = <A>(tree: Tree<A>): number => {
  if (isLeaf(tree)) return 1;
  return 1 + Math.max(depthTree(tree.left), depthTree(tree.right));
};

console.log('depth:');
console.log('  tree1 深度:', depthTree(tree1));
console.log('  tree2 深度:', depthTree(tree2));
console.log();

/**
 * mapTree: 转换树中的每个值
 */
const mapTree = <A, B>(f: (a: A) => B, tree: Tree<A>): Tree<B> => {
  if (isLeaf(tree)) {
    return Leaf(f(tree.value));
  }
  return Branch(
    mapTree(f, tree.left),
    mapTree(f, tree.right)
  );
};

console.log('mapTree 示例:');
const doubledTree = mapTree((x: number) => x * 2, tree1);
console.log('  原树 tree1:', tree1);
console.log('  翻倍后:', doubledTree);
console.log();

/**
 * foldTree: 折叠树（归约）
 */
const foldTree = <A, B>(
  onLeaf: (value: A) => B,
  onBranch: (left: B, right: B) => B
) => (tree: Tree<A>): B => {
  if (isLeaf(tree)) {
    return onLeaf(tree.value);
  }
  return onBranch(
    foldTree(onLeaf, onBranch)(tree.left),
    foldTree(onLeaf, onBranch)(tree.right)
  );
};

console.log('foldTree 示例:');

// 求和：所有叶子节点的值
const sumTree = foldTree<number, number>(
  (value) => value,           // 叶子节点返回值本身
  (left, right) => left + right  // 分支节点求和
);

console.log('  tree1 求和:', sumTree(tree1));
console.log('  tree2 求和:', sumTree(tree2));
console.log();

// 求最大值
const maxTree = foldTree<number, number>(
  (value) => value,
  (left, right) => Math.max(left, right)
);

console.log('  tree2 最大值:', maxTree(tree2));
console.log();

// --- 2.4 树的遍历 ---

console.log('树的遍历:\n');

/**
 * 前序遍历（Pre-order）: 根 -> 左 -> 右
 */
const preOrder = <A>(tree: Tree<A>): A[] => {
  if (isLeaf(tree)) {
    return [tree.value];
  }
  return [
    ...preOrder(tree.left),
    ...preOrder(tree.right)
  ];
};

/**
 * 中序遍历（In-order）: 左 -> 根 -> 右
 * 注意：对于 Branch 节点我们不存储值，所以这里只是示例
 */
const inOrder = <A>(tree: Tree<A>): A[] => {
  if (isLeaf(tree)) {
    return [tree.value];
  }
  return [
    ...inOrder(tree.left),
    ...inOrder(tree.right)
  ];
};

/**
 * 后序遍历（Post-order）: 左 -> 右 -> 根
 */
const postOrder = <A>(tree: Tree<A>): A[] => {
  if (isLeaf(tree)) {
    return [tree.value];
  }
  return [
    ...postOrder(tree.left),
    ...postOrder(tree.right)
  ];
};

console.log('遍历 tree2:');
console.log('  前序:', preOrder(tree2));
console.log('  中序:', inOrder(tree2));
console.log('  后序:', postOrder(tree2));
console.log();

// ============================================================================
// 3. 结构共享（Structural Sharing）
// ============================================================================

console.log('3. 结构共享\n');

console.log('链表的结构共享:');

const original = fromArray([1, 2, 3, 4, 5]);
const modified = prepend(0, original);

console.log('  原链表:', toArray(original));
console.log('  新链表:', toArray(modified));
console.log();

console.log('💡 关键点:');
console.log('  - 新链表只创建了一个新节点（头节点）');
console.log('  - 新链表的 tail 指向原链表');
console.log('  - 两个链表共享大部分结构');
console.log('  - 空间效率: O(1)');
console.log();

console.log('树的结构共享:');

/**
 * 修改树的一个叶子节点
 */
const updateLeaf = <A>(tree: Tree<A>, path: ('left' | 'right')[], newValue: A): Tree<A> => {
  if (path.length === 0) {
    if (isLeaf(tree)) {
      return Leaf(newValue);
    }
    return tree;
  }
  
  if (isBranch(tree)) {
    const [direction, ...rest] = path;
    if (direction === 'left') {
      return Branch(
        updateLeaf(tree.left, rest, newValue),
        tree.right  // 右子树完全共享
      );
    } else {
      return Branch(
        tree.left,  // 左子树完全共享
        updateLeaf(tree.right, rest, newValue)
      );
    }
  }
  
  return tree;
};

const originalTree = tree2;
const modifiedTree = updateLeaf(tree2, ['left', 'left'], 99);

console.log('  原树:', originalTree);
console.log('  修改后:', modifiedTree);
console.log();

console.log('💡 关键点:');
console.log('  - 只有修改路径上的节点被重建');
console.log('  - 其他子树完全共享');
console.log('  - 空间效率: O(log n)');
console.log();

// ============================================================================
// 4. 不可变数据结构的优势
// ============================================================================

console.log('4. 不可变数据结构的优势\n');

console.log('✅ 优势:');
console.log('  1. 线程安全（无竞态条件）');
console.log('  2. 易于推理（数据不会被意外修改）');
console.log('  3. 支持时间旅行（保留历史版本）');
console.log('  4. 纯函数友好（无副作用）');
console.log('  5. 结构共享（节省内存）');
console.log();

console.log('❌ 劣势:');
console.log('  1. 性能开销（需要创建新结构）');
console.log('  2. 内存压力（需要 GC）');
console.log('  3. 学习曲线（思维转变）');
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 总结 ===\n');
console.log('✅ 不可变链表:');
console.log('  - 递归定义: Nil | Cons<A>');
console.log('  - 操作: prepend O(1), map/filter/append O(n)');
console.log('  - 结构共享: prepend 只创建一个节点');
console.log();
console.log('✅ 不可变树:');
console.log('  - 递归定义: Leaf<A> | Branch<A>');
console.log('  - 操作: map/fold/traverse');
console.log('  - 结构共享: 修改只影响路径上的节点');
console.log();
console.log('💡 使用建议:');
console.log('  - 小数据: 直接使用不可变结构');
console.log('  - 大数据: 考虑持久化数据结构库（Immutable.js）');
console.log('  - 性能关键: 可以局部使用可变结构，外部不可变');
console.log();
console.log('🚀 下一步:');
console.log('  - 学习 Fold 和 Unfold');
console.log('  - 理解 Catamorphism 和 Anamorphism');
console.log('  - 探索更高级的递归模式');
