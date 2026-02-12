/**
 * 第十一章第四节：Optics 实战练习
 * 
 * 本文件包含 Optics 的实际应用练习
 * 涵盖 Redux 状态管理、表单处理、API 数据提取等场景
 */

console.log('=== Optics 实战练习 ===\n');

// ============================================================================
// 基础类型定义
// ============================================================================

type Option<T> = 
  | { _tag: 'Some'; value: T }
  | { _tag: 'None' };

const Some = <T>(value: T): Option<T> => ({ _tag: 'Some', value });
const None = <T>(): Option<T> => ({ _tag: 'None' });

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

// 工具函数
function composeLens<S, A, B>(l1: Lens<S, A>, l2: Lens<A, B>): Lens<S, B> {
  return lens(
    (s) => l2.get(l1.get(s)),
    (s, b) => l1.set(s, l2.set(l1.get(s), b))
  );
}

function composeLensPrism<S, A, B>(l: Lens<S, A>, p: Prism<A, B>): Optional<S, B> {
  return optional(
    (s) => p.getOption(l.get(s)),
    (s, b) => l.set(s, p.reverseGet(b))
  );
}

function prop<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return lens(
    (s) => s[key],
    (s, a) => ({ ...s, [key]: a } as S)
  );
}

function somePrism<T>(): Prism<Option<T>, T> {
  return prism(
    (opt) => opt._tag === 'Some' ? Some(opt.value) : None(),
    (value) => Some(value)
  );
}

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

// ============================================================================
// 练习 1：电商应用状态管理
// ============================================================================

console.log('练习 1：电商应用状态管理\n');

/**
 * 电商应用状态
 */
type ECommerceState = {
  readonly user: Option<LoggedInUser>;
  readonly products: Product[];
  readonly cart: ShoppingCart;
  readonly orders: Order[];
};

type LoggedInUser = {
  readonly id: string;
  readonly profile: UserProfile;
  readonly preferences: UserPreferences;
};

type UserProfile = {
  readonly name: string;
  readonly email: string;
  readonly avatar: Option<string>;
};

type UserPreferences = {
  readonly language: string;
  readonly currency: string;
  readonly notifications: boolean;
};

type Product = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly stock: number;
};

type ShoppingCart = {
  readonly items: CartItem[];
  readonly discount: Option<Discount>;
};

type CartItem = {
  readonly productId: string;
  readonly quantity: number;
  readonly price: number;
};

type Discount = {
  readonly code: string;
  readonly percentage: number;
};

type Order = {
  readonly id: string;
  readonly status: OrderStatus;
  readonly items: CartItem[];
  readonly total: number;
};

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

// 定义 Lens 和 Optional
const userLens = prop<ECommerceState, 'user'>('user');
const cartLens = prop<ECommerceState, 'cart'>('cart');
const productsLens = prop<ECommerceState, 'products'>('products');

const profileLens = prop<LoggedInUser, 'profile'>('profile');
const preferencesLens = prop<LoggedInUser, 'preferences'>('preferences');

const nameLens = prop<UserProfile, 'name'>('name');
const emailLens = prop<UserProfile, 'email'>('email');
const avatarLens = prop<UserProfile, 'avatar'>('avatar');

const languageLens = prop<UserPreferences, 'language'>('language');
const notificationsLens = prop<UserPreferences, 'notifications'>('notifications');

const cartItemsLens = prop<ShoppingCart, 'items'>('items');
const discountLens = prop<ShoppingCart, 'discount'>('discount');

// 组合 Optional：更新当前用户的名称
const currentUserNameOptional = composeLensPrism(
  userLens,
  composeLensPrism(
    somePrism<LoggedInUser>(),
    composeLens(profileLens, nameLens)
  )
);

// 组合 Optional：更新当前用户的头像
const currentUserAvatarOptional = composeLensPrism(
  userLens,
  composeLensPrism(
    somePrism<LoggedInUser>(),
    composeLens(
      profileLens,
      composeLensPrism(avatarLens, somePrism<string>())
    )
  )
);

// 组合 Optional：切换通知设置
const notificationsOptional = composeLensPrism(
  userLens,
  composeLensPrism(
    somePrism<LoggedInUser>(),
    composeLens(preferencesLens, notificationsLens)
  )
);

// 初始状态
const initialState: ECommerceState = {
  user: Some({
    id: 'user1',
    profile: {
      name: 'Alice',
      email: 'alice@example.com',
      avatar: Some('https://example.com/avatar.jpg')
    },
    preferences: {
      language: 'zh-CN',
      currency: 'CNY',
      notifications: true
    }
  }),
  products: [
    { id: 'p1', name: 'MacBook Pro', price: 15000, stock: 10 },
    { id: 'p2', name: 'iPhone', price: 8000, stock: 20 }
  ],
  cart: {
    items: [
      { productId: 'p1', quantity: 1, price: 15000 }
    ],
    discount: Some({ code: 'SAVE10', percentage: 10 })
  },
  orders: []
};

console.log('初始状态:', JSON.stringify(initialState, null, 2));

// 操作 1: 更新用户名
const state1 = currentUserNameOptional.set(initialState, 'Alice Johnson');
console.log('\n操作 1: 更新用户名');
console.log('新用户名:', currentUserNameOptional.getOption(state1));

// 操作 2: 切换通知
const state2 = notificationsOptional.modify(state1, enabled => !enabled);
console.log('\n操作 2: 切换通知');
console.log('通知状态:', notificationsOptional.getOption(state2));

// 操作 3: 移除头像
const state3 = composeLensPrism(
  userLens,
  composeLensPrism(
    somePrism<LoggedInUser>(),
    composeLens(profileLens, avatarLens)
  )
).set(state2, None());
console.log('\n操作 3: 移除头像');
console.log('头像:', composeLensPrism(
  userLens,
  composeLensPrism(
    somePrism<LoggedInUser>(),
    composeLens(profileLens, avatarLens)
  )
).getOption(state3));

console.log('\n优势: 类型安全、不可变、代码简洁');
console.log();

// ============================================================================
// 练习 2：嵌套表单数据处理
// ============================================================================

console.log('练习 2：嵌套表单数据处理\n');

/**
 * 用户注册表单
 */
type RegistrationForm = {
  readonly personalInfo: PersonalInfo;
  readonly accountInfo: AccountInfo;
  readonly preferences: FormPreferences;
  readonly errors: FormErrors;
};

type PersonalInfo = {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: Option<string>;
  readonly address: AddressInfo;
};

type AddressInfo = {
  readonly street: string;
  readonly city: string;
  readonly zipCode: string;
  readonly country: string;
};

type AccountInfo = {
  readonly username: string;
  readonly email: string;
  readonly password: string;
};

type FormPreferences = {
  readonly newsletter: boolean;
  readonly marketing: boolean;
};

type FormErrors = {
  readonly personalInfo: string[];
  readonly accountInfo: string[];
};

// 定义 Lens
const personalInfoLens = prop<RegistrationForm, 'personalInfo'>('personalInfo');
const accountInfoLens = prop<RegistrationForm, 'accountInfo'>('accountInfo');
const formPreferencesLens = prop<RegistrationForm, 'preferences'>('preferences');
const formErrorsLens = prop<RegistrationForm, 'errors'>('errors');

const firstNameLens = prop<PersonalInfo, 'firstName'>('firstName');
const lastNameLens = prop<PersonalInfo, 'lastName'>('lastName');
const addressInfoLens = prop<PersonalInfo, 'address'>('address');

const streetLens = prop<AddressInfo, 'street'>('street');
const cityLens = prop<AddressInfo, 'city'>('city');

const usernameLens = prop<AccountInfo, 'username'>('username');
const passwordLens = prop<AccountInfo, 'password'>('password');

const newsletterLens = prop<FormPreferences, 'newsletter'>('newsletter');

// 组合 Lens：快速访问深层字段
const formStreetLens = composeLens(
  composeLens(personalInfoLens, addressInfoLens),
  streetLens
);

const formCityLens = composeLens(
  composeLens(personalInfoLens, addressInfoLens),
  cityLens
);

const formUsernameLens = composeLens(accountInfoLens, usernameLens);

// 初始表单
const emptyForm: RegistrationForm = {
  personalInfo: {
    firstName: '',
    lastName: '',
    dateOfBirth: None(),
    address: {
      street: '',
      city: '',
      zipCode: '',
      country: 'China'
    }
  },
  accountInfo: {
    username: '',
    email: '',
    password: ''
  },
  preferences: {
    newsletter: false,
    marketing: false
  },
  errors: {
    personalInfo: [],
    accountInfo: []
  }
};

console.log('空表单:', JSON.stringify(emptyForm, null, 2));

// 填充表单
let form = emptyForm;
form = composeLens(personalInfoLens, firstNameLens).set(form, 'Alice');
form = composeLens(personalInfoLens, lastNameLens).set(form, 'Johnson');
form = formStreetLens.set(form, '123 Main St');
form = formCityLens.set(form, 'Beijing');
form = formUsernameLens.set(form, 'alice2024');
form = composeLens(accountInfoLens, passwordLens).set(form, 'SecurePass123');

console.log('\n填充后的表单:');
console.log('姓名:', composeLens(personalInfoLens, firstNameLens).get(form), 
  composeLens(personalInfoLens, lastNameLens).get(form));
console.log('地址:', formStreetLens.get(form), formCityLens.get(form));
console.log('用户名:', formUsernameLens.get(form));

// 批量更新地址
const updateAddress = (form: RegistrationForm, street: string, city: string): RegistrationForm => {
  return formCityLens.set(formStreetLens.set(form, street), city);
};

const updatedForm = updateAddress(form, '456 Park Ave', 'Shanghai');
console.log('\n批量更新地址后:');
console.log('地址:', formStreetLens.get(updatedForm), formCityLens.get(updatedForm));
console.log();

// ============================================================================
// 练习 3：API 响应数据提取
// ============================================================================

console.log('练习 3：API 响应数据提取\n');

/**
 * GitHub API 响应结构（简化版）
 */
type GitHubApiResponse = {
  readonly status: number;
  readonly data: Option<GitHubData>;
};

type GitHubData = {
  readonly user: GitHubUser;
  readonly repositories: GitHubRepo[];
};

type GitHubUser = {
  readonly login: string;
  readonly name: Option<string>;
  readonly email: Option<string>;
  readonly bio: Option<string>;
  readonly location: Option<string>;
};

type GitHubRepo = {
  readonly name: string;
  readonly description: Option<string>;
  readonly stars: number;
  readonly language: Option<string>;
};

// 定义 Lens 和 Prism
const dataLens = prop<GitHubApiResponse, 'data'>('data');
const userLens2 = prop<GitHubData, 'user'>('user');
const repositoriesLens = prop<GitHubData, 'repositories'>('repositories');

const loginLens = prop<GitHubUser, 'login'>('login');
const nameOptionLens = prop<GitHubUser, 'name'>('name');
const emailOptionLens = prop<GitHubUser, 'email'>('email');

// 安全提取用户名
const userLoginOptional = composeLensPrism(
  dataLens,
  composeLensPrism(
    somePrism<GitHubData>(),
    composeLens(userLens2, loginLens)
  )
);

// 安全提取用户真实姓名
const userRealNameOptional = composeLensPrism(
  dataLens,
  composeLensPrism(
    somePrism<GitHubData>(),
    composeLens(
      userLens2,
      composeLensPrism(nameOptionLens, somePrism<string>())
    )
  )
);

// 模拟成功的 API 响应
const successResponse: GitHubApiResponse = {
  status: 200,
  data: Some({
    user: {
      login: 'alice',
      name: Some('Alice Johnson'),
      email: Some('alice@example.com'),
      bio: Some('Software Engineer'),
      location: Some('Beijing')
    },
    repositories: [
      { name: 'awesome-project', description: Some('An awesome project'), stars: 100, language: Some('TypeScript') },
      { name: 'another-repo', description: None(), stars: 50, language: Some('JavaScript') }
    ]
  })
};

// 模拟失败的 API 响应
const errorResponse: GitHubApiResponse = {
  status: 404,
  data: None()
};

console.log('成功响应:');
console.log('  用户名:', userLoginOptional.getOption(successResponse));
console.log('  真实姓名:', userRealNameOptional.getOption(successResponse));

console.log('\n失败响应:');
console.log('  用户名:', userLoginOptional.getOption(errorResponse));
console.log('  真实姓名:', userRealNameOptional.getOption(errorResponse));

// 提取第一个仓库的描述
const firstRepoDescOptional = composeLensPrism(
  dataLens,
  composeLensPrism(
    somePrism<GitHubData>(),
    composeLens(
      repositoriesLens,
      composeLensPrism(
        indexOptional<GitHubRepo>(0),
        composeLensPrism(
          prop<GitHubRepo, 'description'>('description'),
          somePrism<string>()
        )
      )
    )
  )
);

console.log('\n第一个仓库描述:', firstRepoDescOptional.getOption(successResponse));
console.log();

// ============================================================================
// 练习 4：配置对象深度更新
// ============================================================================

console.log('练习 4：配置对象深度更新\n');

/**
 * 应用程序配置
 */
type AppConfig = {
  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
  readonly logging: LoggingConfig;
  readonly features: FeatureFlags;
};

type ServerConfig = {
  readonly host: string;
  readonly port: number;
  readonly ssl: SSLConfig;
  readonly cors: CorsConfig;
};

type SSLConfig = {
  readonly enabled: boolean;
  readonly certificate: Option<string>;
  readonly key: Option<string>;
};

type CorsConfig = {
  readonly enabled: boolean;
  readonly origins: string[];
};

type DatabaseConfig = {
  readonly host: string;
  readonly port: number;
  readonly name: string;
  readonly pool: PoolConfig;
};

type PoolConfig = {
  readonly min: number;
  readonly max: number;
  readonly idleTimeout: number;
};

type LoggingConfig = {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly format: 'json' | 'text';
  readonly transports: LogTransport[];
};

type LogTransport = 'console' | 'file' | 'remote';

type FeatureFlags = {
  readonly enableCache: boolean;
  readonly enableMetrics: boolean;
  readonly experimentalFeatures: string[];
};

// 定义 Lens
const serverLens = prop<AppConfig, 'server'>('server');
const databaseLens = prop<AppConfig, 'database'>('database');
const loggingLens = prop<AppConfig, 'logging'>('logging');
const featuresLens = prop<AppConfig, 'features'>('features');

const portLens = prop<ServerConfig, 'port'>('port');
const sslLens = prop<ServerConfig, 'ssl'>('ssl');
const corsLens = prop<ServerConfig, 'cors'>('cors');

const sslEnabledLens = prop<SSLConfig, 'enabled'>('enabled');
const corsEnabledLens = prop<CorsConfig, 'enabled'>('enabled');

const poolLens = prop<DatabaseConfig, 'pool'>('pool');
const poolMaxLens = prop<PoolConfig, 'max'>('max');

const logLevelLens = prop<LoggingConfig, 'level'>('level');

// 组合 Lens
const serverPortLens = composeLens(serverLens, portLens);
const sslEnabledConfigLens = composeLens(
  composeLens(serverLens, sslLens),
  sslEnabledLens
);
const dbPoolMaxLens = composeLens(
  composeLens(databaseLens, poolLens),
  poolMaxLens
);

// 默认配置
const defaultConfig: AppConfig = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: {
      enabled: false,
      certificate: None(),
      key: None()
    },
    cors: {
      enabled: true,
      origins: ['http://localhost:3000']
    }
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp',
    pool: {
      min: 2,
      max: 10,
      idleTimeout: 30000
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    transports: ['console']
  },
  features: {
    enableCache: true,
    enableMetrics: false,
    experimentalFeatures: []
  }
};

console.log('默认配置:', JSON.stringify(defaultConfig, null, 2));

// 生产环境配置调整
let prodConfig = defaultConfig;
prodConfig = serverPortLens.set(prodConfig, 8080);
prodConfig = sslEnabledConfigLens.set(prodConfig, true);
prodConfig = dbPoolMaxLens.set(prodConfig, 50);
prodConfig = composeLens(loggingLens, logLevelLens).set(prodConfig, 'warn');

console.log('\n生产环境配置:');
console.log('  服务器端口:', serverPortLens.get(prodConfig));
console.log('  SSL 启用:', sslEnabledConfigLens.get(prodConfig));
console.log('  数据库连接池最大值:', dbPoolMaxLens.get(prodConfig));
console.log('  日志级别:', composeLens(loggingLens, logLevelLens).get(prodConfig));
console.log();

// ============================================================================
// 总结
// ============================================================================

console.log('总结：Optics 在实际项目中的应用\n');

console.log('1. 状态管理（Redux/Zustand）:');
console.log('   - 深层嵌套状态安全更新');
console.log('   - 避免样板代码');
console.log('   - 类型安全保证');
console.log();

console.log('2. 表单处理:');
console.log('   - 嵌套表单字段更新');
console.log('   - 批量更新多个字段');
console.log('   - 表单验证错误管理');
console.log();

console.log('3. API 数据提取:');
console.log('   - 安全提取嵌套可选字段');
console.log('   - 避免 null/undefined 错误');
console.log('   - 清晰表达数据路径');
console.log();

console.log('4. 配置管理:');
console.log('   - 复杂配置对象更新');
console.log('   - 环境特定配置覆盖');
console.log('   - 类型安全的配置访问');
console.log();

console.log('最佳实践:');
console.log('1. 为常用数据路径创建 Lens 库');
console.log('2. 使用组合而非重复定义');
console.log('3. 结合 TypeScript 获得最佳类型推导');
console.log('4. 在团队中统一 Optics 使用模式');
