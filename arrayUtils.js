/**
 * 数组工具库
 * 提供丰富的数组操作函数
 */

/**
 * 生成一个指定范围的数组
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} step - 步长，默认为1
 * @returns {number[]}
 */
function range(start, end, step = 1) {
    const result = [];
    let current = start;
    if (step > 0) {
        while (current <= end) {
            result.push(current);
            current += step;
        }
    } else if (step < 0) {
        while (current >= end) {
            result.push(current);
            current += step;
        }
    }
    return result;
}

/**
 * 生成一个长度为n，每个元素都是value的数组
 * @param {number} n - 长度
 * @param {any} value - 填充值
 * @returns {any[]}
 */
function fill(n, value) {
    return new Array(n).fill(value);
}

/**
 * 生成一个长度为n，使用生成函数填充的数组
 * @param {number} n - 长度
 * @param {Function} generator - 生成函数，参数是索引
 * @returns {any[]}
 */
function generate(n, generator) {
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
        result[i] = generator(i);
    }
    return result;
}

/**
 * 随机打乱数组（Fisher-Yates洗牌算法）
 * @param {any[]} array - 输入数组
 * @returns {any[]} 打乱后的新数组
 */
function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 从数组中随机抽取一个元素
 * @param {any[]} array - 输入数组
 * @returns {any}
 */
function sample(array) {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 从数组中随机抽取n个元素
 * @param {any[]} array - 输入数组
 * @param {number} n - 抽取数量
 * @returns {any[]}
 */
function sampleSize(array, n) {
    return shuffle(array).slice(0, n);
}

/**
 * 获取数组的第一个元素
 * @param {any[]} array - 输入数组
 * @returns {any}
 */
function first(array) {
    return array[0];
}

/**
 * 获取数组的最后一个元素
 * @param {any[]} array - 输入数组
 * @returns {any}
 */
function last(array) {
    return array[array.length - 1];
}

/**
 * 获取数组除了第一个元素的部分
 * @param {any[]} array - 输入数组
 * @returns {any[]}
 */
function rest(array) {
    return array.slice(1);
}

/**
 * 获取数组除了最后一个元素的部分
 * @param {any[]} array - 输入数组
 * @returns {any[]}
 */
function initial(array) {
    return array.slice(0, -1);
}

/**
 * 获取数组从start开始的n个元素
 * @param {any[]} array - 输入数组
 * @param {number} n - 元素数量
 * @returns {any[]}
 */
function take(array, n) {
    return array.slice(0, n);
}

/**
 * 获取数组去掉前n个元素后的部分
 * @param {any[]} array - 输入数组
 * @param {number} n - 去掉的数量
 * @returns {any[]}
 */
function drop(array, n) {
    return array.slice(n);
}

/**
 * 获取数组满足条件的前n个元素
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {any[]}
 */
function takeWhile(array, predicate) {
    const result = [];
    for (const item of array) {
        if (predicate(item)) {
            result.push(item);
        } else {
            break;
        }
    }
    return result;
}

/**
 * 去掉数组开头满足条件的元素，返回剩余部分
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {any[]}
 */
function dropWhile(array, predicate) {
    let start = 0;
    while (start < array.length && predicate(array[start])) {
        start++;
    }
    return array.slice(start);
}

/**
 * 分组
 * @param {any[]} array - 输入数组
 * @param {Function|string} getter - 分组依据函数或属性名
 * @returns {Object} 分组结果，key是分组值，value是元素数组
 */
function groupBy(array, getter) {
    const result = {};
    for (const item of array) {
        let key;
        if (typeof getter === 'function') {
            key = getter(item);
        } else {
            key = item[getter];
        }
        if (key === undefined) key = 'undefined';
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }
    return result;
}

/**
 * 计数分组，每个分组只计数不保存元素
 * @param {any[]} array - 输入数组
 * @param {Function|string} getter - 分组依据
 * @returns {Object} 计数字典
 */
function countBy(array, getter) {
    const result = {};
    for (const item of array) {
        let key;
        if (typeof getter === 'function') {
            key = getter(item);
        } else {
            key = item[getter];
        }
        if (key === undefined) key = 'undefined';
        result[key] = (result[key] || 0) + 1;
    }
    return result;
}

/**
 * 键值对分组，生成每个key对应元素的某个属性数组
 * @param {any[]} array - 输入数组
 * @param {string} keyProp - 作为key的属性名
 * @param {string} valueProp - 作为value的属性名
 * @returns {Object}
 */
function groupProp(array, keyProp, valueProp) {
    const result = {};
    for (const item of array) {
        const key = item[keyProp];
        const value = item[valueProp];
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(value);
    }
    return result;
}

/**
 * 去重
 * @param {any[]} array - 输入数组
 * @returns {any[]} 去重后的数组
 */
function unique(array) {
    return [...new Set(array)];
}

/**
 * 按指定规则去重
 * @param {any[]} array - 输入数组
 * @param {Function} keyGetter - 生成key的函数
 * @returns {any[]}
 */
function uniqueBy(array, keyGetter) {
    const seen = new Set();
    const result = [];
    for (const item of array) {
        const key = keyGetter(item);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }
    return result;
}

/**
 * 求两个数组的交集
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {any[]}
 */
function intersection(a, b) {
    const setB = new Set(b);
    return a.filter(x => setB.has(x));
}

/**
 * 求两个数组的并集
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {any[]}
 */
function union(a, b) {
    return unique([...a, ...b]);
}

/**
 * 求a对b的差集，即a有b没有的元素
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {any[]}
 */
function difference(a, b) {
    const setB = new Set(b);
    return a.filter(x => !setB.has(x));
}

/**
 * 对称差，即只在一个数组中出现的元素
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {any[]}
 */
function symmetricDifference(a, b) {
    return difference(union(a, b), intersection(a, b));
}

/**
 * 判断数组是否包含某个元素
 * @param {any[]} array - 输入数组
 * @param {any} value - 要查找的值
 * @returns {boolean}
 */
function contains(array, value) {
    return array.includes(value);
}

/**
 * 判断数组是否全部满足条件
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {boolean}
 */
function every(array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (!predicate(array[i], i, array)) {
            return false;
        }
    }
    return true;
}

/**
 * 判断数组是否有一个满足条件
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {boolean}
 */
function some(array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i], i, array)) {
            return true;
        }
    }
    return false;
}

/**
 * 找到第一个满足条件的元素
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {any|undefined}
 */
function find(array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i], i, array)) {
            return array[i];
        }
    }
    return undefined;
}

/**
 * 找到第一个满足条件的元素索引
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {number} 找到返回索引，否则-1
 */
function findIndex(array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i], i, array)) {
            return i;
        }
    }
    return -1;
}

/**
 * 找到最后一个满足条件的元素
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {any|undefined}
 */
function findLast(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i], i, array)) {
            return array[i];
        }
    }
    return undefined;
}

/**
 * 找到最后一个满足条件的元素索引
 * @param {any[]} array - 输入数组
 * @param {Function} predicate - 判断函数
 * @returns {number}
 */
function findLastIndex(array, predicate) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i], i, array)) {
            return i;
        }
    }
    return -1;
}

/**
 * 二分查找，要求数组已排序
 * @param {number[]} array - 已排序的数组
 * @param {number} target - 目标值
 * @returns {number} 找到返回索引，否则-1
 */
function binarySearch(array, target) {
    let left = 0;
    let right = array.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (array[mid] === target) {
            return mid;
        } else if (array[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}

/**
 * 二分查找第一个大于等于target的位置
 * @param {number[]} array - 已排序数组
 * @param {number} target - 目标值
 * @returns {number}
 */
function lowerBound(array, target) {
    let left = 0;
    let right = array.length;
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (array[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

/**
 * 二分查找第一个大于target的位置
 * @param {number[]} array - 已排序数组
 * @param {number} target - 目标值
 * @returns {number}
 */
function upperBound(array, target) {
    let left = 0;
    let right = array.length;
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (array[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

/**
 * 冒泡排序
 * @param {number[]} array - 输入数组
 * @returns {number[]} 排序后的新数组
 */
function bubbleSort(array) {
    const result = [...array];
    const n = result.length;
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    return result;
}

/**
 * 选择排序
 * @param {number[]} array - 输入数组
 * @returns {number[]}
 */
function selectionSort(array) {
    const result = [...array];
    const n = result.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (result[j] < result[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx !== i) {
            [result[i], result[minIdx]] = [result[minIdx], result[i]];
        }
    }
    return result;
}

/**
 * 插入排序
 * @param {number[]} array - 输入数组
 * @returns {number[]}
 */
function insertionSort(array) {
    const result = [...array];
    const n = result.length;
    for (let i = 1; i < n; i++) {
        const key = result[i];
        let j = i - 1;
        while (j >= 0 && result[j] > key) {
            result[j + 1] = result[j];
            j--;
        }
        result[j + 1] = key;
    }
    return result;
}

/**
 * 快速排序
 * @param {number[]} array - 输入数组
 * @returns {number[]}
 */
function quickSort(array) {
    if (array.length <= 1) return [...array];
    const result = [...array];
    const pivot = result[Math.floor(Math.random() * result.length)];
    const left = [];
    const middle = [];
    const right = [];
    for (const num of result) {
        if (num < pivot) {
            left.push(num);
        } else if (num === pivot) {
            middle.push(num);
        } else {
            right.push(num);
        }
    }
    return [...quickSort(left), ...middle, ...quickSort(right)];
}

/**
 * 归并排序
 * @param {number[]} array - 输入数组
 * @returns {number[]}
 */
function mergeSort(array) {
    if (array.length <= 1) return [...array];
    const mid = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, mid));
    const right = mergeSort(array.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
}

/**
 * 数组求和
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function sum(array) {
    return array.reduce((acc, curr) => acc + curr, 0);
}

/**
 * 数组求平均值
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function mean(array) {
    if (array.length === 0) return 0;
    return sum(array) / array.length;
}

/**
 * 数组求中位数
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function median(array) {
    if (array.length === 0) return 0;
    const sorted = [...array].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
        return sorted[mid];
    } else {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
}

/**
 * 数组求众数
 * @param {any[]} array - 输入数组
 * @returns {any}
 */
function mode(array) {
    if (array.length === 0) return undefined;
    const counts = countBy(array, x => x);
    let maxCount = -1;
    let modeVal = undefined;
    for (const [key, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            modeVal = key;
        }
    }
    // 尝试转回原始类型
    if (!isNaN(Number(modeVal))) {
        return Number(modeVal);
    }
    return modeVal;
}

/**
 * 求方差
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function variance(array) {
    if (array.length <= 1) return 0;
    const m = mean(array);
    const squaredDiffs = array.map(x => (x - m) ** 2);
    return mean(squaredDiffs);
}

/**
 * 求标准差
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function standardDeviation(array) {
    return Math.sqrt(variance(array));
}

/**
 * 求最大值
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function max(array) {
    return Math.max(...array);
}

/**
 * 求最小值
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function min(array) {
    return Math.min(...array);
}

/**
 * 找到最大值的索引
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function maxIndex(array) {
    if (array.length === 0) return -1;
    let maxVal = array[0];
    let maxIdx = 0;
    for (let i = 1; i < array.length; i++) {
        if (array[i] > maxVal) {
            maxVal = array[i];
            maxIdx = i;
        }
    }
    return maxIdx;
}

/**
 * 找到最小值的索引
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function minIndex(array) {
    if (array.length === 0) return -1;
    let minVal = array[0];
    let minIdx = 0;
    for (let i = 1; i < array.length; i++) {
        if (array[i] < minVal) {
            minVal = array[i];
            minIdx = i;
        }
    }
    return minIdx;
}

/**
 * 极差，最大值减最小值
 * @param {number[]} array - 输入数组
 * @returns {number}
 */
function rangeOf(array) {
    return max(array) - min(array);
}

/**
 * 按指定键排序
 * @param {any[]} array - 输入数组
 * @param {string|Function} keyGetter - 排序键或获取键的函数
 * @param {boolean} ascending - 是否升序，默认为true
 * @returns {any[]}
 */
function sortBy(array, keyGetter, ascending = true) {
    const result = [...array];
    let getter;
    if (typeof keyGetter === 'string') {
        getter = item => item[keyGetter];
    } else {
        getter = keyGetter;
    }
    return result.sort((a, b) => {
        const valA = getter(a);
        const valB = getter(b);
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * 多个键排序，先按第一个，相同按第二个...
 * @param {any[]} array - 输入数组
 * @param {Array<string|Function>} getters - 排序键列表
 * @param {Array<boolean>} ascendingList - 是否升序列表
 * @returns {any[]}
 */
function sortByMultiple(array, getters, ascendingList = null) {
    const result = [...array];
    return result.sort((a, b) => {
        for (let i = 0; i < getters.length; i++) {
            const getter = getters[i];
            const ascending = ascendingList ? ascendingList[i] : true;
            let valA, valB;
            if (typeof getter === 'string') {
                valA = a[getter];
                valB = b[getter];
            } else {
                valA = getter(a);
                valB = getter(b);
            }
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
        }
        return 0;
    });
}

/**
 * 分块，将数组分成多个大小为size的块
 * @param {any[]} array - 输入数组
 * @param {number} size - 块大小
 * @returns {any[][]}
 */
function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * 展平数组一级
 * @param {any[]} array - 输入数组
 * @returns {any[]}
 */
function flatten(array) {
    return array.reduce((acc, curr) => acc.concat(curr), []);
}

/**
 * 深度展平数组
 * @param {any[]} array - 输入数组
 * @returns {any[]}
 */
function deepFlatten(array) {
    return array.reduce((acc, curr) => {
        if (Array.isArray(curr)) {
            return acc.concat(deepFlatten(curr));
        }
        return acc.concat(curr);
    }, []);
}

/**
 * 数组扁平化到指定深度
 * @param {any[]} array - 输入数组
 * @param {number} depth - 深度
 * @returns {any[]}
 */
function flattenDepth(array, depth = 1) {
    if (depth <= 0) return [...array];
    return array.reduce((acc, curr) => {
        if (Array.isArray(curr)) {
            return acc.concat(flattenDepth(curr, depth - 1));
        }
        return acc.concat(curr);
    }, []);
}

/**
 * 移除数组中的falsy值 (false, 0, '', null, undefined, NaN)
 * @param {any[]} array - 输入数组
 * @returns {any[]}
 */
function compact(array) {
    return array.filter(Boolean);
}

/**
 * 拼接所有数组
 * @param {any[]} arrays - 数组数组
 * @returns {any[]}
 */
function concat(arrays) {
    return arrays.reduce((acc, arr) => acc.concat(arr), []);
}

/**
 * 减去数组中指定位置的元素，返回新数组
 * @param {any[]} array - 输入数组
 * @param {number} start - 起始索引
 * @param {number} deleteCount - 删除数量
 * @returns {any[]}
 */
function without(array, start, deleteCount = 1) {
    const result = [...array];
    result.splice(start, deleteCount);
    return result;
}

/**
 * 移除数组中所有指定值
 * @param {any[]} array - 输入数组
 * @param {...any} values - 要移除的值
 * @returns {any[]}
 */
function withoutValues(array, ...values) {
    const toRemove = new Set(values);
    return array.filter(x => !toRemove.has(x));
}

/**
 * 拉链操作，将两个数组按位置配对
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {Array<Array>}
 */
function zip(a, b) {
    const result = [];
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
        result.push([a[i], b[i]]);
    }
    return result;
}

/**
 * 解拉链操作，将配对数组分开
 * @param {Array<Array>} zipped - 配对数组
 * @returns {Array<Array>} [数组1, 数组2]
 */
function unzip(zipped) {
    if (zipped.length === 0) return [[], []];
    const result = [new Array(zipped.length), new Array(zipped.length)];
    for (let i = 0; i < zipped.length; i++) {
        result[0][i] = zipped[i][0];
        result[1][i] = zipped[i][1];
    }
    return result;
}

/**
 * 多个数组按位置聚合
 * @param {Array<Array>} arrays - 多个数组
 * @returns {Array<Array>}
 */
function zipMultiple(arrays) {
    if (arrays.length === 0) return [];
    const minLen = Math.min(...arrays.map(a => a.length));
    const result = new Array(minLen);
    for (let i = 0; i < minLen; i++) {
        result[i] = arrays.map(a => a[i]);
    }
    return result;
}

/**
 * 滑动窗口，每个窗口是数组中连续k个元素
 * @param {any[]} array - 输入数组
 * @param {number} k - 窗口大小
 * @returns {any[][]}
 */
function slidingWindow(array, k) {
    const result = [];
    for (let i = 0; i <= array.length - k; i++) {
        result.push(array.slice(i, i + k));
    }
    return result;
}

/**
 * 累积操作，返回每次累积的结果数组
 * @param {any[]} array - 输入数组
 * @param {Function} accumulator - 累积函数 (acc, curr) => newAcc
 * @param {any} initial - 初始值
 * @returns {any[]}
 */
function scan(array, accumulator, initial) {
    const result = [];
    let acc = initial;
    for (const item of array) {
        acc = accumulator(acc, item);
        result.push(acc);
    }
    return result;
}

/**
 * 判断两个数组是否相等（元素级比较）
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {boolean}
 */
function equals(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * 深度判断两个数组是否相等
 * @param {any[]} a - 第一个数组
 * @param {any[]} b - 第二个数组
 * @returns {boolean}
 */
function deepEquals(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return a === b;
    }
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
}

/**
 * 数组转对象，用指定属性作为key
 * @param {any[]} array - 输入数组
 * @param {string} keyProp - 作为key的属性名
 * @returns {Object}
 */
function toObject(array, keyProp) {
    return array.reduce((obj, item) => {
        obj[item[keyProp]] = item;
        return obj;
    }, {});
}

/**
 * 对每个元素分组计数然后排序输出
 * @param {any[]} array - 输入数组
 * @param {Function|string} getter - 分组依据
 * @returns {Array} 按计数降序排列的 [{key, count}] 数组
 */
function frequency(array, getter) {
    const counts = countBy(array, getter);
    return Object.entries(counts)
        .map(([key, count]) => ({ key: key, count: count }))
        .sort((a, b) => b.count - a.count);
}

// 导出所有函数
const arrayUtils = {
    range,
    fill,
    generate,
    shuffle,
    sample,
    sampleSize,
    first,
    last,
    rest,
    initial,
    take,
    drop,
    takeWhile,
    dropWhile,
    groupBy,
    countBy,
    groupProp,
    unique,
    uniqueBy,
    intersection,
    union,
    difference,
    symmetricDifference,
    contains,
    every,
    some,
    find,
    findIndex,
    findLast,
    findLastIndex,
    binarySearch,
    lowerBound,
    upperBound,
    bubbleSort,
    selectionSort,
    insertionSort,
    quickSort,
    mergeSort,
    sum,
    mean,
    median,
    mode,
    variance,
    standardDeviation,
    max,
    min,
    maxIndex,
    minIndex,
    rangeOf,
    sortBy,
    sortByMultiple,
    chunk,
    flatten,
    deepFlatten,
    flattenDepth,
    compact,
    concat,
    without,
    withoutValues,
    zip,
    unzip,
    zipMultiple,
    slidingWindow,
    scan,
    equals,
    deepEquals,
    toObject,
    frequency
};

// 测试
function test() {
    console.log('Testing arrayUtils...');

    // 测试range
    console.log('range(1, 10):', range(1, 10));

    // 测试shuffle
    console.log('shuffle([1,2,3,4,5]):', shuffle([1, 2, 3, 4, 5]));

    // 测试分组
    const data = [
        { name: 'Alice', age: 25, city: 'Beijing' },
        { name: 'Bob', age: 30, city: 'Shanghai' },
        { name: 'Charlie', age: 25, city: 'Beijing' },
        { name: 'David', age: 30, city: 'Shanghai' }
    ];
    console.log('groupBy data by age:', groupBy(data, d => d.age));

    // 测试排序
    const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
    console.log('quickSort:', quickSort(unsorted));

    // 测试统计
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    console.log('sum:', sum(numbers));
    console.log('mean:', mean(numbers));
    console.log('median:', median(numbers));
    console.log('variance:', variance(numbers));
    console.log('std dev:', standardDeviation(numbers));

    // 测试chunk
    console.log('chunk([1,2,3,4,5,6], 2):', chunk([1, 2, 3, 4, 5, 6], 2));

    // 测试zip
    console.log('zip([1,2,3], [a,b,c]):', zip([1, 2, 3], ['a', 'b', 'c']));

    // 测试滑动窗口
    console.log('slidingWindow([1,2,3,4,5], 3):', slidingWindow([1, 2, 3, 4, 5], 3));

    console.log('All tests completed!');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = arrayUtils;
} else if (typeof window !== 'undefined') {
    window.arrayUtils = arrayUtils;
}
