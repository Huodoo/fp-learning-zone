/**
 * 第六章练习：Functor 和 Monad 综合练习
 * 
 * 本练习涵盖:
 * 1. Functor 的实现和使用
 * 2. Applicative 的应用
 * 3. Monad 的链式操作
 * 4. do-notation 的实战应用
 * 5. 实际业务场景
 */

import { Option, Some, None, isSome } from './01-functor';
import { Either, Right, Left, isRight } from './01-functor';
import { Do, DoEither } from './05-do-notation';

console.log('=== 第六章综合练习 ===\n');

// ============================================================================
// 练习 1: 实现 Tree Functor
// ============================================================================

console.log('练习 1: 实现 Tree Functor\n');

/**
 * 任务：为二叉树实现 Functor
 * 要求：实现 map 方法，能够转换树中所有节点的值
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

// TODO: 实现 mapTree
const mapTree = <A, B>(f: (a: A) => B) => (tree: Tree<A>): Tree<B> => {
  if (tree._tag === 'Leaf') {
    return Leaf(f(tree.value));
  }
  return Branch(
    mapTree(f)(tree.left),
    mapTree(f)(tree.right)
  );
};

// 测试
const numberTree = Branch(
  Leaf(1),
  Branch(Leaf(2), Leaf(3))
);

console.log('✅ 测试 Tree Functor:');

const doubledTree = mapTree((x: number) => x * 2)(numberTree);
console.log('原始树:', JSON.stringify(numberTree));
console.log('所有值*2:', JSON.stringify(doubledTree));

const stringTree = mapTree((x: number) => `数字${x}`)(numberTree);
console.log('转换为字符串:', JSON.stringify(stringTree));
console.log();

// ============================================================================
// 练习 2: 实现购物车的 Applicative 验证
// ============================================================================

console.log('练习 2: 实现购物车的 Applicative 验证\n');

/**
 * 任务：使用 Applicative 验证购物车
 * 要求：验证商品数量、价格、折扣码，并组合结果
 */

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  discountCode?: string;
}

interface ValidatedCart {
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  finalPrice: number;
}

// 验证函数
const validateQuantity = (quantity: number): Either<string, number> =>
  quantity > 0 && quantity <= 100
    ? Right(quantity)
    : Left(`数量 ${quantity} 无效（1-100）`);

const validatePrice = (price: number): Either<string, number> =>
  price > 0 && price <= 100000
    ? Right(price)
    : Left(`价格 ${price} 无效`);

const validateDiscountCode = (code?: string): Either<string, number> => {
  if (!code) return Right(0);
  
  const discounts: Record<string, number> = {
    'SAVE10': 0.1,
    'SAVE20': 0.2,
    'VIP30': 0.3,
  };
  
  const discount = discounts[code];
  return discount !== undefined
    ? Right(discount)
    : Left(`折扣码 ${code} 无效`);
};

// TODO: 使用 liftA3 或 do-notation 实现验证
const validateCart = (item: CartItem): Either<string, ValidatedCart> => {
  return DoEither(function*() {
    const quantity = yield* validateQuantity(item.quantity);
    const price = yield* validatePrice(item.price);
    const discount = yield* validateDiscountCode(item.discountCode);
    
    const finalPrice = price * quantity * (1 - discount);
    
    return {
      productId: item.productId,
      quantity,
      price,
      discount,
      finalPrice,
    };
  });
};

console.log('✅ 测试购物车验证:');

const validItem: CartItem = {
  productId: 'P001',
  quantity: 2,
  price: 299,
  discountCode: 'SAVE20',
};
console.log('有效商品:', validateCart(validItem));

const invalidQuantity: CartItem = {
  productId: 'P002',
  quantity: 0,
  price: 299,
};
console.log('\n数量无效:', validateCart(invalidQuantity));

const invalidDiscount: CartItem = {
  productId: 'P003',
  quantity: 1,
  price: 299,
  discountCode: 'INVALID',
};
console.log('\n折扣码无效:', validateCart(invalidDiscount));
console.log();

// ============================================================================
// 练习 3: 实现数据库查询 Monad 链
// ============================================================================

console.log('练习 3: 实现数据库查询 Monad 链\n');

/**
 * 任务：实现一个博客系统的数据查询
 * 要求：用户 -> 文章列表 -> 最新文章 -> 评论
 */

interface BlogUser {
  id: number;
  username: string;
  postIds: number[];
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: number;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  text: string;
}

// 模拟数据库
const blogUsers: BlogUser[] = [
  { id: 1, username: 'alice', postIds: [101, 102, 103] },
  { id: 2, username: 'bob', postIds: [201] },
];

const posts: Post[] = [
  { id: 101, title: 'Hello World', content: '...', authorId: 1, createdAt: 1000 },
  { id: 102, title: 'FP is great', content: '...', authorId: 1, createdAt: 2000 },
  { id: 103, title: 'Monad Tutorial', content: '...', authorId: 1, createdAt: 3000 },
  { id: 201, title: 'My First Post', content: '...', authorId: 2, createdAt: 1500 },
];

const comments: Comment[] = [
  { id: 1, postId: 103, userId: 2, text: '写得很好！' },
  { id: 2, postId: 103, userId: 1, text: '谢谢！' },
  { id: 3, postId: 102, userId: 2, text: '同意' },
];

const findBlogUser = (id: number): Option<BlogUser> => {
  const user = blogUsers.find(u => u.id === id);
  return user ? Some(user) : None;
};

const findPost = (id: number): Option<Post> => {
  const post = posts.find(p => p.id === id);
  return post ? Some(post) : None;
};

const getLatestPost = (user: BlogUser): Option<Post> => {
  if (user.postIds.length === 0) return None;
  
  const userPosts = posts.filter(p => user.postIds.includes(p.id));
  const latest = userPosts.sort((a, b) => b.createdAt - a.createdAt)[0];
  
  return latest ? Some(latest) : None;
};

const getComments = (post: Post): Comment[] => {
  return comments.filter(c => c.postId === post.id);
};

// TODO: 使用 do-notation 实现查询链
const getUserLatestPostWithComments = (
  userId: number
): Option<{ post: Post; commentCount: number }> => {
  return Do(function*() {
    const user = yield* findBlogUser(userId);
    const latestPost = yield* getLatestPost(user);
    const postComments = getComments(latestPost);
    
    return {
      post: latestPost,
      commentCount: postComments.length,
    };
  });
};

console.log('✅ 测试博客查询链:');
console.log('用户1的最新文章:', getUserLatestPostWithComments(1));
console.log('用户2的最新文章:', getUserLatestPostWithComments(2));
console.log('用户999的最新文章:', getUserLatestPostWithComments(999));
console.log();

// ============================================================================
// 练习 4: 实现配置加载系统
// ============================================================================

console.log('练习 4: 实现配置加载系统\n');

/**
 * 任务：实现一个支持多数据源的配置加载系统
 * 要求：依次尝试多个配置源，返回第一个成功的
 */

interface Config {
  apiEndpoint: string;
  timeout: number;
  retries: number;
}

// 模拟配置源
const configSources = {
  environment: (): Option<Partial<Config>> => None,  // 环境变量（空）
  file: (): Option<Partial<Config>> => None,  // 配置文件（不存在）
  remote: (): Option<Partial<Config>> => Some({  // 远程配置
    apiEndpoint: 'https://api.example.com',
    timeout: 5000,
  }),
  default: (): Option<Partial<Config>> => Some({  // 默认配置
    apiEndpoint: 'https://default.example.com',
    timeout: 3000,
    retries: 3,
  }),
};

const orElse = <A>(
  alternative: () => Option<A>
) => (option: Option<A>): Option<A> => {
  return isSome(option) ? option : alternative();
};

const mergeConfigs = (base: Partial<Config>, override: Partial<Config>): Config => ({
  apiEndpoint: override.apiEndpoint || base.apiEndpoint || 'https://localhost',
  timeout: override.timeout || base.timeout || 3000,
  retries: override.retries || base.retries || 3,
});

// TODO: 实现配置加载逻辑
const loadConfig = (): Option<Config> => {
  return Do(function*() {
    // 尝试各个配置源
    const envConfig = configSources.environment();
    const fileConfig = configSources.file();
    const remoteConfig = configSources.remote();
    const defaultConfig = yield* configSources.default();
    
    // 合并配置（优先级从高到低）
    let config = defaultConfig;
    if (isSome(remoteConfig)) {
      config = mergeConfigs(config, remoteConfig.value);
    }
    if (isSome(fileConfig)) {
      config = mergeConfigs(config, fileConfig.value);
    }
    if (isSome(envConfig)) {
      config = mergeConfigs(config, envConfig.value);
    }
    
    return config;
  });
};

console.log('✅ 测试配置加载:');
console.log('加载的配置:', loadConfig());
console.log();

// ============================================================================
// 练习 5: 实现 JSON 解析和验证
// ============================================================================

console.log('练习 5: 实现 JSON 解析和验证\n');

/**
 * 任务：解析 JSON 并验证字段
 * 要求：使用 Either 处理解析错误和验证错误
 */

interface UserData {
  name: string;
  email: string;
  age: number;
}

const parseJSON = <T>(json: string): Either<string, T> => {
  try {
    const data = JSON.parse(json);
    return Right(data);
  } catch (error) {
    return Left(`JSON 解析失败: ${error}`);
  }
};

const validateUserData = (data: any): Either<string, UserData> => {
  return DoEither(function*() {
    // 验证字段存在
    if (typeof data.name !== 'string') {
      return yield* Left('name 字段必须是字符串');
    }
    if (typeof data.email !== 'string') {
      return yield* Left('email 字段必须是字符串');
    }
    if (typeof data.age !== 'number') {
      return yield* Left('age 字段必须是数字');
    }
    
    // 验证字段有效性
    const name = yield* (data.name.length >= 2
      ? Right(data.name)
      : Left('name 至少2个字符'));
    
    const email = yield* (data.email.includes('@')
      ? Right(data.email)
      : Left('email 格式无效'));
    
    const age = yield* (data.age >= 18 && data.age <= 120
      ? Right(data.age)
      : Left('age 必须在18-120之间'));
    
    return { name, email, age };
  });
};

// TODO: 组合解析和验证
const parseAndValidateUser = (json: string): Either<string, UserData> => {
  return DoEither(function*() {
    const data = yield* parseJSON(json);
    const validated = yield* validateUserData(data);
    return validated;
  });
};

console.log('✅ 测试 JSON 解析和验证:');

const validJSON = '{"name":"张三","email":"zhang@example.com","age":25}';
console.log('有效 JSON:', parseAndValidateUser(validJSON));

const invalidJSON = '{"name":"A","email":"invalid","age":15}';
console.log('\n无效数据:', parseAndValidateUser(invalidJSON));

const malformedJSON = '{invalid json}';
console.log('\n格式错误:', parseAndValidateUser(malformedJSON));
console.log();

// ============================================================================
// 练习 6: 实现文件路径解析器
// ============================================================================

console.log('练习 6: 实现文件路径解析器\n');

/**
 * 任务：解析文件路径并提取信息
 * 要求：路径格式 /dir1/dir2/filename.ext
 */

interface ParsedPath {
  directory: string;
  filename: string;
  extension: string;
}

const parsePath = (path: string): Either<string, ParsedPath> => {
  return DoEither(function*() {
    // 检查路径格式
    if (!path.startsWith('/')) {
      return yield* Left('路径必须以 / 开头');
    }
    
    const parts = path.split('/').filter(p => p.length > 0);
    
    if (parts.length === 0) {
      return yield* Left('路径为空');
    }
    
    const filename = parts[parts.length - 1];
    const directory = '/' + parts.slice(0, -1).join('/');
    
    // 解析文件名和扩展名
    const dotIndex = filename.lastIndexOf('.');
    
    if (dotIndex === -1) {
      return yield* Left('文件名必须包含扩展名');
    }
    
    const name = filename.substring(0, dotIndex);
    const extension = filename.substring(dotIndex + 1);
    
    if (name.length === 0) {
      return yield* Left('文件名不能为空');
    }
    
    if (extension.length === 0) {
      return yield* Left('扩展名不能为空');
    }
    
    return {
      directory,
      filename: name,
      extension,
    };
  });
};

console.log('✅ 测试路径解析:');
console.log('/home/user/document.pdf:', parsePath('/home/user/document.pdf'));
console.log('/etc/config.json:', parsePath('/etc/config.json'));
console.log('invalid/path:', parsePath('invalid/path'));
console.log('/no-extension:', parsePath('/no-extension'));
console.log();

// ============================================================================
// 练习 7: 实现简单的状态机
// ============================================================================

console.log('练习 7: 实现简单的状态机（订单状态转换）\n');

/**
 * 任务：实现订单状态转换
 * 状态: Pending -> Confirmed -> Shipped -> Delivered
 */

type OrderState = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';

interface Order {
  id: string;
  state: OrderState;
}

const confirmOrder = (order: Order): Either<string, Order> => {
  if (order.state === 'Pending') {
    return Right({ ...order, state: 'Confirmed' });
  }
  return Left(`无法确认订单，当前状态: ${order.state}`);
};

const shipOrder = (order: Order): Either<string, Order> => {
  if (order.state === 'Confirmed') {
    return Right({ ...order, state: 'Shipped' });
  }
  return Left(`无法发货，当前状态: ${order.state}`);
};

const deliverOrder = (order: Order): Either<string, Order> => {
  if (order.state === 'Shipped') {
    return Right({ ...order, state: 'Delivered' });
  }
  return Left(`无法标记为已送达，当前状态: ${order.state}`);
};

// TODO: 使用 Monad 链完成订单流程
const processOrderFlow = (order: Order): Either<string, Order> => {
  return DoEither(function*() {
    const confirmed = yield* confirmOrder(order);
    const shipped = yield* shipOrder(confirmed);
    const delivered = yield* deliverOrder(shipped);
    return delivered;
  });
};

console.log('✅ 测试订单状态转换:');

const newOrder: Order = { id: 'O001', state: 'Pending' };
console.log('新订单处理:', processOrderFlow(newOrder));

const shippedOrder: Order = { id: 'O002', state: 'Shipped' };
console.log('\n已发货订单处理:', processOrderFlow(shippedOrder));
console.log();

// ============================================================================
// 练习 8: 实现异步操作模拟（使用 Promise Monad）
// ============================================================================

console.log('练习 8: Promise 是 Monad\n');

console.log('Promise 的 then 就是 flatMap！');

/**
 * 任务：演示 Promise 作为 Monad
 */

const fetchUser = (id: number): Promise<{ id: number; name: string }> => {
  return Promise.resolve({ id, name: `User${id}` });
};

const fetchPosts = (userId: number): Promise<string[]> => {
  return Promise.resolve([`Post1 by ${userId}`, `Post2 by ${userId}`]);
};

const processUserPosts = async (userId: number): Promise<string> => {
  // Promise 的 flatMap 就是 then
  return fetchUser(userId)
    .then(user => fetchPosts(user.id))  // flatMap!
    .then(posts => `用户有 ${posts.length} 篇文章`);
};

console.log('✅ Promise Monad 示例:');
processUserPosts(1).then(result => console.log(result));

console.log();
console.log('Promise.then 等价于 flatMap:');
console.log('  promise.then(f) === flatMap(f)(promise)');
console.log('  async/await 就是 Promise 的 do-notation!');
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 练习总结 ===\n');

console.log('通过这些练习，你应该掌握了:');
console.log('✅ 为自定义类型实现 Functor');
console.log('✅ 使用 Applicative 组合独立的验证');
console.log('✅ 使用 Monad 处理依赖链');
console.log('✅ 使用 do-notation 简化代码');
console.log('✅ 在实际业务中应用这些抽象');
console.log();

console.log('关键要点:');
console.log('1. Functor (map): 用于简单的值转换');
console.log('2. Applicative (ap): 用于组合多个独立计算');
console.log('3. Monad (flatMap): 用于依赖链式计算');
console.log('4. do-notation: 让 Monad 代码更易读');
console.log();
