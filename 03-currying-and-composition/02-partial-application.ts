/**
 * 第三章第二节: 部分应用 (Partial Application)
 * 
 * 部分应用是固定函数的部分参数,返回一个参数更少的新函数
 * 它与柯里化相关但不完全相同
 */

console.log('=== 部分应用 (Partial Application) ===\n');

// ============================================================================
// 1. 部分应用 vs 柯里化
// ============================================================================

console.log('1. 部分应用 vs 柯里化\n');

// 原始函数
function add3(a: number, b: number, c: number): number {
  return a + b + c;
}

// ✅ 柯里化: 转换为单参数函数链
const curriedAdd = (a: number) => (b: number) => (c: number) => a + b + c;
const step1 = curriedAdd(1);        // 必须一个一个传
const step2 = step1(2);
const result1 = step2(3);
console.log('柯里化结果:', result1);  // 6

// ✅ 部分应用: 一次固定多个参数
const partialAdd = (a: number, b: number) => (c: number) => add3(a, b, c);
const add1And2 = partialAdd(1, 2);  // 一次固定两个参数
const result2 = add1And2(3);
console.log('部分应用结果:', result2);  // 6

/**
 * 核心区别:
 * - 柯里化: 总是返回单参数函数,有固定的参数顺序
 * - 部分应用: 可以一次固定任意数量的参数,更灵活
 */
console.log();

// ============================================================================
// 2. 使用 bind 实现部分应用
// ============================================================================

console.log('2. 使用 bind 实现部分应用\n');

function multiply(a: number, b: number, c: number): number {
  return a * b * c;
}

// bind 的第一个参数是 this,后面是要固定的参数
const double = multiply.bind(null, 2);        // 固定第一个参数为 2
const triple = multiply.bind(null, 3);        // 固定第一个参数为 3
const doubleAndTriple = multiply.bind(null, 2, 3);  // 固定前两个参数

console.log('double(5, 10):', double(5, 10));           // 2 * 5 * 10 = 100
console.log('triple(4, 5):', triple(4, 5));             // 3 * 4 * 5 = 60
console.log('doubleAndTriple(7):', doubleAndTriple(7)); // 2 * 3 * 7 = 42

// bind 的局限性: 只能从左到右固定参数
// 如果想固定第二个或第三个参数,bind 做不到
console.log();

// ============================================================================
// 3. 实现通用的部分应用函数
// ============================================================================

console.log('3. 实现通用的部分应用函数\n');

// 简单版本: 从左到右固定参数
function partial<T extends any[], U extends any[], R>(
  fn: (...args: [...T, ...U]) => R,
  ...fixedArgs: T
): (...args: U) => R {
  return function(...remainingArgs: U): R {
    return fn(...fixedArgs, ...remainingArgs);
  };
}

function greet(greeting: string, name: string, punctuation: string): string {
  return `${greeting}, ${name}${punctuation}`;
}

const sayHello = partial(greet, 'Hello');
const sayHelloToJohn = partial(greet, 'Hello', 'John');

console.log('sayHello("Alice", "!"):', sayHello('Alice', '!'));
console.log('sayHelloToJohn("."):', sayHelloToJohn('.'));

// 使用在数组方法中
const numbers = [1, 2, 3, 4, 5];

function multiply3(a: number, b: number, c: number): number {
  return a * b * c;
}

const multiplyBy2 = partial(multiply3, 2);
console.log('部分应用于 map:', numbers.map(n => multiplyBy2(n, 3)));
console.log();

// ============================================================================
// 4. 高级: 支持占位符的部分应用
// ============================================================================

console.log('4. 支持占位符的部分应用\n');

const _ = Symbol('placeholder');

function partialWithPlaceholder<F extends (...args: any[]) => any>(
  fn: F,
  ...partialArgs: any[]
): (...args: any[]) => ReturnType<F> {
  return function(...remainingArgs: any[]): ReturnType<F> {
    const args: any[] = [];
    let remainingIndex = 0;

    for (const arg of partialArgs) {
      if (arg === _) {
        args.push(remainingArgs[remainingIndex++]);
      } else {
        args.push(arg);
      }
    }

    // 添加剩余的参数
    while (remainingIndex < remainingArgs.length) {
      args.push(remainingArgs[remainingIndex++]);
    }

    return fn(...args);
  };
}

function divide(a: number, b: number): number {
  return a / b;
}

// 固定分子,变化分母
const divideTenBy = partialWithPlaceholder(divide, 10, _);
console.log('10 / 2:', divideTenBy(2));  // 5
console.log('10 / 5:', divideTenBy(5));  // 2

// 固定分母,变化分子
const divideByTwo = partialWithPlaceholder(divide, _, 2);
console.log('10 / 2:', divideByTwo(10));  // 5
console.log('20 / 2:', divideByTwo(20));  // 10

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 固定年份和月份
const formatMarch2024 = partialWithPlaceholder(formatDate, 2024, 3, _);
console.log('2024年3月15日:', formatMarch2024(15));

// 只固定年份
const format2024 = partialWithPlaceholder(formatDate, 2024, _, _);
console.log('2024年5月20日:', format2024(5, 20));
console.log();

// ============================================================================
// 5. 真实业务场景: 日志系统
// ============================================================================

console.log('5. 真实业务场景: 日志系统\n');

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function logMessage(
  level: LogLevel,
  module: string,
  timestamp: Date,
  message: string
): void {
  const time = timestamp.toISOString();
  console.log(`[${time}] [${level}] [${module}] ${message}`);
}

// 创建不同级别的日志器
const logDebug = partial(logMessage, 'DEBUG');
const logInfo = partial(logMessage, 'INFO');
const logError = partial(logMessage, 'ERROR');

// 创建不同模块的日志器
const userLogger = partial(logInfo, 'USER');
const orderLogger = partial(logInfo, 'ORDER');

// 使用日志器
userLogger(new Date(), '用户登录');
orderLogger(new Date(), '订单创建');
logError('PAYMENT', new Date(), '支付失败');
console.log();

// ============================================================================
// 6. 真实业务场景: API 请求配置
// ============================================================================

console.log('6. 真实业务场景: API 请求配置\n');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestOptions = {
  method: HttpMethod;
  baseUrl: string;
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
};

function makeRequest(options: RequestOptions): string {
  const { method, baseUrl, endpoint, headers, body } = options;
  return `${method} ${baseUrl}${endpoint} ${JSON.stringify({ headers, body })}`;
}

// 创建 API 客户端 (固定 baseUrl 和 headers)
function createApiClient(baseUrl: string, defaultHeaders: Record<string, string>) {
  return {
    get: partial(makeRequest, {
      method: 'GET',
      baseUrl,
      headers: defaultHeaders,
    } as RequestOptions),
    
    post: (endpoint: string, body: any) =>
      makeRequest({
        method: 'POST',
        baseUrl,
        endpoint,
        headers: defaultHeaders,
        body,
      }),
    
    put: (endpoint: string, body: any) =>
      makeRequest({
        method: 'PUT',
        baseUrl,
        endpoint,
        headers: defaultHeaders,
        body,
      }),
  };
}

const api = createApiClient('https://api.example.com', {
  'Authorization': 'Bearer token123',
  'Content-Type': 'application/json',
});

// 注意: 这里简化了示例,实际应用中需要更复杂的类型处理
console.log('GET请求示例: api.get("/users")');
console.log('POST请求示例: api.post("/users", { name: "张三" })');
console.log();

// ============================================================================
// 7. 真实业务场景: 数据验证
// ============================================================================

console.log('7. 真实业务场景: 数据验证\n');

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function validate(
  fieldName: string,
  rules: Array<(value: any) => boolean>,
  errorMessages: string[],
  value: any
): ValidationResult {
  const errors: string[] = [];

  rules.forEach((rule, index) => {
    if (!rule(value)) {
      errors.push(`${fieldName}: ${errorMessages[index]}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 创建字段验证器
const validateUsername = partial(
  validate,
  '用户名',
  [
    (v: string) => v.length >= 3,
    (v: string) => v.length <= 20,
    (v: string) => /^[a-zA-Z0-9_]+$/.test(v),
  ],
  [
    '至少3个字符',
    '最多20个字符',
    '只能包含字母、数字和下划线',
  ]
);

const validateEmail = partial(
  validate,
  '邮箱',
  [(v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)],
  ['邮箱格式不正确']
);

const validateAge = partial(
  validate,
  '年龄',
  [(v: number) => v >= 18, (v: number) => v <= 120],
  ['必须年满18岁', '年龄不能超过120岁']
);

console.log('验证用户名"ab":', validateUsername('ab'));
console.log('验证用户名"john_doe":', validateUsername('john_doe'));
console.log('验证邮箱"invalid":', validateEmail('invalid'));
console.log('验证邮箱"user@example.com":', validateEmail('user@example.com'));
console.log('验证年龄15:', validateAge(15));
console.log('验证年龄25:', validateAge(25));
console.log();

// ============================================================================
// 8. 真实业务场景: 事件处理器
// ============================================================================

console.log('8. 真实业务场景: 事件处理器\n');

type EventType = 'click' | 'hover' | 'submit';

function handleEvent(
  eventType: EventType,
  elementId: string,
  middleware: (data: any) => any,
  handler: (data: any) => void,
  data: any
): void {
  console.log(`处理 ${eventType} 事件于 #${elementId}`);
  const processedData = middleware(data);
  handler(processedData);
}

// 创建点击事件处理器
const handleClick = partial(handleEvent, 'click');

// 创建特定元素的处理器
const handleLoginButtonClick = partial(
  handleClick,
  'loginButton',
  (data: any) => ({ ...data, timestamp: Date.now() })  // 添加时间戳
);

// 使用
handleLoginButtonClick(
  (data: any) => console.log('登录按钮被点击:', data),
  { username: 'john' }
);

// 创建表单提交处理器
const handleFormSubmit = partial(handleEvent, 'submit');
const handleUserFormSubmit = partial(
  handleFormSubmit,
  'userForm',
  (data: any) => {
    // 数据清洗
    return {
      ...data,
      username: data.username?.trim(),
      email: data.email?.toLowerCase(),
    };
  }
);

handleUserFormSubmit(
  (data: any) => console.log('表单提交:', data),
  { username: '  John  ', email: 'JOHN@EXAMPLE.COM' }
);
console.log();

// ============================================================================
// 9. 真实业务场景: 价格计算器
// ============================================================================

console.log('9. 真实业务场景: 价格计算器\n');

type PriceCalculationConfig = {
  taxRate: number;
  shippingFee: number;
  discountRate: number;
};

function calculateFinalPrice(
  config: PriceCalculationConfig,
  quantity: number,
  unitPrice: number
): number {
  const subtotal = quantity * unitPrice;
  const discount = subtotal * config.discountRate;
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * config.taxRate;
  return afterDiscount + tax + config.shippingFee;
}

// 为不同地区创建价格计算器
const calculateChinaPrice = partial(calculateFinalPrice, {
  taxRate: 0.13,      // 13% 增值税
  shippingFee: 15,    // 15元运费
  discountRate: 0,    // 无折扣
});

const calculateUSPrice = partial(calculateFinalPrice, {
  taxRate: 0.08,      // 8% 销售税
  shippingFee: 10,    // $10 运费
  discountRate: 0,    // 无折扣
});

// 为VIP创建折扣计算器
const calculateVIPPrice = partial(calculateFinalPrice, {
  taxRate: 0.13,
  shippingFee: 0,     // 免运费
  discountRate: 0.1,  // 9折
});

console.log('中国价格 (3件 * ¥100):', calculateChinaPrice(3, 100));
console.log('美国价格 (3件 * $100):', calculateUSPrice(3, 100));
console.log('VIP价格 (3件 * ¥100):', calculateVIPPrice(3, 100));
console.log();

// ============================================================================
// 10. 部分应用的最佳实践
// ============================================================================

console.log('10. 部分应用的最佳实践\n');

/**
 * ✅ 何时使用部分应用:
 * 
 * 1. 配置化函数 - 固定配置参数,创建特定用途的函数
 * 2. 创建工厂函数 - 基于基础函数创建定制版本
 * 3. 减少重复 - 多次调用时固定相同的参数
 * 4. 依赖注入 - 提前注入依赖,延迟执行
 * 5. 回调函数 - 为事件处理器预设参数
 * 
 * ❌ 何时避免:
 * 
 * 1. 参数经常变化 - 没有固定的参数值
 * 2. 一次性使用 - 只调用一次的函数
 * 3. 性能关键路径 - 额外的函数调用有开销
 * 4. 过度抽象 - 让代码变得难以理解
 */

// ✅ 好的使用场景: 重复的配置
const formatPrice = (currency: string, locale: string, amount: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

const formatCNY = partial(formatPrice, 'CNY', 'zh-CN');
const formatUSD = partial(formatPrice, 'USD', 'en-US');

console.log('格式化人民币:', formatCNY(1234.56));
console.log('格式化美元:', formatUSD(1234.56));

// ❌ 不好的使用场景: 一次性使用
// 这种情况直接调用更清晰
const result = partial(add3, 1, 2)(3);
console.log('不必要的部分应用:', result);
// 不如直接: add3(1, 2, 3)

console.log();
console.log('=== 示例结束 ===');

// 导出供其他模块使用
export {
  partial,
  partialWithPlaceholder,
  _,
  validateUsername,
  validateEmail,
  validateAge,
  calculateFinalPrice,
  formatPrice,
};

export type { LogLevel, HttpMethod, RequestOptions, ValidationResult, PriceCalculationConfig };
