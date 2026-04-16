/**
 * TypeScript 类型工具库
 * 提供各种类型检查、转换和验证工具
 */

/**
 * 基本类型定义
 */
type Primitive = string | number | boolean | null | undefined | symbol;
type AnyFunction = (...args: any[]) => any;
type AnyObject = Record<string, any>;

/**
 * 检查是否为 undefined 或 null
 */
export function isNullOrUndefined(value: unknown): value is undefined | null {
    return value === undefined || value === null;
}

/**
 * 检查是否为 undefined
 */
export function isUndefined(value: unknown): value is undefined {
    return value === undefined;
}

/**
 * 检查是否为 null
 */
export function isNull(value: unknown): value is null {
    return value === null;
}

/**
 * 检查是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/**
 * 检查是否为数字
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

/**
 * 检查是否为整数
 */
export function isInteger(value: unknown): value is number {
    return isNumber(value) && Number.isInteger(value);
}

/**
 * 检查是否为字符串
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

/**
 * 检查是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
    return isString(value) && value.length > 0;
}

/**
 * 检查是否为 symbol
 */
export function isSymbol(value: unknown): value is symbol {
    return typeof value === 'symbol';
}

/**
 * 检查是否为函数
 */
export function isFunction(value: unknown): value is AnyFunction {
    return typeof value === 'function';
}

/**
 * 检查是否为对象（不包括 null）
 */
export function isObject(value: unknown): value is AnyObject {
    return typeof value === 'object' && value !== null;
}

/**
 * 检查是否为纯对象（由 Object 构造函数创建，或字面量）
 */
export function isPlainObject(value: unknown): value is AnyObject {
    if (!isObject(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

/**
 * 检查是否为数组
 */
export function isArray<T = any>(value: unknown): value is T[] {
    return Array.isArray(value);
}

/**
 * 检查是否为非空数组
 */
export function isNonEmptyArray<T = any>(value: unknown): value is T[] {
    return isArray(value) && value.length > 0;
}

/**
 * 检查是否为 Date 实例且有效
 */
export function isDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 检查是否为正则表达式
 */
export function isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
}

/**
 * 检查是否为 Promise
 */
export function isPromise<T = any>(value: unknown): value is Promise<T> {
    return isObject(value) && isFunction((value as Promise<any>).then) && isFunction((value as Promise<any>).catch);
}

/**
 * 检查字符串是否为有效邮箱
 */
export function isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
}

/**
 * 检查字符串是否为有效 URL
 */
export function isUrl(value: string): boolean {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * 检查字符串是否为有效 IPv4 地址
 */
export function isIPv4(value: string): boolean {
    const parts = value.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255 && String(num) === part;
    });
}

/**
 * 检查是否为空值（空字符串、空数组、空对象、0、false、NaN 都算空）
 */
export function isEmpty(value: unknown): boolean {
    if (isNullOrUndefined(value)) return true;
    if (isString(value) || isArray(value)) return value.length === 0;
    if (isPlainObject(value)) return Object.keys(value).length === 0;
    if (isNumber(value) && isNaN(value)) return true;
    return false;
}

/**
 * 检查是否不为空
 */
export function isNotEmpty(value: unknown): value is NonNullable<any> {
    return !isEmpty(value);
}

/**
 * 断言类型，如果不满足则抛出错误
 */
export function assertType<T>(
    predicate: (value: unknown) => boolean,
    value: unknown,
    message?: string
): asserts value is T {
    if (!predicate(value)) {
        throw new TypeError(message || 'Type assertion failed');
    }
}

/**
 * 确保值不为 null/undefined，否则抛出
 */
export function assertNotNull<T>(value: T | null | undefined, message?: string): T {
    if (isNullOrUndefined(value)) {
        throw new TypeError(message || 'Value is null or undefined');
    }
    return value;
}

/**
 * 类型断言：告诉编译器这个就是这个类型
 */
export function cast<T>(value: unknown): T {
    return value as T;
}

/**
 * 将值转换为字符串
 */
export function toString(value: unknown): string {
    if (isNullOrUndefined(value)) return '';
    if (isString(value)) return value;
    return String(value);
}

/**
 * 将值转换为数字，如果无法转换返回 null
 */
export function toNumber(value: unknown): number | null {
    if (isNumber(value)) return value;
    if (isBoolean(value)) return value ? 1 : 0;
    if (isString(value)) {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
    return null;
}

/**
 * 将值转换为布尔值
 * - false, 0, '', null, undefined, NaN -> false
 * 其他 -> true
 */
export function toBoolean(value: unknown): boolean {
    return Boolean(value);
}

/**
 * 从对象中提取指定类型的属性
 */
export function pickByType<T>(
    obj: AnyObject,
    predicate: (value: unknown) => boolean
): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (predicate(value)) {
            result[key as keyof T] = cast<T[keyof T]>(value);
        }
    }
    return result;
}

/**
 * 对象深度克隆
 */
export function deepClone<T>(value: T): T {
    if (isPrimitive(value) || isFunction(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(item => deepClone(item)) as unknown as T;
    }
    if (value instanceof Date) {
        return new Date(value.getTime()) as unknown as T;
    }
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags) as unknown as T;
    }
    if (isPlainObject(value)) {
        const cloned = {} as T;
        for (const [key, val] of Object.entries(value)) {
            cloned[key as keyof T] = deepClone(val);
        }
        return cloned;
    }
    // 其他类型直接返回
    return value;
}

/**
 * 深度冻结对象，使其不可变
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
    if (isObject(obj) && !Object.isFrozen(obj)) {
        Object.freeze(obj);
        for (const key of Object.keys(obj)) {
            deepFreeze(obj[key]);
        }
    }
    return obj;
}

/**
 * 深度比较两个值是否相等
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    // 处理 NaN
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
        return true;
    }

    // 类型不同直接不相等
    if (typeof a !== typeof b) return false;

    // 数组比较
    if (isArray(a) && isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }

    // Date 比较
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    // RegExp 比较
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags;
    }

    // 对象比较
    if (isPlainObject(a) && isPlainObject(b)) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        for (const key of aKeys) {
            if (!b.hasOwnProperty(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    return false;
}

/**
 * 浅比较
 */
export function shallowEqual(a: AnyObject, b: AnyObject): boolean {
    if (a === b) return true;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
        if (a[key] !== b[key]) return false;
    }
    return true;
}

/**
 * 拾取对象的指定属性
 */
export function pick<T extends AnyObject, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
    }
    return result;
}

/**
 * 省略对象的指定属性
 */
export function omit<T extends AnyObject, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}

/**
 * 深度拾取
 */
export function deepPick<T>(
    obj: AnyObject,
    paths: string[]
): Partial<T> {
    const result: Partial<T> = {};
    for (const path of paths) {
        const parts = path.split('.');
        let current: any = result;
        let source: any = obj;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!source || !source.hasOwnProperty(part)) break;
            if (i === parts.length - 1) {
                current[part] = source[part];
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
                source = source[part];
            }
        }
    }
    return result;
}

/**
 * 对象合并
 */
export function merge<T extends AnyObject>(...objects: AnyObject[]): T {
    const result: AnyObject = {};
    for (const obj of objects) {
        if (!isPlainObject(obj)) continue;
        for (const [key, value] of Object.entries(obj)) {
            if (isPlainObject(value) && isPlainObject(result[key])) {
                result[key] = merge(result[key], value);
            } else {
                result[key] = deepClone(value);
            }
        }
    }
    return result as T;
}

/**
 * 获取对象属性值，支持路径如 'user.name'
 */
export function get<T = any>(
    obj: AnyObject,
    path: string,
    defaultValue?: T
): T | undefined {
    const parts = path.split('.');
    let current: any = obj;
    for (const part of parts) {
        if (isNullOrUndefined(current) || !current.hasOwnProperty(part)) {
            return defaultValue;
        }
        current = current[part];
    }
    return current;
}

/**
 * 设置对象属性值，支持路径
 */
export function set(
    obj: AnyObject,
    path: string,
    value: any
): AnyObject {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            current[part] = value;
        } else {
            if (!(part in current) || !isPlainObject(current[part])) {
                current[part] = {};
            }
            current = current[part];
        }
    }
    return obj;
}

/**
 * 删除对象属性，支持路径
 */
export function unset(obj: AnyObject, path: string): boolean {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            if (Array.isArray(current)) {
                const idx = parseInt(part, 10);
                if (isNaN(idx)) return false;
                current.splice(idx, 1);
            } else {
                delete current[part];
            }
            return true;
        }
        if (!current.hasOwnProperty(part)) return false;
        current = current[part];
        if (!isObject(current)) return false;
    }
    return false;
}

/**
 * 对象数组去重，根据指定属性
 */
export function uniqueBy<T>(
    array: T[],
    keyGetter: keyof T | ((item: T) => any)
): T[] {
    const seen = new Set();
    const result: T[] = [];
    for (const item of array) {
        const key = typeof keyGetter === 'function'
            ? keyGetter(item)
            : item[keyGetter];
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }
    return result;
}

/**
 * 分组
 */
export function groupBy<T, K extends keyof any>(
    array: T[],
    keyGetter: (item: T) => K
): Record<K, T[]> {
    const result = {} as Record<K, T[]>;
    for (const item of array) {
        const key = keyGetter(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }
    return result;
}

/**
 * 键值分组，提取值
 */
export function keyBy<T, K extends keyof any>(
    array: T[],
    keyGetter: (item: T) => K
): Record<K, T> {
    const result = {} as Record<K, T>;
    for (const item of array) {
        const key = keyGetter(item);
        result[key] = item;
    }
    return result;
}

/**
 * 计数
 */
export function countBy<T>(
    array: T[],
    keyGetter: (item: T) => any
): Record<any, number> {
    const result: Record<any, number> = {};
    for (const item of array) {
        const key = keyGetter(item);
        result[key] = (result[key] || 0) + 1;
    }
    return result;
}

/**
 * 排序，支持多字段
 */
export function sortBy<T>(
    array: T[],
    getters: Array<((item: T) => number | string) | keyof T>,
    ascending: boolean | boolean[] = true
): T[] {
    const sorted = [...array];
    sorted.sort((a, b) => {
        for (let i = 0; i < getters.length; i++) {
            const getter = getters[i];
            const valA = typeof getter === 'function' ? getter(a) : a[getter];
            const valB = typeof getter === 'function' ? getter(b) : b[getter];
            const asc = Array.isArray(ascending) ? ascending[i] : ascending;
            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
        }
        return 0;
    });
    return sorted;
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T = any>(
    str: string,
    defaultValue?: T
): T | null {
    try {
        return JSON.parse(str) as T;
    } catch {
        return defaultValue ?? null;
    }
}

/**
 * 安全的 JSON 字符串化
 */
export function safeJsonStringify(
    value: any,
    spaces?: number
): string | null {
    try {
        return JSON.stringify(value, null, spaces);
    } catch {
        return null;
    }
}

/**
 * 延迟 promise
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带超时的 Promise
 */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    timeoutMessage = 'Operation timed out'
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(timeoutMessage));
        }, ms);
        promise
            .then(result => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch(err => {
                clearTimeout(timeoutId);
                reject(err);
            });
    });
}

/**
 * 重试异步操作
 */
export async function retry<T>(
    operation: () => Promise<T>,
    retries: number,
    delayMs = 0
): Promise<T> {
    try {
        return await operation();
    } catch (err) {
        if (retries > 0) {
            if (delayMs > 0) {
                await delay(delayMs);
            }
            return retry(operation, retries - 1, delayMs);
        }
        throw err;
    }
}

/**
 * 防抖
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    return function (this: any, ...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, waitMs);
    };
}

/**
 * 节流
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
): (...args: Parameters<T>) => void {
    let waiting = false;
    return function (this: any, ...args: Parameters<T>) {
        if (waiting) return;
        waiting = true;
        setTimeout(() => {
            func.apply(this, args);
            waiting = false;
        }, waitMs);
    };
}

/**
 * 记忆化函数结果
 */
export function memoize<T extends (...args: any[]) => any>(
    func: T,
    resolver?: (...args: Parameters<T>) => string
): T {
    const cache = new Map<string, ReturnType<T>>();
    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
        const key = resolver ? resolver(...args) : JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key)!;
        }
        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    } as T;
}

/**
 * LRU 缓存
 */
export class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, V>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        // 刷新顺序
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            // 删除最旧的
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * 数据验证器
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export class Validator {
    private rules: Array<(value: any) => string | null>;

    constructor() {
        this.rules = [];
    }

    required(message = 'This field is required'): this {
        this.rules.push(value => {
            if (isNullOrUndefined(value) || isEmpty(value)) {
                return message;
            }
            return null;
        });
        return this;
    }

    minLength(min: number, message?: string): this {
        this.rules.push(value => {
            if (!isString(value) && !isArray(value)) {
                return message ?? `Value must be a string or array`;
            }
            if (value.length < min) {
                return message ?? `Must be at least ${min} characters long`;
            }
            return null;
        });
        return this;
    }

    maxLength(max: number, message?: string): this {
        this.rules.push(value => {
            if (!isString(value) && !isArray(value)) {
                return message ?? `Value must be a string or array`;
            }
            if (value.length > max) {
                return message ?? `Must be at most ${max} characters long`;
            }
            return null;
        });
        return this;
    }

    min(min: number, message?: string): this {
        this.rules.push(value => {
            if (!isNumber(value)) {
                return message ?? `Value must be a number`;
            }
            if (value < min) {
                return message ?? `Must be at least ${min}`;
            }
            return null;
        });
        return this;
    }

    max(max: number, message?: string): this {
        this.rules.push(value => {
            if (!isNumber(value)) {
                return message ?? `Value must be a number`;
            }
            if (value > max) {
                return message ?? `Must be at most ${max}`;
            }
            return null;
        });
        return this;
    }

    email(message = 'Must be a valid email address'): this {
        this.rules.push(value => {
            if (!isString(value)) return message;
            if (!isEmail(value)) return message;
            return null;
        });
        return this;
    }

    pattern(regex: RegExp, message: string): this {
        this.rules.push(value => {
            if (!isString(value) || !regex.test(value)) {
                return message;
            }
            return null;
        });
        return this;
    }

    validate(value: any): ValidationResult {
        const errors: string[] = [];
        for (const rule of this.rules) {
            const err = rule(value);
            if (err) {
                errors.push(err);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * 验证对象schema
 */
export function validateSchema<T>(
    obj: AnyObject,
    schema: Record<keyof T, Validator>
): ValidationResult {
    const errors: string[] = [];
    for (const [field, validator] of Object.entries(schema)) {
        const result = validator.validate(obj[field]);
        if (!result.valid) {
            result.errors.forEach(err => errors.push(`${field}: ${err}`));
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}

// 默认导出所有工具
export default {
    isNullOrUndefined,
    isUndefined,
    isNull,
    isBoolean,
    isNumber,
    isInteger,
    isString,
    isNonEmptyString,
    isSymbol,
    isFunction,
    isObject,
    isPlainObject,
    isArray,
    isNonEmptyArray,
    isDate,
    isRegExp,
    isPromise,
    isEmpty,
    isNotEmpty,
    assertType,
    assertNotNull,
    cast,
    toString,
    toNumber,
    toBoolean,
    deepClone,
    deepEqual,
    shallowEqual,
    pick,
    omit,
    merge,
    get,
    set,
    unset,
    uniqueBy,
    groupBy,
    keyBy,
    countBy,
    sortBy,
    safeJsonParse,
    safeJsonStringify,
    delay,
    withTimeout,
    retry,
    debounce,
    throttle,
    memoize
};
