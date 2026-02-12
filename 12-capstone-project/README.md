# 第十二章：综合实战项目

> 用纯函数式风格构建一个完整的 CLI 应用

## 🎯 项目简介

本章将综合运用前面所有章节学到的知识，构建一个完整的**任务管理 CLI 应用**（Todo List）。

这不是一个玩具项目，而是一个真实可用的应用，展示了如何在实际项目中应用函数式编程思想。

## 📋 项目特性

- ✅ **纯函数式架构** - 核心逻辑完全纯净
- ✅ **类型安全** - 使用 ADT 建模领域
- ✅ **错误处理** - 使用 Either 和 TaskEither
- ✅ **副作用隔离** - 使用 IO 和 Task
- ✅ **依赖注入** - 使用 Reader
- ✅ **数据更新** - 使用 Lens
- ✅ **可测试** - 纯函数易于测试

## 🏗️ 架构设计

```
┌─────────────────────────────────────┐
│         main.ts (Impure Shell)      │  ← 唯一允许副作用的地方
│  - 解析命令行参数                      │
│  - 执行 IO 操作                       │
│  - 打印输出                           │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        app.ts (Pure Core)           │  ← 纯函数业务逻辑
│  - 命令处理                           │
│  - 状态转换                           │
│  - 验证逻辑                           │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│    Domain Models (types.ts)         │  ← ADT 类型定义
│  - Todo, TodoList, Command          │
│  - Result types                     │
└─────────────────────────────────────┘
```

## 🎓 学到的内容

### 1. Pure Core, Impure Shell 模式

将程序分为两部分：

- **Pure Core（纯核心）** - 所有业务逻辑都是纯函数
- **Impure Shell（非纯外壳）** - 只在边界处理副作用

### 2. 使用 ADT 建模领域

```typescript
type Todo = {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
  readonly createdAt: Date;
};

type Command =
  | { type: 'Add'; text: string }
  | { type: 'Complete'; id: number }
  | { type: 'Remove'; id: number }
  | { type: 'List' };
```

### 3. 使用 Monad Stack 处理复杂场景

```typescript
// ReaderTaskEither<Deps, Error, Result>
type AppEffect<A> = ReaderTaskEither<AppDeps, AppError, A>;
```

### 4. Lens 简化数据更新

```typescript
const completedLens = lensProp<Todo, 'completed'>('completed');
const updatedTodo = completedLens.set(todo, true);
```

## 📁 文件说明

### src/types.ts
领域模型和类型定义

### src/option.ts
Option 类型（复用第 5 章）

### src/either.ts
Either 类型（复用第 5 章）

### src/io.ts
IO Monad（复用第 7 章）

### src/task.ts
Task Monad（复用第 7 章）

### src/reader.ts
Reader Monad（复用第 8 章）

### src/lens.ts
Lens 实现（复用第 11 章）

### src/app.ts
应用核心逻辑（纯函数）

### src/main.ts
程序入口（副作用边界）

### tests/app.test.ts
测试（展示 FP 的可测试性）

## 🚀 运行项目

```bash
# 运行应用
npm run ch12:capstone

# 添加任务
node dist/12-capstone-project/src/main.js add "学习 FP"

# 列出所有任务
node dist/12-capstone-project/src/main.js list

# 完成任务
node dist/12-capstone-project/src/main.js complete 1

# 删除任务
node dist/12-capstone-project/src/main.js remove 1
```

## 💡 关键设计决策

### 1. 为什么使用 ReaderTaskEither？

```typescript
// 组合了三个关注点：
// - Reader: 依赖注入（文件系统、配置）
// - Task: 异步操作（读写文件）
// - Either: 错误处理（类型化错误）
```

### 2. 为什么分离 Pure Core 和 Impure Shell？

- **可测试性** - 纯函数不需要 mock
- **可推理性** - 纯函数行为可预测
- **可组合性** - 纯函数易于组合

### 3. 为什么使用 ADT 而不是 OOP 继承？

- **穷尽性检查** - TypeScript 会强制处理所有情况
- **模式匹配** - 使用 switch/case 清晰表达逻辑
- **扩展性** - 添加新类型不需要修改现有代码

## 🎯 学习目标检查

完成本章后，你应该能够：

- [ ] 理解 Pure Core, Impure Shell 架构
- [ ] 使用 ADT 建模真实业务领域
- [ ] 组合多个 Monad（ReaderTaskEither）
- [ ] 隔离副作用到程序边界
- [ ] 编写可测试的纯函数式代码
- [ ] 在实际项目中应用 FP 思想

## 🔄 OOP vs FP 对比

### OOP 方式（可变状态）

```typescript
class TodoList {
  private todos: Todo[] = [];
  
  add(text: string) {
    this.todos.push({ id: Date.now(), text, completed: false });
  }
  
  complete(id: number) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.completed = true;
  }
}
```

### FP 方式（不可变状态）

```typescript
function addTodo(list: TodoList, text: string): TodoList {
  return {
    ...list,
    todos: [...list.todos, createTodo(text)]
  };
}

function completeTodo(list: TodoList, id: number): Either<Error, TodoList> {
  // 返回新状态或错误
}
```

## 📚 进一步学习

完成这个项目后，你已经掌握了函数式编程的核心概念！

下一步：
1. 在工作项目中逐步引入 FP 思想
2. 学习成熟的 FP 库（fp-ts, Effect）
3. 探索纯函数式语言（Haskell, Elm, PureScript）
4. 深入学习范畴论（Category Theory）

## 🎉 恭喜！

你已经完成了整个 FP Learning Zone 的学习！

这是一个了不起的成就。函数式编程不仅仅是一种编程范式，更是一种思维方式。

希望这个学习项目能帮助你：
- 写出更可靠的代码
- 更好地处理复杂性
- 享受编程的乐趣

**Happy Functional Programming! 🚀**
