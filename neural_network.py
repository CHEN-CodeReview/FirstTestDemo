"""
简单的神经网络实现
包含全连接层、激活函数、损失函数、优化器
支持前向传播和反向传播
"""

import math
import random
from typing import List, Tuple, Optional, Callable, Union
import numpy as np


class Activation:
    """激活函数集合"""

    @staticmethod
    def sigmoid(x: np.ndarray) -> np.ndarray:
        """Sigmoid激活函数"""
        return 1 / (1 + np.exp(-x))

    @staticmethod
    def sigmoid_derivative(x: np.ndarray) -> np.ndarray:
        """Sigmoid导数"""
        s = Activation.sigmoid(x)
        return s * (1 - s)

    @staticmethod
    def relu(x: np.ndarray) -> np.ndarray:
        """ReLU激活函数"""
        return np.maximum(0, x)

    @staticmethod
    def relu_derivative(x: np.ndarray) -> np.ndarray:
        """ReLU导数"""
        return (x > 0).astype(float)

    @staticmethod
    def tanh(x: np.ndarray) -> np.ndarray:
        """Tanh激活函数"""
        return np.tanh(x)

    @staticmethod
    def tanh_derivative(x: np.ndarray) -> np.ndarray:
        """Tanh导数"""
        t = np.tanh(x)
        return 1 - t ** 2

    @staticmethod
    def leaky_relu(x: np.ndarray, alpha: float = 0.01) -> np.ndarray:
        """Leaky ReLU激活函数"""
        return np.where(x > 0, x, alpha * x)

    @staticmethod
    def leaky_relu_derivative(x: np.ndarray, alpha: float = 0.01) -> np.ndarray:
        """Leaky ReLU导数"""
        return np.where(x > 0, 1.0, alpha)

    @staticmethod
    def softmax(x: np.ndarray) -> np.ndarray:
        """Softmax激活函数（用于输出层）"""
        # 减去最大值防止溢出
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_x / np.sum(exp_x, axis=1, keepdims=True)

    @staticmethod
    def get_activation(name: str) -> Tuple[Callable, Callable]:
        """根据名称获取激活函数和导数"""
        activations = {
            'sigmoid': (Activation.sigmoid, Activation.sigmoid_derivative),
            'relu': (Activation.relu, Activation.relu_derivative),
            'tanh': (Activation.tanh, Activation.tanh_derivative),
            'leaky_relu': (Activation.leaky_relu, Activation.leaky_relu_derivative),
            'softmax': (Activation.softmax, None),
            'none': (lambda x: x, lambda x: np.ones_like(x)),
        }
        return activations[name.lower()]


class Loss:
    """损失函数集合"""

    @staticmethod
    def mse(y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """均方误差"""
        return np.mean((y_pred - y_true) ** 2) / 2

    @staticmethod
    def mse_derivative(y_pred: np.ndarray, y_true: np.ndarray) -> np.ndarray:
        """均方误差导数"""
        return (y_pred - y_true) / y_pred.shape[0]

    @staticmethod
    def cross_entropy(y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """交叉熵损失（用于分类）"""
        # 添加小epsilon防止log(0)
        epsilon = 1e-10
        return -np.mean(y_true * np.log(y_pred + epsilon))

    @staticmethod
    def cross_entropy_softmax_derivative(y_pred: np.ndarray, y_true: np.ndarray) -> np.ndarray:
        """交叉熵 + softmax的组合导数（简化计算）"""
        return y_pred - y_true

    @staticmethod
    def binary_cross_entropy(y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """二元交叉熵"""
        epsilon = 1e-10
        return -np.mean(y_true * np.log(y_pred + epsilon) + (1 - y_true) * np.log(1 - y_pred + epsilon))

    @staticmethod
    def binary_cross_entropy_derivative(y_pred: np.ndarray, y_true: np.ndarray) -> np.ndarray:
        """二元交叉熵导数"""
        epsilon = 1e-10
        return ((y_pred - y_true) / ((y_pred + epsilon) * (1 - y_pred + epsilon))) / y_pred.shape[0]

    @staticmethod
    def get_loss(name: str) -> Tuple[Callable, Callable]:
        """根据名称获取损失函数和导数"""
        losses = {
            'mse': (Loss.mse, Loss.mse_derivative),
            'cross_entropy': (Loss.cross_entropy, Loss.cross_entropy_softmax_derivative),
            'binary_cross_entropy': (Loss.binary_cross_entropy, Loss.binary_cross_entropy_derivative),
        }
        return losses[name.lower()]


class Optimizer:
    """优化器基类"""

    def update(self, learning_rate: float, gradients: List[np.ndarray], weights: List[np.ndarray],
               biases: List[np.ndarray]) -> None:
        """更新权重和偏置"""
        raise NotImplementedError


class SGD(Optimizer):
    """随机梯度下降"""

    def __init__(self, momentum: float = 0.0):
        self.momentum = momentum
        self.velocity_w: List[np.ndarray] = []
        self.velocity_b: List[np.ndarray] = []
        self.initialized = False

    def update(self, learning_rate: float, gradients: List[np.ndarray], weights: List[np.ndarray],
               biases: List[np.ndarray]) -> None:
        if not self.initialized:
            self.velocity_w = [np.zeros_like(w) for w in weights]
            self.velocity_b = [np.zeros_like(b) for b in biases]
            self.initialized = True

        for i in range(len(weights)):
            self.velocity_w[i] = self.momentum * self.velocity_w[i] - learning_rate * gradients[2 * i]
            self.velocity_b[i] = self.momentum * self.velocity_b[i] - learning_rate * gradients[2 * i + 1]
            weights[i] += self.velocity_w[i]
            biases[i] += self.velocity_b[i]


class Adam(Optimizer):
    """Adam优化器"""

    def __init__(self, beta1: float = 0.9, beta2: float = 0.999, epsilon: float = 1e-8):
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m_w: List[np.ndarray] = []
        self.v_w: List[np.ndarray] = []
        self.m_b: List[np.ndarray] = []
        self.v_b: List[np.ndarray] = []
        self.t = 0
        self.initialized = False

    def update(self, learning_rate: float, gradients: List[np.ndarray], weights: List[np.ndarray],
               biases: List[np.ndarray]) -> None:
        if not self.initialized:
            self.m_w = [np.zeros_like(w) for w in weights]
            self.v_w = [np.zeros_like(w) for w in weights]
            self.m_b = [np.zeros_like(b) for b in biases]
            self.v_b = [np.zeros_like(b) for b in biases]
            self.initialized = True

        self.t += 1

        for i in range(len(weights)):
            grad_w = gradients[2 * i]
            grad_b = gradients[2 * i + 1]

            # 更新一阶矩估计
            self.m_w[i] = self.beta1 * self.m_w[i] + (1 - self.beta1) * grad_w
            self.m_b[i] = self.beta1 * self.m_b[i] + (1 - self.beta1) * grad_b

            # 更新二阶矩估计
            self.v_w[i] = self.beta2 * self.v_w[i] + (1 - self.beta2) * (grad_w ** 2)
            self.v_b[i] = self.beta2 * self.v_b[i] + (1 - self.beta2) * (grad_b ** 2)

            # 偏差修正
            m_w_hat = self.m_w[i] / (1 - self.beta1 ** self.t)
            m_b_hat = self.m_b[i] / (1 - self.beta1 ** self.t)
            v_w_hat = self.v_w[i] / (1 - self.beta2 ** self.t)
            v_b_hat = self.v_b[i] / (1 - self.beta2 ** self.t)

            # 更新参数
            weights[i] -= learning_rate * m_w_hat / (np.sqrt(v_w_hat) + self.epsilon)
            biases[i] -= learning_rate * m_b_hat / (np.sqrt(v_b_hat) + self.epsilon)


class Layer:
    """神经网络层基类"""

    def __init__(self, input_size: int, output_size: int, activation: str = 'relu'):
        self.input_size = input_size
        self.output_size = output_size
        self.activation_name = activation
        self.activation, self.activation_derivative = Activation.get_activation(activation)

        # 权重和偏置
        self.weights: Optional[np.ndarray] = None
        self.biases: Optional[np.ndarray] = None

        # 缓存用于反向传播
        self.input: Optional[np.ndarray] = None
        self.z: Optional[np.ndarray] = None  # 激活前的线性输出
        self.output: Optional[np.ndarray] = None

    def initialize(self, weight_init: str = 'xavier') -> None:
        """初始化权重"""
        if weight_init == 'xavier':
            # Xavier初始化
            scale = math.sqrt(2.0 / (self.input_size + self.output_size))
        elif weight_init == 'he':
            # He初始化（适合ReLU）
            scale = math.sqrt(2.0 / self.input_size)
        else:
            scale = 0.01

        self.weights = np.random.randn(self.input_size, self.output_size) * scale
        self.biases = np.zeros((1, self.output_size))

    def forward(self, x: np.ndarray) -> np.ndarray:
        """前向传播"""
        self.input = x
        self.z = np.dot(x, self.weights) + self.biases
        self.output = self.activation(self.z)
        return self.output

    def backward(self, delta: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """反向传播
        delta: 来自上层的梯度 (batch_size, output_size)
        返回: (dw, db, delta_prev)
        """
        batch_size = self.input.shape[0]

        if self.activation_derivative is not None:
            delta = delta * self.activation_derivative(self.z)

        dw = np.dot(self.input.T, delta)
        db = np.sum(delta, axis=0, keepdims=True)
        delta_prev = np.dot(delta, self.weights.T)

        return dw, db, delta_prev


class DropoutLayer(Layer):
    """Dropout层"""

    def __init__(self, dropout_rate: float = 0.5):
        # dropout层不改变维度
        super().__init__(input_size=0, output_size=0)
        self.dropout_rate = dropout_rate
        self.mask: Optional[np.ndarray] = None
        self.training = True

    def forward(self, x: np.ndarray) -> np.ndarray:
        self.input = x
        if self.training:
            # 训练阶段：随机失活，缩放输出
            self.mask = (np.random.rand(*x.shape) > self.dropout_rate) / (1 - self.dropout_rate)
            self.output = x * self.mask
        else:
            # 预测阶段：不做改变
            self.output = x
        return self.output

    def backward(self, delta: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        # dropout没有参数，直接传递梯度
        delta_prev = delta * self.mask
        # 返回空梯度，因为没有可训练参数
        return np.zeros((0, 0)), np.zeros((0, 0)), delta_prev


class BatchNormalizationLayer(Layer):
    """批归一化层"""

    def __init__(self, num_features: int, epsilon: float = 1e-5, momentum: float = 0.9):
        super().__init__(input_size=num_features, output_size=num_features)
        self.num_features = num_features
        self.epsilon = epsilon
        self.momentum = momentum

        self.gamma: Optional[np.ndarray] = None
        self.beta: Optional[np.ndarray] = None
        self.running_mean: Optional[np.ndarray] = None
        self.running_var: Optional[np.ndarray] = None
        self.training = True

        self.x_normalized: Optional[np.ndarray] = None
        self.mean: Optional[np.ndarray] = None
        self.var: Optional[np.ndarray] = None

    def initialize(self, weight_init: str = 'xavier') -> None:
        self.gamma = np.ones((1, self.num_features))
        self.beta = np.zeros((1, self.num_features))
        self.running_mean = np.zeros((1, self.num_features))
        self.running_var = np.ones((1, self.num_features))

    def forward(self, x: np.ndarray) -> np.ndarray:
        self.input = x
        if self.training:
            self.mean = np.mean(x, axis=0, keepdims=True)
            self.var = np.var(x, axis=0, keepdims=True)
            self.x_normalized = (x - self.mean) / np.sqrt(self.var + self.epsilon)
            self.output = self.gamma * self.x_normalized + self.beta

            # 更新运行统计量
            self.running_mean = self.momentum * self.running_mean + (1 - self.momentum) * self.mean
            self.running_var = self.momentum * self.running_var + (1 - self.momentum) * self.var
        else:
            self.x_normalized = (x - self.running_mean) / np.sqrt(self.running_var + self.epsilon)
            self.output = self.gamma * self.x_normalized + self.beta
        return self.output

    def backward(self, delta: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        batch_size = delta.shape[0]
        dgamma = np.sum(delta * self.x_normalized, axis=0, keepdims=True)
        dbeta = np.sum(delta, axis=0, keepdims=True)

        dx_normalized = delta * self.gamma
        ivar = 1.0 / np.sqrt(self.var + self.epsilon)
        dvar = np.sum(dx_normalized * (self.input - self.mean) * -0.5 * (self.var + self.epsilon) ** (-1.5),
                      axis=0, keepdims=True)
        dmean = np.sum(-dx_normalized * ivar, axis=0, keepdims=True) + dvar * np.mean(-2 * (self.input - self.mean),
                                                                                      axis=0, keepdims=True)
        delta_prev = dx_normalized * ivar + dvar * 2 * (self.input - self.mean) / batch_size + dmean / batch_size

        return dgamma, dbeta, delta_prev


class NeuralNetwork:
    """简单的前馈神经网络"""

    def __init__(self, loss_name: str = 'mse', weight_init: str = 'xavier'):
        self.layers: List[Layer] = []
        self.weight_init = weight_init
        self.loss_func, self.loss_derivative = Loss.get_loss(loss_name)
        self.loss_name = loss_name
        self.initialized = False

    def add_layer(self, layer: Layer) -> None:
        """添加层"""
        self.layers.append(layer)

    def initialize(self) -> None:
        """初始化所有层的权重"""
        for layer in self.layers:
            if hasattr(layer, 'initialize'):
                layer.initialize(self.weight_init)
        self.initialized = True

    def forward(self, x: np.ndarray, training: bool = True) -> np.ndarray:
        """前向传播"""
        current = x
        for layer in self.layers:
            if hasattr(layer, 'training'):
                layer.training = training
            current = layer.forward(current)
        return current

    def backward(self, y_pred: np.ndarray, y_true: np.ndarray) -> List[np.ndarray]:
        """反向传播，收集所有梯度"""
        gradients = []
        delta = self.loss_derivative(y_pred, y_true)

        for layer in reversed(self.layers):
            if isinstance(layer, DropoutLayer):
                _, _, delta = layer.backward(delta)
            elif isinstance(layer, BatchNormalizationLayer):
                dgamma, dbeta, delta = layer.backward(delta)
                if dgamma.size > 0:
                    gradients.append(dgamma)
                    gradients.append(dbeta)
            else:
                dw, db, delta = layer.backward(delta)
                if dw.size > 0:  # 只添加有参数的梯度
                    gradients.append(dw)
                    gradients.append(db)

        # 反转梯度，使其和参数顺序一致
        gradients.reverse()
        return gradients

    def get_weights_and_biases(self) -> Tuple[List[np.ndarray], List[np.ndarray]]:
        """获取所有可训练参数"""
        weights = []
        biases = []
        for layer in self.layers:
            if isinstance(layer, BatchNormalizationLayer):
                if layer.gamma is not None:
                    weights.append(layer.gamma)
                    biases.append(layer.beta)
            elif isinstance(layer, Layer) and layer.weights is not None:
                weights.append(layer.weights)
                biases.append(layer.biases)
        return weights, biases

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int, learning_rate: float,
            batch_size: int = 32, optimizer: Optional[Optimizer] = None,
            verbose: bool = True) -> List[float]:
        """训练模型"""
        if not self.initialized:
            self.initialize()

        if optimizer is None:
            optimizer = SGD()

        n_samples = X.shape[0]
        loss_history = []

        for epoch in range(epochs):
            # 打乱数据
            indices = np.random.permutation(n_samples)
            X_shuffled = X[indices]
            y_shuffled = y[indices]

            total_loss = 0.0
            n_batches = 0

            for start in range(0, n_samples, batch_size):
                end = min(start + batch_size, n_samples)
                X_batch = X_shuffled[start:end]
                y_batch = y_shuffled[start:end]

                # 前向传播
                y_pred = self.forward(X_batch, training=True)

                # 计算损失
                loss = self.loss_func(y_pred, y_batch)
                total_loss += loss
                n_batches += 1

                # 反向传播
                gradients = self.backward(y_pred, y_batch)

                # 更新参数
                weights, biases = self.get_weights_and_biases()
                optimizer.update(learning_rate, gradients, weights, biases)

            avg_loss = total_loss / n_batches
            loss_history.append(avg_loss)

            if verbose and (epoch + 1) % (epochs // 10 if epochs >= 10 else 1) == 0:
                print(f"Epoch {epoch + 1}/{epochs}, Loss: {avg_loss:.6f}")

        return loss_history

    def predict(self, X: np.ndarray) -> np.ndarray:
        """预测"""
        return self.forward(X, training=False)

    def evaluate(self, X: np.ndarray, y: np.ndarray) -> float:
        """评估损失"""
        y_pred = self.predict(X)
        return self.loss_func(y_pred, y)

    def accuracy(self, X: np.ndarray, y: np.ndarray) -> float:
        """计算分类准确率（假设y是one-hot编码）"""
        y_pred = self.predict(X)
        y_pred_classes = np.argmax(y_pred, axis=1)
        y_true_classes = np.argmax(y, axis=1)
        return np.mean(y_pred_classes == y_true_classes)


def create_mlp(input_size: int, hidden_sizes: List[int], output_size: int,
               hidden_activation: str = 'relu', output_activation: str = 'softmax',
               loss: str = 'cross_entropy', use_dropout: bool = False,
               dropout_rate: float = 0.5) -> NeuralNetwork:
    """创建多层感知器"""
    nn = NeuralNetwork(loss_name=loss)

    # 输入层到第一个隐藏层
    prev_size = input_size
    for hidden_size in hidden_sizes:
        nn.add_layer(Layer(prev_size, hidden_size, hidden_activation))
        if use_dropout:
            nn.add_layer(DropoutLayer(dropout_rate))
        prev_size = hidden_size

    # 输出层
    nn.add_layer(Layer(prev_size, output_size, output_activation))
    nn.initialize()
    return nn


def one_hot_encode(y: np.ndarray, n_classes: int) -> np.ndarray:
    """将标签转为one-hot编码"""
    one_hot = np.zeros((len(y), n_classes))
    for i, label in enumerate(y):
        one_hot[i, int(label)] = 1
    return one_hot


def split_train_test(X: np.ndarray, y: np.ndarray, test_size: float = 0.2,
                     random_state: Optional[int] = None) -> Tuple:
    """拆分训练测试集"""
    if random_state is not None:
        np.random.seed(random_state)
    n_samples = X.shape[0]
    indices = np.random.permutation(n_samples)
    n_test = int(n_samples * test_size)
    train_indices = indices[n_test:]
    test_indices = indices[:n_test]
    return X[train_indices], X[test_indices], y[train_indices], y[test_indices]


def generate_xor_data(n: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    """生成XOR问题数据"""
    X = np.random.rand(n, 2) * 2 - 1  # [-1, 1]
    y = np.zeros((n, 1))
    for i in range(n):
        if (X[i, 0] > 0) != (X[i, 1] > 0):
            y[i] = 1
    return X, y


def generate_circular_data(n: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    """生成环形分类数据"""
    X = np.random.randn(n, 2)
    y = np.zeros((n,), dtype=int)
    radius = np.sqrt(X[:, 0] ** 2 + X[:, 1] ** 2)
    y[(radius > 0.5) & (radius < 1.5)] = 1
    return X, one_hot_encode(y, 2)


def main():
    """示例训练"""
    print("Neural Network Demo")
    print("=" * 50)

    # XOR示例
    print("\nTraining on XOR problem:")
    print("-" * 50)
    X, y = generate_xor_data(1000)
    X_train, X_test, y_train, y_test = split_train_test(X, y, test_size=0.2, random_state=42)

    nn_xor = create_mlp(
        input_size=2,
        hidden_sizes=[4, 4],
        output_size=1,
        hidden_activation='relu',
        output_activation='sigmoid',
        loss='binary_cross_entropy'
    )

    optimizer = Adam()
    history = nn_xor.fit(X_train, y_train, epochs=1000, learning_rate=0.01,
                        batch_size=32, optimizer=optimizer, verbose=True)

    test_loss = nn_xor.evaluate(X_test, y_test)
    predictions = nn_xor.predict(X_test)
    binary_pred = (predictions > 0.5).astype(float)
    accuracy = np.mean(binary_pred == y_test)
    print(f"\nXOR Test Results:")
    print(f"  Test loss: {test_loss:.6f}")
    print(f"  Accuracy: {accuracy:.4f}")

    # 环形数据示例
    print("\n" + "=" * 50)
    print("\nTraining on circular classification problem:")
    print("-" * 50)
    X, y = generate_circular_data(1000)
    X_train, X_test, y_train, y_test = split_train_test(X, y, test_size=0.2, random_state=42)

    nn_circle = create_mlp(
        input_size=2,
        hidden_sizes=[16, 8],
        output_size=2,
        hidden_activation='relu',
        output_activation='softmax',
        loss='cross_entropy',
        use_dropout=True,
        dropout_rate=0.2
    )

    optimizer = Adam()
    history = nn_circle.fit(X_train, y_train, epochs=50, learning_rate=0.01,
                           batch_size=16, optimizer=optimizer, verbose=True)

    test_loss = nn_circle.evaluate(X_test, y_test)
    accuracy = nn_circle.accuracy(X_test, y_test)
    print(f"\nCircle Classification Results:")
    print(f"  Test loss: {test_loss:.6f}")
    print(f"  Accuracy: {accuracy:.4f}")

    # 测试不同优化器对比
    print("\n" + "=" * 50)
    print("\nComparing SGD vs Adam on XOR:")
    print("-" * 50)

    X, y = generate_xor_data(2000)
    X_train, X_test, y_train, y_test = split_train_test(X, y, test_size=0.2, random_state=42)

    # SGD
    nn_sgd = create_mlp(
        input_size=2,
        hidden_sizes=[4],
        output_size=1,
        hidden_activation='relu',
        output_activation='sigmoid',
        loss='binary_cross_entropy'
    )
    optimizer_sgd = SGD(momentum=0.9)
    history_sgd = nn_sgd.fit(X_train, y_train, epochs=200, learning_rate=0.01,
                            batch_size=32, optimizer=optimizer_sgd, verbose=False)

    # Adam
    nn_adam = create_mlp(
        input_size=2,
        hidden_sizes=[4],
        output_size=1,
        hidden_activation='relu',
        output_activation='sigmoid',
        loss='binary_cross_entropy'
    )
    optimizer_adam = Adam()
    history_adam = nn_adam.fit(X_train, y_train, epochs=200, learning_rate=0.01,
                              batch_size=32, optimizer=optimizer_adam, verbose=False)

    acc_sgd = np.mean((nn_sgd.predict(X_test) > 0.5) == y_test)
    acc_adam = np.mean((nn_adam.predict(X_test) > 0.5) == y_test)

    print(f"SGD final loss: {history_sgd[-1]:.6f}, Accuracy: {acc_sgd:.4f}")
    print(f"Adam final loss: {history_adam[-1]:.6f}, Accuracy: {acc_adam:.4f}")

    print("\n" + "=" * 50)
    print("Training complete!")


if __name__ == "__main__":
    main()
