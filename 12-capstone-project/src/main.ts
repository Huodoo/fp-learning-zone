/**
 * 程序入口 - Impure Shell
 * 
 * 这是唯一允许副作用的地方
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Either, isLeft, isRight } from './either.js';
import {
  Command,
  AppError,
  TodoList,
  AppDeps,
  FileSystem,
  Logger,
  AppConfig,
  createEmptyTodoList,
  formatError,
  formatTodo,
} from './types.js';
import {
  handleCommand,
  serializeTodoList,
  deserializeTodoList,
  filterTodos,
  getHelpText,
} from './app.js';

// ============================================================================
// 依赖实现（真实实现）
// ============================================================================

const realFileSystem: FileSystem = {
  readFile: async (path: string) => {
    return fs.readFile(path, 'utf-8');
  },
  writeFile: async (path: string, content: string) => {
    await fs.writeFile(path, content, 'utf-8');
  },
  exists: async (path: string) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  },
};

const consoleLogger: Logger = {
  info: (message: string) => console.log(`ℹ️  ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  success: (message: string) => console.log(`✅ ${message}`),
};

// ============================================================================
// 命令行参数解析
// ============================================================================

function parseCommand(args: string[]): Either<AppError, Command> {
  if (args.length === 0) {
    return { _tag: 'Right', right: { type: 'List', filter: 'all' } };
  }

  const [commandName, ...commandArgs] = args;

  switch (commandName) {
    case 'add':
      if (commandArgs.length === 0) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'add requires text argument' },
        };
      }
      const [text, ...tags] = commandArgs;
      return { _tag: 'Right', right: { type: 'Add', text: text!, tags } };

    case 'list':
      const filter = (commandArgs[0] as any) || 'all';
      if (!['all', 'active', 'completed'].includes(filter)) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'Invalid filter. Use: all, active, or completed' },
        };
      }
      return { _tag: 'Right', right: { type: 'List', filter } };

    case 'complete':
      if (commandArgs.length === 0) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'complete requires id argument' },
        };
      }
      const completeId = parseInt(commandArgs[0]!, 10);
      if (isNaN(completeId)) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'id must be a number' },
        };
      }
      return { _tag: 'Right', right: { type: 'Complete', id: completeId } };

    case 'uncomplete':
      if (commandArgs.length === 0) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'uncomplete requires id argument' },
        };
      }
      const uncompleteId = parseInt(commandArgs[0]!, 10);
      if (isNaN(uncompleteId)) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'id must be a number' },
        };
      }
      return { _tag: 'Right', right: { type: 'Uncomplete', id: uncompleteId } };

    case 'remove':
      if (commandArgs.length === 0) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'remove requires id argument' },
        };
      }
      const removeId = parseInt(commandArgs[0]!, 10);
      if (isNaN(removeId)) {
        return {
          _tag: 'Left',
          left: { type: 'InvalidCommand', message: 'id must be a number' },
        };
      }
      return { _tag: 'Right', right: { type: 'Remove', id: removeId } };

    case 'clear':
      return { _tag: 'Right', right: { type: 'Clear' } };

    case 'help':
      return { _tag: 'Right', right: { type: 'Help' } };

    default:
      return {
        _tag: 'Left',
        left: { type: 'InvalidCommand', message: `Unknown command: ${commandName}` },
      };
  }
}

// ============================================================================
// 文件操作（副作用）
// ============================================================================

async function loadTodoList(dataPath: string): Promise<Either<AppError, TodoList>> {
  try {
    const exists = await realFileSystem.exists(dataPath);
    
    if (!exists) {
      return { _tag: 'Right', right: createEmptyTodoList() };
    }

    const content = await realFileSystem.readFile(dataPath);
    return deserializeTodoList(content);
  } catch (error) {
    return {
      _tag: 'Left',
      left: {
        type: 'FileSystemError',
        error: error instanceof Error ? error : new Error('Unknown error'),
      },
    };
  }
}

async function saveTodoList(dataPath: string, list: TodoList): Promise<Either<AppError, void>> {
  try {
    const content = serializeTodoList(list);
    await realFileSystem.writeFile(dataPath, content);
    return { _tag: 'Right', right: undefined };
  } catch (error) {
    return {
      _tag: 'Left',
      left: {
        type: 'FileSystemError',
        error: error instanceof Error ? error : new Error('Unknown error'),
      },
    };
  }
}

// ============================================================================
// 主程序
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dataPath = path.join(process.cwd(), 'todos.json');

  // 解析命令
  const commandResult = parseCommand(args);
  if (isLeft(commandResult)) {
    consoleLogger.error(formatError(commandResult.left));
    console.log(getHelpText());
    process.exit(1);
  }

  const command = commandResult.right;

  // 处理 Help 命令
  if (command.type === 'Help') {
    console.log(getHelpText());
    process.exit(0);
  }

  // 加载当前状态
  const loadResult = await loadTodoList(dataPath);
  if (isLeft(loadResult)) {
    consoleLogger.error(formatError(loadResult.left));
    process.exit(1);
  }

  let currentList = loadResult.right;

  // 处理命令（纯函数）
  const updatedListResult = handleCommand(currentList, command);
  
  if (isLeft(updatedListResult)) {
    consoleLogger.error(formatError(updatedListResult.left));
    process.exit(1);
  }

  const updatedList = updatedListResult.right;

  // 保存状态（除了 List 命令）
  if (command.type !== 'List') {
    const saveResult = await saveTodoList(dataPath, updatedList);
    if (isLeft(saveResult)) {
      consoleLogger.error(formatError(saveResult.left));
      process.exit(1);
    }
  }

  // 显示结果
  if (command.type === 'List') {
    const filter = command.filter || 'all';
    const todos = filterTodos(updatedList, filter);
    
    if (todos.length === 0) {
      consoleLogger.info(`No ${filter} todos found`);
    } else {
      console.log(`\n${filter.toUpperCase()} TODOS:\n`);
      todos.forEach(todo => {
        console.log(formatTodo(todo));
      });
      console.log();
    }
  } else if (command.type === 'Add') {
    consoleLogger.success(`Added: ${command.text}`);
  } else if (command.type === 'Complete') {
    consoleLogger.success(`Completed todo ${command.id}`);
  } else if (command.type === 'Uncomplete') {
    consoleLogger.success(`Uncompleted todo ${command.id}`);
  } else if (command.type === 'Remove') {
    consoleLogger.success(`Removed todo ${command.id}`);
  } else if (command.type === 'Clear') {
    consoleLogger.success('Cleared completed todos');
  }
}

// 运行程序
main().catch(error => {
  consoleLogger.error(`Unexpected error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
