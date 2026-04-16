package com.example.datastructures;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * 各种数据结构的实现集合
 * 包含链表、树、堆、图等常见数据结构
 */
public class DataStructure {

    /**
     * 单向链表节点
     */
    public static class ListNode {
        public int val;
        public ListNode next;

        public ListNode(int val) {
            this.val = val;
            this.next = null;
        }

        public ListNode(int val, ListNode next) {
            this.val = val;
            this.next = next;
        }
    }

    /**
     * 双向链表节点
     */
    public static class DoublyListNode {
        public int val;
        public DoublyListNode prev;
        public DoublyListNode next;

        public DoublyListNode(int val) {
            this.val = val;
            this.prev = null;
            this.next = null;
        }
    }

    /**
     * 单向链表实现
     */
    public static class SinglyLinkedList {
        private ListNode head;
        private ListNode tail;
        private int size;

        public SinglyLinkedList() {
            this.head = null;
            this.tail = null;
            this.size = 0;
        }

        /**
         * 在链表头部添加节点
         */
        public void addFirst(int val) {
            ListNode newNode = new ListNode(val);
            if (head == null) {
                head = newNode;
                tail = newNode;
            } else {
                newNode.next = head;
                head = newNode;
            }
            size++;
        }

        /**
         * 在链表尾部添加节点
         */
        public void addLast(int val) {
            ListNode newNode = new ListNode(val);
            if (tail == null) {
                head = newNode;
                tail = newNode;
            } else {
                tail.next = newNode;
                tail = newNode;
            }
            size++;
        }

        /**
         * 在指定位置插入节点
         */
        public void insert(int index, int val) {
            if (index < 0 || index > size) {
                throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
            }
            if (index == 0) {
                addFirst(val);
                return;
            }
            if (index == size) {
                addLast(val);
                return;
            }
            ListNode current = head;
            for (int i = 0; i < index - 1; i++) {
                current = current.next;
            }
            ListNode newNode = new ListNode(val);
            newNode.next = current.next;
            current.next = newNode;
            size++;
        }

        /**
         * 删除指定位置的节点
         */
        public int delete(int index) {
            if (index < 0 || index >= size) {
                throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
            }
            if (index == 0) {
                return deleteFirst();
            }
            if (index == size - 1) {
                return deleteLast();
            }
            ListNode prev = head;
            for (int i = 0; i < index - 1; i++) {
                prev = prev.next;
            }
            int val = prev.next.val;
            prev.next = prev.next.next;
            size--;
            return val;
        }

        /**
         * 删除第一个节点
         */
        public int deleteFirst() {
            if (head == null) {
                throw new NoSuchElementException();
            }
            int val = head.val;
            head = head.next;
            size--;
            if (size == 0) {
                tail = null;
            }
            return val;
        }

        /**
         * 删除最后一个节点
         */
        public int deleteLast() {
            if (tail == null) {
                throw new NoSuchElementException();
            }
            if (size == 1) {
                int val = head.val;
                head = null;
                tail = null;
                size = 0;
                return val;
            }
            ListNode current = head;
            while (current.next != tail) {
                current = current.next;
            }
            int val = tail.val;
            current.next = null;
            tail = current;
            size--;
            return val;
        }

        /**
         * 获取指定位置的节点值
         */
        public int get(int index) {
            if (index < 0 || index >= size) {
                throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
            }
            ListNode current = head;
            for (int i = 0; i < index; i++) {
                current = current.next;
            }
            return current.val;
        }

        /**
         * 获取链表大小
         */
        public int size() {
            return size;
        }

        /**
         * 判断链表是否为空
         */
        public boolean isEmpty() {
            return size == 0;
        }

        /**
         * 转换为数组
         */
        public int[] toArray() {
            int[] arr = new int[size];
            ListNode current = head;
            for (int i = 0; i < size; i++) {
                arr[i] = current.val;
                current = current.next;
            }
            return arr;
        }

        /**
         * 反转链表
         */
        public void reverse() {
            ListNode prev = null;
            ListNode current = head;
            tail = head;
            while (current != null) {
                ListNode next = current.next;
                current.next = prev;
                prev = current;
                current = next;
            }
            head = prev;
        }

        /**
         * 检测是否有环
         */
        public boolean hasCycle() {
            if (head == null || head.next == null) {
                return false;
            }
            ListNode slow = head;
            ListNode fast = head;
            while (fast != null && fast.next != null) {
                slow = slow.next;
                fast = fast.next.next;
                if (slow == fast) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * 二叉树节点
     */
    public static class TreeNode {
        public int val;
        public TreeNode left;
        public TreeNode right;

        public TreeNode(int val) {
            this.val = val;
            this.left = null;
            this.right = null;
        }

        public TreeNode(int val, TreeNode left, TreeNode right) {
            this.val = val;
            this.left = left;
            this.right = right;
        }
    }

    /**
     * 二叉搜索树实现
     */
    public static class BinarySearchTree {
        private TreeNode root;
        private int size;

        public BinarySearchTree() {
            this.root = null;
            this.size = 0;
        }

        /**
         * 插入节点
         */
        public void insert(int val) {
            root = insertRecursive(root, val);
            size++;
        }

        private TreeNode insertRecursive(TreeNode node, int val) {
            if (node == null) {
                return new TreeNode(val);
            }
            if (val < node.val) {
                node.left = insertRecursive(node.left, val);
            } else if (val > node.val) {
                node.right = insertRecursive(node.right, val);
            }
            return node;
        }

        /**
         * 查找值是否存在
         */
        public boolean contains(int val) {
            return containsRecursive(root, val);
        }

        private boolean containsRecursive(TreeNode node, int val) {
            if (node == null) {
                return false;
            }
            if (val == node.val) {
                return true;
            } else if (val < node.val) {
                return containsRecursive(node.left, val);
            } else {
                return containsRecursive(node.right, val);
            }
        }

        /**
         * 删除节点
         */
        public void delete(int val) {
            root = deleteRecursive(root, val);
            size--;
        }

        private TreeNode deleteRecursive(TreeNode node, int val) {
            if (node == null) {
                return null;
            }
            if (val < node.val) {
                node.left = deleteRecursive(node.left, val);
                return node;
            } else if (val > node.val) {
                node.right = deleteRecursive(node.right, val);
                return node;
            } else {
                // 找到要删除的节点
                if (node.left == null) {
                    return node.right;
                }
                if (node.right == null) {
                    return node.left;
                }
                // 有两个子节点，找到中序后继
                TreeNode successor = findMin(node.right);
                node.val = successor.val;
                node.right = deleteRecursive(node.right, successor.val);
                return node;
            }
        }

        private TreeNode findMin(TreeNode node) {
            while (node.left != null) {
                node = node.left;
            }
            return node;
        }

        /**
         * 前序遍历
         */
        public List<Integer> preorderTraversal() {
            List<Integer> result = new ArrayList<>();
            preorderRecursive(root, result);
            return result;
        }

        private void preorderRecursive(TreeNode node, List<Integer> result) {
            if (node == null) return;
            result.add(node.val);
            preorderRecursive(node.left, result);
            preorderRecursive(node.right, result);
        }

        /**
         * 中序遍历
         */
        public List<Integer> inorderTraversal() {
            List<Integer> result = new ArrayList<>();
            inorderRecursive(root, result);
            return result;
        }

        private void inorderRecursive(TreeNode node, List<Integer> result) {
            if (node == null) return;
            inorderRecursive(node.left, result);
            result.add(node.val);
            inorderRecursive(node.right, result);
        }

        /**
         * 后序遍历
         */
        public List<Integer> postorderTraversal() {
            List<Integer> result = new ArrayList<>();
            postorderRecursive(root, result);
            return result;
        }

        private void postorderRecursive(TreeNode node, List<Integer> result) {
            if (node == null) return;
            postorderRecursive(node.left, result);
            postorderRecursive(node.right, result);
            result.add(node.val);
        }

        /**
         * 层序遍历
         */
        public List<Integer> levelOrderTraversal() {
            List<Integer> result = new ArrayList<>();
            if (root == null) return result;

            Queue<TreeNode> queue = new LinkedList<>();
            queue.offer(root);

            while (!queue.isEmpty()) {
                TreeNode node = queue.poll();
                result.add(node.val);
                if (node.left != null) {
                    queue.offer(node.left);
                }
                if (node.right != null) {
                    queue.offer(node.right);
                }
            }
            return result;
        }

        /**
         * 获取树的高度
         */
        public int height() {
            return heightRecursive(root);
        }

        private int heightRecursive(TreeNode node) {
            if (node == null) return 0;
            return 1 + Math.max(heightRecursive(node.left), heightRecursive(node.right));
        }

        /**
         * 获取大小
         */
        public int size() {
            return size;
        }

        /**
         * 判断是否为空
         */
        public boolean isEmpty() {
            return size == 0;
        }
    }

    /**
     * 最大堆实现
     */
    public static class MaxHeap {
        private int[] heap;
        private int size;
        private int capacity;

        public MaxHeap(int capacity) {
            this.capacity = capacity;
            this.heap = new int[capacity + 1]; // 1-based indexing
            this.size = 0;
        }

        /**
         * 获取堆大小
         */
        public int size() {
            return size;
        }

        /**
         * 判断是否为空
         */
        public boolean isEmpty() {
            return size == 0;
        }

        /**
         * 获取堆顶元素
         */
        public int peek() {
            if (isEmpty()) {
                throw new NoSuchElementException("Heap is empty");
            }
            return heap[1];
        }

        /**
         * 插入元素
         */
        public void insert(int val) {
            if (size >= capacity) {
                throw new IllegalStateException("Heap is full");
            }
            size++;
            heap[size] = val;
            bubbleUp(size);
        }

        /**
         * 上浮操作
         */
        private void bubbleUp(int index) {
            while (index > 1) {
                int parent = index / 2;
                if (heap[index] > heap[parent]) {
                    swap(index, parent);
                    index = parent;
                } else {
                    break;
                }
            }
        }

        /**
         * 弹出堆顶元素
         */
        public int extractMax() {
            if (isEmpty()) {
                throw new NoSuchElementException("Heap is empty");
            }
            int max = heap[1];
            heap[1] = heap[size];
            size--;
            bubbleDown(1);
            return max;
        }

        /**
         * 下沉操作
         */
        private void bubbleDown(int index) {
            while (true) {
                int left = 2 * index;
                int right = 2 * index + 1;
                int largest = index;

                if (left <= size && heap[left] > heap[largest]) {
                    largest = left;
                }
                if (right <= size && heap[right] > heap[largest]) {
                    largest = right;
                }

                if (largest != index) {
                    swap(index, largest);
                    index = largest;
                } else {
                    break;
                }
            }
        }

        /**
         * 交换两个位置
         */
        private void swap(int i, int j) {
            int temp = heap[i];
            heap[i] = heap[j];
            heap[j] = temp;
        }

        /**
         * 转换为数组
         */
        public int[] toArray() {
            int[] arr = new int[size];
            for (int i = 0; i < size; i++) {
                arr[i] = heap[i + 1];
            }
            return arr;
        }

        /**
         * 堆排序
         */
        public static int[] heapSort(int[] arr) {
            MaxHeap heap = new MaxHeap(arr.length);
            for (int num : arr) {
                heap.insert(num);
            }
            int[] result = new int[arr.length];
            for (int i = arr.length - 1; i >= 0; i--) {
                result[i] = heap.extractMax();
            }
            return result;
        }
    }

    /**
     * 最小堆实现
     */
    public static class MinHeap {
        private int[] heap;
        private int size;
        private int capacity;

        public MinHeap(int capacity) {
            this.capacity = capacity;
            this.heap = new int[capacity + 1];
            this.size = 0;
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public int peek() {
            if (isEmpty()) {
                throw new NoSuchElementException("Heap is empty");
            }
            return heap[1];
        }

        public void insert(int val) {
            if (size >= capacity) {
                throw new IllegalStateException("Heap is full");
            }
            size++;
            heap[size] = val;
            bubbleUp(size);
        }

        private void bubbleUp(int index) {
            while (index > 1) {
                int parent = index / 2;
                if (heap[index] < heap[parent]) {
                    swap(index, parent);
                    index = parent;
                } else {
                    break;
                }
            }
        }

        public int extractMin() {
            if (isEmpty()) {
                throw new NoSuchElementException("Heap is empty");
            }
            int min = heap[1];
            heap[1] = heap[size];
            size--;
            bubbleDown(1);
            return min;
        }

        private void bubbleDown(int index) {
            while (true) {
                int left = 2 * index;
                int right = 2 * index + 1;
                int smallest = index;

                if (left <= size && heap[left] < heap[smallest]) {
                    smallest = left;
                }
                if (right <= size && heap[right] < heap[smallest]) {
                    smallest = right;
                }

                if (smallest != index) {
                    swap(index, smallest);
                    index = smallest;
                } else {
                    break;
                }
            }
        }

        private void swap(int i, int j) {
            int temp = heap[i];
            heap[i] = heap[j];
            heap[j] = temp;
        }
    }

    /**
     * 并查集实现
     */
    public static class UnionFind {
        private int[] parent;
        private int[] rank;
        private int count;

        public UnionFind(int size) {
            parent = new int[size];
            rank = new int[size];
            count = size;
            for (int i = 0; i < size; i++) {
                parent[i] = i;
                rank[i] = 1;
            }
        }

        /**
         * 查找根节点，带路径压缩
         */
        public int find(int x) {
            if (parent[x] != x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        }

        /**
         * 合并两个集合
         */
        public boolean union(int x, int y) {
            int rootX = find(x);
            int rootY = find(y);
            if (rootX == rootY) {
                return false;
            }

            if (rank[rootX] < rank[rootY]) {
                parent[rootX] = rootY;
            } else if (rank[rootX] > rank[rootY]) {
                parent[rootY] = rootX;
            } else {
                parent[rootY] = rootX;
                rank[rootX]++;
            }
            count--;
            return true;
        }

        /**
         * 判断是否连通
         */
        public boolean connected(int x, int y) {
            return find(x) == find(y);
        }

        /**
         * 获取连通分量数量
         */
        public int count() {
            return count;
        }
    }

    /**
     * 图的邻接表实现
     */
    public static class Graph {
        private int vertices;
        private List<List<Integer>> adjacencyList;
        private boolean directed;

        public Graph(int vertices) {
            this(vertices, false);
        }

        public Graph(int vertices, boolean directed) {
            this.vertices = vertices;
            this.directed = directed;
            this.adjacencyList = new ArrayList<>();
            for (int i = 0; i < vertices; i++) {
                adjacencyList.add(new ArrayList<>());
            }
        }

        /**
         * 添加边
         */
        public void addEdge(int from, int to) {
            if (from < 0 || from >= vertices || to < 0 || to >= vertices) {
                throw new IllegalArgumentException("Invalid vertex index");
            }
            adjacencyList.get(from).add(to);
            if (!directed) {
                adjacencyList.get(to).add(from);
            }
        }

        /**
         * 获取顶点数
         */
        public int vertices() {
            return vertices;
        }

        /**
         * 获取边数
         */
        public int edges() {
            int count = 0;
            for (List<Integer> neighbors : adjacencyList) {
                count += neighbors.size();
            }
            return directed ? count : count / 2;
        }

        /**
         * 获取邻居
         */
        public List<Integer> getNeighbors(int vertex) {
            if (vertex < 0 || vertex >= vertices) {
                throw new IllegalArgumentException("Invalid vertex index");
            }
            return Collections.unmodifiableList(adjacencyList.get(vertex));
        }

        /**
         * 深度优先搜索
         */
        public List<Integer> dfs(int start) {
            List<Integer> result = new ArrayList<>();
            boolean[] visited = new boolean[vertices];
            dfsRecursive(start, visited, result);
            return result;
        }

        private void dfsRecursive(int vertex, boolean[] visited, List<Integer> result) {
            visited[vertex] = true;
            result.add(vertex);
            for (int neighbor : adjacencyList.get(vertex)) {
                if (!visited[neighbor]) {
                    dfsRecursive(neighbor, visited, result);
                }
            }
        }

        /**
         * 广度优先搜索
         */
        public List<Integer> bfs(int start) {
            List<Integer> result = new ArrayList<>();
            boolean[] visited = new boolean[vertices];
            Queue<Integer> queue = new LinkedList<>();

            visited[start] = true;
            queue.offer(start);

            while (!queue.isEmpty()) {
                int vertex = queue.poll();
                result.add(vertex);

                for (int neighbor : adjacencyList.get(vertex)) {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true;
                        queue.offer(neighbor);
                    }
                }
            }
            return result;
        }

        /**
         * 检测是否有环
         */
        public boolean hasCycle() {
            boolean[] visited = new boolean[vertices];
            if (!directed) {
                // 无向图检测环
                for (int i = 0; i < vertices; i++) {
                    if (!visited[i]) {
                        if (hasCycleUndirected(i, -1, visited)) {
                            return true;
                        }
                    }
                }
            } else {
                // 有向图检测环
                int[] recStack = new int[vertices]; // 0: unvisited, 1: visiting, 2: visited
                for (int i = 0; i < vertices; i++) {
                    if (recStack[i] == 0) {
                        if (hasCycleDirected(i, recStack)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        private boolean hasCycleUndirected(int vertex, int parent, boolean[] visited) {
            visited[vertex] = true;
            for (int neighbor : adjacencyList.get(vertex)) {
                if (!visited[neighbor]) {
                    if (hasCycleUndirected(neighbor, vertex, visited)) {
                        return true;
                    }
                } else if (neighbor != parent) {
                    return true;
                }
            }
            return false;
        }

        private boolean hasCycleDirected(int vertex, int[] visited) {
            visited[vertex] = 1;
            for (int neighbor : adjacencyList.get(vertex)) {
                if (visited[neighbor] == 1) {
                    return true;
                }
                if (visited[neighbor] == 0 && hasCycleDirected(neighbor, visited)) {
                    return true;
                }
            }
            visited[vertex] = 2;
            return false;
        }

        /**
         * 拓扑排序（仅用于有向图）
         */
        public List<Integer> topologicalSort() {
            if (!directed) {
                throw new IllegalStateException("Topological sort only works for directed graphs");
            }

            int[] inDegree = new int[vertices];
            for (int i = 0; i < vertices; i++) {
                for (int neighbor : adjacencyList.get(i)) {
                    inDegree[neighbor]++;
                }
            }

            Queue<Integer> queue = new LinkedList<>();
            for (int i = 0; i < vertices; i++) {
                if (inDegree[i] == 0) {
                    queue.offer(i);
                }
            }

            List<Integer> result = new ArrayList<>();
            while (!queue.isEmpty()) {
                int vertex = queue.poll();
                result.add(vertex);
                for (int neighbor : adjacencyList.get(vertex)) {
                    inDegree[neighbor]--;
                    if (inDegree[neighbor] == 0) {
                        queue.offer(neighbor);
                    }
                }
            }

            if (result.size() != vertices) {
                throw new IllegalStateException("Graph has a cycle, topological sort not possible");
            }

            return result;
        }
    }

    /**
     * 带权图的邻接表实现
     */
    public static class WeightedGraph {
        public static class Edge {
            public int to;
            public int weight;

            public Edge(int to, int weight) {
                this.to = to;
                this.weight = weight;
            }
        }

        private int vertices;
        private List<List<Edge>> adjacencyList;
        private boolean directed;

        public WeightedGraph(int vertices) {
            this(vertices, false);
        }

        public WeightedGraph(int vertices, boolean directed) {
            this.vertices = vertices;
            this.directed = directed;
            this.adjacencyList = new ArrayList<>();
            for (int i = 0; i < vertices; i++) {
                adjacencyList.add(new ArrayList<>());
            }
        }

        public void addEdge(int from, int to, int weight) {
            if (from < 0 || from >= vertices || to < 0 || to >= vertices) {
                throw new IllegalArgumentException("Invalid vertex index");
            }
            adjacencyList.get(from).add(new Edge(to, weight));
            if (!directed) {
                adjacencyList.get(to).add(new Edge(from, weight));
            }
        }

        public List<Edge> getEdges(int vertex) {
            return Collections.unmodifiableList(adjacencyList.get(vertex));
        }

        public int vertices() {
            return vertices;
        }

        /**
         * Dijkstra 最短路径算法
         */
        public int[] dijkstra(int start) {
            int[] distances = new int[vertices];
            Arrays.fill(distances, Integer.MAX_VALUE);
            distances[start] = 0;

            boolean[] processed = new boolean[vertices];
            PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
            pq.offer(new int[]{start, 0});

            while (!pq.isEmpty()) {
                int[] current = pq.poll();
                int vertex = current[0];
                int distance = current[1];

                if (processed[vertex]) continue;
                processed[vertex] = true;

                for (Edge edge : adjacencyList.get(vertex)) {
                    if (!processed[edge.to] && distances[edge.to] > distance + edge.weight) {
                        distances[edge.to] = distance + edge.weight;
                        pq.offer(new int[]{edge.to, distances[edge.to]});
                    }
                }
            }

            return distances;
        }
    }

    /**
     * 循环队列实现
     */
    public static class CircularQueue {
        private int[] queue;
        private int front;
        private int rear;
        private int size;
        private int capacity;

        public CircularQueue(int capacity) {
            this.capacity = capacity;
            this.queue = new int[capacity];
            this.front = 0;
            this.rear = -1;
            this.size = 0;
        }

        public boolean enqueue(int val) {
            if (isFull()) {
                return false;
            }
            rear = (rear + 1) % capacity;
            queue[rear] = val;
            size++;
            return true;
        }

        public int dequeue() {
            if (isEmpty()) {
                throw new NoSuchElementException("Queue is empty");
            }
            int val = queue[front];
            front = (front + 1) % capacity;
            size--;
            return val;
        }

        public int front() {
            if (isEmpty()) {
                throw new NoSuchElementException("Queue is empty");
            }
            return queue[front];
        }

        public int rear() {
            if (isEmpty()) {
                throw new NoSuchElementException("Queue is empty");
            }
            return queue[rear];
        }

        public boolean isEmpty() {
            return size == 0;
        }

        public boolean isFull() {
            return size == capacity;
        }

        public int size() {
            return size;
        }
    }

    /**
     * 基于数组的栈实现
     */
    public static class Stack {
        private int[] stack;
        private int top;
        private int capacity;

        public Stack(int capacity) {
            this.capacity = capacity;
            this.stack = new int[capacity];
            this.top = -1;
        }

        public void push(int val) {
            if (isFull()) {
                throw new IllegalStateException("Stack is full");
            }
            top++;
            stack[top] = val;
        }

        public int pop() {
            if (isEmpty()) {
                throw new NoSuchElementException("Stack is empty");
            }
            int val = stack[top];
            top--;
            return val;
        }

        public int peek() {
            if (isEmpty()) {
                throw new NoSuchElementException("Stack is empty");
            }
            return stack[top];
        }

        public boolean isEmpty() {
            return top == -1;
        }

        public boolean isFull() {
            return top == capacity - 1;
        }

        public int size() {
            return top + 1;
        }
    }

    /**
     * AVL树节点
     */
    public static class AVLNode {
        public int val;
        public AVLNode left;
        public AVLNode right;
        public int height;

        public AVLNode(int val) {
            this.val = val;
            this.height = 1;
        }
    }

    /**
     * AVL树（自平衡二叉搜索树）实现
     */
    public static class AVLTree {
        private AVLNode root;
        private int size;

        public AVLTree() {
            this.root = null;
            this.size = 0;
        }

        public int height(AVLNode node) {
            return node == null ? 0 : node.height;
        }

        public int getBalance(AVLNode node) {
            return node == null ? 0 : height(node.left) - height(node.right);
        }

        public AVLNode rightRotate(AVLNode y) {
            AVLNode x = y.left;
            AVLNode T2 = x.right;

            x.right = y;
            y.left = T2;

            y.height = 1 + Math.max(height(y.left), height(y.right));
            x.height = 1 + Math.max(height(x.left), height(x.right));

            return x;
        }

        public AVLNode leftRotate(AVLNode x) {
            AVLNode y = x.right;
            AVLNode T2 = y.left;

            y.left = x;
            x.right = T2;

            x.height = 1 + Math.max(height(x.left), height(x.right));
            y.height = 1 + Math.max(height(y.left), height(y.right));

            return y;
        }

        public AVLNode insert(AVLNode node, int val) {
            if (node == null) {
                size++;
                return new AVLNode(val);
            }

            if (val < node.val) {
                node.left = insert(node.left, val);
            } else if (val > node.val) {
                node.right = insert(node.right, val);
            } else {
                return node;
            }

            node.height = 1 + Math.max(height(node.left), height(node.right));

            int balance = getBalance(node);

            // LL
            if (balance > 1 && val < node.left.val) {
                return rightRotate(node);
            }

            // RR
            if (balance < -1 && val > node.right.val) {
                return leftRotate(node);
            }

            // LR
            if (balance > 1 && val > node.left.val) {
                node.left = leftRotate(node.left);
                return rightRotate(node);
            }

            // RL
            if (balance < -1 && val < node.right.val) {
                node.right = rightRotate(node.right);
                return leftRotate(node);
            }

            return node;
        }

        public void insert(int val) {
            root = insert(root, val);
        }

        public boolean contains(int val) {
            return search(root, val);
        }

        private boolean search(AVLNode node, int val) {
            if (node == null) {
                return false;
            }
            if (node.val == val) {
                return true;
            }
            if (val < node.val) {
                return search(node.left, val);
            } else {
                return search(node.right, val);
            }
        }

        public int size() {
            return size;
        }

        public boolean isEmpty() {
            return size == 0;
        }
    }

    public static void main(String[] args) {
        // 测试链表
        System.out.println("Testing SinglyLinkedList:");
        SinglyLinkedList list = new SinglyLinkedList();
        list.addLast(1);
        list.addLast(2);
        list.addLast(3);
        list.addFirst(0);
        list.insert(2, 99);
        System.out.println("Size: " + list.size());
        for (int i = 0; i < list.size(); i++) {
            System.out.print(list.get(i) + " ");
        }
        System.out.println();

        // 测试BST
        System.out.println("\nTesting BinarySearchTree:");
        BinarySearchTree bst = new BinarySearchTree();
        int[] values = {5, 3, 7, 2, 4, 6, 8};
        for (int v : values) {
            bst.insert(v);
        }
        System.out.println("Inorder traversal: " + bst.inorderTraversal());
        System.out.println("Height: " + bst.height());
        System.out.println("Contains 4: " + bst.contains(4));
        System.out.println("Contains 99: " + bst.contains(99));

        // 测试最大堆
        System.out.println("\nTesting MaxHeap:");
        int[] arr = {3, 1, 4, 1, 5, 9, 2, 6};
        int[] sorted = MaxHeap.heapSort(arr);
        System.out.println("Heap sorted: " + Arrays.toString(sorted));

        // 测试并查集
        System.out.println("\nTesting UnionFind:");
        UnionFind uf = new UnionFind(5);
        uf.union(0, 1);
        uf.union(1, 2);
        uf.union(3, 4);
        System.out.println("Connected 0 and 2: " + uf.connected(0, 2));
        System.out.println("Connected 0 and 3: " + uf.connected(0, 3));
        System.out.println("Components: " + uf.count());

        // 测试图
        System.out.println("\nTesting Graph:");
        Graph graph = new Graph(5);
        graph.addEdge(0, 1);
        graph.addEdge(0, 2);
        graph.addEdge(1, 3);
        graph.addEdge(2, 4);
        System.out.println("DFS from 0: " + graph.dfs(0));
        System.out.println("BFS from 0: " + graph.bfs(0));
    }
}
