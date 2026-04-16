/**
 * 简单的 HTTP 服务器实现
 * 支持路由、中间件、静态文件服务、JSON 解析等
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const { createGzip, createDeflate } = require('zlib');

/**
 * HTTP 服务器类
 */
class HttpServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.host = options.host || 'localhost';
        this.routes = {
            GET: [],
            POST: [],
            PUT: [],
            DELETE: [],
            PATCH: [],
            OPTIONS: [],
            HEAD: []
        };
        this.middlewares = [];
        this.staticPath = options.staticPath || null;
        this.server = null;
        this.logger = options.logger || console;
        this.corsEnabled = options.corsEnabled || false;
        this.corsOptions = {
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true
        };
    }

    /**
     * 添加中间件
     * @param {Function} middleware - 中间件函数 (req, res, next) => void
     */
    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * 注册 GET 路由
     * @param {string} path - 路由路径
     * @param {Function} handler - 处理函数 (req, res) => void
     */
    get(path, handler) {
        this.addRoute('GET', path, handler);
        return this;
    }

    /**
     * 注册 POST 路由
     * @param {string} path - 路由路径
     * @param {Function} handler - 处理函数
     */
    post(path, handler) {
        this.addRoute('POST', path, handler);
        return this;
    }

    /**
     * 注册 PUT 路由
     */
    put(path, handler) {
        this.addRoute('PUT', path, handler);
        return this;
    }

    /**
     * 注册 DELETE 路由
     */
    delete(path, handler) {
        this.addRoute('DELETE', path, handler);
        return this;
    }

    /**
     * 注册路由
     */
    addRoute(method, path, handler) {
        this.routes[method].push({
            path,
            handler,
            regex: this.pathToRegex(path)
        });
    }

    /**
     * 将路径转换为正则表达式，支持参数如 /users/:id
     */
    pathToRegex(path) {
        const paramNames = [];
        const regexStr = path
            .replace(/\//g, '\\/')
            .replace(/:([^\\/]+)/g, (_, name) => {
                paramNames.push(name);
                return '([^\\/]+)';
            })
            .replace(/\*/g, '.*');
        return {
            regex: new RegExp(`^${regexStr}$`),
            paramNames
        };
    }

    /**
     * 匹配路由，提取参数
     */
    matchRoute(method, pathname) {
        const routes = this.routes[method];
        if (!routes) return null;

        for (const route of routes) {
            const match = route.regex.regex.exec(pathname);
            if (match) {
                const params = {};
                route.regex.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                return {
                    handler: route.handler,
                    params
                };
            }
        }
        return null;
    }

    /**
     * 设置静态文件服务路径
     */
    static(folderPath) {
        this.staticPath = folderPath;
        return this;
    }

    /**
     * 启用 CORS
     */
    enableCors(options = {}) {
        this.corsEnabled = true;
        this.corsOptions = { ...this.corsOptions, ...options };
        return this;
    }

    /**
     * 处理请求
     */
    handleRequest(req, res) {
        // 解析 URL
        const parsedUrl = url.parse(req.url);
        const pathname = parsedUrl.pathname;
        const query = querystring.parse(parsedUrl.query);

        // 包装请求对象
        req.parsedUrl = parsedUrl;
        req.pathname = pathname;
        req.query = query;
        req.params = {};

        // 包装响应对象添加便捷方法
        this.wrapResponse(res);

        // 添加 CORS 头
        if (this.corsEnabled) {
            this.addCorsHeaders(req, res);
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }
        }

        this.logger.log(`${req.method} ${pathname}`);

        // 运行中间件
        this.runMiddlewares(0, req, res, () => {
            // 尝试匹配路由
            const matched = this.matchRoute(req.method, pathname);
            if (matched) {
                req.params = matched.params;
                matched.handler(req, res);
                return;
            }

            // 如果没找到路由，尝试提供静态文件
            if (this.staticPath) {
                this.serveStaticFile(pathname, req, res);
                return;
            }

            // 404
            res.status(404).json({ error: 'Not Found' });
        });
    }

    /**
     * 递归运行中间件
     */
    runMiddlewares(index, req, res, done) {
        if (index >= this.middlewares.length) {
            done();
            return;
        }
        const middleware = this.middlewares[index];
        middleware(req, res, () => {
            this.runMiddlewares(index + 1, req, res, done);
        });
    }

    /**
     * 包装响应对象添加快捷方法
     */
    wrapResponse(res) {
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };

        res.json = (data) => {
            if (!res.getHeader('Content-Type')) {
                res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
        };

        res.send = (body) => {
            if (typeof body === 'string') {
                if (!res.getHeader('Content-Type')) {
                    res.setHeader('Content-Type', 'text/html');
                }
                res.end(body);
            } else if (Buffer.isBuffer(body)) {
                res.end(body);
            } else {
                res.json(body);
            }
        };

        res.redirect = (location, code = 302) => {
            res.statusCode = code;
            res.setHeader('Location', location);
            res.end();
        };

        res.sendFile = (filePath) => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    res.status(404).json({ error: 'File not found' });
                    return;
                }
                if (stats.isDirectory()) {
                    // 尝试找 index.html
                    const indexPath = path.join(filePath, 'index.html');
                    fs.stat(indexPath, (err2) => {
                        if (err2) {
                            res.status(404).json({ error: 'File not found' });
                        } else {
                            this.sendFileWithCompression(indexPath, req, res);
                        }
                    });
                } else {
                    this.sendFileWithCompression(filePath, req, res);
                }
            });
        };
    }

    /**
     * 添加 CORS 头
     */
    addCorsHeaders(req, res) {
        res.setHeader('Access-Control-Allow-Origin', this.corsOptions.origin);
        res.setHeader('Access-Control-Allow-Methods', this.corsOptions.methods);
        res.setHeader('Access-Control-Allow-Credentials', this.corsOptions.credentials);
        if (req.headers['access-control-request-headers']) {
            res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        }
    }

    /**
     * 提供静态文件
     */
    serveStaticFile(pathname, req, res) {
        let filePath = path.join(this.staticPath, pathname);
        // 防目录遍历攻击
        if (!filePath.startsWith(path.resolve(this.staticPath))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        fs.access(filePath, fs.constants.R_OK, (err) => {
            if (err) {
                res.status(404).json({ error: 'Not Found' });
                return;
            }
            this.sendFileWithCompression(filePath, req, res);
        });
    }

    /**
     * 根据接受编码选择压缩方式发送文件
     */
    sendFileWithCompression(filePath, req, res) {
        const contentType = this.getContentType(filePath);
        res.setHeader('Content-Type', contentType);

        const acceptEncoding = req.headers['accept-encoding'] || '';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.status(500).json({ error: 'Cannot read file' });
                return;
            }

            if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
                res.end(content);
                return;
            }

            if (acceptEncoding.includes('gzip')) {
                res.setHeader('Content-Encoding', 'gzip');
                createGzip().end(content).pipe(res);
            } else if (acceptEncoding.includes('deflate')) {
                res.setHeader('Content-Encoding', 'deflate');
                createDeflate().end(content).pipe(res);
            }
        });
    }

    /**
     * 根据扩展名获取 Content-Type
     */
    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.zip': 'application/zip',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * 启动服务器
     */
    listen(callback) {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, this.host, () => {
            this.logger.log(`Server running at http://${this.host}:${this.port}/`);
            if (callback) callback();
        });

        this.server.on('error', (err) => {
            this.logger.error('Server error:', err);
        });

        return this.server;
    }

    /**
     * 关闭服务器
     */
    close() {
        if (this.server) {
            this.server.close();
        }
    }
}

/**
 * JSON 解析中间件
 */
function jsonParser(options = {}) {
    const limit = options.limit || '100kb';
    const limitBytes = parseSize(limit);

    return function (req, res, next) {
        if (req.method === 'GET' || req.method === 'HEAD') {
            return next();
        }
        if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
            return next();
        }

        let body = '';
        let receivedBytes = 0;

        req.on('data', (chunk) => {
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
            this.logger.error('JSON parse error:', err);
            res.status(400).json({ error: 'Invalid request' });
        });
    };
}

/**
 * urlencoded 解析中间件（表单数据）
 */
function urlencodedParser(options = {}) {
    const limit = options.limit || '100kb';
    const limitBytes = parseSize(limit);

    return function (req, res, next) {
        if (req.method === 'GET' || req.method === 'HEAD') {
            return next();
        }
        if (!req.headers['content-type'] ||
            !req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
            return next();
        }

        let body = '';
        let receivedBytes = 0;

        req.on('data', (chunk) => {
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

        req.on('error', () => {
            res.status(400).json({ error: 'Invalid request' });
        });
    };
}

/**
 * 日志中间件
 */
function loggerMiddleware(logger = console) {
    return function (req, res, next) {
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
 * 解析大小字符串如 "100kb" 转为字节数
 */
function parseSize(sizeStr) {
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
        case 'gb':
        case 'g':
            return num * 1024 * 1024 * 1024;
        default:
            return num;
    }
}

/**
 * 简单内存存储的路由缓存
 */
class RouteCache {
    constructor(options = {}) {
        this.maxAge = options.maxAge || 60 * 1000; // 1 minute default
        this.cache = new Map();
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    // 缓存中间件工厂
    middleware() {
        return (req, res, next) => {
            // 只缓存 GET 请求
            if (req.method !== 'GET') {
                return next();
            }
            const key = req.pathname + JSON.stringify(req.query);
            const cached = this.get(key);
            if (cached) {
                res.json(cached);
                return;
            }
            // 保存原始 json 方法
            const originalJson = res.json;
            res.json = (data) => {
                this.set(key, data);
                originalJson.call(res, data);
            };
            next();
        };
    }
}

/**
 * 创建一个示例 API 服务器
 */
function createExampleServer() {
    const server = new HttpServer({ port: 3000 });

    // 启用 CORS
    server.enableCors();

    // 添加中间件
    server.use(loggerMiddleware());
    server.use(jsonParser());
    server.use(urlencodedParser());

    // 添加缓存
    const cache = new RouteCache({ maxAge: 30 * 1000 });
    server.use(cache.middleware());

    // 示例数据
    let users = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' }
    ];
    let nextId = 4;

    // 路由
    server.get('/', (req, res) => {
        res.send(`
            <html>
                <head><title>Example API Server</title></head>
                <body>
                    <h1>Welcome to Example API Server</h1>
                    <ul>
                        <li><a href="/api/users">GET /api/users - List all users</a></li>
                        <li>GET /api/users/:id - Get user by ID</li>
                        <li>POST /api/users - Create new user (JSON body: {name, email})</li>
                        <li>PUT /api/users/:id - Update user</li>
                        <li>DELETE /api/users/:id - Delete user</li>
                    </ul>
                </body>
            </html>
        `);
    });

    server.get('/api/users', (req, res) => {
        res.json({ users });
    });

    server.get('/api/users/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const user = users.find(u => u.id === id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    });

    server.post('/api/users', (req, res) => {
        const { name, email } = req.body;
        if (!name || !email) {
            res.status(400).json({ error: 'Name and email are required' });
            return;
        }
        const user = { id: nextId++, name, email };
        users.push(user);
        res.status(201).json({ user });
    });

    server.put('/api/users/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { name, email } = req.body;
        users[idx] = { ...users[idx], name, email };
        res.json({ user: users[idx] });
    });

    server.delete('/api/users/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const initialLength = users.length;
        users = users.filter(u => u.id !== id);
        if (users.length === initialLength) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ success: true });
    });

    // 简单的健康检查
    server.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    // 静态文件服务示例
    // server.static('./public');

    return server;
}

// 如果直接运行，则启动示例服务器
if (require.main === module) {
    const server = createExampleServer();
    server.listen(() => {
        console.log('Example server is running. You can test it with:');
        console.log('  curl http://localhost:3000/api/users');
    });
}

module.exports = {
    HttpServer,
    jsonParser,
    urlencodedParser,
    loggerMiddleware,
    RouteCache,
    createExampleServer
};
