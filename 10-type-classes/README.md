# 第十章：类型类 (Type Classes)

> 通过类型类实现多态和代码复用，理解函数式编程中的抽象机制

## 🎯 学习目标

学完本章后，你将能够：

- ✅ 理解类型类的概念及其与 OOP 接口的区别
- ✅ 掌握常见类型类：Eq、Ord、Show、Semigroup、Monoid
- ✅ 使用 Foldable 和 Traversable 处理数据结构
- ✅ 在 TypeScript 中模拟实现类型类模式
- ✅ 应用类型类解决实际业务问题

## 📖 核心概念

### 1. 什么是类型类 (Type Class)?

#### 通俗类比

类型类就像是**能力认证**：
- **接口 (Interface)** = 出生证明：你是什么类型
- **类型类 (Type Class)** = 技能证书：你能做什么操作

举例：
- `Eq` 类型类 = "可比较相等性"能力证书
- `Ord` 类型类 = "可排序"能力证书  
- `Show` 类型类 = "可转为字符串"能力证书

任何类型只要实现了相应的操作，就可以获得该类型类的"认证"！

#### 严格定义

**类型类 (Type Class)** 是一种定义通用行为的机制，它描述了一组类型应该支持的操作。

```haskell
-- Haskell 中的类型类定义示例
class Eq a where
  (==) :: a -> a -> Bool
  
-- 为具体类型实现类型类
instance Eq Int where
  x == y = -- 实现整数相等性比较
```

在 TypeScript 中，我们通过**接口 + 字典对象**来模拟类型类：

```typescript
// 类型类定义
interface Eq<T> {
  equals: (a: T, b: T) => boolean;
}

// 类型类实例（字典）
const eqNumber: Eq<number> = {
  equals: (a, b) => a === b
};

const eqString: Eq<string> = {
  equals: (a, b) => a === b
};
```

### 2. 类型类 vs OOP 接口

#### 关键区别

| 特性 | OOP 接口 (Interface) | 类型类 (Type Class) |
|------|---------------------|-------------------|
| **绑定时机** | 在类定义时绑定 | 使用时传入（外部实现） |
| **耦合性** | 高耦合（类必须声明实现接口） | 低耦合（可为任何类型添加行为） |
| **扩展性** | 难以为第三方类型扩展 | 可为任何类型（包括原生类型）实现 |
| **多实现** | 一个类一种实现 | 同一类型可有多个实现 |

#### OOP 方式（紧耦合）

```typescript
// ❌ OOP: 能力必须在类定义时声明
interface Comparable {
  compareTo(other: this): number;
}

class Person implements Comparable {
  constructor(public age: number) {}
  
  compareTo(other: Person): number {
    return this.age - other.age;
  }
}

// 问题：无法为 number、string 等原生类型添加 Comparable
```

#### 类型类方式（松耦合）

```typescript
// ✅ 类型类：能力外部定义，使用时传入
interface Ord<T> {
  compare: (a: T, b: T) => number;
}

// 可为任何类型实现 Ord
const ordNumber: Ord<number> = {
  compare: (a, b) => a - b
};

const ordString: Ord<string> = {
  compare: (a, b) => a.localeCompare(b)
};

// 同一类型可有多个实现
const ordNumberReverse: Ord<number> = {
  compare: (a, b) => b - a  // 倒序
};

// 通用排序函数（接受类型类实例）
function sort<T>(arr: T[], ord: Ord<T>): T[] {
  return [...arr].sort(ord.compare);
}

sort([3, 1, 2], ordNumber);      // [1, 2, 3]
sort([3, 1, 2], ordNumberReverse); // [3, 2, 1]
```

### 3. 常见类型类

#### Eq - 相等性比较

定义了 `equals` 操作，判断两个值是否相等。

**法则 (Laws)**：
- 自反性：`equals(a, a) === true`
- 对称性：`equals(a, b) === equals(b, a)`
- 传递性：如果 `equals(a, b)` 且 `equals(b, c)`，则 `equals(a, c)`

```typescript
interface Eq<T> {
  equals: (a: T, b: T) => boolean;
}
```

#### Ord - 排序比较

扩展 Eq，增加了 `compare` 操作。

**法则**：
- 全序性：任意两个值可比较
- 反对称性：如果 `compare(a, b) <= 0` 且 `compare(b, a) <= 0`，则 `equals(a, b)`
- 传递性：如果 `compare(a, b) <= 0` 且 `compare(b, c) <= 0`，则 `compare(a, c) <= 0`

```typescript
interface Ord<T> extends Eq<T> {
  compare: (a: T, b: T) => number;  // < 0 | 0 | > 0
}
```

#### Show - 字符串表示

定义了 `show` 操作，将值转为字符串。

```typescript
interface Show<T> {
  show: (a: T) => string;
}
```

#### Semigroup - 可结合操作

定义了 `concat` 操作，可以组合两个相同类型的值。

**法则**：
- 结合律：`concat(concat(a, b), c) === concat(a, concat(b, c))`

```typescript
interface Semigroup<T> {
  concat: (a: T, b: T) => T;
}
```

**示例**：
- 数字加法：`concat(1, 2) = 3`
- 字符串连接：`concat("hello", "world") = "helloworld"`
- 数组合并：`concat([1, 2], [3, 4]) = [1, 2, 3, 4]`

#### Monoid - 带单位元的 Semigroup

扩展 Semigroup，增加了单位元 (identity element)。

**法则**：
- 继承 Semigroup 的结合律
- 左单位元：`concat(empty, a) === a`
- 右单位元：`concat(a, empty) === a`

```typescript
interface Monoid<T> extends Semigroup<T> {
  empty: T;  // 单位元
}
```

**示例**：
- 数字加法：`empty = 0`
- 数字乘法：`empty = 1`
- 字符串连接：`empty = ""`
- 数组合并：`empty = []`

### 4. 为什么类型类重要？

#### 1. **代码复用和抽象**

```typescript
// 通用的 fold 函数，适用于所有 Monoid
function foldMap<T>(arr: T[], monoid: Monoid<T>): T {
  return arr.reduce(monoid.concat, monoid.empty);
}

// 复用于不同场景
foldMap([1, 2, 3], monoidSum);        // 6
foldMap(["a", "b", "c"], monoidString); // "abc"
foldMap([[1], [2], [3]], monoidArray);  // [1, 2, 3]
```

#### 2. **组合性**

类型类可以组合，从简单类型类构建复杂类型类：

```typescript
// Ord 扩展 Eq
interface Ord<T> extends Eq<T> {
  compare: (a: T, b: T) => number;
}

// Monoid 扩展 Semigroup
interface Monoid<T> extends Semigroup<T> {
  empty: T;
}
```

#### 3. **类型安全的多态**

```typescript
// 使用类型类约束，保证类型安全
function dedupe<T>(arr: T[], eq: Eq<T>): T[] {
  return arr.filter((item, index) => 
    arr.findIndex(other => eq.equals(item, other)) === index
  );
}
```

#### 4. **解决实际问题**

**场景 1：数据聚合**
```typescript
// 使用 Monoid 聚合多个数据源
const stats1 = { views: 100, likes: 10 };
const stats2 = { views: 200, likes: 20 };
const stats3 = { views: 300, likes: 30 };

const totalStats = foldMap([stats1, stats2, stats3], monoidStats);
// { views: 600, likes: 60 }
```

**场景 2：表单验证**
```typescript
// 使用 Semigroup 组合验证结果
const validation1 = validateName(name);
const validation2 = validateEmail(email);
const validation3 = validateAge(age);

const allValidations = concat(
  concat(validation1, validation2),
  validation3
);
```

**场景 3：配置合并**
```typescript
// 使用 Monoid 合并配置
const defaultConfig = { timeout: 3000, retries: 3 };
const userConfig = { timeout: 5000 };
const finalConfig = concat(defaultConfig, userConfig);
```

### 5. Foldable - 可折叠结构

定义了如何将数据结构折叠（归约）为单个值。

```typescript
interface Foldable<F> {
  reduce: <A, B>(fa: HKT<F, A>, f: (b: B, a: A) => B, initial: B) => B;
}
```

**核心操作**：
- `reduce`：从左到右折叠
- `foldMap`：使用 Monoid 折叠

**示例**：数组、树、链表等都是 Foldable。

### 6. Traversable - 可遍历结构

扩展 Foldable，支持在结构中应用带副作用的操作。

```typescript
interface Traversable<T> extends Foldable<T> {
  traverse: <A, B>(
    fa: HKT<T, A>,
    f: (a: A) => HKT<Effect, B>
  ) => HKT<Effect, HKT<T, B>>;
}
```

**关键能力**：可以"翻转"嵌套类型。

```typescript
// 将 Array<Option<T>> 转为 Option<Array<T>>
traverse([Some(1), Some(2), Some(3)]) // Some([1, 2, 3])
traverse([Some(1), None, Some(3)])     // None
```

## 🎓 学习路线

1. **01-type-class-pattern.ts** - 类型类基础模式
   - 在 TypeScript 中模拟类型类
   - 实现 Eq、Ord、Show
   - 实现 Semigroup、Monoid

2. **02-semigroup-monoid.ts** - Semigroup 和 Monoid 深入
   - 各种 Monoid 实例
   - 组合 Monoid
   - 实际应用场景

3. **03-foldable-traversable.ts** - Foldable 和 Traversable
   - 实现 Foldable
   - 实现 Traversable
   - 处理复杂数据结构

4. **04-exercises.ts** - 实战练习
   - 表单验证组合
   - 数据聚合
   - 配置合并

## 🔑 关键要点

1. **类型类是能力的抽象**：定义了类型应该支持的操作
2. **外部实现，使用时传入**：不需要修改原类型
3. **遵循数学法则**：保证组合和推理的正确性
4. **Monoid 是最强大的抽象之一**：可并行、可组合、有单位元
5. **类型类实现代码复用**：一次实现，多处使用

## 📚 延伸阅读

- [Haskell Type Classes](https://learnyouahaskell.com/types-and-typeclasses)
- [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
- [Scala Cats Type Classes](https://typelevel.org/cats/typeclasses.html)

## 💡 实践建议

1. 为常用数据类型实现类型类实例
2. 使用 Monoid 简化聚合逻辑
3. 利用类型类写出更通用的函数
4. 遵循类型类法则，保证代码正确性

---

**下一章**：[第十一章：光学 (Optics)](../11-optics/README.md) - 处理嵌套不可变数据的优雅方案
