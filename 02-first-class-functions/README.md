# 第二章：函数是一等公民

> 理解高阶函数、闭包以及函数式编程与面向对象编程的区别

## 🎯 学习目标

学完本章后,你将能够:

- ✅ 理解"一等公民"(First-Class Citizen) 的含义
- ✅ 熟练使用高阶函数 (Higher-Order Functions)
- ✅ 掌握闭包 (Closures) 的原理和应用
- ✅ 对比 OOP 与 FP 的不同思维方式
- ✅ 在实际业务中应用函数式思维

## 📖 核心概念

### 1. 什么是一等公民 (First-Class Citizen)?

#### 通俗类比

在一个国家里:
- **一等公民**拥有完整的权利:可以自由移动、拥有财产、参与投票
- **二等公民**受到限制:只能在特定场所活动、权利受限

在编程语言中,函数作为**一等公民**意味着:
- ✅ 可以赋值给变量
- ✅ 可以作为参数传递
- ✅ 可以作为返回值
- ✅ 可以存储在数据结构中

```typescript
// ✅ 函数可以赋值给变量
const add = (a: number, b: number) => a + b;

// ✅ 函数可以作为参数传递
function apply(fn: (x: number) => number, value: number) {
  return fn(value);
}

// ✅ 函数可以作为返回值
function multiplier(factor: number) {
  return (x: number) => x * factor;
}

// ✅ 函数可以存储在数组中
const operations = [add, subtract, multiply];
```

### 2. 高阶函数 (Higher-Order Functions)

#### 定义

高阶函数是指**接受函数作为参数**或**返回函数**的函数。

#### 为什么需要高阶函数?

| 优势 | 说明 |
|------|------|
| **代码复用** | 提取公共模式,减少重复 |
| **抽象层次高** | 关注"做什么"而非"怎么做" |
| **组合性强** | 小函数可以组合成复杂功能 |
| **声明式编程** | 代码更接近业务逻辑 |

#### 常见的高阶函数

```typescript
// map: 转换数组元素
[1, 2, 3].map(x => x * 2);  // [2, 4, 6]

// filter: 过滤数组元素
[1, 2, 3, 4].filter(x => x > 2);  // [3, 4]

// reduce: 聚合数组元素
[1, 2, 3].reduce((sum, x) => sum + x, 0);  // 6

// forEach: 遍历数组 (有副作用)
[1, 2, 3].forEach(x => console.log(x));
```

### 3. 闭包 (Closures)

#### 通俗类比

想象一个**背包**:
- 你去旅行时带着背包
- 背包里装着你的个人物品
- 无论你走到哪里,背包都跟着你
- 只有你能访问背包里的东西

闭包就像这个背包:函数"记住"了它被创建时的环境。

#### 严格定义

闭包是指**函数和其词法环境的组合**。即使外部函数已经返回,内部函数仍然可以访问外部函数的变量。

```typescript
function createCounter() {
  let count = 0;  // 私有变量
  
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    getCount() { return count; }
  };
}

const counter = createCounter();
counter.increment();  // 1
counter.increment();  // 2
counter.getCount();   // 2
// 无法直接访问 count 变量
```

#### 闭包的应用场景

1. **数据隐藏和封装** - 创建私有变量
2. **函数工厂** - 生成定制化的函数
3. **部分应用** - 固定某些参数
4. **回调函数** - 保持状态
5. **模块模式** - 实现模块化

### 4. Currying (柯里化)

虽然柯里化会在第三章详细讲解,但作为高阶函数的重要应用,这里先简单介绍:

```typescript
// 普通函数
function add(a: number, b: number, c: number) {
  return a + b + c;
}

// 柯里化版本
function curriedAdd(a: number) {
  return (b: number) => {
    return (c: number) => {
      return a + b + c;
    };
  };
}

curriedAdd(1)(2)(3);  // 6
```

## 🆚 OOP vs FP 对比

### 思维方式对比

#### OOP: 以对象为中心

```typescript
class UserService {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  async getUser(id: number): Promise<User> {
    return this.db.findById(id);
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    return this.db.update(id, { ...user, ...data });
  }
}

// 使用
const service = new UserService(database);
await service.updateUser(1, { name: 'New Name' });
```

#### FP: 以函数为中心

```typescript
// 纯函数: 数据转换
type UserService = {
  getUser: (db: Database, id: number) => Promise<User>;
  updateUser: (db: Database, id: number, data: Partial<User>) => Promise<User>;
};

const UserService: UserService = {
  async getUser(db, id) {
    return db.findById(id);
  },
  
  async updateUser(db, id, data) {
    const user = await this.getUser(db, id);
    return db.update(id, { ...user, ...data });
  }
};

// 使用
await UserService.updateUser(database, 1, { name: 'New Name' });
```

### 对比总结

| 方面 | OOP | FP |
|------|-----|-----|
| **核心概念** | 对象、类、继承、封装 | 函数、组合、不可变数据 |
| **状态管理** | 对象内部状态 | 参数传递 |
| **代码复用** | 继承、多态 | 高阶函数、组合 |
| **副作用** | 方法可以修改状态 | 最小化、隔离副作用 |
| **测试** | 需要 mock 依赖 | 纯函数易测试 |
| **并发** | 需要锁机制 | 不可变数据天然安全 |

## 💡 关键要点总结

1. **函数是一等公民**
   - 可以像数据一样自由传递和使用
   - 这是函数式编程的基础

2. **高阶函数提升抽象层次**
   - 接受函数作为参数
   - 返回函数作为结果
   - 实现强大的代码复用

3. **闭包是强大的工具**
   - 创建私有状态
   - 实现函数工厂
   - 但要注意内存泄漏

4. **FP vs OOP 不是对立的**
   - 可以在同一项目中混用
   - 选择最适合问题域的范式
   - 理解两者的优势和局限

## 🤔 进一步思考

1. **问: JavaScript 的闭包会导致内存泄漏吗?**
   - 答: 可能会。如果长期持有对大对象的引用,会导致内存无法回收。需要在合适的时机解除引用。

2. **问: 高阶函数的性能如何?**
   - 答: 现代 JavaScript 引擎对高阶函数有很好的优化。在大多数情况下,性能差异可以忽略。

3. **问: 什么时候用 OOP,什么时候用 FP?**
   - 答: 
     - OOP: 建模实体关系、需要封装状态时
     - FP: 数据转换、管道处理、需要高度可测试性时
     - 混合: 在同一项目中结合两者优势

4. **问: 箭头函数和普通函数有什么区别?**
   - 答: 主要是 `this` 绑定不同。箭头函数没有自己的 `this`,它继承外层作用域的 `this`。

## 📝 实践指南

### 识别可以用高阶函数的场景

❌ **命令式循环:**
```typescript
const result = [];
for (let i = 0; i < items.length; i++) {
  if (items[i].active) {
    result.push(items[i].name);
  }
}
```

✅ **声明式高阶函数:**
```typescript
const result = items
  .filter(item => item.active)
  .map(item => item.name);
```

### 使用闭包创建工具函数

```typescript
// 日志记录器工厂
function createLogger(prefix: string) {
  return (message: string) => {
    console.log(`[${prefix}] ${message}`);
  };
}

const errorLog = createLogger('ERROR');
const infoLog = createLogger('INFO');

errorLog('Something went wrong');  // [ERROR] Something went wrong
infoLog('Process completed');      // [INFO] Process completed
```

## 🎯 学习检查清单

- [ ] 理解函数作为一等公民的含义
- [ ] 能够编写和使用高阶函数
- [ ] 理解闭包的原理和应用场景
- [ ] 能够对比 OOP 和 FP 的思维方式
- [ ] 完成本章所有练习

## 📚 本章文件

- `01-higher-order-functions.ts` - 高阶函数的详细示例
- `02-closures.ts` - 闭包的原理和应用
- `03-oop-vs-fp.ts` - OOP 与 FP 的对比
- `04-exercises.ts` - 练习题

## ➡️ 下一章

[第三章: 柯里化与函数组合](/03-currying-and-composition) - 学习函数组合的艺术
