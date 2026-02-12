/**
 * 第七章第三节: TaskEither
 * 
 * TaskEither<E, A> 结合了 Task 和 Either
 * 用于处理可能失败的异步操作
 * 
 * TaskEither = Task + Either
 * - Task: 异步计算
 * - Either: 错误处理
 * 
 * 这是最实用的 Monad 组合之一！
 */

console.log('=== TaskEither ===\n');

// 重用 Either 类型
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

// ============================================================================
// 1. 为什么需要 TaskEither？
// ============================================================================

console.log('1. 为什么需要 TaskEither？\n');

console.log('问题：异步操作通常会失败，我们需要同时处理:');
console.log('  1. 异步性 (Task)');
console.log('  2. 可能的错误 (Either)');
console.log();

console.log('解决方案: TaskEither<E, A>');
console.log('  - 异步计算: 像 Task');
console.log('  - 错误处理: 像 Either');
console.log('  - 最佳组合: Railway-Oriented Programming + 异步');
console.log();

// ============================================================================
// 2. TaskEither 的定义
// ============================================================================

console.log('2. TaskEither 的定义\n');

/**
 * TaskEither<E, A> 表示一个异步计算
 * 可能产生类型 A 的成功值，或类型 E 的错误
 */
class TaskEither<E, A> {
  constructor(private computation: () => Promise<Either<E, A>>) {}

  /**
   * Functor: map
   * 只转换成功值（Right）
   */
  map<B>(f: (a: A) => B): TaskEither<E, B> {
    return new TaskEither(() =>
      this.computation().then(either =>
        isRight(either) ? Right(f(either.right)) : either
      )
    );
  }

  /**
   * 转换错误值（Left）
   */
  mapLeft<E2>(f: (e: E) => E2): TaskEither<E2, A> {
    return new TaskEither(() =>
      this.computation().then(either =>
        either._tag === 'Left' ? Left(f(either.left)) : either as Either<E2, A>
      )
    );
  }

  /**
   * Monad: flatMap
   * 链式组合 TaskEither
   */
  flatMap<B>(f: (a: A) => TaskEither<E, B>): TaskEither<E, B> {
    return new TaskEither(() =>
      this.computation().then(either =>
        isRight(either) ? f(either.right).run() : either
      )
    );
  }

  /**
   * 错误恢复
   */
  orElse<E2>(f: (e: E) => TaskEither<E2, A>): TaskEither<E2, A> {
    return new TaskEither(() =>
      this.computation().then(either =>
        either._tag === 'Left' ? f(either.left).run() : either as Either<E2, A>
      )
    );
  }

  /**
   * fold: 处理两种情况
   */
  fold<B>(onLeft: (e: E) => B, onRight: (a: A) => B): Promise<B> {
    return this.computation().then(either =>
      either._tag === 'Left' ? onLeft(either.left) : onRight(either.right)
    );
  }

  /**
   * 执行异步计算
   */
  run(): Promise<Either<E, A>> {
    return this.computation();
  }
}

// 辅助函数
const rightTask = <E, A>(a: A): TaskEither<E, A> => {
  return new TaskEither(() => Promise.resolve(Right(a)));
};

const leftTask = <E, A>(e: E): TaskEither<E, A> => {
  return new TaskEither(() => Promise.resolve(Left(e)));
};

// 从 Either 创建 TaskEither
const fromEither = <E, A>(either: Either<E, A>): TaskEither<E, A> => {
  return new TaskEither(() => Promise.resolve(either));
};

// 捕获异常
const tryCatch = <E, A>(
  f: () => Promise<A>,
  onError: (error: unknown) => E
): TaskEither<E, A> => {
  return new TaskEither(async () => {
    try {
      const result = await f();
      return Right(result);
    } catch (error) {
      return Left(onError(error));
    }
  });
};

console.log('✅ TaskEither Monad 实现完成');
console.log();

// ============================================================================
// 3. 基本示例
// ============================================================================

console.log('3. 基本示例\n');

const divide = (a: number, b: number): TaskEither<string, number> => {
  if (b === 0) {
    return leftTask('除数不能为0');
  }
  return rightTask(a / b);
};

console.log('✅ 基本除法操作:');
console.log('10 / 2 =', await divide(10, 2).run());
console.log('10 / 0 =', await divide(10, 0).run());
console.log();

// ============================================================================
// 4. 实战场景：API 请求
// ============================================================================

console.log('4. 实战场景：API 请求\n');

interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟 API 错误类型
type ApiError = 
  | { type: 'NetworkError'; message: string }
  | { type: 'NotFound'; id: number }
  | { type: 'Unauthorized' };

// 模拟 HTTP 请求
const fetchUserApi = (id: number): TaskEither<ApiError, User> => {
  return tryCatch(
    async () => {
      console.log(`  [API] 请求用户 ${id}`);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (id === 999) {
        throw new Error('User not found');
      }
      
      return {
        id,
        name: `User${id}`,
        email: `user${id}@example.com`,
      };
    },
    (error) => {
      if ((error as Error).message === 'User not found') {
        return { type: 'NotFound', id };
      }
      return { type: 'NetworkError', message: String(error) };
    }
  );
};

console.log('✅ API 请求（成功）:');
const userResult1 = await fetchUserApi(1).run();
console.log(userResult1);

console.log('\n✅ API 请求（失败）:');
const userResult2 = await fetchUserApi(999).run();
console.log(userResult2);
console.log();

// ============================================================================
// 5. 链式操作
// ============================================================================

console.log('5. 链式操作\n');

interface Post {
  id: number;
  userId: number;
  title: string;
}

const fetchUserPosts = (userId: number): TaskEither<ApiError, Post[]> => {
  return tryCatch(
    async () => {
      console.log(`  [API] 请求用户 ${userId} 的文章`);
      await new Promise(resolve => setTimeout(resolve, 150));
      return [
        { id: 1, userId, title: `Post 1 by User ${userId}` },
        { id: 2, userId, title: `Post 2 by User ${userId}` },
      ];
    },
    (error) => ({ type: 'NetworkError', message: String(error) })
  );
};

const getLatestPost = (posts: Post[]): Either<ApiError, Post> => {
  if (posts.length === 0) {
    return Left({ type: 'NetworkError', message: 'No posts found' });
  }
  return Right(posts[0]);
};

// 组合：获取用户的最新文章
const getUserLatestPost = (userId: number): TaskEither<ApiError, Post> => {
  return fetchUserApi(userId)
    .flatMap(user => fetchUserPosts(user.id))
    .flatMap(posts => fromEither(getLatestPost(posts)));
};

console.log('✅ 获取用户最新文章:');
const latestPost = await getUserLatestPost(1).run();
console.log(latestPost);
console.log();

// ============================================================================
// 6. 实战场景：数据库操作
// ============================================================================

console.log('6. 实战场景：数据库操作\n');

type DbError =
  | { type: 'ConnectionError'; message: string }
  | { type: 'QueryError'; sql: string }
  | { type: 'NotFound' };

interface DbRow {
  id: number;
  name: string;
  value: string;
}

const queryDatabase = (sql: string): TaskEither<DbError, DbRow[]> => {
  return tryCatch(
    async () => {
      console.log(`  [DB] 执行查询: ${sql}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟数据
      return [
        { id: 1, name: 'config1', value: 'value1' },
        { id: 2, name: 'config2', value: 'value2' },
      ];
    },
    (error) => ({ type: 'QueryError', sql })
  );
};

const findById = (id: number): TaskEither<DbError, DbRow> => {
  return queryDatabase(`SELECT * FROM config WHERE id = ${id}`)
    .flatMap(rows => {
      const row = rows.find(r => r.id === id);
      if (!row) {
        return leftTask({ type: 'NotFound' });
      }
      return rightTask(row);
    });
};

console.log('✅ 数据库查询:');
const dbResult = await findById(1).run();
console.log(dbResult);
console.log();

// ============================================================================
// 7. 错误恢复
// ============================================================================

console.log('7. 错误恢复\n');

const fetchWithFallback = (id: number): TaskEither<ApiError, User> => {
  return fetchUserApi(id)
    .orElse(error => {
      console.log(`  [Fallback] 主请求失败，使用缓存`);
      // 使用缓存数据
      return rightTask({
        id,
        name: 'Cached User',
        email: 'cached@example.com',
      });
    });
};

console.log('✅ 错误恢复（主请求失败，使用fallback）:');
const fallbackResult = await fetchWithFallback(999).run();
console.log(fallbackResult);
console.log();

// ============================================================================
// 8. 实战场景：完整的业务流程
// ============================================================================

console.log('8. 实战场景：完整的业务流程\n');

interface Order {
  id: string;
  userId: number;
  amount: number;
}

interface Payment {
  orderId: string;
  amount: number;
  status: 'success' | 'failed';
}

type BusinessError =
  | { type: 'ValidationError'; message: string }
  | { type: 'PaymentError'; message: string }
  | { type: 'DatabaseError'; message: string };

const validateOrder = (order: Order): Either<BusinessError, Order> => {
  if (order.amount <= 0) {
    return Left({ type: 'ValidationError', message: '金额必须大于0' });
  }
  if (order.amount > 100000) {
    return Left({ type: 'ValidationError', message: '金额超出限制' });
  }
  return Right(order);
};

const processPayment = (order: Order): TaskEither<BusinessError, Payment> => {
  return tryCatch(
    async () => {
      console.log(`  [Payment] 处理订单 ${order.id} 的支付`);
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        orderId: order.id,
        amount: order.amount,
        status: 'success' as const,
      };
    },
    () => ({ type: 'PaymentError', message: '支付失败' })
  );
};

const saveOrder = (payment: Payment): TaskEither<BusinessError, void> => {
  return tryCatch(
    async () => {
      console.log(`  [DB] 保存订单 ${payment.orderId}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    () => ({ type: 'DatabaseError', message: '保存失败' })
  );
};

const sendConfirmation = (orderId: string): TaskEither<BusinessError, void> => {
  return tryCatch(
    async () => {
      console.log(`  [Email] 发送确认邮件 for ${orderId}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    () => ({ type: 'DatabaseError', message: '邮件发送失败' })
  );
};

// 完整的订单处理流程
const processOrderComplete = (order: Order): TaskEither<BusinessError, void> => {
  return fromEither(validateOrder(order))
    .flatMap(processPayment)
    .flatMap(payment => {
      return saveOrder(payment)
        .flatMap(() => sendConfirmation(payment.orderId));
    });
};

console.log('✅ 完整订单处理流程（成功）:');
const order1: Order = { id: 'O001', userId: 1, amount: 299 };
const result1 = await processOrderComplete(order1).run();
console.log('结果:', result1);

console.log('\n✅ 完整订单处理流程（失败 - 金额无效）:');
const order2: Order = { id: 'O002', userId: 2, amount: -10 };
const result2 = await processOrderComplete(order2).run();
console.log('结果:', result2);
console.log();

// ============================================================================
// 9. TaskEither 工具函数
// ============================================================================

console.log('9. TaskEither 工具函数\n');

/**
 * sequence: 将 TaskEither 数组转换为数组的 TaskEither
 */
const sequence = <E, A>(tasks: TaskEither<E, A>[]): TaskEither<E, A[]> => {
  return new TaskEither(async () => {
    const results: A[] = [];
    for (const task of tasks) {
      const either = await task.run();
      if (either._tag === 'Left') {
        return either;
      }
      results.push(either.right);
    }
    return Right(results);
  });
};

/**
 * parallel: 并行执行多个 TaskEither
 */
const parallel = <E, A>(tasks: TaskEither<E, A>[]): TaskEither<E, A[]> => {
  return new TaskEither(async () => {
    const results = await Promise.all(tasks.map(t => t.run()));
    const errors = results.filter(r => r._tag === 'Left');
    
    if (errors.length > 0) {
      return errors[0] as Either<E, A[]>;
    }
    
    return Right(results.map(r => (r as Right<A>).right));
  });
};

console.log('✅ 并行获取多个用户:');
const userTasks = [1, 2, 3].map(fetchUserApi);
const allUsers = await parallel(userTasks).run();
console.log('获取结果:', allUsers);
console.log();

console.log('=== TaskEither 总结 ===');
console.log('TaskEither 结合了 Task 和 Either');
console.log('完美适合处理异步 + 可能失败的操作');
console.log('提供了 Railway-Oriented Programming for async');
console.log('是最实用的 Monad 组合之一');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  TaskEither,
  type Either,
  Left,
  Right,
  isRight,
  rightTask,
  leftTask,
  fromEither,
  tryCatch,
  sequence,
  parallel,
};
