/**
 * 第九章第四节: Fold 和 Unfold
 * 
 * Fold 和 Unfold 是函数式编程中的两个基本递归模式
 * 
 * - Fold (Catamorphism): 将数据结构"折叠"成一个值
 * - Unfold (Anamorphism): 从一个种子值"展开"成数据结构
 * - Hylomorphism: 先 unfold 再 fold
 * 
 * 这些是 Recursion Schemes（递归模式）的基础
 */

console.log('=== Fold 和 Unfold ===\n');

// ============================================================================
// 1. Fold（折叠/归约）- Catamorphism
// ============================================================================

console.log('1. Fold - 将数据结构压缩成一个值\n');

// --- 1.1 数组的 fold（reduce） ---

console.log('数组的 fold（也叫 reduce）:\n');

/**
 * foldLeft: 从左往右折叠
 * 也叫 reduce, foldl
 */
function foldLeft<A, B>(
  f: (acc: B, curr: A) => B,
  init: B,
  arr: A[]
): B {
  if (arr.length === 0) {
    return init;
  }
  
  // 用当前元素更新累积值，继续处理剩余元素
  const newAcc = f(init, arr[0]);
  return foldLeft(f, newAcc, arr.slice(1));
}

const numbers = [1, 2, 3, 4, 5];

console.log('foldLeft 示例:');
console.log('  数组:', numbers);

// 求和
const sum = foldLeft((acc, x) => acc + x, 0, numbers);
console.log('  求和:', sum);

// 求积
const product = foldLeft((acc, x) => acc * x, 1, numbers);
console.log('  求积:', product);

// 构建字符串
const str = foldLeft((acc, x) => `${acc}, ${x}`, '0', numbers);
console.log('  拼接:', str);
console.log();

/**
 * foldRight: 从右往左折叠
 * 也叫 foldr
 */
function foldRight<A, B>(
  f: (curr: A, acc: B) => B,
  init: B,
  arr: A[]
): B {
  if (arr.length === 0) {
    return init;
  }
  
  // 先处理剩余元素，再用当前元素组合
  const tailResult = foldRight(f, init, arr.slice(1));
  return f(arr[0], tailResult);
}

console.log('foldRight 示例:');
console.log('  数组:', numbers);

// foldRight 构建字符串（顺序不同）
const strRight = foldRight((x, acc) => `${x}, ${acc}`, '0', numbers);
console.log('  拼接:', strRight);

// 反转数组
const reversed = foldRight<number, number[]>((x, acc) => [...acc, x], [], numbers);
console.log('  反转:', reversed);
console.log();

// --- 1.2 链表的 fold ---

console.log('链表的 fold:\n');

// 链表类型（来自上一节）
type List<A> = Nil | Cons<A>;

interface Nil {
  readonly _tag: 'Nil';
}

interface Cons<A> {
  readonly _tag: 'Cons';
  readonly head: A;
  readonly tail: List<A>;
}

const Nil: List<never> = { _tag: 'Nil' };
const Cons = <A>(head: A, tail: List<A>): List<A> => ({ _tag: 'Cons', head, tail });
const isNil = <A>(list: List<A>): list is Nil => list._tag === 'Nil';

/**
 * foldList: 链表的通用 fold
 */
function foldList<A, B>(
  onNil: () => B,
  onCons: (head: A, tailResult: B) => B,
  list: List<A>
): B {
  if (isNil(list)) {
    return onNil();
  }
  
  // 先递归处理尾部，再用头部组合
  const tailResult = foldList(onNil, onCons, list.tail);
  return onCons(list.head, tailResult);
}

// 从数组创建链表
function fromArray<A>(arr: A[]): List<A> {
  if (arr.length === 0) return Nil;
  return Cons(arr[0], fromArray(arr.slice(1)));
}

const list = fromArray([1, 2, 3, 4, 5]);

console.log('链表的 fold:');

// 用 fold 实现 sum
const sumList = foldList<number, number>(
  () => 0,                      // 空链表 = 0
  (head, tailSum) => head + tailSum  // 头 + 尾的和
);

console.log('  求和:', sumList(list));

// 用 fold 实现 length
const lengthList = foldList<number, number>(
  () => 0,
  (_head, tailLength) => 1 + tailLength
);

console.log('  长度:', lengthList(list));

// 用 fold 实现 map
const mapList = <A, B>(f: (a: A) => B) => (list: List<A>): List<B> =>
  foldList<A, List<B>>(
    () => Nil,
    (head, tailResult) => Cons(f(head), tailResult)
  )(list);

const doubled = mapList((x: number) => x * 2)(list);
console.log('  翻倍:', doubled);
console.log();

// --- 1.3 树的 fold ---

console.log('树的 fold:\n');

// 树类型
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

const Leaf = <A>(value: A): Tree<A> => ({ _tag: 'Leaf', value });
const Branch = <A>(left: Tree<A>, right: Tree<A>): Tree<A> => ({ _tag: 'Branch', left, right });
const isLeaf = <A>(tree: Tree<A>): tree is Leaf<A> => tree._tag === 'Leaf';

/**
 * foldTree: 树的通用 fold
 */
function foldTree<A, B>(
  onLeaf: (value: A) => B,
  onBranch: (left: B, right: B) => B,
  tree: Tree<A>
): B {
  if (isLeaf(tree)) {
    return onLeaf(tree.value);
  }
  
  // 递归处理左右子树，再组合
  const leftResult = foldTree(onLeaf, onBranch, tree.left);
  const rightResult = foldTree(onLeaf, onBranch, tree.right);
  return onBranch(leftResult, rightResult);
}

const tree = Branch(
  Branch(Leaf(1), Leaf(2)),
  Branch(Leaf(3), Leaf(4))
);

console.log('树的 fold:');

// 求和
const sumTree = foldTree<number, number>(
  (value) => value,
  (left, right) => left + right
)(tree);

console.log('  求和:', sumTree);

// 求最大值
const maxTree = foldTree<number, number>(
  (value) => value,
  (left, right) => Math.max(left, right)
)(tree);

console.log('  最大值:', maxTree);

// 计算节点数
const sizeTree = foldTree<number, number>(
  (_value) => 1,
  (left, right) => left + right
)(tree);

console.log('  节点数:', sizeTree);
console.log();

// ============================================================================
// 2. Unfold（展开/生成）- Anamorphism
// ============================================================================

console.log('2. Unfold - 从种子值生成数据结构\n');

// --- 2.1 数组的 unfold ---

console.log('数组的 unfold:\n');

/**
 * unfoldArray: 从种子值生成数组
 * step 函数返回 null 表示结束，或返回 [value, nextSeed]
 */
function unfoldArray<A, B>(
  step: (seed: B) => [A, B] | null,
  seed: B
): A[] {
  const result = step(seed);
  
  if (result === null) {
    return [];
  }
  
  const [value, nextSeed] = result;
  return [value, ...unfoldArray(step, nextSeed)];
}

console.log('unfold 示例:');

// 生成 [1, 2, 3, 4, 5]
const range = unfoldArray(
  (n: number) => n > 5 ? null : [n, n + 1],
  1
);
console.log('  range(1, 5):', range);

// 生成斐波那契数列
const fibonacci = unfoldArray(
  ([a, b]: [number, number]) => a > 100 ? null : [a, [b, a + b]],
  [0, 1] as [number, number]
);
console.log('  fibonacci (< 100):', fibonacci);

// 生成无限序列（取前 10 个）
const naturals = unfoldArray(
  (n: number) => n > 10 ? null : [n, n + 1],
  1
);
console.log('  naturals (1-10):', naturals);
console.log();

// --- 2.2 链表的 unfold ---

console.log('链表的 unfold:\n');

/**
 * unfoldList: 从种子值生成链表
 */
function unfoldList<A, B>(
  step: (seed: B) => [A, B] | null,
  seed: B
): List<A> {
  const result = step(seed);
  
  if (result === null) {
    return Nil;
  }
  
  const [value, nextSeed] = result;
  return Cons(value, unfoldList(step, nextSeed));
}

const listRange = unfoldList(
  (n: number) => n > 5 ? null : [n, n + 1],
  1
);

console.log('  链表 range:', listRange);
console.log();

// --- 2.3 树的 unfold ---

console.log('树的 unfold:\n');

/**
 * unfoldTree: 从种子值生成树
 * step 返回 Leaf(value) 或 [leftSeed, rightSeed]
 */
function unfoldTree<A, B>(
  step: (seed: B) => A | [B, B],
  seed: B
): Tree<A> {
  const result = step(seed);
  
  if (!Array.isArray(result)) {
    return Leaf(result);
  }
  
  const [leftSeed, rightSeed] = result;
  return Branch(
    unfoldTree(step, leftSeed),
    unfoldTree(step, rightSeed)
  );
}

// 生成完全二叉树（深度为 3）
const completeTree = unfoldTree(
  (depth: number): number | [number, number] => {
    if (depth === 0) return depth;
    return [depth - 1, depth - 1];
  },
  3
);

console.log('  完全二叉树:', completeTree);
console.log();

// ============================================================================
// 3. Hylomorphism（重构）- Unfold + Fold
// ============================================================================

console.log('3. Hylomorphism - 先 unfold 再 fold\n');

/**
 * hylo: 先生成数据结构，再折叠它
 * 组合 unfold 和 fold
 */
function hylo<A, B, C>(
  unfoldStep: (seed: C) => [A, C] | null,
  foldF: (acc: B, curr: A) => B,
  foldInit: B,
  seed: C
): B {
  // 先 unfold 生成数组
  const arr = unfoldArray(unfoldStep, seed);
  
  // 再 fold 归约
  return foldLeft(foldF, foldInit, arr);
}

console.log('hylo 示例:');

// 计算 1 到 n 的和（先生成序列，再求和）
const sumRange = (n: number): number =>
  hylo(
    (i: number) => i > n ? null : [i, i + 1],  // unfold: 生成 1..n
    (acc, x) => acc + x,                       // fold: 求和
    0,                                         // fold 初始值
    1                                          // unfold 种子
  );

console.log('  sum(1..10):', sumRange(10));

// 阶乘（先生成序列，再求积）
const factorial = (n: number): number =>
  hylo(
    (i: number) => i > n ? null : [i, i + 1],
    (acc, x) => acc * x,
    1,
    1
  );

console.log('  factorial(5):', factorial(5));
console.log();

// ============================================================================
// 4. 实际应用示例
// ============================================================================

console.log('4. 实际应用示例\n');

// --- 4.1 快速排序（使用 fold） ---

console.log('快速排序（使用 fold）:\n');

/**
 * 快速排序：递归 + fold
 */
function quickSort(arr: number[]): number[] {
  return foldLeft<number, number[]>(
    (acc, x) => {
      if (acc.length === 0) {
        return [x];
      }
      
      const pivot = acc[0];
      if (x <= pivot) {
        // 小于等于 pivot 的放左边
        const left = acc.filter(y => y <= pivot);
        const right = acc.filter(y => y > pivot);
        return [...quickSort(left.slice(0, -1)), x, left[left.length - 1], ...quickSort(right)];
      } else {
        // 大于 pivot 的放右边
        const left = acc.filter(y => y <= pivot);
        const right = acc.filter(y => y > pivot);
        return [...quickSort(left), pivot, ...quickSort([...right, x])];
      }
    },
    [],
    arr
  );
}

// 简化版快速排序
function quickSortSimple(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[0];
  const rest = arr.slice(1);
  
  return foldLeft<number, { left: number[]; right: number[] }>(
    (acc, x) => {
      if (x <= pivot) {
        return { ...acc, left: [...acc.left, x] };
      } else {
        return { ...acc, right: [...acc.right, x] };
      }
    },
    { left: [], right: [] },
    rest
  ).then(({ left, right }) => [
    ...quickSortSimple(left),
    pivot,
    ...quickSortSimple(right)
  ]);
}

// 更简洁的版本
function quickSortClean(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x <= pivot);
  const right = arr.slice(1).filter(x => x > pivot);
  
  return [...quickSortClean(left), pivot, ...quickSortClean(right)];
}

const unsorted = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
console.log('  原数组:', unsorted);
console.log('  排序后:', quickSortClean(unsorted));
console.log();

// --- 4.2 生成器模式（使用 unfold） ---

console.log('生成器模式（使用 unfold）:\n');

// 生成斐波那契数列（前 n 项）
function fibonacciN(n: number): number[] {
  return unfoldArray(
    ({ index, a, b }: { index: number; a: number; b: number }) => {
      if (index >= n) return null;
      return [a, { index: index + 1, a: b, b: a + b }];
    },
    { index: 0, a: 0, b: 1 }
  );
}

console.log('  fibonacci(10):', fibonacciN(10));

// 生成等差数列
function arithmeticSequence(start: number, step: number, count: number): number[] {
  return unfoldArray(
    ({ current, remaining }: { current: number; remaining: number }) => {
      if (remaining <= 0) return null;
      return [current, { current: current + step, remaining: remaining - 1 }];
    },
    { current: start, remaining: count }
  );
}

console.log('  等差数列 (1, +2, 10项):', arithmeticSequence(1, 2, 10));

// 生成等比数列
function geometricSequence(start: number, ratio: number, count: number): number[] {
  return unfoldArray(
    ({ current, remaining }: { current: number; remaining: number }) => {
      if (remaining <= 0) return null;
      return [current, { current: current * ratio, remaining: remaining - 1 }];
    },
    { current: start, remaining: count }
  );
}

console.log('  等比数列 (1, ×2, 10项):', geometricSequence(1, 2, 10));
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 总结 ===\n');
console.log('✅ Fold (Catamorphism):');
console.log('  - 将数据结构"压缩"成一个值');
console.log('  - 递归处理子结构，再组合结果');
console.log('  - 应用: sum, product, max, filter, map...');
console.log();
console.log('✅ Unfold (Anamorphism):');
console.log('  - 从种子值"生成"数据结构');
console.log('  - 与 fold 互为逆操作');
console.log('  - 应用: range, fibonacci, 生成器...');
console.log();
console.log('✅ Hylomorphism:');
console.log('  - 先 unfold 再 fold');
console.log('  - 生成临时结构后立即消费');
console.log('  - 应用: 一步完成生成和归约');
console.log();
console.log('💡 理论意义:');
console.log('  - Fold 和 Unfold 是递归模式的基础');
console.log('  - 所有递归都可以表达为某种 fold/unfold');
console.log('  - 通向更高级的递归模式（Recursion Schemes）');
console.log();
console.log('🚀 进阶方向:');
console.log('  - Paramorphism (para)');
console.log('  - Apomorphism (apo)');
console.log('  - Zygohistomorphic Prepromorphisms (开玩笑😄)');
