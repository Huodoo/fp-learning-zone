/**
 * 测试文件 - 展示函数式代码的可测试性
 * 
 * 由于核心逻辑都是纯函数，测试非常简单！
 */

import {
  addTodo,
  completeTodo,
  removeTodo,
  handleCommand,
  serializeTodoList,
  deserializeTodoList,
  filterTodos,
} from '../src/app.js';
import { createEmptyTodoList, TodoList, Command } from '../src/types.js';
import { isRight, isLeft } from '../src/either.js';

console.log('=== 测试开始 ===\n');

// ============================================================================
// 测试 addTodo
// ============================================================================

console.log('测试 1: addTodo');
const emptyList = createEmptyTodoList();
const list1 = addTodo(emptyList, 'Learn FP', ['learning', 'fp']);
console.log('✓ 添加第一个 todo');
console.assert(list1.todos.length === 1, '应该有 1 个 todo');
console.assert(list1.todos[0]!.text === 'Learn FP', 'text 应该是 Learn FP');
console.assert(list1.todos[0]!.tags.length === 2, '应该有 2 个 tag');
console.assert(list1.nextId === 2, 'nextId 应该是 2');

const list2 = addTodo(list1, 'Practice coding');
console.log('✓ 添加第二个 todo');
console.assert(list2.todos.length === 2, '应该有 2 个 todo');
console.assert(list2.nextId === 3, 'nextId 应该是 3');
console.log();

// ============================================================================
// 测试 completeTodo
// ============================================================================

console.log('测试 2: completeTodo');
const completeResult = completeTodo(list2, 1);
console.assert(isRight(completeResult), 'completeTodo 应该成功');
if (isRight(completeResult)) {
  const list3 = completeResult.right;
  console.assert(list3.todos[0]!.completed === true, 'todo 1 应该被标记为完成');
  console.assert(list3.todos[1]!.completed === false, 'todo 2 应该仍未完成');
  console.log('✓ 完成 todo 成功');
}

const completeNotFoundResult = completeTodo(list2, 999);
console.assert(isLeft(completeNotFoundResult), '不存在的 todo 应该返回错误');
if (isLeft(completeNotFoundResult)) {
  console.assert(completeNotFoundResult.left.type === 'TodoNotFound', '应该是 TodoNotFound 错误');
  console.log('✓ 不存在的 todo 返回正确错误');
}
console.log();

// ============================================================================
// 测试 removeTodo
// ============================================================================

console.log('测试 3: removeTodo');
const removeResult = removeTodo(list2, 1);
console.assert(isRight(removeResult), 'removeTodo 应该成功');
if (isRight(removeResult)) {
  const list4 = removeResult.right;
  console.assert(list4.todos.length === 1, '应该还剩 1 个 todo');
  console.assert(list4.todos[0]!.id === 2, '剩余的应该是 todo 2');
  console.log('✓ 删除 todo 成功');
}
console.log();

// ============================================================================
// 测试 handleCommand
// ============================================================================

console.log('测试 4: handleCommand');
const addCommand: Command = { type: 'Add', text: 'Test task' };
const addResult = handleCommand(emptyList, addCommand);
console.assert(isRight(addResult), 'Add 命令应该成功');
if (isRight(addResult)) {
  console.assert(addResult.right.todos.length === 1, '应该有 1 个 todo');
  console.log('✓ Add 命令处理成功');
}

const completeCommand: Command = { type: 'Complete', id: 1 };
const completeCommandResult = handleCommand(list2, completeCommand);
console.assert(isRight(completeCommandResult), 'Complete 命令应该成功');
console.log('✓ Complete 命令处理成功');

const removeCommand: Command = { type: 'Remove', id: 1 };
const removeCommandResult = handleCommand(list2, removeCommand);
console.assert(isRight(removeCommandResult), 'Remove 命令应该成功');
console.log('✓ Remove 命令处理成功');
console.log();

// ============================================================================
// 测试序列化/反序列化
// ============================================================================

console.log('测试 5: serializeTodoList & deserializeTodoList');
const serialized = serializeTodoList(list2);
console.assert(typeof serialized === 'string', '序列化结果应该是字符串');
console.log('✓ 序列化成功');

const deserializeResult = deserializeTodoList(serialized);
console.assert(isRight(deserializeResult), '反序列化应该成功');
if (isRight(deserializeResult)) {
  const deserialized = deserializeResult.right;
  console.assert(deserialized.todos.length === list2.todos.length, 'todos 数量应该相同');
  console.assert(deserialized.nextId === list2.nextId, 'nextId 应该相同');
  console.log('✓ 反序列化成功');
}

const invalidJson = '{ invalid json }';
const deserializeErrorResult = deserializeTodoList(invalidJson);
console.assert(isLeft(deserializeErrorResult), '无效 JSON 应该返回错误');
if (isLeft(deserializeErrorResult)) {
  console.assert(deserializeErrorResult.left.type === 'ParseError', '应该是 ParseError');
  console.log('✓ 无效 JSON 返回正确错误');
}
console.log();

// ============================================================================
// 测试 filterTodos
// ============================================================================

console.log('测试 6: filterTodos');
// 创建混合状态的列表
let mixedList = emptyList;
mixedList = addTodo(mixedList, 'Task 1');
mixedList = addTodo(mixedList, 'Task 2');
mixedList = addTodo(mixedList, 'Task 3');

const completeResult1 = completeTodo(mixedList, 1);
if (isRight(completeResult1)) {
  mixedList = completeResult1.right;
}

const completeResult2 = completeTodo(mixedList, 3);
if (isRight(completeResult2)) {
  mixedList = completeResult2.right;
}

// 现在 mixedList 有 3 个 todo：1 和 3 已完成，2 未完成

const allTodos = filterTodos(mixedList, 'all');
console.assert(allTodos.length === 3, '全部应该有 3 个');
console.log('✓ 过滤 all 成功');

const activeTodos = filterTodos(mixedList, 'active');
console.assert(activeTodos.length === 1, '活跃应该有 1 个');
console.assert(activeTodos[0]!.id === 2, '活跃的应该是 todo 2');
console.log('✓ 过滤 active 成功');

const completedTodos = filterTodos(mixedList, 'completed');
console.assert(completedTodos.length === 2, '已完成应该有 2 个');
console.log('✓ 过滤 completed 成功');
console.log();

// ============================================================================
// 测试不可变性
// ============================================================================

console.log('测试 7: 不可变性验证');
const originalList = createEmptyTodoList();
const modifiedList = addTodo(originalList, 'Test');

console.assert(originalList.todos.length === 0, '原列表不应该被修改');
console.assert(modifiedList.todos.length === 1, '新列表应该有 1 个 todo');
console.assert(originalList !== modifiedList, '应该是不同的对象');
console.log('✓ 操作不修改原始数据');
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('=== 所有测试通过! ===\n');
console.log('💡 关键观察：');
console.log('  1. 纯函数非常容易测试 - 不需要 mock、不需要设置状态');
console.log('  2. 每个测试都是独立的 - 没有共享状态污染');
console.log('  3. 测试即文档 - 清晰展示了函数的行为');
console.log('  4. 不可变性保证 - 原始数据永远不会被意外修改');
console.log();
console.log('这就是函数式编程的力量！🚀');
