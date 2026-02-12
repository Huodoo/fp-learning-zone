# 第九章：递归思维

> 从循环思维转向递归思维，掌握函数式编程的核心数据结构和算法

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解递归的本质和递归思维方式
- ✅ 掌握尾递归优化和 Trampoline 技术
- ✅ 实现不可变数据结构（链表、树）
- ✅ 理解 Fold（Catamorphism）和 Unfold（Anamorphism）
- ✅ 用递归解决复杂问题（树遍历、解析等）

## 📖 核心概念

### 1. 为什么需要递归思维？

#### 循环 vs 递归

**命令式循环**的特点：
- 使用可变状态（循环变量）
- 关注"如何做"（How）
- 依赖副作用

**函数式递归**的特点：
- 无可变状态
- 关注"是什么"（What）
- 纯函数，无副作用

#### 对比示例

```typescript
// ❌ 命令式: 使用循环
function sumImperative(numbers: number[]): number {
  let sum = 0;  // 可变状态
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];  // 修改状态
  }
  return sum;
}

// ✅ 函数式: 使用递归
function sumRecursive(numbers: number[]): number {
  if (numbers.length === 0) return 0;  // 基础情况
  return numbers[0] + sumRecursive(numbers.slice(1));  // 递归调用
}
```

### 2. 递归的三要素

#### 1️⃣ 基础情况（Base Case）
- 递归的终止条件
- 最简单的问题答案

#### 2️⃣ 递归情况（Recursive Case）
- 将问题分解为更小的子问题
- 调用自身处理子问题

#### 3️⃣ 组合结果
- 将子问题的结果组合成最终答案

#### 示例：阶乘

```typescript
function factorial(n: number): number {
  // 1. 基础情况
  if (n === 0) return 1;
  
  // 2. 递归情况：分解为更小的问题
  const subProblem = factorial(n - 1);
  
  // 3. 组合结果
  return n * subProblem;
}
```

### 3. 尾递归优化

#### 普通递归的问题：栈溢出

```typescript
// ❌ 普通递归：会爆栈
function factorial(n: number): number {
  if (n === 0) return 1;
  return n * factorial(n - 1);  // 乘法在递归调用之后
}

factorial(100000);  // 💥 Maximum call stack size exceeded
```

#### 尾递归：最后一步是递归调用

```typescript
// ✅ 尾递归：可以优化
function factorialTail(n: number, acc: number = 1): number {
  if (n === 0) return acc;
  return factorialTail(n - 1, n * acc);  // 递归调用是最后一步
}
```

#### 尾调用优化（TCO）

- JavaScript 引擎可以优化尾递归为循环
- 不增加调用栈深度
- 理论上可以无限递归

> 注意：很多 JavaScript 引擎没有完全实现 TCO，需要 Trampoline 技术

### 4. Trampoline（蹦床函数）

#### 什么是 Trampoline？

Trampoline 是一种技术，通过迭代执行返回的函数来避免栈溢出

```typescript
// 返回函数或值
type Bounce<A> = A | (() => Bounce<A>);

// Trampoline: 不断执行函数直到得到值
function trampoline<A>(bounce: Bounce<A>): A {
  let result = bounce;
  while (typeof result === 'function') {
    result = result();
  }
  return result;
}

// 使用 Trampoline 的递归
function factorialTrampoline(n: number, acc: number = 1): Bounce<number> {
  if (n === 0) return acc;
  return () => factorialTrampoline(n - 1, n * acc);
}

// 安全地计算大数
trampoline(factorialTrampoline(100000));  // ✅ 不会爆栈
```

### 5. 不可变数据结构

#### 为什么需要不可变数据结构？

在函数式编程中：
- 数据不可变
- 修改 = 创建新的数据结构
- 结构共享节省内存

#### 不可变链表（Linked List）

```typescript
type List<A> = Nil | Cons<A>;

interface Nil {
  readonly _tag: 'Nil';
}

interface Cons<A> {
  readonly _tag: 'Cons';
  readonly head: A;
  readonly tail: List<A>;
}

// 空链表
const Nil: List<never> = { _tag: 'Nil' };

// 添加元素（创建新链表）
const Cons = <A>(head: A, tail: List<A>): List<A> => ({
  _tag: 'Cons',
  head,
  tail
});

// 使用
const list = Cons(1, Cons(2, Cons(3, Nil)));  // [1, 2, 3]
```

#### 不可变树（Binary Tree）

```typescript
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

// 示例树
const tree = Branch(
  Leaf(1),
  Branch(
    Leaf(2),
    Leaf(3)
  )
);
```

### 6. Fold 和 Unfold

#### Fold（折叠/归约）- Catamorphism

将数据结构"压缩"成一个值

```typescript
// 列表的 fold
function foldList<A, B>(
  onNil: () => B,
  onCons: (head: A, tail: B) => B,
  list: List<A>
): B {
  if (list._tag === 'Nil') {
    return onNil();
  }
  return onCons(list.head, foldList(onNil, onCons, list.tail));
}

// 使用 fold 实现 sum
const sum = (list: List<number>) =>
  foldList(
    () => 0,                    // 空列表 = 0
    (head, tailSum) => head + tailSum  // 头 + 尾的和
  )(list);
```

#### Unfold（展开/生成）- Anamorphism

从一个种子值"生成"数据结构

```typescript
// 生成列表
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

// 使用 unfold 生成 [1, 2, 3, 4, 5]
const range = unfoldList(
  (n: number) => n > 5 ? null : [n, n + 1],
  1
);
```

#### Fold + Unfold = 重构（Hylomorphism）

```typescript
// 先 unfold 再 fold
function hylo<A, B, C>(
  unfold: (seed: C) => [A, C] | null,
  fold: (a: A, b: B) => B,
  init: B,
  seed: C
): B {
  const list = unfoldList(unfold, seed);
  return foldList(() => init, fold, list);
}
```

### 7. 递归思维的应用场景

#### ✅ 适合用递归的场景

1. **树形结构处理**
   - 文件系统遍历
   - DOM 树操作
   - AST 抽象语法树

2. **分治算法**
   - 快速排序
   - 归并排序
   - 二分查找

3. **递归定义的问题**
   - 斐波那契数列
   - 汉诺塔
   - 组合问题

4. **数据结构操作**
   - 链表操作
   - 树的遍历
   - 图的搜索

#### ❌ 不适合用递归的场景

1. **简单的迭代**
   - 线性遍历数组
   - 简单累加

2. **性能关键路径**
   - 需要极致性能的场景
   - 大数据量处理（除非有 TCO）

### 8. 递归 vs 循环对比

| 维度 | 递归 | 循环 |
|------|------|------|
| **可读性** | ⭐⭐⭐⭐⭐ (声明式) | ⭐⭐⭐ (命令式) |
| **数学性** | ⭐⭐⭐⭐⭐ (自然) | ⭐⭐ (机械) |
| **性能** | ⭐⭐⭐ (需优化) | ⭐⭐⭐⭐⭐ (高效) |
| **栈使用** | ⭐⭐ (可能爆栈) | ⭐⭐⭐⭐⭐ (无栈) |
| **副作用** | ⭐⭐⭐⭐⭐ (无) | ⭐⭐ (有) |
| **组合性** | ⭐⭐⭐⭐⭐ (强) | ⭐⭐ (弱) |

## 🎓 本章内容

1. **01-recursion-basics.ts** - 递归基础
   - 递归的三要素
   - 阶乘、斐波那契、列表操作
   - 递归 vs 循环对比

2. **02-tail-recursion.ts** - 尾递归优化
   - 尾递归的概念
   - Trampoline 技术
   - 避免栈溢出

3. **03-immutable-data-structures.ts** - 不可变数据结构
   - 手写不可变链表
   - 手写不可变二叉树
   - 结构共享原理

4. **04-fold-and-unfold.ts** - Fold 和 Unfold
   - Catamorphism（折叠）
   - Anamorphism（展开）
   - Hylomorphism（重构）

5. **05-exercises.ts** - 综合练习
   - 树的遍历算法
   - JSON 解析器
   - 文件系统模拟
   - 表达式求值

## 💡 学习建议

1. **画图思考**: 递归最好用树状图来理解
2. **找规律**: 发现问题的递归模式
3. **写基础**: 先写基础情况，再写递归情况
4. **避免爆栈**: 大数据用尾递归或 Trampoline
5. **实践**: 用递归重写命令式代码

## 🔗 相关章节

- 第二章: 一等函数 - 递归是函数调用自身
- 第六章: Functor 和 Monad - Fold 是 Monad 的操作
- 第四章: 代数数据类型 - 递归数据结构

## 📚 延伸阅读

- Recursion Schemes（递归模式）
- Corecursion（余递归）
- Mutual Recursion（相互递归）
- Continuation-Passing Style（CPS）

---

**下一章**: 第十章 - 类型类 (Type Classes)
