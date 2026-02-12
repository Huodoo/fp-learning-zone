/**
 * 应用核心逻辑 - Pure Core
 * 
 * 所有业务逻辑都是纯函数
 */

import { Either, left, right } from './either.js';
import { Option, some, none, fromNullable } from './option.js';
import { lensProp, modify } from './lens.js';
import {
  Todo,
  TodoList,
  Command,
  AppError,
  TodoFilter,
  createTodo,
  createEmptyTodoList,
} from './types.js';

// ============================================================================
// 纯函数：状态转换
// ============================================================================

/**
 * 添加 Todo
 */
export function addTodo(
  list: TodoList,
  text: string,
  tags: readonly string[] = []
): TodoList {
  const newTodo = createTodo(list.nextId, text, tags);
  return {
    todos: [...list.todos, newTodo],
    nextId: list.nextId + 1,
  };
}

/**
 * 查找 Todo
 */
export function findTodo(list: TodoList, id: number): Option<Todo> {
  return fromNullable(list.todos.find(todo => todo.id === id));
}

/**
 * 完成 Todo
 */
export function completeTodo(list: TodoList, id: number): Either<AppError, TodoList> {
  const todoOption = findTodo(list, id);
  
  if (todoOption._tag === 'None') {
    return left({ type: 'TodoNotFound', id });
  }

  const completedLens = lensProp<Todo, 'completed'>('completed');
  const updatedTodos = list.todos.map(todo =>
    todo.id === id ? completedLens.set(todo, true) : todo
  );

  return right({ ...list, todos: updatedTodos });
}

/**
 * 取消完成 Todo
 */
export function uncompleteTodo(list: TodoList, id: number): Either<AppError, TodoList> {
  const todoOption = findTodo(list, id);
  
  if (todoOption._tag === 'None') {
    return left({ type: 'TodoNotFound', id });
  }

  const completedLens = lensProp<Todo, 'completed'>('completed');
  const updatedTodos = list.todos.map(todo =>
    todo.id === id ? completedLens.set(todo, false) : todo
  );

  return right({ ...list, todos: updatedTodos });
}

/**
 * 删除 Todo
 */
export function removeTodo(list: TodoList, id: number): Either<AppError, TodoList> {
  const todoOption = findTodo(list, id);
  
  if (todoOption._tag === 'None') {
    return left({ type: 'TodoNotFound', id });
  }

  const updatedTodos = list.todos.filter(todo => todo.id !== id);
  return right({ ...list, todos: updatedTodos });
}

/**
 * 过滤 Todos
 */
export function filterTodos(list: TodoList, filter: TodoFilter): readonly Todo[] {
  switch (filter) {
    case 'all':
      return list.todos;
    case 'active':
      return list.todos.filter(todo => !todo.completed);
    case 'completed':
      return list.todos.filter(todo => todo.completed);
  }
}

/**
 * 清空所有已完成的 Todos
 */
export function clearCompleted(list: TodoList): TodoList {
  const activeTodos = list.todos.filter(todo => !todo.completed);
  return { ...list, todos: activeTodos };
}

// ============================================================================
// 命令处理 - 纯函数
// ============================================================================

/**
 * 处理命令
 */
export function handleCommand(
  list: TodoList,
  command: Command
): Either<AppError, TodoList> {
  switch (command.type) {
    case 'Add':
      return right(addTodo(list, command.text, command.tags || []));

    case 'Complete':
      return completeTodo(list, command.id);

    case 'Uncomplete':
      return uncompleteTodo(list, command.id);

    case 'Remove':
      return removeTodo(list, command.id);

    case 'List':
      // List 命令不改变状态，只是查询
      return right(list);

    case 'Clear':
      return right(clearCompleted(list));

    case 'Help':
      // Help 命令不改变状态
      return right(list);
  }
}

// ============================================================================
// 序列化/反序列化 - 纯函数
// ============================================================================

/**
 * 序列化 TodoList 到 JSON
 */
export function serializeTodoList(list: TodoList): string {
  return JSON.stringify(list, null, 2);
}

/**
 * 从 JSON 反序列化 TodoList
 */
export function deserializeTodoList(json: string): Either<AppError, TodoList> {
  try {
    const parsed = JSON.parse(json);
    
    // 基本验证
    if (!parsed || typeof parsed !== 'object') {
      return left({ type: 'ParseError', message: 'Invalid JSON structure' });
    }

    if (!Array.isArray(parsed.todos)) {
      return left({ type: 'ParseError', message: 'Missing todos array' });
    }

    if (typeof parsed.nextId !== 'number') {
      return left({ type: 'ParseError', message: 'Missing or invalid nextId' });
    }

    // 转换日期字符串回 Date 对象
    const todos = parsed.todos.map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
    }));

    return right({ todos, nextId: parsed.nextId });
  } catch (error) {
    return left({ 
      type: 'ParseError', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// ============================================================================
// 帮助信息
// ============================================================================

export function getHelpText(): string {
  return `
Todo List CLI - 函数式编程示例

用法:
  tsx src/main.ts <command> [arguments]

命令:
  add <text> [tags...]      添加新任务
  list [filter]             列出任务 (filter: all|active|completed)
  complete <id>             标记任务为已完成
  uncomplete <id>           取消完成任务
  remove <id>               删除任务
  clear                     清除所有已完成任务
  help                      显示此帮助信息

示例:
  tsx src/main.ts add "学习函数式编程" fp learning
  tsx src/main.ts list
  tsx src/main.ts list active
  tsx src/main.ts complete 1
  tsx src/main.ts remove 2
  tsx src/main.ts clear
`;
}
