# 第一章：纯函数与不可变性

> 函数式编程的基石：理解纯函数、副作用和不可变数据

## 🎯 学习目标

学完本章后，你将能够：

- ✅ 清晰区分纯函数和非纯函数
- ✅ 识别代码中的副作用
- ✅ 理解引用透明性的重要性
- ✅ 掌握不可变数据的操作技巧
- ✅ 将命令式/OOP 代码重构为纯函数式代码

## 📖 核心概念

### 1. 什么是纯函数 (Pure Function)?

#### 通俗类比

想象一个**自动售货机**：
- 你投入相同的钱（输入），永远得到相同的商品（输出）
- 它不会记住你是谁，不会因为时间、天气而改变结果
- 它不会偷偷改变你钱包里的钱（不修改外部状态）

这就是纯函数的本质！

#### 严格定义

一个函数是**纯函数**，当且仅当它满足以下两个条件：

1. **相同输入总是返回相同输出**（确定性）
2. **没有副作用**（不修改外部状态，不进行 I/O 操作）

```typescript
// ✅ 纯函数
function add(a: number, b: number): number {
  return a + b;
}

// ❌ 非纯函数（依赖外部状态）
let counter = 0;
function increment(): number {
  return ++counter;  // 修改了外部变量
}

// ❌ 非纯函数（有副作用）
function greet(name: string): string {
  console.log(`Hello, ${name}`);  // I/O 是副作用
  return `Hello, ${name}`;
}
```

### 2. 什么是副作用 (Side Effect)?

副作用是指函数执行过程中，除了返回值之外的任何**可观察的变化**：

- 修改全局变量或外部状态
- 修改传入的参数（对象/数组）
- 进行 I/O 操作（console.log, 文件读写, 网络请求）
- 抛出异常
- 调用其他有副作用的函数

### 3. 引用透明性 (Referential Transparency)

#### 通俗类比

在数学中，如果 `f(x) = x + 1`，那么无论何时何地，`f(5)` 都等于 `6`。你可以直接用 `6` 替换 `f(5)`，程序行为不变。

这就是**引用透明性**：可以安全地用函数的返回值替换函数调用本身。

#### 严格定义

一个表达式具有引用透明性，如果它可以被其求值结果替换，而不改变程序的行为。

```typescript
// ✅ 引用透明
const result1 = add(2, 3) + add(2, 3);  // 10
const result2 = 5 + 5;                  // 10 - 等价替换

// ❌ 非引用透明
const result3 = increment() + increment();  // 1 + 2 = 3
const result4 = 1 + 1;                      // 2 - 不等价！
```

### 4. 不可变性 (Immutability)

#### 通俗类比

想象你在写日记：
- **可变方式**：在同一本日记上涂改覆盖（OOP 常见做法）
- **不可变方式**：每次都写在新的一页，保留所有历史记录（FP 做法）

不可变数据意味着：一旦创建，就不能被修改。要"改变"，就创建一个新的副本。

#### 为什么需要不可变性？

| 优势 | 说明 |
|------|------|
| **可预测性** | 数据不会被意外修改 |
| **易于测试** | 无需担心状态污染 |
| **并发安全** | 多线程环境下无竞态条件 |
| **时间旅行** | 可以轻松实现 undo/redo |
| **易于追踪** | 变化历史清晰可见 |

## 🆚 OOP vs FP 对比

### 状态管理对比

#### OOP 方式：可变状态

```typescript
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    this.balance += amount;  // 直接修改状态
  }

  withdraw(amount: number): void {
    this.balance -= amount;  // 直接修改状态
  }

  getBalance(): number {
    return this.balance;
  }
}

// 使用
const account = new BankAccount(100);
account.deposit(50);   // 修改了内部状态
account.withdraw(30);  // 又修改了内部状态
console.log(account.getBalance());  // 120
```

#### FP 方式：不可变状态

```typescript
type BankAccount = {
  readonly balance: number;
};

// 所有操作都返回新对象
function createAccount(initialBalance: number): BankAccount {
  return { balance: initialBalance };
}

function deposit(account: BankAccount, amount: number): BankAccount {
  return { balance: account.balance + amount };  // 返回新对象
}

function withdraw(account: BankAccount, amount: number): BankAccount {
  return { balance: account.balance - amount };  // 返回新对象
}

// 使用
const account1 = createAccount(100);
const account2 = deposit(account1, 50);
const account3 = withdraw(account2, 30);
console.log(account3.balance);  // 120
console.log(account1.balance);  // 100 - 原对象未变！
```

### 优缺点对比

| 方面 | OOP 可变状态 | FP 不可变数据 |
|------|-------------|--------------|
| **性能** | 更高效（原地修改） | 需要创建新对象（但可用结构共享优化） |
| **代码简洁性** | 较简洁 | 可能更冗长 |
| **可预测性** | 低（状态可能被任何地方修改） | 高（数据不变） |
| **并发安全** | 需要锁机制 | 天然线程安全 |
| **调试难度** | 高（状态变化难追踪） | 低（纯函数易隔离测试） |
| **历史追踪** | 困难 | 简单 |

## 💡 关键要点总结

1. **纯函数是 FP 的核心**
   - 相同输入 → 相同输出
   - 无副作用

2. **副作用不可避免，但要隔离**
   - 将有副作用的代码推到边界
   - 核心逻辑保持纯净

3. **不可变数据带来可预测性**
   - 但需要学习新的数据操作方式
   - 需要改变"直接修改"的思维习惯

4. **引用透明性 = 可替换性**
   - 让代码推理更简单
   - 编译器/解释器可以安全优化

## 🤔 进一步思考

1. **问：如果所有函数都是纯的，那如何与外部世界交互（I/O）？**
   - 答：我们会在后续章节（第 7 章 IO Monad）学习如何"描述"副作用而不执行它。

2. **问：不可变数据不会很慢吗？每次都复制整个对象？**
   - 答：现代 FP 使用"结构共享"（Structural Sharing），只复制改变的部分。我们会在第 9 章实现。

3. **问：JavaScript/TypeScript 不是默认可变的吗？如何实现不可变？**
   - 答：使用 `const`、`readonly`、`Object.freeze()`，以及手写的不可变操作函数。

4. **问：FP 要求所有函数都是纯的吗？**
   - 答：不！真实应用必然有副作用。FP 的目标是**最大化纯函数，最小化并隔离副作用**。

## 📝 实践指南

### 识别非纯函数的模式

❌ **非纯函数的常见特征：**
- 使用 `this`（依赖外部状态）
- 读写全局变量
- 修改参数
- 使用 `Date.now()`, `Math.random()` 等不确定性函数
- 执行 I/O（console.log, fetch, fs.readFile...）

✅ **纯函数的特征：**
- 仅依赖参数
- 仅返回计算结果
- 不修改任何外部状态
- 可以重复调用任意次，结果始终一致

### 重构为纯函数的步骤

1. **提取依赖** - 将外部依赖作为参数传入
2. **移除修改** - 不修改参数，返回新值
3. **隔离副作用** - 将副作用推到函数边界

## 🎯 学习检查清单

- [ ] 理解纯函数的定义和重要性
- [ ] 能够识别代码中的副作用
- [ ] 理解引用透明性的含义
- [ ] 掌握不可变数据的基本操作
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-pure-vs-impure.ts` - 纯函数 vs 非纯函数的对比示例
- `02-immutability.ts` - 不可变数据操作（手写实现）
- `03-exercises.ts` - 练习题：将命令式/OOP 代码重构为纯函数

## ➡️ 下一章

[第二章：函数是一等公民](/02-first-class-functions) - 学习高阶函数、闭包和函数组合的基础
