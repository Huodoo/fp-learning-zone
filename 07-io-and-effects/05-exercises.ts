/**
 * 第七章练习：IO 和 Effects 综合练习
 */

import { IO } from './01-io-monad';
import { Task } from './02-task-monad';
import { TaskEither, rightTask, leftTask, tryCatch, Either, Left, Right } from './03-task-either';

console.log('=== 第七章综合练习 ===\n');

// ============================================================================
// 练习 1: 实现日志系统
// ============================================================================

console.log('练习 1: 实现日志系统\n');

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const logWithLevel = (level: LogLevel, message: string): IO<void> => {
  return new IO(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  });
};

const info = (message: string): IO<void> => logWithLevel('INFO', message);
const warn = (message: string): IO<void> => logWithLevel('WARN', message);
const error = (message: string): IO<void> => logWithLevel('ERROR', message);

console.log('✅ 测试日志系统:');
const logProgram = info('应用启动')
  .flatMap(() => warn('这是一个警告'))
  .flatMap(() => error('这是一个错误'));

logProgram.unsafeRun();
console.log();

// ============================================================================
// 练习 2: 实现缓存系统
// ============================================================================

console.log('练习 2: 实现缓存系统\n');

class Cache<K, V> {
  private store: Map<K, { value: V; expires: number }> = new Map();

  set(key: K, value: V, ttl: number): IO<void> {
    return new IO(() => {
      this.store.set(key, {
        value,
        expires: Date.now() + ttl,
      });
    });
  }

  get(key: K): IO<V | null> {
    return new IO(() => {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        this.store.delete(key);
        return null;
      }
      return entry.value;
    });
  }
}

const cache = new Cache<string, string>();

console.log('✅ 测试缓存系统:');
cache.set('key1', 'value1', 10000).unsafeRun();
console.log('获取缓存:', cache.get('key1').unsafeRun());
console.log();

// ============================================================================
// 练习 3: 实现重试逻辑
// ============================================================================

console.log('练习 3: 实现重试逻辑\n');

const retry = <E, A>(
  task: TaskEither<E, A>,
  maxRetries: number,
  delay: number = 1000
): TaskEither<E, A> => {
  return new TaskEither(async () => {
    let lastError: E | null = null;
    
    for (let i = 0; i <= maxRetries; i++) {
      if (i > 0) {
        console.log(`  [Retry] 第 ${i} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await task.run();
      if (result._tag === 'Right') {
        return result;
      }
      lastError = result.left;
    }
    
    return Left(lastError!);
  });
};

let attemptCount = 0;
const unreliableTask = (): TaskEither<string, string> => {
  return tryCatch(
    async () => {
      attemptCount++;
      console.log(`  [Task] 尝试 #${attemptCount}`);
      if (attemptCount < 3) {
        throw new Error('失败');
      }
      return '成功';
    },
    (error) => String(error)
  );
};

console.log('✅ 测试重试逻辑:');
const retryResult = await retry(unreliableTask(), 5, 100).run();
console.log('最终结果:', retryResult);
console.log();

// ============================================================================
// 练习 4: 实现批处理
// ============================================================================

console.log('练习 4: 实现批处理\n');

const processBatch = <E, A, B>(
  items: A[],
  processor: (item: A) => TaskEither<E, B>,
  batchSize: number = 5
): TaskEither<E, B[]> => {
  return new TaskEither(async () => {
    const results: B[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`  [Batch] 处理批次 ${i / batchSize + 1}, 大小: ${batch.length}`);
      
      for (const item of batch) {
        const result = await processor(item).run();
        if (result._tag === 'Left') {
          return result;
        }
        results.push(result.right);
      }
    }
    
    return Right(results);
  });
};

const processItem = (n: number): TaskEither<string, number> => {
  return tryCatch(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return n * 2;
    },
    (error) => String(error)
  );
};

console.log('✅ 测试批处理:');
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const batchResult = await processBatch(items, processItem, 3).run();
console.log('批处理结果:', batchResult);
console.log();

// ============================================================================
// 练习 5: 实现数据管道
// ============================================================================

console.log('练习 5: 实现数据管道\n');

type PipelineError = { stage: string; error: string };

const pipeline = <A, B, C, D>(
  input: A,
  stage1: (a: A) => TaskEither<PipelineError, B>,
  stage2: (b: B) => TaskEither<PipelineError, C>,
  stage3: (c: C) => TaskEither<PipelineError, D>
): TaskEither<PipelineError, D> => {
  return stage1(input)
    .flatMap(stage2)
    .flatMap(stage3);
};

const extractData = (raw: string): TaskEither<PipelineError, string[]> => {
  return tryCatch(
    async () => {
      console.log('  [Stage 1] 提取数据');
      await new Promise(resolve => setTimeout(resolve, 100));
      return raw.split(',');
    },
    () => ({ stage: 'extract', error: '提取失败' })
  );
};

const transformData = (data: string[]): TaskEither<PipelineError, number[]> => {
  return tryCatch(
    async () => {
      console.log('  [Stage 2] 转换数据');
      await new Promise(resolve => setTimeout(resolve, 100));
      return data.map(s => parseInt(s.trim()));
    },
    () => ({ stage: 'transform', error: '转换失败' })
  );
};

const aggregateData = (numbers: number[]): TaskEither<PipelineError, number> => {
  return tryCatch(
    async () => {
      console.log('  [Stage 3] 聚合数据');
      await new Promise(resolve => setTimeout(resolve, 100));
      return numbers.reduce((sum, n) => sum + n, 0);
    },
    () => ({ stage: 'aggregate', error: '聚合失败' })
  );
};

console.log('✅ 测试数据管道:');
const pipelineResult = await pipeline(
  '1, 2, 3, 4, 5',
  extractData,
  transformData,
  aggregateData
).run();
console.log('管道结果:', pipelineResult);
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 练习总结 ===\n');
console.log('通过这些练习，你应该掌握了:');
console.log('✅ IO Monad 的实际应用');
console.log('✅ Task Monad 处理异步操作');
console.log('✅ TaskEither 组合异步和错误处理');
console.log('✅ 重试、批处理等实用模式');
console.log('✅ 构建复杂的业务流程');
console.log();

export {};
