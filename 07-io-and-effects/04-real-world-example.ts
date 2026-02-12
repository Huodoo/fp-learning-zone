/**
 * 第七章第四节: 实际应用示例
 * 
 * 使用 IO、Task 和 TaskEither 构建真实世界的应用
 * 包括文件操作、API 调用、数据库查询等
 */

import { TaskEither, rightTask, leftTask, fromEither, tryCatch, Either, Left, Right } from './03-task-either';

console.log('=== 实际应用示例 ===\n');

// ============================================================================
// 示例 1: 文件处理系统
// ============================================================================

console.log('示例 1: 文件处理系统\n');

type FileError = 
  | { type: 'NotFound'; path: string }
  | { type: 'PermissionDenied'; path: string }
  | { type: 'InvalidFormat'; message: string };

// 模拟文件系统
const mockFileSystem: Record<string, string> = {
  '/config/app.json': '{"name":"MyApp","version":"1.0.0","port":3000}',
  '/data/users.csv': 'id,name,email\n1,张三,zhang@example.com\n2,李四,li@example.com',
};

const readFileAsync = (path: string): TaskEither<FileError, string> => {
  return tryCatch(
    async () => {
      console.log(`  [FS] 读取文件: ${path}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const content = mockFileSystem[path];
      if (!content) {
        throw new Error('File not found');
      }
      return content;
    },
    () => ({ type: 'NotFound', path })
  );
};

const writeFileAsync = (path: string, content: string): TaskEither<FileError, void> => {
  return tryCatch(
    async () => {
      console.log(`  [FS] 写入文件: ${path}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      mockFileSystem[path] = content;
    },
    () => ({ type: 'PermissionDenied', path })
  );
};

const parseJSON = <T>(content: string): Either<FileError, T> => {
  try {
    return Right(JSON.parse(content));
  } catch {
    return Left({ type: 'InvalidFormat', message: 'JSON 格式错误' });
  }
};

interface Config {
  name: string;
  version: string;
  port: number;
}

const loadConfig = (path: string): TaskEither<FileError, Config> => {
  return readFileAsync(path)
    .flatMap(content => fromEither(parseJSON<Config>(content)));
};

const updateConfig = (path: string, updates: Partial<Config>): TaskEither<FileError, void> => {
  return loadConfig(path)
    .map(config => ({ ...config, ...updates }))
    .map(newConfig => JSON.stringify(newConfig, null, 2))
    .flatMap(content => writeFileAsync(path, content));
};

console.log('✅ 加载配置文件:');
const config = await loadConfig('/config/app.json').run();
console.log(config);

console.log('\n✅ 更新配置文件:');
await updateConfig('/config/app.json', { port: 8080 }).run();
const updatedConfig = await loadConfig('/config/app.json').run();
console.log('更新后:', updatedConfig);
console.log();

// ============================================================================
// 示例 2: REST API 客户端
// ============================================================================

console.log('示例 2: REST API 客户端\n');

type HttpError =
  | { type: 'NetworkError'; message: string }
  | { type: 'NotFound'; url: string }
  | { type: 'ServerError'; status: number }
  | { type: 'ParseError'; message: string };

interface ApiResponse<T> {
  status: number;
  data: T;
}

const httpGet = <T>(url: string): TaskEither<HttpError, T> => {
  return tryCatch(
    async () => {
      console.log(`  [HTTP GET] ${url}`);
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 模拟响应
      if (url.includes('/users/')) {
        const id = parseInt(url.split('/').pop() || '0');
        return {
          id,
          name: `User ${id}`,
          email: `user${id}@example.com`,
        } as T;
      }
      
      throw new Error('Not found');
    },
    (error) => ({
      type: 'NetworkError',
      message: String(error),
    })
  );
};

const httpPost = <T, D>(url: string, data: D): TaskEither<HttpError, T> => {
  return tryCatch(
    async () => {
      console.log(`  [HTTP POST] ${url}`, data);
      await new Promise(resolve => setTimeout(resolve, 150));
      return { success: true, data } as T;
    },
    (error) => ({
      type: 'NetworkError',
      message: String(error),
    })
  );
};

interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

const getUser = (id: number): TaskEither<HttpError, User> => {
  return httpGet<User>(`/api/users/${id}`);
};

const createUser = (dto: CreateUserDto): TaskEither<HttpError, User> => {
  return httpPost<User, CreateUserDto>('/api/users', dto);
};

console.log('✅ GET 请求:');
const user = await getUser(1).run();
console.log(user);

console.log('\n✅ POST 请求:');
const newUser = await createUser({ name: '王五', email: 'wang@example.com' }).run();
console.log(newUser);
console.log();

// ============================================================================
// 示例 3: 完整的业务流程 - 用户注册
// ============================================================================

console.log('示例 3: 完整的业务流程 - 用户注册\n');

type ValidationError = { field: string; message: string };
type AppError = FileError | HttpError | ValidationError;

const validateEmail = (email: string): Either<ValidationError, string> => {
  return email.includes('@')
    ? Right(email)
    : Left({ field: 'email', message: '邮箱格式无效' });
};

const validatePassword = (password: string): Either<ValidationError, string> => {
  return password.length >= 6
    ? Right(password)
    : Left({ field: 'password', message: '密码至少6个字符' });
};

interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

const checkEmailExists = (email: string): TaskEither<AppError, boolean> => {
  return tryCatch(
    async () => {
      console.log(`  [DB] 检查邮箱是否存在: ${email}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return false; // 模拟不存在
    },
    (error) => ({ type: 'NetworkError', message: String(error) })
  );
};

const saveUser = (dto: RegisterDto): TaskEither<AppError, User> => {
  return tryCatch(
    async () => {
      console.log(`  [DB] 保存用户:`, dto);
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        id: Date.now(),
        name: dto.name,
        email: dto.email,
      };
    },
    (error) => ({ type: 'NetworkError', message: String(error) })
  );
};

const sendWelcomeEmail = (user: User): TaskEither<AppError, void> => {
  return tryCatch(
    async () => {
      console.log(`  [Email] 发送欢迎邮件到: ${user.email}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    (error) => ({ type: 'NetworkError', message: String(error) })
  );
};

const registerUser = (dto: RegisterDto): TaskEither<AppError, User> => {
  return fromEither(validateEmail(dto.email))
    .flatMap(() => fromEither(validatePassword(dto.password)))
    .flatMap(() => checkEmailExists(dto.email))
    .flatMap(exists => {
      if (exists) {
        return leftTask({ field: 'email', message: '邮箱已存在' });
      }
      return rightTask(undefined);
    })
    .flatMap(() => saveUser(dto))
    .flatMap(user => 
      sendWelcomeEmail(user).map(() => user)
    );
};

console.log('✅ 用户注册流程:');
const registration = await registerUser({
  email: 'newuser@example.com',
  password: 'password123',
  name: '新用户',
}).run();
console.log('注册结果:', registration);
console.log();

console.log('=== 实际应用示例总结 ===');
console.log('TaskEither 非常适合构建实际应用');
console.log('能够优雅地处理异步操作和错误');
console.log('代码清晰、类型安全、易于测试');
console.log();

export {};
