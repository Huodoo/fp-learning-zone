/**
 * 第七章第二节: Task Monad
 * 
 * Task 是异步版本的 IO
 * 类似 Promise，但是"懒惰"的 - 只有调用 run() 才会开始执行
 * 
 * Task 相比 Promise 的优势:
 * 1. 延迟执行（不会立即开始）
 * 2. 可重复运行
 * 3. 更容易取消
 * 4. 更好的组合性
 */

console.log('=== Task Monad ===\n');

// ============================================================================
// 1. Promise 的问题
// ============================================================================

console.log('1. Promise 的问题\n');

console.log('❌ Promise 的问题:');
console.log('1. 立即执行 - 创建时就开始计算');
console.log('2. 不可重用 - 只能获取一次结果');
console.log('3. 难以取消');
console.log('4. 缺乏 referential transparency');
console.log();

// Promise 立即开始执行
console.log('示例: Promise 立即执行');
const promise = new Promise((resolve) => {
  console.log('  → Promise 开始执行（在创建时）');
  setTimeout(() => resolve('结果'), 100);
});
console.log('Promise 已创建，但我们还没调用 then');

// 等待演示完成
await new Promise(resolve => setTimeout(resolve, 150));
console.log();

// ============================================================================
// 2. Task Monad 的定义
// ============================================================================

console.log('2. Task Monad 的定义\n');

/**
 * Task<A> 表示一个异步计算，最终产生类型 A 的值
 * 
 * 关键特性:
 * - 延迟执行: 只有调用 run() 才开始计算
 * - 可重用: 可以多次调用 run()
 * - 可组合: 实现 Functor、Applicative、Monad
 */
class Task<A> {
  constructor(private computation: () => Promise<A>) {}

  /**
   * Functor: map
   * 转换 Task 中的值
   */
  map<B>(f: (a: A) => B): Task<B> {
    return new Task(() =>
      this.computation().then(a => f(a))
    );
  }

  /**
   * Monad: flatMap
   * 链式组合 Task
   */
  flatMap<B>(f: (a: A) => Task<B>): Task<B> {
    return new Task(() =>
      this.computation().then(a => f(a).run())
    );
  }

  /**
   * Applicative: ap
   */
  ap<B>(tf: Task<(a: A) => B>): Task<B> {
    return tf.flatMap(f => this.map(f));
  }

  /**
   * 执行异步计算
   */
  run(): Promise<A> {
    return this.computation();
  }
}

// 辅助函数
const pureTask = <A>(a: A): Task<A> => {
  return new Task(() => Promise.resolve(a));
};

console.log('✅ Task Monad 实现完成');
console.log();

// ============================================================================
// 3. Task vs Promise 对比
// ============================================================================

console.log('3. Task vs Promise 对比\n');

console.log('创建 Task（不会立即执行）:');
const task = new Task(() => {
  console.log('  → Task 开始执行');
  return Promise.resolve('Task 结果');
});
console.log('Task 已创建，但还没执行\n');

console.log('现在执行 Task:');
await task.run();

console.log('\n可以重复执行同一个 Task:');
await task.run();
console.log();

// ============================================================================
// 4. 基本示例：延迟执行
// ============================================================================

console.log('4. 基本示例：延迟执行\n');

const delay = (ms: number): Task<void> => {
  return new Task(() => new Promise(resolve => setTimeout(resolve, ms)));
};

const logAfterDelay = (message: string, ms: number): Task<void> => {
  return delay(ms).map(() => {
    console.log(message);
  });
};

console.log('✅ 延迟输出（500ms）:');
await logAfterDelay('500ms 后输出这条消息', 500).run();
console.log();

// ============================================================================
// 5. Task 的 map 操作
// ============================================================================

console.log('5. Task 的 map 操作\n');

const fetchNumber = (): Task<number> => {
  return new Task(() => Promise.resolve(42));
};

const doubledTask = fetchNumber().map(n => n * 2);
const stringTask = fetchNumber().map(n => `数字是: ${n}`);

console.log('✅ 使用 map 转换 Task 中的值:');
console.log('原始值:', await fetchNumber().run());
console.log('乘以2:', await doubledTask.run());
console.log('转字符串:', await stringTask.run());
console.log();

// ============================================================================
// 6. Task 的 flatMap 操作
// ============================================================================

console.log('6. Task 的 flatMap 操作\n');

interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟异步 API 调用
const fetchUser = (id: number): Task<User> => {
  return new Task(async () => {
    console.log(`  [API] 获取用户 ${id}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      id,
      name: `User${id}`,
      email: `user${id}@example.com`,
    };
  });
};

const fetchUserPosts = (userId: number): Task<string[]> => {
  return new Task(async () => {
    console.log(`  [API] 获取用户 ${userId} 的文章`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return [`Post1 by User${userId}`, `Post2 by User${userId}`];
  });
};

// 使用 flatMap 链式调用
const getUserPostsCount = (userId: number): Task<number> => {
  return fetchUser(userId)
    .flatMap(user => fetchUserPosts(user.id))
    .map(posts => posts.length);
};

console.log('✅ 使用 flatMap 链式调用异步操作:');
const postsCount = await getUserPostsCount(1).run();
console.log('文章数量:', postsCount);
console.log();

// ============================================================================
// 7. 实战场景：HTTP 请求
// ============================================================================

console.log('7. 实战场景：HTTP 请求\n');

interface ApiResponse<T> {
  status: number;
  data: T;
}

// 模拟 HTTP GET 请求
const httpGet = <T>(url: string): Task<ApiResponse<T>> => {
  return new Task(async () => {
    console.log(`  [HTTP GET] ${url}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 模拟响应
    if (url.includes('/users/')) {
      const id = parseInt(url.split('/').pop() || '0');
      return {
        status: 200,
        data: {
          id,
          name: `User${id}`,
          email: `user${id}@example.com`,
        } as T,
      };
    }
    
    throw new Error('Not found');
  });
};

// 使用 Task 处理 HTTP 请求
const getUser = (id: number): Task<User> => {
  return httpGet<User>(`/api/users/${id}`)
    .map(response => {
      if (response.status !== 200) {
        throw new Error('Request failed');
      }
      return response.data;
    });
};

console.log('✅ HTTP 请求示例:');
const user = await getUser(42).run();
console.log('获取的用户:', user);
console.log();

// ============================================================================
// 8. 实战场景：数据库查询
// ============================================================================

console.log('8. 实战场景：数据库查询\n');

interface DbRow {
  id: number;
  name: string;
  value: string;
}

// 模拟数据库
const database: DbRow[] = [
  { id: 1, name: 'config1', value: 'value1' },
  { id: 2, name: 'config2', value: 'value2' },
];

// 数据库查询
const queryDb = (sql: string): Task<DbRow[]> => {
  return new Task(async () => {
    console.log(`  [DB] 执行查询: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 150));
    return database;
  });
};

// 查询并处理结果
const getConfigValue = (name: string): Task<string | null> => {
  return queryDb(`SELECT * FROM config WHERE name = '${name}'`)
    .map(rows => {
      const row = rows.find(r => r.name === name);
      return row ? row.value : null;
    });
};

console.log('✅ 数据库查询示例:');
const configValue = await getConfigValue('config1').run();
console.log('配置值:', configValue);
console.log();

// ============================================================================
// 9. 组合多个 Task
// ============================================================================

console.log('9. 组合多个 Task\n');

/**
 * parallel: 并行执行多个 Task
 */
const parallel = <A>(tasks: Task<A>[]): Task<A[]> => {
  return new Task(() => Promise.all(tasks.map(t => t.run())));
};

/**
 * race: 竞争执行，返回最快完成的
 */
const race = <A>(tasks: Task<A>[]): Task<A> => {
  return new Task(() => Promise.race(tasks.map(t => t.run())));
};

// 示例：并行获取多个用户
const fetchMultipleUsers = (ids: number[]): Task<User[]> => {
  const tasks = ids.map(id => fetchUser(id));
  return parallel(tasks);
};

console.log('✅ 并行执行多个 Task:');
const users = await fetchMultipleUsers([1, 2, 3]).run();
console.log('获取了', users.length, '个用户');
console.log();

// ============================================================================
// 10. 实战场景：带超时的请求
// ============================================================================

console.log('10. 实战场景：带超时的请求\n');

const timeout = <A>(ms: number): Task<A> => {
  return new Task(() => 
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  );
};

const withTimeout = <A>(ms: number, task: Task<A>): Task<A> => {
  return race([task, timeout<A>(ms)]);
};

const slowRequest = (): Task<string> => {
  return new Task(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return '慢速请求的结果';
  });
};

console.log('✅ 带超时的请求（1秒超时）:');
try {
  const result = await withTimeout(1000, slowRequest()).run();
  console.log('结果:', result);
} catch (error) {
  console.log('请求超时:', (error as Error).message);
}
console.log();

// ============================================================================
// 11. Task 工具函数
// ============================================================================

console.log('11. Task 工具函数\n');

/**
 * fromPromise: 从 Promise 创建 Task
 */
const fromPromise = <A>(promiseFn: () => Promise<A>): Task<A> => {
  return new Task(promiseFn);
};

/**
 * sequence: 将 Task 数组转换为数组的 Task（串行）
 */
const sequence = <A>(tasks: Task<A>[]): Task<A[]> => {
  return new Task(async () => {
    const results: A[] = [];
    for (const task of tasks) {
      const result = await task.run();
      results.push(result);
    }
    return results;
  });
};

/**
 * traverse: map 后再 sequence
 */
const traverse = <A, B>(f: (a: A) => Task<B>) => (array: A[]): Task<B[]> => {
  return sequence(array.map(f));
};

console.log('✅ Task 工具函数演示:');

// 串行执行
const serialTasks = sequence([
  logAfterDelay('串行任务1', 100),
  logAfterDelay('串行任务2', 100),
  logAfterDelay('串行任务3', 100),
]);

await serialTasks.run();
console.log('串行任务完成');
console.log();

// ============================================================================
// 12. Task vs Promise 总结
// ============================================================================

console.log('12. Task vs Promise 总结\n');

console.log('📊 对比:');
console.log();
console.log('Promise:');
console.log('  ❌ 立即执行');
console.log('  ❌ 不可重用');
console.log('  ✅ 原生支持');
console.log('  ✅ 广泛使用');
console.log();
console.log('Task:');
console.log('  ✅ 延迟执行');
console.log('  ✅ 可重用');
console.log('  ✅ 更好的组合性');
console.log('  ✅ Referential Transparency');
console.log('  ❌ 需要自己实现');
console.log();

console.log('=== Task Monad 总结 ===');
console.log('Task 是延迟执行的 Promise');
console.log('提供更好的组合性和可重用性');
console.log('非常适合函数式编程风格');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  Task,
  pureTask,
  delay,
  parallel,
  race,
  timeout,
  withTimeout,
  fromPromise,
  sequence,
  traverse,
};
