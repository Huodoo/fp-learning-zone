# 第四章：代数数据类型

> 理解代数数据类型(ADT)、模式匹配,以及如何用它们替代面向对象的继承

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解积类型(Product Types)和和类型(Sum Types)
- ✅ 掌握 TypeScript 中的联合类型和判别联合
- ✅ 熟练使用模式匹配进行类型安全的分支处理
- ✅ 理解 ADT 与 OOP 继承的区别
- ✅ 在实际项目中应用 ADT 建模业务领域

## 📖 核心概念

### 1. 什么是代数数据类型 (Algebraic Data Types)?

#### 通俗类比

想象你在玩**乐高积木**:
- **积类型** (Product Type) = 一个模型由多个零件**组合**而成 (A AND B)
- **和类型** (Sum Type) = 一个零件可以是**多种形状之一** (A OR B)

代数数据类型就是用这两种方式组合数据!

#### 严格定义

代数数据类型是通过代数方式(积和和)组合简单类型得到的复合类型:

- **积类型** (Product Type): 同时包含多个字段 (元组、记录、对象)
- **和类型** (Sum Type): 多个可能类型中的一个 (联合类型、枚举)

```typescript
// 积类型: User 同时包含 name AND email AND age
type User = {
  name: string;
  email: string;
  age: number;
};

// 和类型: Result 是 Success OR Failure
type Result<T, E> =
  | { type: 'success'; value: T }
  | { type: 'failure'; error: E };
```

### 2. 积类型 (Product Types)

#### 为什么叫"积"?

类型的值数量等于各字段值数量的**乘积**:

```typescript
// boolean 有 2 个值: true, false
// boolean 有 2 个值: true, false
// 组合起来有 2 × 2 = 4 种可能:
type Pair = [boolean, boolean];
// [true, true], [true, false], [false, true], [false, false]
```

#### 常见形式

| 形式 | 示例 | 说明 |
|------|------|------|
| **元组** | `[string, number]` | 固定位置的值 |
| **记录** | `{ x: number, y: number }` | 命名的字段 |
| **类** | `class Point { x: number; y: number }` | OOP 中的对象 |

### 3. 和类型 (Sum Types)

#### 为什么叫"和"?

类型的值数量等于各可能类型值数量的**和**:

```typescript
// boolean 有 2 个值
// null 有 1 个值
// 组合起来有 2 + 1 = 3 种可能:
type Optional = boolean | null;
// true, false, null
```

#### TypeScript 中的实现

TypeScript 使用**判别联合** (Discriminated Union) 实现和类型:

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };
```

关键要素:
- **判别字段** (kind): 用于区分具体类型
- **联合类型** (|): 表示"或"的关系
- **结构化**: 每个分支都是一个积类型

### 4. 模式匹配 (Pattern Matching)

#### 通俗类比

模式匹配就像**海关检查**:
- 检查护照类型(判别字段)
- 根据类型执行不同的处理
- 确保所有情况都被覆盖(穷尽性检查)

#### TypeScript 中的实现

TypeScript 没有原生的模式匹配,但可以通过类型守卫模拟:

```typescript
function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      // TypeScript 知道这里 shape 是 circle
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      // 穷尽性检查: 如果所有情况都覆盖,这里永远不会执行
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

## 🆚 ADT vs OOP 对比

### 继承 vs 和类型

#### OOP: 继承层次

```typescript
abstract class Shape {
  abstract area(): number;
}

class Circle extends Shape {
  constructor(public radius: number) { super(); }
  area() { return Math.PI * this.radius ** 2; }
}

class Rectangle extends Shape {
  constructor(public width: number, public height: number) { super(); }
  area() { return this.width * this.height; }
}
```

#### FP: 和类型

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
  }
}
```

### 表达式问题 (Expression Problem)

| 操作 | OOP (继承) | FP (ADT) |
|------|-----------|----------|
| **添加新类型** | 容易 (新建子类) | 困难 (修改和类型定义) |
| **添加新操作** | 困难 (修改所有子类) | 容易 (新建函数) |
| **类型安全** | 运行时错误 | 编译时检查 |
| **穷尽性检查** | 无 | 有 (never 类型) |

### 优缺点对比

| 方面 | OOP 继承 | FP ADT |
|------|---------|--------|
| **封装** | 好 (数据和方法绑定) | 中 (数据和函数分离) |
| **扩展性** | 添加类型容易 | 添加操作容易 |
| **类型安全** | 弱 (类型转换) | 强 (编译时检查) |
| **可测试性** | 中 (需要 mock) | 好 (纯函数易测试) |
| **复杂度** | 高 (继承层次) | 低 (扁平结构) |

## 💡 关键要点总结

1. **积类型 = AND (同时拥有)**
   - 元组: `[A, B]`
   - 记录: `{ a: A, b: B }`

2. **和类型 = OR (多选一)**
   - 联合: `A | B`
   - 判别联合: `{ type: 'a', ... } | { type: 'b', ... }`

3. **模式匹配 = 类型安全的分支**
   - switch + 判别字段
   - 穷尽性检查 (never)

4. **ADT vs OOP**
   - ADT: 数据和操作分离,易于添加新操作
   - OOP: 数据和方法绑定,易于添加新类型

## 🤔 进一步思考

1. **问: TypeScript 的联合类型和其他语言的和类型有什么区别?**
   - 答: TypeScript 的联合类型是结构化的,通过判别字段实现模式匹配。Haskell/Rust 等语言有原生的 enum 和 pattern matching 支持。

2. **问: 什么时候用 ADT,什么时候用 OOP?**
   - 答:
     - ADT: 数据结构相对固定,操作经常变化 (如解析器、编译器)
     - OOP: 类型经常变化,操作相对固定 (如插件系统、UI 组件)

3. **问: 如何在 TypeScript 中实现穷尽性检查?**
   - 答: 使用 never 类型。如果某个分支返回 never,说明该分支永远不会执行,这意味着所有情况都被覆盖了。

4. **问: ADT 能表达继承吗?**
   - 答: 可以!通过嵌套和类型模拟继承层次,但更推荐扁平化的设计。

## 📝 实践指南

### 何时使用积类型

✅ **适合的场景:**
- 表示具有固定字段的实体 (用户、订单、产品)
- 函数参数打包
- API 请求/响应格式

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};
```

### 何时使用和类型

✅ **适合的场景:**
- 表示互斥的状态 (加载中、成功、失败)
- 表示多种可能的形状 (不同类型的事件)
- 替代 null/undefined (Option 类型)

```typescript
type LoadingState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

### 设计 ADT 的原则

1. **使非法状态不可表示**
   ```typescript
   // ❌ 坏的设计
   type User = {
     loggedIn: boolean;
     token?: string;  // 可能出现 loggedIn=true 但 token=undefined
   };
   
   // ✅ 好的设计
   type User =
     | { status: 'guest' }
     | { status: 'authenticated'; token: string };
   ```

2. **优先使用小的、可组合的类型**
   ```typescript
   type EmailAddress = string;  // 可以添加品牌类型
   type UserId = number;
   
   type User = {
     id: UserId;
     email: EmailAddress;
   };
   ```

3. **使用判别字段使模式匹配更清晰**
   ```typescript
   // 总是使用相同的字段名 (kind, type, tag)
   type Shape =
     | { kind: 'circle'; radius: number }
     | { kind: 'square'; side: number };
   ```

## 🎯 学习检查清单

- [ ] 理解积类型和和类型的概念
- [ ] 能够在 TypeScript 中定义判别联合
- [ ] 掌握模式匹配和穷尽性检查
- [ ] 理解 ADT 与 OOP 继承的区别和权衡
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-product-types.ts` - 积类型(元组、记录)和类型代数
- `02-sum-types.ts` - 和类型(判别联合)和基础模式匹配
- `03-pattern-matching.ts` - 高级模式匹配和穷尽性检查
- `04-oop-vs-adt.ts` - OOP 继承与 ADT 的对比
- `05-exercises.ts` - 练习题

## ➡️ 下一章

[第五章: Option 和 Either](/05-option-and-either) - 学习用 ADT 处理空值和错误
