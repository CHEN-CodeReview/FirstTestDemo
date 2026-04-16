/**
 * 类型化的 API 服务器框架
 * 基于 Express 风格，提供类型安全的路由定义
 */

import * as http from 'http';
import * as url from 'url';
import * as querystring from 'querystring';
import * as fs from 'fs';
import * as path from 'path';
import { createGzip, createDeflate } from 'zlib';

/**
 * 请求接口
 */
export interface Request extends http.IncomingMessage {
    pathname: string;
    query: Record<string, string>;
    params: Record<string, string>;
    body?: any;
    parsedUrl: url.UrlWithParsedQuery;
}

/**
 * 响应接口
 */
export interface Response extends http.ServerResponse {
    status: (code: number) => Response;
    json: (data: any) => void;
    send: (body: string | Buffer | any) => void;
    redirect: (location: string, code?: number) => void;
    sendFile: (filePath: string) => void;
}

/**
 * 下一个函数类型
 */
export type NextFunction = (err?: any) => void;

/**
 * 中间件类型
 */
export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

/**
 * 路由处理函数类型
 */
export type RequestHandler = (req: Request, res: Response) => void;

/**
 * 路由配置
 */
interface Route {
    method: string;
    path: string;
    handler: RequestHandler;
    regex: RegExp;
    paramNames: string[];
}

/**
 * CORS 配置
 */
export interface CorsOptions {
    origin: string;
    methods: string;
    credentials: boolean;
    allowedHeaders?: string;
}

/**
 * API 服务器类
 */
export class ApiServer {
    private port: number;
    private host: string;
    private routes: Route[] = [];
    private middlewares: Middleware[] = [];
    private server: http.Server | null = null;
    private staticPath: string | null = null;
    private corsEnabled: boolean = false;
    private corsOptions: CorsOptions = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true
    };
    private logger: { log: (message: any) => void; error: (message: any) => void } = console;

    constructor(options: { port?: number; host?: string; logger?: any } = {}) {
        this.port = options.port || 3000;
        this.host = options.host || 'localhost';
        if (options.logger) {
            this.logger = options.logger;
        }
    }

    /**
     * 添加中间件
     */
    use(middleware: Middleware): this {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * 注册 GET 路由
     */
    get(path: string, handler: RequestHandler): this {
        return this.addRoute('GET', path, handler);
    }

    /**
     * 注册 POST 路由
     */
    post(path: string, handler: RequestHandler): this {
        return this.addRoute('POST', path, handler);
    }

    /**
     * 注册 PUT 路由
     */
    put(path: string, handler: RequestHandler): this {
        return this.addRoute('PUT', path, handler);
    }

    /**
     * 注册 DELETE 路由
     */
    delete(path: string, handler: RequestHandler): this {
        return this.addRoute('DELETE', path, handler);
    }

    /**
     * 注册 PATCH 路由
     */
    patch(path: string, handler: RequestHandler): this {
        return this.addRoute('PATCH', path, handler);
    }

    /**
     * 添加路由
     */
    private addRoute(method: string, path: string, handler: RequestHandler): this {
        const { regex, paramNames } = this.pathToRegex(path);
        this.routes.push({
            method,
            path,
            handler,
            regex,
            paramNames
        });
        return this;
    }

    /**
     * 将路径转换为正则，提取参数名
     */
    private pathToRegex(path: string): { regex: RegExp; paramNames: string[] } {
        const paramNames: string[] = [];
        let regexStr = path
            .replace(/\//g, '\\/')
            .replace(/:([^\/]+)/g, (_, name: string) => {
                paramNames.push(name);
                return '([^\\/]+)';
            })
            .replace(/\*/g, '.*');
        regexStr = `^${regexStr}$`;
        return { regex: new RegExp(regexStr), paramNames };
    }

    /**
     * 匹配路由
     */
    private matchRoute(method: string, pathname: string): {
        handler: RequestHandler;
        params: Record<string, string>;
    } | null {
        for (const route of this.routes) {
            if (route.method !== method) continue;
            const match = route.regex.exec(pathname);
            if (match) {
                const params: Record<string, string> = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                return { handler: route.handler, params };
            }
        }
        return null;
    }

    /**
     * 设置静态文件目录
     */
    static(folderPath: string): this {
        this.staticPath = folderPath;
        return this;
    }

    /**
     * 启用 CORS
     */
    enableCors(options: Partial<CorsOptions> = {}): this {
        this.corsEnabled = true;
        this.corsOptions = { ...this.corsOptions, ...options };
        return this;
    }

    /**
     * 添加 CORS 头
     */
    private addCorsHeaders(req: Request, res: Response): void {
        res.setHeader('Access-Control-Allow-Origin', this.corsOptions.origin);
        res.setHeader('Access-Control-Allow-Methods', this.corsOptions.methods);
        res.setHeader('Access-Control-Allow-Credentials', String(this.corsOptions.credentials));
        if (req.headers['access-control-request-headers']) {
            res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] as string);
        }
    }

    /**
     * 包装响应对象添加便捷方法
     */
    private wrapResponse(res: Response): void {
        res.status = (code: number): Response => {
            res.statusCode = code;
            return res;
        };

        res.json = (data: any): void => {
            if (!res.getHeader('Content-Type')) {
                res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
        };

        res.send = (body: string | Buffer | any): void => {
            if (typeof body === 'string') {
                if (!res.getHeader('Content-Type')) {
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                }
                res.end(body);
            } else if (Buffer.isBuffer(body)) {
                res.end(body);
            } else {
                res.json(body);
            }
        };

        res.redirect = (location: string, code: number = 302): void => {
            res.statusCode = code;
            res.setHeader('Location', location);
            res.end();
        };

        res.sendFile = (filePath: string): void => {
            this.serveStaticFile(filePath, res);
        };
    }

    /**
     * 运行中间件链
     */
    private runMiddlewares(index: number, req: Request, res: Response, done: () => void): void {
        if (index >= this.middlewares.length) {
            done();
            return;
        }
        const middleware = this.middlewares[index];
        middleware(req, res, (err) => {
            if (err) {
                this.handleError(err, req, res);
                return;
            }
            this.runMiddlewares(index + 1, req, res, done);
        });
    }

    /**
     * 处理错误
     */
    private handleError(err: any, req: Request, res: Response): void {
        this.logger.error(`Error on ${req.method} ${req.pathname}:`, err);
        if (!res.headersSent) {
            res.status(err.status || 500).json({
                error: err.message || 'Internal Server Error'
            });
        }
    }

    /**
     * 根据扩展名获取 MIME 类型
     */
    private getContentType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.txt': 'text/plain; charset=utf-8',
            '.pdf': 'application/pdf',
            '.zip': 'application/zip',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * 发送文件压缩
     */
    private sendFileWithCompression(filePath: string, acceptEncoding: string | undefined, res: Response): void {
        const contentType = this.getContentType(filePath);
        res.setHeader('Content-Type', contentType);

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.status(404).json({ error: 'File not found' });
                return;
            }

            if (!acceptEncoding || (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate'))) {
                res.end(content);
                return;
            }

            if (acceptEncoding.includes('gzip')) {
                res.setHeader('Content-Encoding', 'gzip');
                createGzip().end(content).pipe(res);
            } else if (acceptEncoding.includes('deflate')) {
                res.setHeader('Content-Encoding', 'deflate');
                createDeflate().end(content).pipe(res);
            } else {
                res.end(content);
            }
        });
    }

    /**
     * 提供静态文件
     */
    private serveStaticFile(requestPath: string, res: Response): void {
        if (!this.staticPath) {
            res.status(404).json({ error: 'Not Found' });
            return;
        }

        let filePath = path.join(this.staticPath, requestPath);
        // 安全检查，防止目录遍历
        const resolved = path.resolve(filePath);
        const root = path.resolve(this.staticPath);
        if (!resolved.startsWith(root)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.status(404).json({ error: 'Not Found' });
                return;
            }

            if (stats.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
                fs.stat(filePath, (err2) => {
                    if (err2) {
                        res.status(404).json({ error: 'Not Found' });
                    } else {
                        this.sendFileWithCompression(filePath, undefined, res);
                    }
                });
            } else {
                this.sendFileWithCompression(filePath, undefined, res);
            }
        });
    }

    /**
     * 处理请求入口
     */
    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        const parsedUrl = url.parse(req.url as string, true);
        const pathname = parsedUrl.pathname || '/';
        const query = parsedUrl.query as Record<string, string>;

        // 扩展请求对象
        const customReq = req as Request;
        customReq.parsedUrl = parsedUrl as url.UrlWithParsedQuery;
        customReq.pathname = pathname;
        customReq.query = query;
        customReq.params = {};

        // 扩展响应对象
        const customRes = res as Response;
        this.wrapResponse(customRes);

        // 日志
        this.logger.log(`${req.method} ${pathname}`);

        // CORS
        if (this.corsEnabled) {
            this.addCorsHeaders(customReq, customRes);
            if (req.method === 'OPTIONS') {
                customRes.writeHead(204);
                customRes.end();
                return;
            }
        }

        // 运行中间件
        this.runMiddlewares(0, customReq, customRes, () => {
            // 匹配路由
            const matched = this.matchRoute(req.method as string, pathname);
            if (matched) {
                customReq.params = matched.params;
                matched.handler(customReq, customRes);
                return;
            }

            // 静态文件
            if (this.staticPath) {
                this.serveStaticFile(pathname, customRes);
                return;
            }

            // 404
            customRes.status(404).json({ error: 'Not Found' });
        });
    }

    /**
     * 启动服务器
     */
    listen(callback?: () => void): http.Server {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, this.host, () => {
            this.logger.log(`API Server listening at http://${this.host}:${this.port}/`);
            if (callback) callback();
        });

        this.server.on('error', (err: NodeJS.ErrnoException) => {
            this.logger.error('Server error:', err);
        });

        return this.server;
    }

    /**
     * 关闭服务器
     */
    close(): void {
        if (this.server) {
            this.server.close();
        }
    }
}

/**
 * JSON 解析中间件
 */
export function jsonParser(options: { limit?: string } = {}): Middleware {
    const limitStr = options.limit || '100kb';
    const limitBytes = parseSize(limitStr);

    return function (req: Request, res: Response, next: NextFunction): void {
        if (req.method === 'GET' || req.method === 'HEAD') {
            next();
            return;
        }

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            next();
            return;
        }

        let body = '';
        let receivedBytes = 0;

        req.on('data', (chunk: Buffer) => {
            receivedBytes += chunk.length;
            if (receivedBytes > limitBytes) {
                res.status(413).json({ error: 'Request entity too large' });
                req.destroy();
                return;
            }
            body += chunk;
        });

        req.on('end', () => {
            if (body) {
                try {
                    req.body = JSON.parse(body);
                } catch (err) {
                    res.status(400).json({ error: 'Invalid JSON' });
                    return;
                }
            } else {
                req.body = {};
            }
            next();
        });

        req.on('error', (err) => {
            next(err);
        });
    };
}

/**
 * urlencoded 解析中间件（表单数据）
 */
export function urlencodedParser(options: { limit?: string } = {}): Middleware {
    const limitStr = options.limit || '100kb';
    const limitBytes = parseSize(limitStr);

    return function (req: Request, res: Response, next: NextFunction): void {
        if (req.method === 'GET' || req.method === 'HEAD') {
            next();
            return;
        }

        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/x-www-form-urlencoded')) {
            next();
            return;
        }

        let body = '';
        let receivedBytes = 0;

        req.on('data', (chunk: Buffer) => {
            receivedBytes += chunk.length;
            if (receivedBytes > limitBytes) {
                res.status(413).json({ error: 'Request entity too large' });
                req.destroy();
                return;
            }
            body += chunk;
        });

        req.on('end', () => {
            req.body = querystring.parse(body);
            next();
        });

        req.on('error', (err) => {
            next(err);
        });
    };
}

/**
 * 日志中间件
 */
export function loggerMiddleware(logger: { log: (message: string) => void } = console): Middleware {
    return function (req: Request, res: Response, next: NextFunction): void {
        const start = Date.now();
        logger.log(`--> ${req.method} ${req.pathname}`);

        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.log(`<-- ${req.method} ${req.pathname} ${res.statusCode} ${duration}ms`);
        });

        next();
    };
}

/**
 * 解析大小字符串
 */
function parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)([bkm]?b?)$/i);
    if (!match) return 100 * 1024;
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 'kb':
        case 'k':
            return num * 1024;
        case 'mb':
        case 'm':
            return num * 1024 * 1024;
        default:
            return num;
    }
}

/**
 * 路由缓存
 */
export class RouteCache {
    private maxAge: number;
    private cache = new Map<string, { data: any; timestamp: number }>();

    constructor(options: { maxAge?: number } = {}) {
        this.maxAge = options.maxAge || 60 * 1000; // 默认1分钟
    }

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    set(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }

    middleware(): Middleware {
        return (req: Request, res: Response, next: NextFunction) => {
            if (req.method !== 'GET') {
                next();
                return;
            }
            const key = req.pathname + JSON.stringify(req.query);
            const cached = this.get(key);
            if (cached !== null) {
                res.json(cached);
                return;
            }
            // 保存原始 json 方法
            const originalJson = res.json.bind(res);
            res.json = (data: any) => {
                this.set(key, data);
                originalJson(data);
            };
            next();
        };
    }
}

/**
 * 用户数据类型定义（示例）
 */
export interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

/**
 * 创建示例 Todo API 服务器
 */
export function createTodoApiServer(): ApiServer {
    const server = new ApiServer({ port: 3000 });

    // 启用 CORS
    server.enableCors();

    // 添加中间件
    server.use(loggerMiddleware());
    server.use(jsonParser());
    server.use(urlencodedParser());

    // 添加缓存
    const cache = new RouteCache({ maxAge: 30 * 1000 });
    server.use(cache.middleware());

    // 示例内存存储
    interface Todo {
        id: number;
        title: string;
        completed: boolean;
        createdAt: string;
    }

    let todos: Todo[] = [
        { id: 1, title: 'Learn TypeScript', completed: false, createdAt: new Date().toISOString() },
        { id: 2, title: 'Build API server', completed: true, createdAt: new Date().toISOString() },
        { id: 3, title: 'Test the code', completed: false, createdAt: new Date().toISOString() }
    ];
    let nextId = 4;

    // API 路由
    server.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    server.get('/api/todos', (req, res) => {
        const completed = req.query.completed;
        let result = todos;
        if (completed === 'true') {
            result = todos.filter(t => t.completed);
        } else if (completed === 'false') {
            result = todos.filter(t => !t.completed);
        }
        res.json({ todos: result, total: result.length });
    });

    server.get('/api/todos/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const todo = todos.find(t => t.id === id);
        if (!todo) {
            res.status(404).json({ error: 'Todo not found' });
            return;
        }
        res.json({ todo });
    });

    server.post('/api/todos', (req, res) => {
        const { title } = req.body;
        if (!title || typeof title !== 'string') {
            res.status(400).json({ error: 'Title is required' });
            return;
        }

        const todo: Todo = {
            id: nextId++,
            title,
            completed: false,
            createdAt: new Date().toISOString()
        };
        todos.push(todo);
        res.status(201).json({ todo });
    });

    server.put('/api/todos/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const idx = todos.findIndex(t => t.id === id);
        if (idx === -1) {
            res.status(404).json({ error: 'Todo not found' });
            return;
        }

        const { title, completed } = req.body;
        todos[idx] = {
            ...todos[idx],
            ...(title !== undefined && { title }),
            ...(completed !== undefined && { completed })
        };
        res.json({ todo: todos[idx] });
    });

    server.delete('/api/todos/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const initialLength = todos.length;
        todos = todos.filter(t => t.id !== id);
        if (todos.length === initialLength) {
            res.status(404).json({ error: 'Todo not found' });
            return;
        }
        res.json({ success: true });
    });

    server.post('/api/todos/:id/toggle', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const todo = todos.find(t => t.id === id);
        if (!todo) {
            res.status(404).json({ error: 'Todo not found' });
            return;
        }
        todo.completed = !todo.completed;
        res.json({ todo });
    });

    server.delete('/api/todos', (req, res) => {
        const completed = req.query.completed;
        if (completed === 'true') {
            const deleted = todos.length;
            todos = todos.filter(t => !t.completed);
            res.json({ success: true, deletedCount: deleted - todos.length });
        } else {
            res.json({ success: false, message: 'No filter provided' });
        }
    });

    // 根路径
    server.get('/', (req, res) => {
        res.send(`
            <html>
                <head>
                    <title>Todo API</title>
                    <style>body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; }</style>
                </head>
                <body>
                    <h1>Todo API Example</h1>
                    <ul>
                        <li><code>GET /api/todos</code> - List all todos</li>
                        <li><code>GET /api/todos/:id</code> - Get todo by ID</li>
                        <li><code>POST /api/todos</code> - Create new todo (body: { "title": "..." })</li>
                        <li><code>PUT /api/todos/:id</code> - Update todo</li>
                        <li><code>DELETE /api/todos/:id</code> - Delete todo</li>
                        <li><code>POST /api/todos/:id/toggle</code> - Toggle completion</li>
                    </ul>
                </body>
            </html>
        `);
    });

    return server;
}

// 如果直接运行，启动示例服务器
if (require.main === module) {
    const server = createTodoApiServer();
    server.listen();
}
