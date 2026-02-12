# 第三章: 柯里化与函数组合

> 学习函数组合的艺术,掌握柯里化、部分应用和 Point-Free 风格

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解柯里化 (Currying) 的原理和应用
- ✅ 掌握部分应用 (Partial Application)
- ✅ 熟练使用 compose 和 pipe 组合函数
- ✅ 理解 Point-Free 风格的优势
- ✅ 构建声明式的数据处理管道

## 📖 核心概念

### 1. 柯里化 (Currying)

#### 通俗类比

想象一个**饮料自动贩卖机**:
- 普通版本:需要同时投入"饮料类型" + "大小" + "温度"三个选择
- 柯里化版本:先选饮料类型 → 再选大小 → 最后选温度,每一步都返回一个新的"部分配置好的机器"

柯里化就是把多参数函数转换为一系列单参数函数!

#### 严格定义

柯里化是将一个多参数函数转换为一系列单参数函数的过程。

```typescript
// 普通函数: 一次接收所有参数
function add(a: number, b: number, c: number): number {
  return a + b + c;
}
add(1, 2, 3);  // 6

// 柯里化: 每次只接收一个参数
function curriedAdd(a: number) {
  return (b: number) => {
    return (c: number) => {
      return a + b + c;
    };
  };
}
curriedAdd(1)(2)(3);  // 6
```

#### 为什么需要柯里化?

| 优势 | 说明 |
|------|------|
| **参数复用** | 固定部分参数,创建专用函数 |
| **延迟执行** | 参数收集完整前不执行 |
| **函数组合** | 更容易组合函数 |
| **配置优先** | 先配置,后使用 |

### 2. 部分应用 (Partial Application)

#### 与柯里化的区别

- **柯里化**: 将 `f(a, b, c)` 转换为 `f(a)(b)(c)`,每次只接受一个参数
- **部分应用**: 将 `f(a, b, c)` 固定部分参数,得到 `f'(c)`,一次可以固定多个参数

```typescript
// 部分应用
function multiply(a: number, b: number): number {
  return a * b;
}

const double = multiply.bind(null, 2);  // 固定第一个参数
double(5);  // 10

// 柯里化
const curriedMultiply = (a: number) => (b: number) => a * b;
const alsoDouble = curriedMultiply(2);
alsoDouble(5);  // 10
```

### 3. 函数组合 (Composition)

#### 通俗类比

想象**工厂流水线**:
- 原材料进入 → 清洗 → 切割 → 组装 → 包装 → 成品
- 每个工序是一个函数
- 整条流水线就是函数组合

#### Compose vs Pipe

```typescript
// compose: 从右到左执行 (数学中的函数组合)
// f ∘ g ∘ h = f(g(h(x)))
const result1 = compose(f, g, h)(x);  // f(g(h(x)))

// pipe: 从左到右执行 (更符合阅读习惯)
const result2 = pipe(h, g, f)(x);     // f(g(h(x)))
```

#### 为什么使用函数组合?

| 优势 | 说明 |
|------|------|
| **声明式** | 描述"做什么",而非"怎么做" |
| **可读性强** | 清晰表达数据转换流程 |
| **易于测试** | 每个小函数独立测试 |
| **易于重构** | 调整组合顺序即可 |

### 4. Point-Free 风格

#### 定义

Point-Free (无点风格) 是指函数定义中不显式提及参数。

```typescript
// ❌ 有点风格 (Pointed Style)
const getNames = (users: User[]) => users.map(u => u.name);

// ✅ 无点风格 (Point-Free Style)
const getName = (u: User) => u.name;
const getNames = map(getName);  // 不显式提及 users 参数
```

#### 为什么使用 Point-Free?

- **更简洁** - 减少冗余参数声明
- **更抽象** - 关注函数组合而非数据流动
- **更灵活** - 易于重组和复用

#### 注意事项

⚠️ **不要过度使用!** Point-Free 风格提高了抽象程度,但也可能降低可读性。在团队协作中,清晰 > 简洁。

## 💡 核心原则

### 函数组合的数学基础

函数组合遵循**结合律** (Associativity):

```
compose(f, compose(g, h)) === compose(compose(f, g), h)
```

这意味着:
```typescript
compose(f, g, h) === compose(f, compose(g, h)) === compose(compose(f, g), h)
```

## 🆚 命令式 vs 声明式

### 命令式: 如何做 (How)

```typescript
function processUsers(users: User[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.age >= 18) {
      result.push(user.name.toUpperCase());
    }
  }
  return result;
}
```

### 声明式: 做什么 (What)

```typescript
const processUsers = pipe(
  filter((u: User) => u.age >= 18),
  map((u: User) => u.name),
  map((name: string) => name.toUpperCase())
);
```

## 🔧 实用模式

### 1. 配置优先模式

```typescript
// 先配置
const fetchWithAuth = createFetch({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' }
});

// 后使用
fetchWithAuth('/users');
fetchWithAuth('/posts');
```

### 2. 验证器组合

```typescript
const validateUser = allOf([
  validateEmail,
  validateAge,
  validatePhone
]);
```

### 3. 中间件模式

```typescript
const app = compose(
  logger,
  auth,
  rateLimit,
  handler
);
```

## 💡 关键要点总结

1. **柯里化 = 单参数化**
   - 每次只接受一个参数
   - 返回接受下一个参数的函数
   - 直到所有参数收集完毕

2. **部分应用 = 参数固定**
   - 固定函数的部分参数
   - 返回接受剩余参数的新函数
   - 可以一次固定多个参数

3. **组合 = 流水线**
   - compose: 从右到左
   - pipe: 从左到右
   - 小函数 → 大功能

4. **Point-Free = 省略参数**
   - 提高抽象层次
   - 关注函数关系
   - 适度使用,不要过度

## 🤔 进一步思考

1. **问: 柯里化会影响性能吗?**
   - 答: 会创建多个函数闭包,有轻微性能开销。但在大多数业务场景中可以忽略。如果性能关键,可以手动优化。

2. **问: 什么时候用 compose,什么时候用 pipe?**
   - 答: 
     - compose: 数学风格,从右到左,适合函数式纯粹主义者
     - pipe: 流程风格,从左到右,更符合自然阅读习惯
     - 推荐使用 pipe (个人偏好)

3. **问: Point-Free 风格可读性差怎么办?**
   - 答: 不要为了 Point-Free 而 Point-Free。如果降低了可读性,就添加中间变量或使用有点风格。

4. **问: 如何调试组合的函数?**
   - 答: 
     - 使用 tap 函数在中间打印日志
     - 拆分组合,逐步测试
     - 使用类型系统确保正确性

## 📝 实践指南

### 识别可以柯里化的场景

✅ **适合柯里化:**
- 需要多次复用部分配置的函数
- 参数有优先级(先配置,后使用)
- 需要延迟执行

❌ **不适合柯里化:**
- 参数平等,没有优先级
- 一次性使用的函数
- 参数数量不固定

### 构建数据处理管道

```typescript
// 声明式管道
const processOrders = pipe(
  filterCompleted,
  sortByDate,
  groupByUser,
  calculateTotals,
  formatReport
);

const report = processOrders(orders);
```

## 🎯 学习检查清单

- [ ] 理解柯里化的原理和应用
- [ ] 区分柯里化和部分应用
- [ ] 能够使用 compose 和 pipe 组合函数
- [ ] 理解 Point-Free 风格的优缺点
- [ ] 能够构建声明式的数据处理管道
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-currying.ts` - 柯里化的原理和实现
- `02-partial-application.ts` - 部分应用的使用场景
- `03-compose-and-pipe.ts` - 函数组合详解
- `04-point-free.ts` - Point-Free 风格示例
- `05-exercises.ts` - 综合练习

## ➡️ 下一章

[第四章: 代数数据类型](/04-algebraic-data-types) - 学习类型系统和模式匹配
