/**
 * 第十章第三节：Foldable 和 Traversable
 * 
 * 本文件实现 Foldable 和 Traversable 类型类
 * 展示如何统一处理不同的数据结构
 */

console.log('=== Foldable 和 Traversable ===\n');

// ============================================================================
// 基础类型定义
// ============================================================================

interface Semigroup<T> {
  concat: (a: T, b: T) => T;
}

interface Monoid<T> extends Semigroup<T> {
  empty: T;
}

// Option 类型（简化版）
type Option<T> = 
  | { _tag: 'Some'; value: T }
  | { _tag: 'None' };

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None = <T>(): Option<T> => ({ _tag: 'None' });

// Either 类型（简化版）
type Either<L, R> = 
  | { _tag: 'Left'; left: L }
  | { _tag: 'Right'; right: R };

const Left = <L, R>(left: L): Either<L, R> => ({ _tag: 'Left', left });
const Right = <L, R>(right: R): Either<L, R> => ({ _tag: 'Right', right });

// ============================================================================
// 1. Foldable 类型类
// ============================================================================

console.log('1. Foldable 类型类\n');

/**
 * Foldable 类型类
 * 表示可以被"折叠"（归约）为单个值的数据结构
 * 
 * 核心操作：reduce（从左到右折叠）
 */
interface Foldable<F> {
  /**
   * reduce: 从左到右折叠
   * @param fa 要折叠的数据结构
   * @param f 累加器函数
   * @param initial 初始值
   */
  reduce<A, B>(fa: any, f: (b: B, a: A) => B, initial: B): B;
  
  /**
   * foldMap: 使用 Monoid 折叠
   * 先映射，再折叠
   */
  foldMap<A, M>(fa: any, f: (a: A) => M, monoid: Monoid<M>): M;
}

// ============================================================================
// 2. Array 的 Foldable 实例
// ============================================================================

console.log('2. Array 的 Foldable 实例\n');

const foldableArray: Foldable<'Array'> = {
  reduce: <A, B>(fa: A[], f: (b: B, a: A) => B, initial: B): B => {
    return fa.reduce(f, initial);
  },
  
  foldMap: <A, M>(fa: A[], f: (a: A) => M, monoid: Monoid<M>): M => {
    return fa.map(f).reduce(monoid.concat, monoid.empty);
  }
};

// 测试 Array Foldable
const numbers = [1, 2, 3, 4, 5];

const sum = foldableArray.reduce(
  numbers,
  (acc, n) => acc + n,
  0
);

console.log('数字列表:', numbers);
console.log('求和 (reduce):', sum);

const monoidSum: Monoid<number> = {
  concat: (a, b) => a + b,
  empty: 0
};

const sumViaFoldMap = foldableArray.foldMap(
  numbers,
  n => n,
  monoidSum
);

console.log('求和 (foldMap):', sumViaFoldMap);
console.log();

// ============================================================================
// 3. Option 的 Foldable 实例
// ============================================================================

console.log('3. Option 的 Foldable 实例\n');

const foldableOption: Foldable<'Option'> = {
  reduce: <A, B>(fa: Option<A>, f: (b: B, a: A) => B, initial: B): B => {
    if (fa._tag === 'None') {
      return initial;
    }
    return f(initial, fa.value);
  },
  
  foldMap: <A, M>(fa: Option<A>, f: (a: A) => M, monoid: Monoid<M>): M => {
    if (fa._tag === 'None') {
      return monoid.empty;
    }
    return f(fa.value);
  }
};

const someValue = Some(10);
const noneValue = None<number>();

console.log('Some(10) 求和:', 
  foldableOption.reduce(someValue, (acc, n) => acc + n, 0));

console.log('None 求和:', 
  foldableOption.reduce(noneValue, (acc, n) => acc + n, 0));
console.log();

// ============================================================================
// 4. Tree 数据结构的 Foldable 实例
// ============================================================================

console.log('4. Tree 数据结构的 Foldable 实例\n');

/**
 * 二叉树类型
 */
type Tree<T> = 
  | { _tag: 'Leaf' }
  | { _tag: 'Node'; value: T; left: Tree<T>; right: Tree<T> };

const Leaf = <T>(): Tree<T> => ({ _tag: 'Leaf' });

const Node = <T>(value: T, left: Tree<T>, right: Tree<T>): Tree<T> => ({
  _tag: 'Node',
  value,
  left,
  right
});

/**
 * Tree 的 Foldable 实例
 * 使用中序遍历
 */
const foldableTree: Foldable<'Tree'> = {
  reduce: <A, B>(tree: Tree<A>, f: (b: B, a: A) => B, initial: B): B => {
    if (tree._tag === 'Leaf') {
      return initial;
    }
    
    // 中序遍历：左 -> 根 -> 右
    const leftResult = foldableTree.reduce(tree.left, f, initial);
    const rootResult = f(leftResult, tree.value);
    const rightResult = foldableTree.reduce(tree.right, f, rootResult);
    
    return rightResult;
  },
  
  foldMap: <A, M>(tree: Tree<A>, f: (a: A) => M, monoid: Monoid<M>): M => {
    if (tree._tag === 'Leaf') {
      return monoid.empty;
    }
    
    const leftResult = foldableTree.foldMap(tree.left, f, monoid);
    const rootResult = f(tree.value);
    const rightResult = foldableTree.foldMap(tree.right, f, monoid);
    
    return monoid.concat(monoid.concat(leftResult, rootResult), rightResult);
  }
};

// 构造一棵树
//       4
//      / \
//     2   6
//    / \ / \
//   1  3 5  7
const tree: Tree<number> = Node(
  4,
  Node(2, Node(1, Leaf(), Leaf()), Node(3, Leaf(), Leaf())),
  Node(6, Node(5, Leaf(), Leaf()), Node(7, Leaf(), Leaf()))
);

const treeSum = foldableTree.reduce(
  tree,
  (acc, n) => acc + n,
  0
);

console.log('树的结构: (中序遍历应该是 1,2,3,4,5,6,7)');
console.log('树的求和:', treeSum); // 1+2+3+4+5+6+7 = 28

const monoidArray = <T>(): Monoid<T[]> => ({
  concat: (a, b) => [...a, ...b],
  empty: []
});

const treeToList = foldableTree.foldMap(
  tree,
  n => [n],
  monoidArray<number>()
);

console.log('树转列表:', treeToList);
console.log();

// ============================================================================
// 5. Foldable 的通用函数
// ============================================================================

console.log('5. Foldable 的通用函数\n');

/**
 * 通用的 fold 函数
 * 使用 Monoid 折叠任何 Foldable 结构
 */
function fold<F, A>(
  foldable: Foldable<F>,
  fa: any,
  monoid: Monoid<A>
): A {
  return foldable.foldMap(fa, a => a, monoid);
}

/**
 * 查找满足条件的第一个元素
 */
function find<F, A>(
  foldable: Foldable<F>,
  fa: any,
  predicate: (a: A) => boolean
): Option<A> {
  return foldable.reduce<A, Option<A>>(
    fa,
    (acc, a) => {
      if (acc._tag === 'Some') return acc;
      return predicate(a) ? Some(a) : None();
    },
    None()
  );
}

/**
 * 检查是否所有元素都满足条件
 */
function all<F, A>(
  foldable: Foldable<F>,
  fa: any,
  predicate: (a: A) => boolean
): boolean {
  return foldable.reduce<A, boolean>(
    fa,
    (acc, a) => acc && predicate(a),
    true
  );
}

/**
 * 检查是否存在满足条件的元素
 */
function any<F, A>(
  foldable: Foldable<F>,
  fa: any,
  predicate: (a: A) => boolean
): boolean {
  return foldable.reduce<A, boolean>(
    fa,
    (acc, a) => acc || predicate(a),
    false
  );
}

/**
 * 计算元素个数
 */
function length<F, A>(foldable: Foldable<F>, fa: any): number {
  return foldable.reduce<A, number>(fa, (acc, _) => acc + 1, 0);
}

// 测试通用函数
console.log('find(偶数):', find(foldableArray, [1, 2, 3, 4], n => n % 2 === 0));
console.log('all(< 10):', all(foldableArray, [1, 2, 3], n => n < 10));
console.log('any(> 3):', any(foldableArray, [1, 2, 3], n => n > 3));
console.log('length:', length(foldableArray, [1, 2, 3, 4, 5]));
console.log();

// ============================================================================
// 6. Traversable 类型类
// ============================================================================

console.log('6. Traversable 类型类\n');

/**
 * Traversable 类型类
 * 扩展 Foldable，支持在结构中应用带副作用的操作
 * 
 * 核心能力：可以"翻转"嵌套类型
 * Array<Option<T>> -> Option<Array<T>>
 */
interface Traversable<T> extends Foldable<T> {
  /**
   * traverse: 遍历并应用带副作用的函数，然后"翻转"类型
   */
  traverse<A, B>(
    ta: any,
    f: (a: A) => Option<B>
  ): Option<any>;
  
  /**
   * sequence: 翻转嵌套类型
   * 如果所有都是 Some，返回 Some(结构)
   * 如果有任何 None，返回 None
   */
  sequence<A>(tta: any): Option<any>;
}

// ============================================================================
// 7. Array 的 Traversable 实例
// ============================================================================

console.log('7. Array 的 Traversable 实例\n');

const traversableArray: Traversable<'Array'> = {
  ...foldableArray,
  
  traverse: <A, B>(ta: A[], f: (a: A) => Option<B>): Option<B[]> => {
    const results: B[] = [];
    
    for (const item of ta) {
      const result = f(item);
      if (result._tag === 'None') {
        return None(); // 短路：遇到 None 立即返回
      }
      results.push(result.value);
    }
    
    return Some(results);
  },
  
  sequence: <A>(tta: Option<A>[]): Option<A[]> => {
    return traversableArray.traverse(tta, x => x);
  }
};

// 示例：解析数字字符串
function parseNumber(s: string): Option<number> {
  const n = Number(s);
  return isNaN(n) ? None() : Some(n);
}

const validStrings = ['1', '2', '3'];
const invalidStrings = ['1', 'abc', '3'];

console.log('解析有效字符串:', 
  traversableArray.traverse(validStrings, parseNumber));

console.log('解析无效字符串:', 
  traversableArray.traverse(invalidStrings, parseNumber));
console.log();

// sequence 示例
const allSome: Option<number>[] = [Some(1), Some(2), Some(3)];
const hasNone: Option<number>[] = [Some(1), None(), Some(3)];

console.log('sequence(全是 Some):', 
  traversableArray.sequence(allSome));

console.log('sequence(包含 None):', 
  traversableArray.sequence(hasNone));
console.log();

// ============================================================================
// 8. 实际应用：批量验证
// ============================================================================

console.log('8. 实际应用：批量验证\n');

type User = {
  id: string;
  name: string;
  age: number;
};

type ValidationError = string;

// 验证用户 ID（模拟数据库查询）
function validateUserId(id: string): Option<string> {
  const validIds = ['user1', 'user2', 'user3'];
  return validIds.includes(id) ? Some(id) : None();
}

const userIds = ['user1', 'user2', 'user3'];
const invalidUserIds = ['user1', 'invalid', 'user3'];

console.log('验证有效 ID 列表:', 
  traversableArray.traverse(userIds, validateUserId));

console.log('验证包含无效 ID 的列表:', 
  traversableArray.traverse(invalidUserIds, validateUserId));
console.log();

// ============================================================================
// 9. 实际应用：并行异步操作（模拟）
// ============================================================================

console.log('9. 实际应用：并行异步操作（模拟）\n');

/**
 * 模拟异步结果类型
 * 实际中可以用 Promise
 */
type AsyncResult<T> = Either<string, T>;

// 模拟异步获取用户信息
function fetchUser(id: string): AsyncResult<User> {
  const users: Record<string, User> = {
    'user1': { id: 'user1', name: 'Alice', age: 25 },
    'user2': { id: 'user2', name: 'Bob', age: 30 }
  };
  
  const user = users[id];
  return user ? Right(user) : Left(`用户 ${id} 不存在`);
}

/**
 * Array 的 Traversable (Either 版本)
 */
function traverseArrayEither<A, B>(
  arr: A[],
  f: (a: A) => Either<string, B>
): Either<string, B[]> {
  const results: B[] = [];
  
  for (const item of arr) {
    const result = f(item);
    if (result._tag === 'Left') {
      return result; // 短路：遇到错误立即返回
    }
    results.push(result.right);
  }
  
  return Right(results);
}

const ids1 = ['user1', 'user2'];
const ids2 = ['user1', 'invalid', 'user2'];

console.log('批量获取用户（成功）:');
console.log(traverseArrayEither(ids1, fetchUser));

console.log('\n批量获取用户（失败）:');
console.log(traverseArrayEither(ids2, fetchUser));
console.log();

// ============================================================================
// 10. 总结
// ============================================================================

console.log('10. 总结\n');

console.log('Foldable 的价值:');
console.log('- 统一的折叠接口，适用于各种数据结构');
console.log('- 可以实现通用的聚合、查找、计数等操作');
console.log('- 与 Monoid 结合，实现灵活的数据归约');
console.log();

console.log('Traversable 的价值:');
console.log('- 可以在保持结构的同时应用带副作用的操作');
console.log('- "翻转"嵌套类型：Array<Option<T>> -> Option<Array<T>>');
console.log('- 实现批量验证、并行异步操作等场景');
console.log('- traverse 比 map + sequence 更高效（一次遍历）');
console.log();

console.log('实际应用场景:');
console.log('- 批量数据验证（全部成功或返回第一个错误）');
console.log('- 并行异步请求（全部成功才返回结果）');
console.log('- 配置解析（所有字段都解析成功才返回配置对象）');
console.log('- 表单批量提交（所有字段验证通过才提交）');
