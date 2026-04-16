"""
数据处理工具库
包含数据清洗、预处理、特征工程、统计分析等功能
"""

import math
import random
from typing import List, Dict, Any, Tuple, Optional, Union
from collections import Counter, defaultdict
import statistics
import copy

class DataProcessor:
    """数据处理主类"""

    def __init__(self):
        self.data: List[Dict[str, Any]] = []
        self.columns: List[str] = []
        self._cached_stats: Dict[str, Any] = {}

    def load_from_list_of_dicts(self, data: List[Dict[str, Any]]) -> None:
        """从字典列表加载数据"""
        self.data = data
        if data:
            self.columns = list(data[0].keys())
        else:
            self.columns = []
        self._cached_stats.clear()

    def add_row(self, row: Dict[str, Any]) -> None:
        """添加一行数据"""
        if not self.data:
            self.columns = list(row.keys())
        self.data.append(row)

    def get_shape(self) -> Tuple[int, int]:
        """获取数据形状 (行数, 列数)"""
        return len(self.data), len(self.columns)

    def head(self, n: int = 5) -> List[Dict[str, Any]]:
        """获取前n行数据"""
        return self.data[:n]

    def tail(self, n: int = 5) -> List[Dict[str, Any]]:
        """获取后n行数据"""
        return self.data[-n:]

    def sample(self, n: int) -> List[Dict[str, Any]]:
        """随机抽样n行"""
        if n >= len(self.data):
            return copy.deepcopy(self.data)
        return random.sample(self.data, n)

    # ========== 数据清洗 ==========

    def remove_nulls(self, column: Optional[str] = None) -> int:
        """删除包含空值的行，返回删除的行数"""
        original_len = len(self.data)
        if column:
            self.data = [row for row in self.data if row.get(column) is not None and row.get(column) != '']
        else:
            self.data = [
                row for row in self.data
                if all(v is not None and v != '' for v in row.values())
            ]
        self._cached_stats.clear()
        return original_len - len(self.data)

    def fill_nulls(self, column: str, value: Any) -> int:
        """填充指定列的空值，返回填充的数量"""
        filled_count = 0
        for row in self.data:
            if row.get(column) is None or row.get(column) == '':
                row[column] = value
                filled_count += 1
        self._cached_stats.clear()
        return filled_count

    def fill_nulls_with_mean(self, column: str) -> int:
        """用均值填充数值列的空值"""
        values = self.get_numeric_values(column)
        if not values:
            return 0
        mean_val = statistics.mean(values)
        return self.fill_nulls(column, mean_val)

    def fill_nulls_with_median(self, column: str) -> int:
        """用中位数填充数值列的空值"""
        values = self.get_numeric_values(column)
        if not values:
            return 0
        median_val = statistics.median(values)
        return self.fill_nulls(column, median_val)

    def fill_nulls_with_mode(self, column: str) -> int:
        """用众数填充列的空值"""
        values = [row[column] for row in self.data if column in row and row[column] is not None and row[column] != '']
        if not values:
            return 0
        counter = Counter(values)
        mode_val = counter.most_common(1)[0][0]
        return self.fill_nulls(column, mode_val)

    def remove_duplicates(self, subset: Optional[List[str]] = None) -> int:
        """删除重复行，返回删除的行数"""
        original_len = len(self.data)
        seen = set()
        new_data = []
        for row in self.data:
            if subset:
                key = tuple(row.get(col) for col in subset)
            else:
                key = tuple(row.items())
            if key not in seen:
                seen.add(key)
                new_data.append(row)
        self.data = new_data
        self._cached_stats.clear()
        return original_len - len(self.data)

    def filter_by_condition(self, column: str, condition) -> None:
        """根据条件过滤数据"""
        self.data = [row for row in self.data if condition(row.get(column))]
        self._cached_stats.clear()

    def filter_range(self, column: str, min_val: float, max_val: float) -> int:
        """过滤出数值在指定范围内的数据，返回剩余行数"""
        original_len = len(self.data)
        self.data = [
            row for row in self.data
            if column in row and
               isinstance(row[column], (int, float)) and
               min_val <= float(row[column]) <= max_val
        ]
        self._cached_stats.clear()
        return len(self.data)

    # ========== 类型转换 ==========

    def to_numeric(self, column: str) -> Tuple[int, int]:
        """将列转换为数值类型，返回(成功转换数, 失败数)"""
        success = 0
        fail = 0
        for row in self.data:
            if column in row and row[column] is not None and row[column] != '':
                try:
                    if isinstance(row[column], str):
                        row[column] = float(row[column])
                        if row[column].is_integer():
                            row[column] = int(row[column])
                    success += 1
                except ValueError:
                    fail += 1
            else:
                fail += 1
        self._cached_stats.clear()
        return success, fail

    def to_categorical(self, column: str) -> Dict[int, Any]:
        """将列转换为分类编码，返回编码映射"""
        unique_values = self.get_unique_values(column)
        mapping = {i: val for i, val in enumerate(unique_values)}
        reverse_mapping = {val: i for i, val in enumerate(unique_values)}
        for row in self.data:
            if column in row:
                val = row[column]
                row[column + '_encoded'] = reverse_mapping.get(val)
        self.columns.append(column + '_encoded')
        return mapping

    def one_hot_encode(self, column: str) -> List[str]:
        """独热编码，返回新生成的列名列表"""
        unique_values = self.get_unique_values(column)
        new_columns = []
        for val in unique_values:
            new_col = f"{column}_{val}"
            new_columns.append(new_col)
            for row in self.data:
                row[new_col] = 1 if row.get(column) == val else 0
        self.columns.extend(new_columns)
        return new_columns

    # ========== 特征缩放 ==========

    def min_max_scale(self, column: str) -> Tuple[float, float]:
        """最小最大缩放，返回(min, max)"""
        values = self.get_numeric_values(column)
        if not values:
            return 0, 0
        min_val = min(values)
        max_val = max(values)
        range_val = max_val - min_val

        if range_val == 0:
            for row in self.data:
                if column in row and isinstance(row[column], (int, float)):
                    row[column + '_scaled'] = 0.0
        else:
            for row in self.data:
                if column in row and isinstance(row[column], (int, float)):
                    row[column + '_scaled'] = (float(row[column]) - min_val) / range_val

        self.columns.append(column + '_scaled')
        self._cached_stats.clear()
        return min_val, max_val

    def standard_scale(self, column: str) -> Tuple[float, float]:
        """标准化缩放，返回(均值, 标准差)"""
        values = self.get_numeric_values(column)
        if not values:
            return 0, 0
        mean_val = statistics.mean(values)
        std_val = statistics.stdev(values) if len(values) > 1 else 1

        if std_val == 0:
            for row in self.data:
                if column in row and isinstance(row[column], (int, float)):
                    row[column + '_standard'] = 0.0
        else:
            for row in self.data:
                if column in row and isinstance(row[column], (int, float)):
                    row[column + '_standard'] = (float(row[column]) - mean_val) / std_val

        self.columns.append(column + '_standard')
        self._cached_stats.clear()
        return mean_val, std_val

    # ========== 统计分析 ==========

    def get_numeric_values(self, column: str) -> List[float]:
        """获取列的所有数值值"""
        values = []
        for row in self.data:
            val = row.get(column)
            if val is not None and val != '' and isinstance(val, (int, float)):
                values.append(float(val))
        return values

    def get_unique_values(self, column: str) -> List[Any]:
        """获取列的所有唯一值"""
        unique = set()
        for row in self.data:
            val = row.get(column)
            if val is not None:
                unique.add(val)
        return sorted(list(unique))

    def value_counts(self, column: str) -> Dict[Any, int]:
        """统计每个值出现的次数"""
        counts = Counter()
        for row in self.data:
            val = row.get(column)
            if val is not None:
                counts[val] += 1
        return dict(counts.most_common())

    def describe_column(self, column: str) -> Dict[str, float]:
        """描述列的统计信息"""
        if column in self._cached_stats:
            return self._cached_stats[column].copy()

        values = self.get_numeric_values(column)
        if not values:
            return {}

        stats = {
            'count': len(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values),
            'min': min(values),
            'max': max(values),
            'range': max(values) - min(values),
            'variance': statistics.variance(values) if len(values) > 1 else 0,
            'std_dev': statistics.stdev(values) if len(values) > 1 else 0,
        }

        # 计算四分位数
        sorted_vals = sorted(values)
        stats['q1'] = self._percentile(sorted_vals, 25)
        stats['q3'] = self._percentile(sorted_vals, 75)
        stats['iqr'] = stats['q3'] - stats['q1']

        self._cached_stats[column] = stats
        return stats.copy()

    def describe_all(self) -> Dict[str, Dict[str, float]]:
        """描述所有数值列的统计信息"""
        result = {}
        for column in self.columns:
            desc = self.describe_column(column)
            if desc:
                result[column] = desc
        return result

    def correlation(self, column1: str, column2: str) -> float:
        """计算两列的皮尔逊相关系数"""
        vals1 = self.get_numeric_values(column1)
        vals2 = self.get_numeric_values(column2)

        # 只保留两个都有效的值
        paired = [(v1, v2) for v1, v2 in zip(vals1, vals2) if v1 is not None and v2 is not None]
        if len(paired) < 2:
            return 0.0

        n = len(paired)
        mean1 = sum(v1 for v1, _ in paired) / n
        mean2 = sum(v2 for _, v2 in paired) / n

        numerator = sum((v1 - mean1) * (v2 - mean2) for v1, v2 in paired)
        denom1 = sum((v1 - mean1) ** 2 for v1, v2 in paired)
        denom2 = sum((v2 - mean2) ** 2 for v2, _ in paired)

        if denom1 == 0 or denom2 == 0:
            return 0.0

        return numerator / math.sqrt(denom1 * denom2)

    def covariance(self, column1: str, column2: str) -> float:
        """计算协方差"""
        vals1 = self.get_numeric_values(column1)
        vals2 = self.get_numeric_values(column2)

        paired = [(v1, v2) for v1, v2 in zip(vals1, vals2) if v1 is not None and v2 is not None]
        if len(paired) < 2:
            return 0.0

        n = len(paired)
        mean1 = sum(v1 for v1, _ in paired) / n
        mean2 = sum(v2 for _, v2 in paired) / n

        return sum((v1 - mean1) * (v2 - mean2) for v1, v2 in paired) / (n - 1)

    def correlation_matrix(self) -> Dict[str, Dict[str, float]]:
        """计算所有数值列的相关矩阵"""
        numeric_cols = [col for col in self.columns if self.describe_column(col)]
        matrix = {}
        for col1 in numeric_cols:
            matrix[col1] = {}
            for col2 in numeric_cols:
                matrix[col1][col2] = self.correlation(col1, col2)
        return matrix

    # ========== 分箱 ==========

    def equal_width_binning(self, column: str, n_bins: int) -> Dict[int, Tuple[float, float]]:
        """等宽分箱"""
        values = self.get_numeric_values(column)
        if not values:
            return {}

        min_val = min(values)
        max_val = max(values)
        bin_width = (max_val - min_val) / n_bins

        bins = {}
        for i in range(n_bins):
            start = min_val + i * bin_width
            end = min_val + (i + 1) * bin_width
            bins[i] = (start, end)

        for row in self.data:
            if column in row and isinstance(row[column], (int, float)):
                val = float(row[column])
                bin_idx = min(int((val - min_val) / bin_width), n_bins - 1)
                row[f"{column}_bin"] = bin_idx

        self.columns.append(f"{column}_bin")
        return bins

    def equal_freq_binning(self, column: str, n_bins: int) -> List[float]:
        """等频分箱"""
        values = sorted(self.get_numeric_values(column))
        if not values:
            return []

        bin_size = len(values) // n_bins
        breakpoints = [values[0]]

        for i in range(1, n_bins):
            idx = i * bin_size
            if idx < len(values):
                breakpoints.append(values[idx])
        breakpoints.append(values[-1])

        for row in self.data:
            if column in row and isinstance(row[column], (int, float)):
                val = float(row[column])
                bin_idx = 0
                for i, bp in enumerate(breakpoints[1:], 1):
                    if val > bp:
                        bin_idx = i
                    else:
                        break
                row[f"{column}_bin"] = min(bin_idx, n_bins - 1)

        self.columns.append(f"{column}_bin")
        return breakpoints

    # ========== 特征选择 ==========

    def remove_outliers_iqr(self, column: str) -> int:
        """使用IQR方法移除异常值，返回移除的行数"""
        stats = self.describe_column(column)
        if not stats:
            return 0

        q1 = stats['q1']
        q3 = stats['q3']
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        original_len = len(self.data)
        self.data = [
            row for row in self.data
            if not (column in row and isinstance(row[column], (int, float)) and
                   (float(row[column]) < lower_bound or float(row[column]) > upper_bound))
        ]
        self._cached_stats.clear()
        return original_len - len(self.data)

    def select_columns(self, columns: List[str]) -> None:
        """只保留指定列"""
        self.data = [
            {col: row.get(col) for col in columns}
            for row in self.data
        ]
        self.columns = columns.copy()
        self._cached_stats.clear()

    def drop_columns(self, columns: List[str]) -> None:
        """删除指定列"""
        keep_columns = [col for col in self.columns if col not in columns]
        self.select_columns(keep_columns)

    # ========== 数据拆分 ==========

    def train_test_split(self, target_column: str, test_size: float = 0.2,
                        random_state: Optional[int] = None) -> Tuple:
        """拆分训练测试集"""
        if random_state is not None:
            random.seed(random_state)

        all_data = copy.deepcopy(self.data)
        n_total = len(all_data)
        n_test = int(n_total * test_size)

        # 打乱顺序
        shuffled = all_data.copy()
        random.shuffle(shuffled)

        test_data = shuffled[:n_test]
        train_data = shuffled[n_test:]

        X_train = [{k: v for k, v in row.items() if k != target_column} for row in train_data]
        y_train = [row[target_column] for row in train_data]
        X_test = [{k: v for k, v in row.items() if k != target_column} for row in test_data]
        y_test = [row[target_column] for row in test_data]

        return X_train, X_test, y_train, y_test

    def k_fold_cross_validation(self, k: int = 5, random_state: Optional[int] = None) -> List[Tuple[List[int], List[int]]]:
        """生成k折交叉验证的索引"""
        if random_state is not None:
            random.seed(random_state)

        n_samples = len(self.data)
        indices = list(range(n_samples))
        random.shuffle(indices)

        fold_size = n_samples // k
        folds = []

        for i in range(k):
            start = i * fold_size
            end = start + fold_size if i < k - 1 else n_samples
            test_indices = indices[start:end]
            train_indices = indices[:start] + indices[end:]
            folds.append((train_indices, test_indices))

        return folds

    # ========== 归一化处理 ==========

    def normalize_text(self, text: str) -> str:
        """归一化文本"""
        # 转为小写
        text = text.lower()
        # 移除多余空格
        words = text.split()
        return ' '.join(words)

    def tokenize(self, text: str) -> List[str]:
        """分词"""
        text = self.normalize_text(text)
        # 简单按空格分词
        return text.split()

    def count_vectorize(self, text_column: str, max_features: Optional[int] = None) -> Dict[str, int]:
        """词袋模型向量化"""
        # 统计所有词频
        word_counts = Counter()
        for row in self.data:
            text = row.get(text_column, '')
            if isinstance(text, str):
                tokens = self.tokenize(text)
                word_counts.update(tokens)

        # 按频率排序，选择top N
        if max_features and len(word_counts) > max_features:
            most_common = word_counts.most_common(max_features)
            vocabulary = {word: idx for idx, (word, _) in enumerate(most_common)}
        else:
            vocabulary = {word: idx for idx, word in enumerate(sorted(word_counts.keys()))}

        # 为每个样本创建词频向量
        for row in self.data:
            text = row.get(text_column, '')
            if isinstance(text, str):
                tokens = self.tokenize(text)
                counts = Counter(tokens)
                for word, idx in vocabulary.items():
                    row[f"{text_column}_word_{idx}"] = counts.get(word, 0)

        # 添加新列
        for word, idx in vocabulary.items():
            self.columns.append(f"{text_column}_word_{idx}")

        self._cached_stats.clear()
        return vocabulary

    def tfidf_vectorize(self, text_column: str, max_features: Optional[int] = None) -> Dict[str, float]:
        """TF-IDF向量化"""
        # 先建立词汇表
        word_counts = Counter()
        doc_count = defaultdict(int)
        n_docs = len(self.data)

        # 统计词频和文档频率
        for row in self.data:
            text = row.get(text_column, '')
            if isinstance(text, str):
                tokens = set(self.tokenize(text))
                for token in tokens:
                    doc_count[token] += 1

        # 再次统计每个文档的词频
        vocabulary = sorted(list(doc_count.keys()))
        if max_features and len(vocabulary) > max_features:
            # 按文档频率排序，保留最高频的
            vocabulary.sort(key=lambda w: -doc_count[w])
            vocabulary = vocabulary[:max_features]

        vocabulary = {word: idx for idx, word in enumerate(vocabulary)}

        # 计算TF-IDF
        idf = {}
        for word, idx in vocabulary.items():
            df = doc_count[word]
            idf[word] = math.log(n_docs / (1 + df))

        for row in self.data:
            text = row.get(text_column, '')
            if isinstance(text, str):
                tokens = self.tokenize(text)
                counts = Counter(tokens)
                total_tokens = len(tokens)
                for word, idx in vocabulary.items():
                    tf = counts.get(word, 0) / total_tokens if total_tokens > 0 else 0
                    row[f"{text_column}_tfidf_{idx}"] = tf * idf[word]

        # 添加新列
        for word, idx in vocabulary.items():
            self.columns.append(f"{text_column}_tfidf_{idx}")

        self._cached_stats.clear()
        return idf

    # ========== 内部辅助方法 ==========

    def _percentile(self, sorted_vals: List[float], percentile: float) -> float:
        """计算百分位数"""
        n = len(sorted_vals)
        if n == 0:
            return 0.0
        if n == 1:
            return sorted_vals[0]

        index = (n - 1) * percentile / 100
        floor = int(math.floor(index))
        ceil = int(math.ceil(index))

        if floor == ceil:
            return sorted_vals[index]

        weight = index - floor
        return sorted_vals[floor] * (1 - weight) + sorted_vals[ceil] * weight

    # ========== 输出方法 ==========

    def to_list_of_dicts(self) -> List[Dict[str, Any]]:
        """转换为字典列表"""
        return copy.deepcopy(self.data)

    def to_lists(self) -> Tuple[List[str], List[List[Any]]]:
        """转换为列名和二维列表"""
        rows = []
        for row in self.data:
            rows.append([row.get(col) for col in self.columns])
        return self.columns.copy(), rows


class Normalizer:
    """归一化工具类"""

    @staticmethod
    def min_max(values: List[float]) -> List[float]:
        """最小最大归一化到[0,1]"""
        if not values:
            return []
        min_val = min(values)
        max_val = max(values)
        range_val = max_val - min_val
        if range_val == 0:
            return [0.0 for _ in values]
        return [(v - min_val) / range_val for v in values]

    @staticmethod
    def z_score(values: List[float]) -> List[float]:
        """z-score标准化"""
        if not values:
            return []
        mean_val = statistics.mean(values)
        if len(values) == 1:
            return [0.0]
        std_val = statistics.stdev(values)
        if std_val == 0:
            return [0.0 for _ in values]
        return [(v - mean_val) / std_val for v in values]

    @staticmethod
    def l1_normalize(values: List[float]) -> List[float]:
        """L1归一化"""
        total = sum(abs(v) for v in values)
        if total == 0:
            return [0.0 for _ in values]
        return [abs(v) / total for v in values]

    @staticmethod
    def l2_normalize(values: List[float]) -> List[float]:
        """L2归一化"""
        norm = math.sqrt(sum(v * v for v in values))
        if norm == 0:
            return [0.0 for _ in values]
        return [v / norm for v in values]


class Imputer:
    """缺失值填充工具"""

    def __init__(self, strategy: str = 'mean'):
        self.strategy = strategy
        self.fill_value: Optional[Any] = None
        self.fitted = False

    def fit(self, values: List[Optional[Union[int, float]]]) -> None:
        """拟合填充值"""
        valid_values = [v for v in values if v is not None and v != '']
        if not valid_values:
            self.fill_value = None
            self.fitted = True
            return

        if self.strategy == 'mean':
            self.fill_value = statistics.mean(valid_values)
        elif self.strategy == 'median':
            self.fill_value = statistics.median(valid_values)
        elif self.strategy == 'mode':
            counter = Counter(valid_values)
            self.fill_value = counter.most_common(1)[0][0]
        elif self.strategy == 'constant':
            self.fill_value = 0
        self.fitted = True

    def transform(self, values: List[Optional[Union[int, float]]]) -> List[Optional[Union[int, float]]]:
        """填充缺失值"""
        if not self.fitted:
            raise ValueError("Imputer not fitted")

        return [v if v is not None and v != '' else self.fill_value for v in values]

    def fit_transform(self, values: List[Optional[Union[int, float]]]) -> List[Optional[Union[int, float]]]:
        """拟合并转换"""
        self.fit(values)
        return self.transform(values)


def generate_sample_data(n_samples: int) -> List[Dict[str, Any]]:
    """生成样本数据"""
    data = []
    categories = ['A', 'B', 'C']
    for i in range(n_samples):
        row = {
            'id': i + 1,
            'numeric1': random.uniform(0, 100),
            'numeric2': random.normal(50, 10),
            'category': random.choice(categories),
            'label': random.randint(0, 1),
        }
        # 随机引入一些缺失值
        if random.random() < 0.1:
            row['numeric1'] = None
        if random.random() < 0.05:
            row['category'] = None
        data.append(row)
    return data


def main():
    """示例用法"""
    print("Data Processing Demo")
    print("=" * 50)

    # 生成样本数据
    dp = DataProcessor()
    sample_data = generate_sample_data(100)
    dp.load_from_list_of_dicts(sample_data)

    print(f"Original shape: {dp.get_shape()}")
    print("\nFirst 5 rows:")
    for row in dp.head(5):
        print(row)

    # 数据清洗
    print("\n" + "=" * 50)
    removed = dp.remove_nulls()
    print(f"Removed {removed} rows with nulls")
    print(f"Shape after removing nulls: {dp.get_shape()}")

    # 统计信息
    print("\n" + "=" * 50)
    print("Descriptive statistics for numeric1:")
    stats = dp.describe_column('numeric1')
    for key, value in stats.items():
        print(f"  {key}: {value:.4f}")

    # 相关性
    print("\nCorrelation between numeric1 and numeric2:")
    corr = dp.correlation('numeric1', 'numeric2')
    print(f"  {corr:.4f}")

    # 编码分类变量
    print("\n" + "=" * 50)
    print("One-hot encoding category column:")
    new_cols = dp.one_hot_encode('category')
    print(f"  New columns created: {new_cols}")

    # 特征缩放
    print("\nFeature scaling:")
    min_val, max_val = dp.min_max_scale('numeric1')
    print(f"  min_max_scale for numeric1: min={min_val:.2f}, max={max_val:.2f}")

    mean, std = dp.standard_scale('numeric2')
    print(f"  standard_scale for numeric2: mean={mean:.2f}, std={std:.2f}")

    # 值计数
    print("\nValue counts for label:")
    counts = dp.value_counts('label')
    for val, cnt in counts.items():
        print(f"  {val}: {cnt}")

    # 分箱
    print("\n" + "=" * 50)
    print("Equal width binning on numeric1 (5 bins):")
    bins = dp.equal_width_binning('numeric1', 5)
    for bin_idx, (start, end) in bins.items():
        print(f"  Bin {bin_idx}: [{start:.2f}, {end:.2f})")

    # 拆分训练测试
    print("\n" + "=" * 50)
    X_train, X_test, y_train, y_test = dp.train_test_split('label', test_size=0.2, random_state=42)
    print(f"Train set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")

    print("\n" + "=" * 50)
    print("Processing complete!")
    print(f"Final shape: {dp.get_shape()}")
    print(f"Final columns: {dp.columns}")


if __name__ == "__main__":
    main()
