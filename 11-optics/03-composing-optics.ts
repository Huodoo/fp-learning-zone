/**
 * 第十一章第三节：Optics 组合
 * 
 * 本文件展示如何组合 Lens、Prism 和 Optional
 * 处理复杂的深层嵌套数据结构
 */

console.log('=== Optics 组合 ===\n');

// ============================================================================
// 基础类型定义（从前面的文件导入概念）
// ============================================================================

type Option<T> = 
  | { _tag: 'Some'; value: T }
  | { _tag: 'None' };

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None = <T>(): Option<T> => ({ _tag: 'None' });

// Lens 类型
interface Lens<S, A> {
  get: (s: S) => A;
  set: (s: S, a: A) => S;
  modify: (s: S, f: (a: A) => A) => S;
}

function lens<S, A>(
  getter: (s: S) => A,
  setter: (s: S, a: A) => S
): Lens<S, A> {
  return {
    get: getter,
    set: setter,
    modify: (s, f) => setter(s, f(getter(s)))
  };
}

// Prism 类型
interface Prism<S, A> {
  getOption: (s: S) => Option<A>;
  reverseGet: (a: A) => S;
}

function prism<S, A>(
  getter: (s: S) => Option<A>,
  constructor: (a: A) => S
): Prism<S, A> {
  return {
    getOption: getter,
    reverseGet: constructor
  };
}

// Optional 类型（Lens + Prism 的组合）
interface Optional<S, A> {
  getOption: (s: S) => Option<A>;
  set: (s: S, a: A) => S;
  modify: (s: S, f: (a: A) => A) => S;
}

function optional<S, A>(
  getter: (s: S) => Option<A>,
  setter: (s: S, a: A) => S
): Optional<S, A> {
  return {
    getOption: getter,
    set: setter,
    modify: (s, f) => {
      const optA = getter(s);
      if (optA._tag === 'None') return s;
      return setter(s, f(optA.value));
    }
  };
}

// ============================================================================
// 1. Lens 组合 Lens = Lens
// ============================================================================

console.log('1. Lens 组合 Lens = Lens\n');

function composeLens<S, A, B>(
  outer: Lens<S, A>,
  inner: Lens<A, B>
): Lens<S, B> {
  return lens(
    (s) => inner.get(outer.get(s)),
    (s, b) => outer.set(s, inner.set(outer.get(s), b))
  );
}

// 定义数据结构
type Company = {
  readonly name: string;
  readonly ceo: Person;
};

type Person = {
  readonly name: string;
  readonly address: Address;
};

type Address = {
  readonly city: string;
  readonly street: string;
};

// 定义各层 Lens
const ceoLens: Lens<Company, Person> = lens(
  (company) => company.ceo,
  (company, ceo) => ({ ...company, ceo })
);

const addressLens: Lens<Person, Address> = lens(
  (person) => person.address,
  (person, address) => ({ ...person, address })
);

const cityLens: Lens<Address, string> = lens(
  (address) => address.city,
  (address, city) => ({ ...address, city })
);

// 组合：Company -> CEO -> Address -> City
const companyCeoCityLens = composeLens(
  composeLens(ceoLens, addressLens),
  cityLens
);

const company: Company = {
  name: 'TechCorp',
  ceo: {
    name: 'Alice',
    address: {
      city: 'Beijing',
      street: 'Main St'
    }
  }
};

console.log('原始公司:', JSON.stringify(company, null, 2));

const updatedCompany = companyCeoCityLens.set(company, 'Shanghai');
console.log('\n更新 CEO 城市后:', JSON.stringify(updatedCompany, null, 2));

console.log('\n组合优势：一行代码更新深层嵌套字段');
console.log();

// ============================================================================
// 2. Lens 组合 Prism = Optional
// ============================================================================

console.log('2. Lens 组合 Prism = Optional\n');

function composeLensPrism<S, A, B>(
  lensOuter: Lens<S, A>,
  prismInner: Prism<A, B>
): Optional<S, B> {
  return optional(
    (s) => prismInner.getOption(lensOuter.get(s)),
    (s, b) => lensOuter.set(s, prismInner.reverseGet(b))
  );
}

// 示例：用户可能有或没有邮箱
type User = {
  readonly name: string;
  readonly email: Option<string>;
};

const emailLens: Lens<User, Option<string>> = lens(
  (user) => user.email,
  (user, email) => ({ ...user, email })
);

const somePrism = <T>(): Prism<Option<T>, T> => prism(
  (opt) => opt._tag === 'Some' ? Some(opt.value) : None(),
  (value) => Some(value)
);

// 组合：User -> email (Lens) -> Some (Prism)
const userEmailOptional = composeLensPrism(
  emailLens,
  somePrism<string>()
);

const user1: User = { name: 'Alice', email: Some('alice@example.com') };
const user2: User = { name: 'Bob', email: None() };

console.log('用户 1 (有邮箱):', user1);
console.log('获取邮箱:', userEmailOptional.getOption(user1));

console.log('\n用户 2 (无邮箱):', user2);
console.log('获取邮箱:', userEmailOptional.getOption(user2));

const updatedUser1 = userEmailOptional.set(user1, 'newemail@example.com');
console.log('\n更新用户 1 邮箱:', updatedUser1);

const updatedUser2 = userEmailOptional.set(user2, 'bob@example.com');
console.log('更新用户 2 邮箱:', updatedUser2);
console.log();

// ============================================================================
// 3. Prism 组合 Lens = Optional
// ============================================================================

console.log('3. Prism 组合 Lens = Optional\n');

function composePrismLens<S, A, B>(
  prismOuter: Prism<S, A>,
  lensInner: Lens<A, B>
): Optional<S, B> {
  return optional(
    (s) => {
      const optA = prismOuter.getOption(s);
      if (optA._tag === 'None') return None();
      return Some(lensInner.get(optA.value));
    },
    (s, b) => {
      const optA = prismOuter.getOption(s);
      if (optA._tag === 'None') return s;
      return prismOuter.reverseGet(lensInner.set(optA.value, b));
    }
  );
}

// 示例：API 响应
type ApiResponse<T> =
  | { _tag: 'Success'; data: T }
  | { _tag: 'Error'; message: string };

const Success = <T>(data: T): ApiResponse<T> => ({ _tag: 'Success', data });
const Error = <T>(message: string): ApiResponse<T> => ({ _tag: 'Error', message });

const successPrism = <T>(): Prism<ApiResponse<T>, T> => prism(
  (response) => response._tag === 'Success' ? Some(response.data) : None(),
  (data) => Success(data)
);

// 假设成功响应包含用户数据
type UserData = {
  readonly id: string;
  readonly name: string;
};

const nameLens: Lens<UserData, string> = lens(
  (user) => user.name,
  (user, name) => ({ ...user, name })
);

// 组合：ApiResponse -> Success (Prism) -> name (Lens)
const responseUserNameOptional = composePrismLens(
  successPrism<UserData>(),
  nameLens
);

const successResponse: ApiResponse<UserData> = Success({ id: '1', name: 'Alice' });
const errorResponse: ApiResponse<UserData> = Error('Not found');

console.log('成功响应:', successResponse);
console.log('获取用户名:', responseUserNameOptional.getOption(successResponse));

console.log('\n错误响应:', errorResponse);
console.log('获取用户名（失败）:', responseUserNameOptional.getOption(errorResponse));

const updatedResponse = responseUserNameOptional.set(successResponse, 'Alice Smith');
console.log('\n更新用户名:', updatedResponse);
console.log();

// ============================================================================
// 4. 通用组合函数
// ============================================================================

console.log('4. 通用组合函数\n');

/**
 * Lens -> Lens -> Lens
 */
function compose_L_L<S, A, B>(
  l1: Lens<S, A>,
  l2: Lens<A, B>
): Lens<S, B> {
  return composeLens(l1, l2);
}

/**
 * Lens -> Prism -> Optional
 */
function compose_L_P<S, A, B>(
  l: Lens<S, A>,
  p: Prism<A, B>
): Optional<S, B> {
  return composeLensPrism(l, p);
}

/**
 * Prism -> Lens -> Optional
 */
function compose_P_L<S, A, B>(
  p: Prism<S, A>,
  l: Lens<A, B>
): Optional<S, B> {
  return composePrismLens(p, l);
}

/**
 * Optional -> Lens -> Optional
 */
function compose_O_L<S, A, B>(
  opt: Optional<S, A>,
  l: Lens<A, B>
): Optional<S, B> {
  return optional(
    (s) => {
      const optA = opt.getOption(s);
      if (optA._tag === 'None') return None();
      return Some(l.get(optA.value));
    },
    (s, b) => {
      const optA = opt.getOption(s);
      if (optA._tag === 'None') return s;
      return opt.set(s, l.set(optA.value, b));
    }
  );
}

console.log('组合规则总结:');
console.log('  Lens ∘ Lens = Lens');
console.log('  Lens ∘ Prism = Optional');
console.log('  Prism ∘ Lens = Optional');
console.log('  Optional ∘ Lens = Optional');
console.log('  Optional ∘ Prism = Optional');
console.log('  Optional ∘ Optional = Optional');
console.log();

// ============================================================================
// 5. 实际应用：Redux 状态更新
// ============================================================================

console.log('5. 实际应用：Redux 状态更新\n');

/**
 * Redux 应用状态
 */
type AppState = {
  readonly currentUser: Option<User>;
  readonly products: Product[];
  readonly cart: Cart;
};

type Product = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
};

type Cart = {
  readonly items: CartItem[];
  readonly total: number;
};

type CartItem = {
  readonly productId: string;
  readonly quantity: number;
};

// 定义 Lens
const currentUserLens: Lens<AppState, Option<User>> = lens(
  (state) => state.currentUser,
  (state, currentUser) => ({ ...state, currentUser })
);

const cartLens: Lens<AppState, Cart> = lens(
  (state) => state.cart,
  (state, cart) => ({ ...state, cart })
);

const cartItemsLens: Lens<Cart, CartItem[]> = lens(
  (cart) => cart.items,
  (cart, items) => ({ ...cart, items })
);

// 组合获取当前用户名
const currentUserNameOptional = compose_L_P(
  currentUserLens,
  compose_P_L(
    somePrism<User>(),
    lens<User, string>(
      (user) => user.name,
      (user, name) => ({ ...user, name })
    )
  )
);

const state: AppState = {
  currentUser: Some({ name: 'Alice', email: Some('alice@example.com') }),
  products: [],
  cart: {
    items: [],
    total: 0
  }
};

console.log('原始状态:', JSON.stringify(state, null, 2));

// 更新当前用户名
const updatedState = currentUserNameOptional.set(state, 'Alice Johnson');
console.log('\n更新用户名后:', JSON.stringify(updatedState, null, 2));

console.log('\n优势：类型安全、组合式、声明式');
console.log();

// ============================================================================
// 6. 实际应用：处理深层嵌套的可选数据
// ============================================================================

console.log('6. 实际应用：处理深层嵌套的可选数据\n');

/**
 * 公司组织结构
 */
type Organization = {
  readonly name: string;
  readonly departments: Department[];
};

type Department = {
  readonly name: string;
  readonly manager: Option<Employee>;
};

type Employee = {
  readonly name: string;
  readonly contact: ContactInfo;
};

type ContactInfo = {
  readonly email: string;
  readonly phone: Option<string>;
};

// 工具：数组索引的 Optional（可能越界）
function indexOptional<A>(i: number): Optional<A[], A> {
  return optional(
    (arr) => i >= 0 && i < arr.length ? Some(arr[i]) : None(),
    (arr, a) => {
      if (i < 0 || i >= arr.length) return arr;
      const result = [...arr];
      result[i] = a;
      return result;
    }
  );
}

// 定义 Lens
const departmentsLens: Lens<Organization, Department[]> = lens(
  (org) => org.departments,
  (org, departments) => ({ ...org, departments })
);

const managerLens: Lens<Department, Option<Employee>> = lens(
  (dept) => dept.manager,
  (dept, manager) => ({ ...dept, manager })
);

const contactLens: Lens<Employee, ContactInfo> = lens(
  (emp) => emp.contact,
  (emp, contact) => ({ ...emp, contact })
);

const phoneLens: Lens<ContactInfo, Option<string>> = lens(
  (contact) => contact.phone,
  (contact, phone) => ({ ...contact, phone })
);

// 组合：获取第一个部门的经理的电话
// Organization -> departments[0] -> manager -> contact -> phone
const firstDeptManagerPhoneOptional = compose_O_L(
  compose_O_L(
    compose_L_P(
      compose_L_P(
        composeLens(departmentsLens, indexOptional<Department>(0)),
        managerLens
      ),
      somePrism<Employee>()
    ),
    contactLens
  ),
  compose_L_P(phoneLens, somePrism<string>())
);

const org: Organization = {
  name: 'TechCorp',
  departments: [
    {
      name: 'Engineering',
      manager: Some({
        name: 'Alice',
        contact: {
          email: 'alice@techcorp.com',
          phone: Some('123-456-7890')
        }
      })
    },
    {
      name: 'Marketing',
      manager: None()
    }
  ]
};

console.log('组织结构:', JSON.stringify(org, null, 2));

const phone = firstDeptManagerPhoneOptional.getOption(org);
console.log('\n第一个部门经理电话:', phone);

const updatedOrg = firstDeptManagerPhoneOptional.modify(
  org,
  phone => phone.replace(/-/g, '')
);

console.log('\n修改电话号码（移除短横线）:');
console.log(JSON.stringify(updatedOrg, null, 2));
console.log();

// ============================================================================
// 7. 对比：传统方式 vs Optics
// ============================================================================

console.log('7. 对比：传统方式 vs Optics\n');

console.log('=== 传统方式：更新深层可选字段 ===\n');

function updatePhoneTraditional(org: Organization, newPhone: string): Organization {
  // 手动检查每一层
  if (org.departments.length === 0) return org;
  
  const firstDept = org.departments[0];
  if (firstDept.manager._tag === 'None') return org;
  
  const manager = firstDept.manager.value;
  if (manager.contact.phone._tag === 'None') return org;
  
  // 层层展开更新
  return {
    ...org,
    departments: [
      {
        ...firstDept,
        manager: Some({
          ...manager,
          contact: {
            ...manager.contact,
            phone: Some(newPhone)
          }
        })
      },
      ...org.departments.slice(1)
    ]
  };
}

console.log('传统方式代码:');
console.log('  - 需要手动检查每一层');
console.log('  - 需要层层展开对象');
console.log('  - 代码冗长、易错');
console.log('  - 意图不清晰');

console.log('\n=== Optics 方式 ===\n');

const updatedWithOptics = firstDeptManagerPhoneOptional.set(org, '999-888-7777');

console.log('Optics 方式代码:');
console.log('  - 一行代码完成');
console.log('  - 自动处理 None 情况');
console.log('  - 类型安全');
console.log('  - 意图清晰（聚焦在哪个字段）');
console.log('  - 可复用（Optional 可用于多处）');
console.log();

console.log('结果对比:');
console.log('传统方式:', JSON.stringify(updatePhoneTraditional(org, '999-888-7777'), null, 2));
console.log('\nOptics 方式:', JSON.stringify(updatedWithOptics, null, 2));
console.log();

// ============================================================================
// 8. 总结
// ============================================================================

console.log('8. 总结\n');

console.log('Optics 组合的威力:');
console.log('1. 类型安全 - 编译期捕获错误');
console.log('2. 可组合 - 从简单 Optics 构建复杂操作');
console.log('3. 声明式 - 描述"聚焦在哪"，而非"如何更新"');
console.log('4. 可复用 - 一次定义，多处使用');
console.log('5. 不可变 - 所有操作返回新对象');
console.log();

console.log('适用场景:');
console.log('- Redux/状态管理：深层状态更新');
console.log('- 表单处理：嵌套表单字段更新');
console.log('- API 数据：安全提取嵌套可选字段');
console.log('- 配置管理：复杂配置对象更新');
console.log('- 数据转换：复杂数据结构映射');
