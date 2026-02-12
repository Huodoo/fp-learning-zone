/**
 * 类型定义：领域模型
 * 
 * 使用 ADT（代数数据类型）建模 Todo 应用的领域
 */

// ============================================================================
// 核心领域类型
// ============================================================================

/**
 * Todo 项 - Product Type（积类型）
 */
export type Todo = {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly tags: readonly string[];
};

/**
 * Todo 列表状态
 */
export type TodoList = {
  readonly todos: readonly Todo[];
  readonly nextId: number;
};

// ============================================================================
// 命令类型 - Sum Type（和类型 / Tagged Union）
// ============================================================================

export type Command =
  | { readonly type: 'Add'; readonly text: string; readonly tags?: readonly string[] }
  | { readonly type: 'Complete'; readonly id: number }
  | { readonly type: 'Uncomplete'; readonly id: number }
  | { readonly type: 'Remove'; readonly id: number }
  | { readonly type: 'List'; readonly filter?: TodoFilter }
  | { readonly type: 'Clear' }
  | { readonly type: 'Help' };

/**
 * 过滤器类型
 */
export type TodoFilter = 'all' | 'active' | 'completed';

// ============================================================================
// 错误类型 - Sum Type
// ============================================================================

export type AppError =
  | { readonly type: 'TodoNotFound'; readonly id: number }
  | { readonly type: 'InvalidCommand'; readonly message: string }
  | { readonly type: 'FileSystemError'; readonly error: Error }
  | { readonly type: 'ParseError'; readonly message: string };

// ============================================================================
// 应用依赖（用于 Reader Monad）
// ============================================================================

export type FileSystem = {
  readonly readFile: (path: string) => Promise<string>;
  readonly writeFile: (path: string, content: string) => Promise<void>;
  readonly exists: (path: string) => Promise<boolean>;
};

export type Logger = {
  readonly info: (message: string) => void;
  readonly error: (message: string) => void;
  readonly success: (message: string) => void;
};

export type AppConfig = {
  readonly dataPath: string;
  readonly verbose: boolean;
};

export type AppDeps = {
  readonly fs: FileSystem;
  readonly logger: Logger;
  readonly config: AppConfig;
};

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 创建初始 TodoList
 */
export function createEmptyTodoList(): TodoList {
  return {
    todos: [],
    nextId: 1,
  };
}

/**
 * 创建 Todo
 */
export function createTodo(id: number, text: string, tags: readonly string[] = []): Todo {
  return {
    id,
    text,
    completed: false,
    createdAt: new Date(),
    tags,
  };
}

/**
 * 格式化错误信息
 */
export function formatError(error: AppError): string {
  switch (error.type) {
    case 'TodoNotFound':
      return `Todo with ID ${error.id} not found`;
    case 'InvalidCommand':
      return `Invalid command: ${error.message}`;
    case 'FileSystemError':
      return `File system error: ${error.error.message}`;
    case 'ParseError':
      return `Parse error: ${error.message}`;
  }
}

/**
 * 格式化 Todo 显示
 */
export function formatTodo(todo: Todo): string {
  const checkbox = todo.completed ? '[✓]' : '[ ]';
  const tags = todo.tags.length > 0 ? ` (${todo.tags.join(', ')})` : '';
  return `${checkbox} ${todo.id}. ${todo.text}${tags}`;
}
