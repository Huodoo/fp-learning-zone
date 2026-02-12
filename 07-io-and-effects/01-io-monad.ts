/**
 * 第七章第一节: IO Monad
 * 
 * IO Monad 用于封装副作用（Side Effects）
 * 核心思想：将"描述副作用"和"执行副作用"分离
 * IO 让我们能够在纯函数的世界中描述副作用，然后在"世界的边缘"执行它们
 * 
 * 关键概念：
 * 1. 延迟执行 (Lazy Evaluation)
 * 2. 引用透明性 (Referential Transparency)
 * 3. Pure Core, Impure Shell
 */

console.log('=== IO Monad ===\n');

// ============================================================================
// 1. 什么是副作用？
// ============================================================================

console.log('1. 什么是副作用？\n');

console.log('副作用 (Side Effect) 是指函数除了返回值之外，还与外部世界产生了交互:\n');

console.log('常见的副作用:');
console.log('❌ console.log - 输出到控制台');
console.log('❌ 文件读写 - 修改文件系统');
console.log('❌ 网络请求 - 与外部服务通信');
console.log('❌ 修改全局变量 - 改变程序状态');
console.log('❌ Date.now() - 依赖外部时间');
console.log('❌ Math.random() - 产生随机数');
console.log();

// ❌ 有副作用的函数
function impureGreet(name: string): void {
  console.log(`Hello, ${name}!`);  // 副作用：控制台输出
}

console.log('❌ 不纯的函数 - 直接执行副作用:');
console.log('调用 impureGreet("张三") 会立即输出到控制台');
impureGreet('张三');  // 立即产生副作用
console.log();

// ============================================================================
// 2. IO Monad 的定义
// ============================================================================

console.log('2. IO Monad 的定义\n');

/**
 * IO<A> 表示一个产生类型 A 的副作用计算
 * 
 * 核心思想：
 * - IO 是一个"描述"，不是"执行"
 * - 创建 IO 时不会执行副作用
 * - 只有调用 unsafeRun() 才会执行
 */
class IO<A> {
  constructor(private effect: () => A) {}

  /**
   * Functor: map
   * 转换 IO 中的值，不执行副作用
   */
  map<B>(f: (a: A) => B): IO<B> {
    return new IO(() => f(this.effect()));
  }

  /**
   * Monad: flatMap (也叫 chain 或 bind)
   * 链式组合多个 IO 操作
   */
  flatMap<B>(f: (a: A) => IO<B>): IO<B> {
    return new IO(() => f(this.effect()).unsafeRun());
  }

  /**
   * 执行副作用（不安全！）
   * 只应该在程序的边界调用
   */
  unsafeRun(): A {
    return this.effect();
  }

  /**
   * Applicative: ap
   * 应用 IO 中的函数到 IO 中的值
   */
  ap<B>(ff: IO<(a: A) => B>): IO<B> {
    return ff.flatMap(f => this.map(f));
  }
}

// 辅助函数：创建 IO
const pure = <A>(a: A): IO<A> => new IO(() => a);

console.log('✅ IO Monad 实现了:');
console.log('  - map (Functor)');
console.log('  - flatMap (Monad)');
console.log('  - ap (Applicative)');
console.log('  - unsafeRun (执行副作用)');
console.log();

// ============================================================================
// 3. 基本示例：纯函数包装副作用
// ============================================================================

console.log('3. 基本示例：纯函数包装副作用\n');

// ✅ 纯函数：返回 IO，描述副作用
const greet = (name: string): IO<void> => {
  return new IO(() => {
    console.log(`Hello, ${name}!`);  // 描述副作用，但不执行
  });
};

console.log('✅ 纯函数 - 返回 IO，描述副作用:');
console.log('const greeting = greet("张三")');
const greeting = greet('张三');
console.log('创建 IO 时不会执行副作用！');
console.log('greeting:', greeting);
console.log();

console.log('现在执行副作用:');
console.log('greeting.unsafeRun():');
greeting.unsafeRun();
console.log();

// ============================================================================
// 4. 读取输入的 IO
// ============================================================================

console.log('4. 读取输入的 IO\n');

// 模拟读取用户输入（在真实环境中使用 readline）
const getLine = (): IO<string> => {
  return new IO(() => {
    // 在真实环境中，这里会读取 stdin
    // 这里我们返回模拟数据
    return '张三';
  });
};

const readUserName = (): IO<string> => {
  return getLine();
};

console.log('✅ 读取输入的 IO:');
const userName = readUserName();
console.log('创建 IO:', userName);
console.log('执行 IO:', userName.unsafeRun());
console.log();

// ============================================================================
// 5. IO 的 map 操作
// ============================================================================

console.log('5. IO 的 map 操作\n');

const getCurrentTime = (): IO<number> => {
  return new IO(() => Date.now());
};

// 使用 map 转换值
const getTimeString = (): IO<string> => {
  return getCurrentTime().map(timestamp => {
    return new Date(timestamp).toLocaleString('zh-CN');
  });
};

console.log('✅ 使用 map 转换 IO 中的值:');
console.log('当前时间:', getTimeString().unsafeRun());
console.log();

// ============================================================================
// 6. IO 的 flatMap 操作（链式组合）
// ============================================================================

console.log('6. IO 的 flatMap 操作（链式组合）\n');

const log = (message: string): IO<void> => {
  return new IO(() => {
    console.log(message);
  });
};

// 链式组合多个 IO
const program1 = (): IO<void> => {
  return log('步骤 1')
    .flatMap(() => log('步骤 2'))
    .flatMap(() => log('步骤 3'));
};

console.log('✅ 使用 flatMap 链式组合 IO:');
console.log('执行程序:');
program1().unsafeRun();
console.log();

// ============================================================================
// 7. 实战场景：控制台程序
// ============================================================================

console.log('7. 实战场景：控制台程序\n');

// 模拟的控制台 I/O
const putStrLn = (s: string): IO<void> => {
  return new IO(() => console.log(s));
};

const getStrLn = (): IO<string> => {
  return new IO(() => '张三');  // 模拟用户输入
};

// 纯函数：组合 IO
const askName = (): IO<void> => {
  return putStrLn('请输入您的名字:')
    .flatMap(() => getStrLn())
    .flatMap(name => putStrLn(`欢迎, ${name}!`));
};

console.log('✅ 控制台交互程序:');
askName().unsafeRun();
console.log();

// ============================================================================
// 8. 实战场景：计算器程序
// ============================================================================

console.log('8. 实战场景：计算器程序\n');

const readNumber = (prompt: string): IO<number> => {
  return putStrLn(prompt)
    .flatMap(() => getStrLn())
    .map(str => parseFloat(str));
};

const calculator = (): IO<void> => {
  return readNumber('输入第一个数字:')
    .flatMap(a => {
      return readNumber('输入第二个数字:')
        .flatMap(b => {
          const sum = a + b;
          return putStrLn(`结果: ${a} + ${b} = ${sum}`);
        });
    });
};

console.log('✅ 计算器程序（模拟输入）:');
// 修改 getStrLn 来模拟不同的输入
let inputQueue = ['5', '10'];
const getStrLnSimulated = (): IO<string> => {
  return new IO(() => inputQueue.shift() || '0');
};

const readNumberSim = (prompt: string): IO<number> => {
  return putStrLn(prompt)
    .flatMap(() => getStrLnSimulated())
    .map(str => parseFloat(str));
};

const calculatorSim = (): IO<void> => {
  return readNumberSim('输入第一个数字:')
    .flatMap(a => {
      return readNumberSim('输入第二个数字:')
        .flatMap(b => {
          const sum = a + b;
          return putStrLn(`结果: ${a} + ${b} = ${sum}`);
        });
    });
};

calculatorSim().unsafeRun();
console.log();

// ============================================================================
// 9. do-notation 风格（使用类方法）
// ============================================================================

console.log('9. do-notation 风格（使用类方法）\n');

// 添加 do 方法到 IO 类
declare module './01-io-monad' {
  interface IO<A> {
    do<B>(f: (a: A) => IO<B>): IO<B>;
  }
}

IO.prototype.do = function<A, B>(this: IO<A>, f: (a: A) => IO<B>): IO<B> {
  return this.flatMap(f);
};

// 使用更自然的链式调用
const program2 = (): IO<void> => {
  return putStrLn('开始')
    .do(() => putStrLn('处理中...'))
    .do(() => getCurrentTime())
    .do(time => putStrLn(`时间戳: ${time}`))
    .do(() => putStrLn('完成'));
};

console.log('✅ do 风格的链式调用:');
program2().unsafeRun();
console.log();

// ============================================================================
// 10. 实战场景：文件操作（模拟）
// ============================================================================

console.log('10. 实战场景：文件操作（模拟）\n');

// 模拟文件系统
const fileSystem: Record<string, string> = {
  '/data/config.json': '{"name":"app","version":"1.0"}',
  '/data/users.txt': 'user1\nuser2\nuser3',
};

// 读取文件
const readFile = (path: string): IO<string> => {
  return new IO(() => {
    const content = fileSystem[path];
    if (content === undefined) {
      throw new Error(`文件不存在: ${path}`);
    }
    console.log(`[IO] 读取文件: ${path}`);
    return content;
  });
};

// 写入文件
const writeFile = (path: string, content: string): IO<void> => {
  return new IO(() => {
    console.log(`[IO] 写入文件: ${path}`);
    fileSystem[path] = content;
  });
};

// 文件处理程序
const processConfigFile = (): IO<void> => {
  return readFile('/data/config.json')
    .map(content => JSON.parse(content))
    .map(config => ({
      ...config,
      processed: true,
      timestamp: Date.now(),
    }))
    .map(newConfig => JSON.stringify(newConfig, null, 2))
    .flatMap(newContent => writeFile('/data/config-processed.json', newContent))
    .flatMap(() => putStrLn('文件处理完成'));
};

console.log('✅ 文件处理程序:');
processConfigFile().unsafeRun();
console.log();

// ============================================================================
// 11. IO 的组合工具
// ============================================================================

console.log('11. IO 的组合工具\n');

/**
 * sequence: 将 IO 数组转换为数组的 IO
 */
const sequence = <A>(ios: IO<A>[]): IO<A[]> => {
  return new IO(() => ios.map(io => io.unsafeRun()));
};

/**
 * traverse: map 后再 sequence
 */
const traverse = <A, B>(f: (a: A) => IO<B>) => (array: A[]): IO<B[]> => {
  return sequence(array.map(f));
};

// 示例：批量读取文件
const readFiles = (paths: string[]): IO<string[]> => {
  return traverse(readFile)(paths);
};

console.log('✅ 批量读取文件:');
const files = readFiles(['/data/config.json', '/data/users.txt']);
const contents = files.unsafeRun();
console.log('读取了', contents.length, '个文件');
console.log();

// ============================================================================
// 12. Pure Core, Impure Shell 架构
// ============================================================================

console.log('12. Pure Core, Impure Shell 架构\n');

console.log('架构模式:');
console.log('┌─────────────────────────────────┐');
console.log('│  Impure Shell (副作用层)        │');
console.log('│  - IO/Task 描述副作用           │');
console.log('│  - 文件、网络、数据库            │');
console.log('├─────────────────────────────────┤');
console.log('│  Pure Core (核心业务逻辑)       │');
console.log('│  - 纯函数                        │');
console.log('│  - 易于测试                      │');
console.log('│  - 无副作用                      │');
console.log('└─────────────────────────────────┘');
console.log();

// Pure Core: 纯函数
const processUserData = (rawData: string): { name: string; age: number } => {
  const [name, ageStr] = rawData.split(',');
  return {
    name: name.trim(),
    age: parseInt(ageStr.trim(), 10),
  };
};

const formatUser = (user: { name: string; age: number }): string => {
  return `姓名: ${user.name}, 年龄: ${user.age}岁`;
};

// Impure Shell: 使用 IO 描述副作用
const loadAndFormatUser = (path: string): IO<string> => {
  return readFile(path)
    .map(processUserData)  // 纯函数
    .map(formatUser);      // 纯函数
};

console.log('✅ Pure Core + Impure Shell:');
console.log('核心逻辑是纯函数，副作用在 IO 中描述');
console.log();

// ============================================================================
// 13. IO vs 直接执行对比
// ============================================================================

console.log('13. IO vs 直接执行对比\n');

console.log('❌ 直接执行副作用:');
console.log(`
function impure() {
  console.log('副作用1');  // 立即执行
  console.log('副作用2');  // 立即执行
  return '结果';
}
`);

console.log('✅ 使用 IO 描述副作用:');
console.log(`
function pure(): IO<string> {
  return putStrLn('副作用1')  // 只是描述
    .flatMap(() => putStrLn('副作用2'))  // 只是描述
    .map(() => '结果');
}

// 在边界执行
pure().unsafeRun();
`);

console.log('\n优势:');
console.log('✅ 返回 IO 的函数是纯函数');
console.log('✅ 可以组合、延迟执行');
console.log('✅ 易于测试（不执行副作用）');
console.log('✅ 副作用集中在边界');
console.log();

console.log('=== IO Monad 总结 ===');
console.log('IO 将"描述副作用"和"执行副作用"分离');
console.log('返回 IO 的函数仍然是纯函数');
console.log('所有副作用在程序边界（main 函数）执行');
console.log('这就是 Pure Core, Impure Shell 架构');
console.log();

// ============================================================================
// 导出
// ============================================================================

export {
  IO,
  pure,
  putStrLn,
  getStrLn,
  readFile,
  writeFile,
  log,
  sequence,
  traverse,
};
