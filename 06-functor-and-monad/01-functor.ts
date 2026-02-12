/**
 * 第六章第一节: Functor（函子）
 * 
 * Functor 是函数式编程中最基本的抽象之一
 * 它描述了"可以被映射"的容器类型
 * 任何实现了 map 方法并遵守 Functor Laws 的类型都是 Functor
 * 
 * 核心思想：在不离开容器的情况下转换容器内的值
 */

console.log('=== Functor（函子）===\n');

// ============================================================================
// 1. 什么是 Functor？
// ============================================================================

console.log('1. 什么是 Functor？\n');

console.log('Functor 是一个容器类型，它实现了 map 方法');
console.log('map 允许我们对容器内的值应用函数，而不需要离开容器\n');

console.log('通俗类比：');
console.log('- Functor 就像一个透明的盒子');
console.log('- 你可以透过盒子对里面的值进行操作');
console.log('- 操作后值还在盒子里\n');

// ============================================================================
// 2. Functor 接口定义
// ============================================================================

console.log('2. Functor 接口定义\n');

/**
 * Functor 类型类接口
 * F 是高阶类型（Higher-Kinded Type），如 Option、Either、Array 等
 */
interface Functor<F> {
  /**
   * map 函数：将函数 f 应用到容器 F<A> 内的值上
   * 返回一个新的容器 F<B>
   */
  map<A, B>(f: (a: A) => B, fa: F<A>): F<B>;
}

// 在 TypeScript 中，我们为具体类型实现 map 方法
// 因为 TypeScript 不支持 Higher-Kinded Types

// ============================================================================
// 3. 实现 Functor：Box（最简单的 Functor）
// ============================================================================

console.log('3. 实现 Functor：Box\n');

/**
 * Box 是最简单的 Functor
 * 它只是一个包装值的容器
 */
class Box<A> {
  constructor(private value: A) {}

  // Functor 的 map 方法
  map<B>(f: (a: A) => B): Box<B> {
    return new Box(f(this.value));
  }

  // 辅助方法：获取值（非 Functor 接口的一部分）
  getValue(): A {
    return this.value;
  }

  // 辅助方法：toString（用于展示）
  toString(): string {
    return `Box(${this.value})`;
  }
}

// 创建 Box
const box1 = new Box(5);
console.log('原始 Box:', box1.toString());

// 使用 map 转换值
const box2 = box1.map(x => x * 2);
console.log('map(x => x * 2):', box2.toString());

// 链式 map
const box3 = box1
  .map(x => x * 2)
  .map(x => x + 10)
  .map(x => `结果: ${x}`);
console.log('链式 map:', box3.toString());
console.log();

// ============================================================================
// 4. Option 作为 Functor
// ============================================================================

console.log('4. Option 作为 Functor\n');

// 重用第五章的 Option 类型
type Option<T> = Some<T> | None;

interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

interface None {
  readonly _tag: 'None';
}

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None: Option<never> = { _tag: 'None' };

const isSome = <T>(option: Option<T>): option is Some<T> => 
  option._tag === 'Some';

// Option 的 map 实现
const mapOption = <A, B>(f: (a: A) => B) => (option: Option<A>): Option<B> => {
  if (isSome(option)) {
    return Some(f(option.value));
  }
  return None;
};

console.log('✅ Option 的 map 操作:');
const someValue = Some(10);
const noneValue = None;

console.log('Some(10).map(x => x * 2):', mapOption((x: number) => x * 2)(someValue));
console.log('None.map(x => x * 2):', mapOption((x: number) => x * 2)(noneValue));
console.log();

// ============================================================================
// 5. Either 作为 Functor
// ============================================================================

console.log('5. Either 作为 Functor\n');

// 重用第五章的 Either 类型
type Either<L, R> = Left<L> | Right<R>;

interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

const Left = <L>(left: L): Either<L, never> => ({ _tag: 'Left', left });
const Right = <R>(right: R): Either<never, R> => ({ _tag: 'Right', right });

const isRight = <L, R>(either: Either<L, R>): either is Right<R> =>
  either._tag === 'Right';

// Either 的 map 实现（只映射 Right 值）
const mapEither = <L, A, B>(f: (a: A) => B) => (either: Either<L, A>): Either<L, B> => {
  if (isRight(either)) {
    return Right(f(either.right));
  }
  return either as Either<L, B>;
};

console.log('✅ Either 的 map 操作:');
const rightValue = Right(20);
const leftValue = Left('错误信息');

console.log('Right(20).map(x => x * 2):', mapEither((x: number) => x * 2)(rightValue));
console.log('Left("错误").map(x => x * 2):', mapEither((x: number) => x * 2)(leftValue));
console.log();

// ============================================================================
// 6. Array 作为 Functor
// ============================================================================

console.log('6. Array 作为 Functor\n');

console.log('JavaScript 的 Array 内置了 map 方法，它就是一个 Functor!');

const numbers = [1, 2, 3, 4, 5];
console.log('原始数组:', numbers);

const doubled = numbers.map(x => x * 2);
console.log('map(x => x * 2):', doubled);

const squares = numbers.map(x => x * x);
console.log('map(x => x * x):', squares);
console.log();

// ============================================================================
// 7. Functor Laws（函子定律）
// ============================================================================

console.log('7. Functor Laws（函子定律）\n');

console.log('所有 Functor 必须遵守两个定律:\n');

// Law 1: Identity（恒等定律）
console.log('📜 定律 1: Identity Law（恒等定律）');
console.log('map(x => x)(fa) === fa');
console.log('映射恒等函数应该等于什么都不做\n');

const identity = <A>(a: A): A => a;

const boxForLaw1 = new Box(42);
const mapped = boxForLaw1.map(identity);
console.log('原始值:', boxForLaw1.getValue());
console.log('map(identity):', mapped.getValue());
console.log('相等?', boxForLaw1.getValue() === mapped.getValue());
console.log();

// Law 2: Composition（组合定律）
console.log('📜 定律 2: Composition Law（组合定律）');
console.log('map(f)(map(g)(fa)) === map(x => f(g(x)))(fa)');
console.log('先后 map 两次 = 一次 map 组合函数\n');

const f = (x: number) => x * 2;
const g = (x: number) => x + 10;
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A) => f(g(a));

const boxForLaw2 = new Box(5);

// 方式1: 先 map g，再 map f
const way1 = boxForLaw2.map(g).map(f);
console.log('方式1 - 先 map(g) 再 map(f):', way1.getValue());

// 方式2: 一次 map 组合函数
const way2 = boxForLaw2.map(compose(f, g));
console.log('方式2 - map(f ∘ g):', way2.getValue());

console.log('相等?', way1.getValue() === way2.getValue());
console.log();

// ============================================================================
// 8. 实战场景：用户数据转换
// ============================================================================

console.log('8. 实战场景：用户数据转换\n');

interface User {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
}

interface UserDTO {
  id: number;
  fullName: string;
  isAdult: boolean;
}

// 转换函数
const userToDTO = (user: User): UserDTO => ({
  id: user.id,
  fullName: `${user.firstName} ${user.lastName}`,
  isAdult: user.age >= 18,
});

// 使用 Option Functor 处理可能不存在的用户
const findUser = (id: number): Option<User> => {
  const users: User[] = [
    { id: 1, firstName: '张', lastName: '三', age: 28 },
    { id: 2, firstName: '李', lastName: '四', age: 16 },
  ];
  const user = users.find(u => u.id === id);
  return user ? Some(user) : None;
};

// 使用 map 转换
const getUserDTO = (id: number): Option<UserDTO> => {
  return mapOption(userToDTO)(findUser(id));
};

console.log('✅ 使用 Functor 转换用户数据:');
console.log('用户 1 的 DTO:', getUserDTO(1));
console.log('用户 999 的 DTO:', getUserDTO(999));
console.log();

// ============================================================================
// 9. 实战场景：API 响应处理
// ============================================================================

console.log('9. 实战场景：API 响应处理\n');

interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
}

// 将 API 响应转换为 Either
const parseResponse = <T>(response: ApiResponse<T>): Either<string, T> => {
  if (response.status === 200 && response.data !== undefined) {
    return Right(response.data);
  }
  return Left(response.error || '未知错误');
};

// 模拟 API 调用
const fetchUserData = (id: number): ApiResponse<User> => {
  if (id === 1) {
    return {
      status: 200,
      data: { id: 1, firstName: '王', lastName: '五', age: 30 },
    };
  }
  return { status: 404, error: '用户不存在' };
};

// 使用 Functor 转换 API 响应
const getUserName = (id: number): Either<string, string> => {
  const response = fetchUserData(id);
  const userEither = parseResponse(response);
  // 使用 map 提取用户名
  return mapEither((user: User) => `${user.firstName}${user.lastName}`)(userEither);
};

console.log('✅ 使用 Functor 处理 API 响应:');
console.log('用户 1:', getUserName(1));
console.log('用户 999:', getUserName(999));
console.log();

// ============================================================================
// 10. 自定义 Functor：Tree
// ============================================================================

console.log('10. 自定义 Functor：Tree\n');

/**
 * Tree 是一个递归的 Functor
 * 它可以是一个叶子节点或者一个分支节点
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

const Leaf = <A>(value: A): Tree<A> => ({ _tag: 'Leaf', value });

const Branch = <A>(left: Tree<A>, right: Tree<A>): Tree<A> => ({
  _tag: 'Branch',
  left,
  right,
});

// Tree 的 map 实现（递归）
const mapTree = <A, B>(f: (a: A) => B) => (tree: Tree<A>): Tree<B> => {
  if (tree._tag === 'Leaf') {
    return Leaf(f(tree.value));
  }
  // 递归地映射左右子树
  return Branch(
    mapTree(f)(tree.left),
    mapTree(f)(tree.right)
  );
};

// 辅助函数：将 Tree 转换为字符串
const treeToString = <A>(tree: Tree<A>): string => {
  if (tree._tag === 'Leaf') {
    return `Leaf(${tree.value})`;
  }
  return `Branch(${treeToString(tree.left)}, ${treeToString(tree.right)})`;
};

// 创建一个树
//       10
//      /  \
//     5    15
const tree: Tree<number> = Branch(
  Leaf(5),
  Branch(Leaf(10), Leaf(15))
);

console.log('原始树:', treeToString(tree));

// 使用 map 转换树中所有的值
const doubledTree = mapTree((x: number) => x * 2)(tree);
console.log('所有值乘以 2:', treeToString(doubledTree));

const squaredTree = mapTree((x: number) => x * x)(tree);
console.log('所有值平方:', treeToString(squaredTree));
console.log();

// ============================================================================
// 11. Functor 的实际应用模式
// ============================================================================

console.log('11. Functor 的实际应用模式\n');

// 模式 1: 管道式转换
console.log('模式 1: 管道式转换');

interface Product {
  name: string;
  price: number;
}

const formatProduct = (product: Product): string =>
  `${product.name}: ¥${product.price.toFixed(2)}`;

const applyDiscount = (rate: number) => (product: Product): Product => ({
  ...product,
  price: product.price * (1 - rate),
});

const product = Some({ name: 'iPhone', price: 5999 });

const discountedFormatted = mapOption(formatProduct)(
  mapOption(applyDiscount(0.2))(product)
);

console.log('折后格式化:', discountedFormatted);
console.log();

// 模式 2: 统一错误处理
console.log('模式 2: 统一错误处理');

const parseNumber = (str: string): Either<string, number> => {
  const num = parseFloat(str);
  return isNaN(num) ? Left('无效的数字') : Right(num);
};

const calculate = (input: string): Either<string, string> => {
  return mapEither((n: number) => `结果是 ${n * 2}`)(parseNumber(input));
};

console.log('计算 "42":', calculate('42'));
console.log('计算 "abc":', calculate('abc'));
console.log();

// ============================================================================
// 12. Functor vs 传统方式对比
// ============================================================================

console.log('12. Functor vs 传统方式对比\n');

console.log('❌ 传统方式: 需要手动检查和解包');
console.log(`
function processUser(userOpt: Option<User>): Option<string> {
  if (userOpt._tag === 'Some') {
    const user = userOpt.value;
    const fullName = user.firstName + ' ' + user.lastName;
    return Some(fullName);
  }
  return None;
}
`);

console.log('✅ Functor 方式: 声明式，无需手动检查');
console.log(`
const processUser = (userOpt: Option<User>): Option<string> =>
  mapOption(user => user.firstName + ' ' + user.lastName)(userOpt);
`);
console.log();

console.log('=== Functor 总结 ===');
console.log('Functor 提供了统一的 map 接口');
console.log('可以在不离开容器的情况下转换值');
console.log('必须遵守恒等定律和组合定律');
console.log('是更高级抽象（Applicative、Monad）的基础');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  Box,
  // Option
  type Option,
  Some,
  None,
  isSome,
  mapOption,
  // Either
  type Either,
  Left,
  Right,
  isRight,
  mapEither,
  // Tree
  type Tree,
  Leaf,
  Branch,
  mapTree,
  treeToString,
};
