/**
 * 第一章第二节：不可变性 (Immutability)
 * 
 * 本文件展示如何在 JavaScript/TypeScript 中实现不可变数据操作
 * 不使用第三方库（如 Immer），全部手写实现
 */

console.log('=== 不可变性 (Immutability) ===\n');

// ============================================================================
// 1. 基本类型 vs 引用类型
// ============================================================================

console.log('1. 基本类型 vs 引用类型\n');

// 基本类型（number, string, boolean）天然不可变
let x = 10;
let y = x;
y = 20;
console.log('x =', x);  // 10 - 未改变
console.log('y =', y);  // 20

// 引用类型（object, array）默认可变 - 这是问题所在！
const obj1 = { value: 10 };
const obj2 = obj1;  // 共享同一个引用
obj2.value = 20;     // 修改 obj2 也会影响 obj1
console.log('obj1.value =', obj1.value);  // 20 - 被意外修改了！
console.log('obj2.value =', obj2.value);  // 20
console.log();

// ============================================================================
// 2. 对象的不可变操作
// ============================================================================

console.log('2. 对象的不可变操作\n');

type User = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly age: number;
};

const user1: User = {
  id: 1,
  name: '张三',
  email: 'zhang@example.com',
  age: 25,
};

// ❌ 可变方式：直接修改
// user1.age = 26;  // TypeScript 会报错：Cannot assign to 'age' because it is a read-only property

// ✅ 不可变方式：创建新对象
function updateAge(user: User, newAge: number): User {
  return { ...user, age: newAge };  // 展开运算符创建新对象
}

const user2 = updateAge(user1, 26);
console.log('原对象:', user1);  // age: 25
console.log('新对象:', user2);  // age: 26
console.log();

// ============================================================================
// 3. 嵌套对象的不可变更新
// ============================================================================

console.log('3. 嵌套对象的不可变更新\n');

type Address = {
  readonly street: string;
  readonly city: string;
  readonly country: string;
};

type Person = {
  readonly name: string;
  readonly age: number;
  readonly address: Address;
};

const person1: Person = {
  name: '李四',
  age: 30,
  address: {
    street: '中山路123号',
    city: '上海',
    country: '中国',
  },
};

// ❌ 错误的做法：浅拷贝无法处理嵌套
function updateCityWrong(person: Person, newCity: string): Person {
  const newPerson = { ...person };
  newPerson.address.city = newCity;  // TypeScript 报错 + 修改了原对象的 address
  return newPerson;
}

// ✅ 正确做法：深度更新
function updateCity(person: Person, newCity: string): Person {
  return {
    ...person,
    address: {
      ...person.address,
      city: newCity,
    },
  };
}

const person2 = updateCity(person1, '北京');
console.log('原对象地址:', person1.address);  // city: '上海'
console.log('新对象地址:', person2.address);  // city: '北京'
console.log();

// ============================================================================
// 4. 通用的深度更新工具函数
// ============================================================================

console.log('4. 通用的深度更新工具函数\n');

/**
 * 使用路径更新嵌套对象
 * 类似 Ramda 的 assocPath 或 Lodash 的 set，但不可变
 */
function updateIn<T>(
  obj: T,
  path: string[],
  updateFn: (value: any) => any
): T {
  if (path.length === 0) {
    return updateFn(obj);
  }

  const [first, ...rest] = path;
  const key = first as keyof T;

  return {
    ...obj,
    [key]: updateIn(obj[key], rest, updateFn),
  } as T;
}

const person3 = updateIn(person1, ['address', 'city'], () => '广州');
console.log('使用 updateIn:', person3.address.city);  // '广州'
console.log('原对象未变:', person1.address.city);      // '上海'
console.log();

// ============================================================================
// 5. 数组的不可变操作
// ============================================================================

console.log('5. 数组的不可变操作\n');

const numbers = [1, 2, 3, 4, 5];

// ✅ 添加元素
function append<T>(arr: readonly T[], item: T): T[] {
  return [...arr, item];
}

function prepend<T>(arr: readonly T[], item: T): T[] {
  return [item, ...arr];
}

console.log('原数组:', numbers);
console.log('append(6):', append(numbers, 6));
console.log('prepend(0):', prepend(numbers, 0));
console.log('原数组未变:', numbers);
console.log();

// ✅ 删除元素
function removeAt<T>(arr: readonly T[], index: number): T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

function removeFirst<T>(arr: readonly T[]): T[] {
  return arr.slice(1);
}

function removeLast<T>(arr: readonly T[]): T[] {
  return arr.slice(0, -1);
}

console.log('removeAt(2):', removeAt(numbers, 2));    // [1, 2, 4, 5]
console.log('removeFirst():', removeFirst(numbers));   // [2, 3, 4, 5]
console.log('removeLast():', removeLast(numbers));     // [1, 2, 3, 4]
console.log();

// ✅ 更新元素
function updateAt<T>(arr: readonly T[], index: number, newValue: T): T[] {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)];
}

function mapAt<T>(arr: readonly T[], index: number, fn: (value: T) => T): T[] {
  return updateAt(arr, index, fn(arr[index]!));
}

console.log('updateAt(2, 99):', updateAt(numbers, 2, 99));
console.log('mapAt(2, x => x * 10):', mapAt(numbers, 2, x => x * 10));
console.log();

// ✅ 插入元素
function insertAt<T>(arr: readonly T[], index: number, item: T): T[] {
  return [...arr.slice(0, index), item, ...arr.slice(index)];
}

console.log('insertAt(2, 99):', insertAt(numbers, 2, 99));  // [1, 2, 99, 3, 4, 5]
console.log();

// ============================================================================
// 6. 对象数组的不可变操作
// ============================================================================

console.log('6. 对象数组的不可变操作\n');

type Todo = {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
};

const todos: readonly Todo[] = [
  { id: 1, text: '学习纯函数', completed: true },
  { id: 2, text: '学习不可变性', completed: false },
  { id: 3, text: '完成练习', completed: false },
];

// ✅ 根据 ID 更新某个 todo
function toggleTodo(todos: readonly Todo[], id: number): Todo[] {
  return todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

console.log('切换 ID=2 的完成状态:');
console.log(toggleTodo(todos, 2));
console.log();

// ✅ 删除某个 todo
function removeTodo(todos: readonly Todo[], id: number): Todo[] {
  return todos.filter(todo => todo.id !== id);
}

console.log('删除 ID=2 的 todo:');
console.log(removeTodo(todos, 2));
console.log();

// ✅ 添加 todo
function addTodo(todos: readonly Todo[], text: string): Todo[] {
  const newId = Math.max(...todos.map(t => t.id), 0) + 1;
  const newTodo: Todo = { id: newId, text, completed: false };
  return [...todos, newTodo];
}

console.log('添加新 todo:');
console.log(addTodo(todos, '学习函数组合'));
console.log();

// ============================================================================
// 7. 不可变 Map 和 Set
// ============================================================================

console.log('7. 不可变 Map 和 Set\n');

// JavaScript 的 Map 和 Set 是可变的，我们需要手写不可变版本

/**
 * 不可变 Map 辅助函数
 */
function setInMap<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): Map<K, V> {
  const newMap = new Map(map);
  newMap.set(key, value);
  return newMap;
}

function deleteFromMap<K, V>(map: ReadonlyMap<K, V>, key: K): Map<K, V> {
  const newMap = new Map(map);
  newMap.delete(key);
  return newMap;
}

const userMap = new Map<number, string>([
  [1, 'Alice'],
  [2, 'Bob'],
]);

const updatedMap = setInMap(userMap, 3, 'Charlie');
console.log('原 Map:', Array.from(userMap.entries()));
console.log('新 Map:', Array.from(updatedMap.entries()));
console.log();

/**
 * 不可变 Set 辅助函数
 */
function addToSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const newSet = new Set(set);
  newSet.add(value);
  return newSet;
}

function removeFromSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const newSet = new Set(set);
  newSet.delete(value);
  return newSet;
}

const tags = new Set(['TypeScript', 'FP']);
const updatedTags = addToSet(tags, 'Functional');
console.log('原 Set:', Array.from(tags));
console.log('新 Set:', Array.from(updatedTags));
console.log();

// ============================================================================
// 8. 性能优化：结构共享 (Structural Sharing)
// ============================================================================

console.log('8. 结构共享的概念\n');

/**
 * 虽然我们创建了"新"对象，但实际上大部分数据是共享的
 * 这就是结构共享（Structural Sharing）
 */

const largeObject = {
  id: 1,
  data: {
    items: [1, 2, 3, 4, 5],
    metadata: {
      created: '2024-01-01',
      updated: '2024-01-02',
    },
  },
  settings: {
    theme: 'dark',
    language: 'zh-CN',
  },
};

const updated = {
  ...largeObject,
  settings: {
    ...largeObject.settings,
    theme: 'light',  // 只改这一个字段
  },
};

// 大部分数据是共享的，没有被复制
console.log('data 是共享的:', largeObject.data === updated.data);
console.log('settings 是新的:', largeObject.settings !== updated.settings);
console.log('整个对象是新的:', largeObject !== updated);
console.log();

// ============================================================================
// 9. Object.freeze() - 强制不可变
// ============================================================================

console.log('9. Object.freeze() - 强制不可变\n');

/**
 * Object.freeze() 可以在运行时防止对象被修改
 * 但它是浅冻结，嵌套对象仍然可变
 */

const frozenUser = Object.freeze({
  name: '王五',
  age: 28,
});

try {
  // @ts-expect-error - 演示运行时错误
  frozenUser.age = 29;  // 严格模式下会抛出错误
} catch (e) {
  console.log('尝试修改冻结对象会失败');
}

console.log('frozenUser.age:', frozenUser.age);  // 仍然是 28

// 深度冻结函数
function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  
  return obj;
}

const deepFrozenPerson = deepFreeze({
  name: '赵六',
  address: {
    city: '深圳',
  },
});

try {
  // @ts-expect-error - 演示运行时错误
  deepFrozenPerson.address.city = '杭州';
} catch (e) {
  console.log('深度冻结的嵌套对象也不能修改');
}

console.log('deepFrozenPerson.address.city:', deepFrozenPerson.address.city);  // 仍然是 '深圳'
console.log();

// ============================================================================
// 10. 真实场景：状态管理
// ============================================================================

console.log('10. 真实场景：不可变状态管理\n');

/**
 * 模拟一个简单的状态管理器（类似 Redux）
 */

type AppState = {
  readonly user: {
    readonly id: number;
    readonly name: string;
    readonly loggedIn: boolean;
  } | null;
  readonly todos: readonly Todo[];
  readonly settings: {
    readonly theme: 'light' | 'dark';
    readonly notifications: boolean;
  };
};

type Action =
  | { type: 'LOGIN'; payload: { id: number; name: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: {
          ...action.payload,
          loggedIn: true,
        },
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
      };

    case 'ADD_TODO':
      return {
        ...state,
        todos: addTodo(state.todos, action.payload),
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: toggleTodo(state.todos, action.payload),
      };

    case 'SET_THEME':
      return {
        ...state,
        settings: {
          ...state.settings,
          theme: action.payload,
        },
      };

    default:
      return state;
  }
}

// 初始状态
let state: AppState = {
  user: null,
  todos: [],
  settings: {
    theme: 'light',
    notifications: true,
  },
};

console.log('初始状态:', state);

// 执行一系列操作
state = reducer(state, { type: 'LOGIN', payload: { id: 1, name: 'Alice' } });
console.log('登录后:', state.user);

state = reducer(state, { type: 'ADD_TODO', payload: '学习 FP' });
state = reducer(state, { type: 'ADD_TODO', payload: '写代码' });
console.log('添加 todos 后:', state.todos);

state = reducer(state, { type: 'SET_THEME', payload: 'dark' });
console.log('切换主题后:', state.settings.theme);

console.log('\n=== 示例结束 ===');

// 导出供其他模块使用
export type { User, Address, Person, Todo, AppState, Action };
export {
  updateAge,
  updateCity,
  updateIn,
  append,
  prepend,
  removeAt,
  removeFirst,
  removeLast,
  updateAt,
  mapAt,
  insertAt,
  toggleTodo,
  removeTodo,
  addTodo,
  setInMap,
  deleteFromMap,
  addToSet,
  removeFromSet,
  deepFreeze,
  reducer,
};
