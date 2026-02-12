# 第十一章：光学 (Optics)

> 使用 Lens、Prism 和 Optional 优雅地操作深层嵌套的不可变数据

## 🎯 学习目标

学完本章后，你将能够：

- ✅ 理解为什么需要 Optics（光学）
- ✅ 掌握 Lens 的概念和使用
- ✅ 掌握 Prism 的概念和使用
- ✅ 组合 Optics 处理深层嵌套数据
- ✅ 在实际项目中应用 Optics 简化数据更新

## 📖 核心概念

### 1. 为什么需要 Optics?

#### 问题：嵌套不可变数据更新的痛苦

在函数式编程中，我们强调不可变性。但更新深层嵌套的不可变数据非常繁琐：

```typescript
// ❌ 传统方式：更新深层嵌套数据
type User = {
  name: string;
  address: {
    city: string;
    street: {
      name: string;
      number: number;
    };
  };
};

const user: User = {
  name: 'Alice',
  address: {
    city: 'Beijing',
    street: { name: 'Main St', number: 123 }
  }
};

// 更新街道号码：需要层层展开
const updatedUser = {
  ...user,
  address: {
    ...user.address,
    street: {
      ...user.address.street,
      number: 456  // 只改这一个值！
    }
  }
};
```

**问题**：
1. 😫 **繁琐**：层层展开，代码冗长
2. 🐛 **易错**：容易忘记展开某一层
3. 📉 **可维护性差**：数据结构改变需要修改很多地方
4. 🤯 **可读性差**：意图不明确

#### 解决方案：Optics（光学）

Optics 提供了一套组合式的工具，让你可以：
- **聚焦 (Focus)**：定位到数据结构中的特定部分
- **读取 (Get)**：获取聚焦位置的值
- **更新 (Set)**：更新聚焦位置的值（不可变）
- **修改 (Modify)**：对聚焦位置的值应用函数
- **组合 (Compose)**：组合多个 Optics 处理深层结构

```typescript
// ✅ 使用 Lens
const streetNumberLens = compose(
  addressLens,
  streetLens,
  numberLens
);

const updatedUser = streetNumberLens.set(user, 456);
```

### 2. Lens - 聚焦产品类型 (Product Types)

#### 通俗类比

Lens（透镜）就像一个**放大镜**：
- 可以**聚焦**到对象的某个字段
- 可以**查看**该字段的值
- 可以**修改**该字段的值（创建新对象）

#### 严格定义

**Lens** 是一对函数 `(get, set)`：
- `get: (s: S) => A` - 从整体 `S` 中提取部分 `A`
- `set: (s: S, a: A) => S` - 用新值 `a` 更新整体 `S` 中的部分，返回新的整体

```typescript
interface Lens<S, A> {
  get: (s: S) => A;
  set: (s: S, a: A) => S;
}
```

#### Lens 的三个基本操作

```typescript
interface Lens<S, A> {
  get: (s: S) => A;                    // 读取
  set: (s: S, a: A) => S;              // 设置
  modify: (s: S, f: (a: A) => A) => S; // 修改（应用函数）
}
```

#### Lens 法则

一个合法的 Lens 必须满足三个法则：

1. **GetSet 法则**：`set(s, get(s)) === s`
   - 用读取的值设置回去，对象不变

2. **SetGet 法则**：`get(set(s, a)) === a`
   - 设置后读取，得到设置的值

3. **SetSet 法则**：`set(set(s, a1), a2) === set(s, a2)`
   - 连续设置两次，只有最后一次生效

### 3. Prism - 聚焦和类型 (Sum Types)

#### 通俗类比

Prism（棱镜）就像一个**可选的放大镜**：
- 只对**特定情况**有效
- 可能**聚焦不到**目标（返回 None）
- 可以**构造**目标类型的值

#### 严格定义

**Prism** 是一对函数 `(getOption, reverseGet)`：
- `getOption: (s: S) => Option<A>` - 尝试从 `S` 中提取 `A`（可能失败）
- `reverseGet: (a: A) => S` - 从 `A` 构造 `S`

```typescript
type Option<T> = { _tag: 'Some'; value: T } | { _tag: 'None' };

interface Prism<S, A> {
  getOption: (s: S) => Option<A>;
  reverseGet: (a: A) => S;
}
```

#### Prism 的使用场景

- 处理**联合类型**（Union Types）
- 处理 **Option**、**Either** 等和类型
- 处理**可能不存在**的值

```typescript
// 示例：Prism 用于 Option
type Option<T> = Some<T> | None;

const somePrism = <T>(): Prism<Option<T>, T> => ({
  getOption: (opt) => opt._tag === 'Some' ? Some(opt.value) : None(),
  reverseGet: (value) => Some(value)
});
```

### 4. Optional - Lens + Prism

#### 通俗类比

Optional 是 Lens 和 Prism 的结合：
- 像 Lens 一样聚焦
- 但聚焦可能**失败**（像 Prism）

#### 严格定义

```typescript
interface Optional<S, A> {
  getOption: (s: S) => Option<A>;
  set: (s: S, a: A) => S;
}
```

### 5. Optics 的组合

#### 组合法则

Optics 最强大的特性是**可组合性**：

| 组合 | 结果 |
|------|------|
| Lens ∘ Lens | Lens |
| Lens ∘ Prism | Optional |
| Prism ∘ Lens | Optional |
| Prism ∘ Prism | Prism |
| Optional ∘ ... | Optional |

```typescript
// 组合 Lens
const streetNumberLens = compose(
  addressLens,      // Lens<User, Address>
  streetLens,       // Lens<Address, Street>
  numberLens        // Lens<Street, number>
);                   // Lens<User, number>

// 组合 Lens 和 Prism
const optionalValue = compose(
  userLens,          // Lens<State, Option<User>>
  somePrism          // Prism<Option<User>, User>
);                   // Optional<State, User>
```

### 6. 实际应用场景

#### 场景 1：Redux/状态管理

```typescript
// 深层状态更新
const updateUserName = (state: AppState, newName: string): AppState => {
  return userNameLens.set(state, newName);
};
```

#### 场景 2：表单处理

```typescript
// 更新表单字段
const updateField = <T>(
  form: Form,
  fieldLens: Lens<Form, T>,
  value: T
): Form => {
  return fieldLens.set(form, value);
};
```

#### 场景 3：API 响应处理

```typescript
// 安全地提取嵌套 API 数据
const getUserCity = (response: ApiResponse): Option<string> => {
  return compose(
    userPrism,      // Prism<Response, User>
    addressLens,    // Lens<User, Option<Address>>
    somePrism,      // Prism<Option<Address>, Address>
    cityLens        // Lens<Address, string>
  ).getOption(response);
};
```

### 7. Optics vs 其他方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| **手动展开** | 简单直接 | 繁琐、易错、不可组合 |
| **Lodash _.set** | 使用简单 | 字符串路径不安全、可变 |
| **Immer** | 语法简洁 | 引入可变风格、魔法较多 |
| **Optics** | 类型安全、可组合、函数式 | 学习曲线、抽象程度高 |

#### 何时使用 Optics？

✅ **适合使用**：
- 深层嵌套数据频繁更新
- 需要复用更新逻辑
- 需要类型安全
- 函数式编程项目

❌ **不必使用**：
- 数据结构扁平
- 更新逻辑简单
- 团队不熟悉函数式编程

## 🎓 学习路线

1. **01-lens.ts** - Lens 基础
   - 实现 Lens 从零开始
   - get、set、modify 操作
   - Lens 组合

2. **02-prism.ts** - Prism 基础
   - 实现 Prism 从零开始
   - 处理和类型
   - Option/Either 的 Prism

3. **03-composing-optics.ts** - Optics 组合
   - 组合多个 Lens
   - 组合 Lens 和 Prism
   - 处理深层嵌套数据

4. **04-exercises.ts** - 实战练习
   - Redux 状态更新
   - 表单处理
   - API 数据提取

## 🔑 关键要点

1. **Optics 解决嵌套更新问题**：告别层层展开
2. **类型安全**：编译期捕获错误
3. **可组合**：从简单 Optics 构建复杂 Optics
4. **声明式**：描述"聚焦在哪"，而非"如何更新"
5. **不可变**：所有操作返回新对象

## 📚 延伸阅读

- [Monocle (Scala Optics Library)](https://www.optics.dev/Monocle/)
- [Haskell Lens](https://hackage.haskell.org/package/lens)
- [Ramda Lens](https://ramdajs.com/docs/#lens)

## 💡 实践建议

1. 从简单的 Lens 开始，逐步理解概念
2. 为常用数据结构创建 Lens 库
3. 优先组合现有 Optics，而非从头实现
4. 在状态管理中应用 Lens 简化更新逻辑

---

**上一章**：[第十章：类型类 (Type Classes)](../10-type-classes/README.md)  
**下一章**：[第十二章：综合项目 (Capstone Project)](../12-capstone-project/README.md)
