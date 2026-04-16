package main

import (
	"errors"
	"fmt"
	"math"
	"sync"
)

// 单向链表节点
type ListNode struct {
	Val  int
	Next *ListNode
}

// 单向链表
type SinglyLinkedList struct {
	head *ListNode
	tail *ListNode
	size int
	mu   sync.RWMutex
}

// NewSinglyLinkedList 创建一个新的单向链表
func NewSinglyLinkedList() *SinglyLinkedList {
	return &SinglyLinkedList{
		head: nil,
		tail: nil,
		size: 0,
	}
}

// AddFirst 在头部添加节点
func (l *SinglyLinkedList) AddFirst(val int) {
	l.mu.Lock()
	defer l.mu.Unlock()

	newNode := &ListNode{Val: val}
	if l.head == nil {
		l.head = newNode
		l.tail = newNode
	} else {
		newNode.Next = l.head
		l.head = newNode
	}
	l.size++
}

// AddLast 在尾部添加节点
func (l *SinglyLinkedList) AddLast(val int) {
	l.mu.Lock()
	defer l.mu.Unlock()

	newNode := &ListNode{Val: val}
	if l.tail == nil {
		l.head = newNode
		l.tail = newNode
	} else {
		l.tail.Next = newNode
		l.tail = newNode
	}
	l.size++
}

// Insert 在指定位置插入
func (l *SinglyLinkedList) Insert(index, val int) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if index < 0 || index > l.size {
		return errors.New("index out of bounds")
	}
	if index == 0 {
		l.addFirstLocked(val)
		return nil
	}
	if index == l.size {
		l.addLastLocked(val)
		return nil
	}

	current := l.head
	for i := 0; i < index-1; i++ {
		current = current.Next
	}
	newNode := &ListNode{Val: val}
	newNode.Next = current.Next
	current.Next = newNode
	l.size++
	return nil
}

func (l *SinglyLinkedList) addFirstLocked(val int) {
	newNode := &ListNode{Val: val}
	if l.head == nil {
		l.head = newNode
		l.tail = newNode
	} else {
		newNode.Next = l.head
		l.head = newNode
	}
	l.size++
}

func (l *SinglyLinkedList) addLastLocked(val int) {
	newNode := &ListNode{Val: val}
	if l.tail == nil {
		l.head = newNode
		l.tail = newNode
	} else {
		l.tail.Next = newNode
		l.tail = newNode
	}
	l.size++
}

// Delete 删除指定位置节点
func (l *SinglyLinkedList) Delete(index int) (int, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if index < 0 || index >= l.size {
		return 0, errors.New("index out of bounds")
	}
	if index == 0 {
		return l.deleteFirstLocked(), nil
	}
	if index == l.size-1 {
		return l.deleteLastLocked(), nil
	}

	prev := l.head
	for i := 0; i < index-1; i++ {
		prev = prev.Next
	}
	val := prev.Next.Val
	prev.Next = prev.Next.Next
	l.size--
	return val, nil
}

func (l *SinglyLinkedList) deleteFirstLocked() int {
	val := l.head.Val
	l.head = l.head.Next
	l.size--
	if l.size == 0 {
		l.tail = nil
	}
	return val
}

func (l *SinglyLinkedList) deleteLastLocked() int {
	val := l.tail.Val
	if l.size == 1 {
		l.head = nil
		l.tail = nil
		l.size = 0
		return val
	}

	current := l.head
	for current.Next != l.tail {
		current = current.Next
	}
	current.Next = nil
	l.tail = current
	l.size--
	return val
}

// Get 获取指定位置的值
func (l *SinglyLinkedList) Get(index int) (int, error) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	if index < 0 || index >= l.size {
		return 0, errors.New("index out of bounds")
	}

	current := l.head
	for i := 0; i < index; i++ {
		current = current.Next
	}
	return current.Val, nil
}

// Size 返回大小
func (l *SinglyLinkedList) Size() int {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.size
}

// IsEmpty 判断是否为空
func (l *SinglyLinkedList) IsEmpty() bool {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.size == 0
}

// ToArray 转换为数组
func (l *SinglyLinkedList) ToArray() []int {
	l.mu.RLock()
	defer l.mu.RUnlock()

	arr := make([]int, 0, l.size)
	current := l.head
	for current != nil {
		arr = append(arr, current.Val)
		current = current.Next
	}
	return arr
}

// Reverse 反转链表
func (l *SinglyLinkedList) Reverse() {
	l.mu.Lock()
	defer l.mu.Unlock()

	var prev *ListNode
	current := l.head
	l.tail = l.head
	for current != nil {
		next := current.Next
		current.Next = prev
		prev = current
		current = next
	}
	l.head = prev
}

// 二叉树节点
type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

// 二叉搜索树
type BinarySearchTree struct {
	root *TreeNode
	size int
}

// NewBinarySearchTree 创建新的二叉搜索树
func NewBinarySearchTree() *BinarySearchTree {
	return &BinarySearchTree{root: nil, size: 0}
}

// Insert 插入节点
func (bst *BinarySearchTree) Insert(val int) {
	bst.root = bst.insertRecursive(bst.root, val)
	bst.size++
}

func (bst *BinarySearchTree) insertRecursive(node *TreeNode, val int) *TreeNode {
	if node == nil {
		return &TreeNode{Val: val}
	}
	if val < node.Val {
		node.Left = bst.insertRecursive(node.Left, val)
	} else if val > node.Val {
		node.Right = bst.insertRecursive(node.Right, val)
	}
	return node
}

// Contains 查找是否包含值
func (bst *BinarySearchTree) Contains(val int) bool {
	return bst.containsRecursive(bst.root, val)
}

func (bst *BinarySearchTree) containsRecursive(node *TreeNode, val int) bool {
	if node == nil {
		return false
	}
	if val == node.Val {
		return true
	} else if val < node.Val {
		return bst.containsRecursive(node.Left, val)
	} else {
		return bst.containsRecursive(node.Right, val)
	}
}

// Delete 删除节点
func (bst *BinarySearchTree) Delete(val int) {
	bst.root = bst.deleteRecursive(bst.root, val)
	if bst.size > 0 {
		bst.size--
	}
}

func (bst *BinarySearchTree) deleteRecursive(node *TreeNode, val int) *TreeNode {
	if node == nil {
		return nil
	}
	if val < node.Val {
		node.Left = bst.deleteRecursive(node.Left, val)
		return node
	} else if val > node.Val {
		node.Right = bst.deleteRecursive(node.Right, val)
		return node
	} else {
		if node.Left == nil {
			return node.Right
		}
		if node.Right == nil {
			return node.Left
		}
		successor := bst.findMin(node.Right)
		node.Val = successor.Val
		node.Right = bst.deleteRecursive(node.Right, successor.Val)
		return node
	}
}

func (bst *BinarySearchTree) findMin(node *TreeNode) *TreeNode {
	for node.Left != nil {
		node = node.Left
	}
	return node
}

// Preorder 前序遍历
func (bst *BinarySearchTree) Preorder() []int {
	result := make([]int, 0, bst.size)
	bst.preorderRecursive(bst.root, &result)
	return result
}

func (bst *BinarySearchTree) preorderRecursive(node *TreeNode, result *[]int) {
	if node == nil {
		return
	}
	*result = append(*result, node.Val)
	bst.preorderRecursive(node.Left, result)
	bst.preorderRecursive(node.Right, result)
}

// Inorder 中序遍历
func (bst *BinarySearchTree) Inorder() []int {
	result := make([]int, 0, bst.size)
	bst.inorderRecursive(bst.root, &result)
	return result
}

func (bst *BinarySearchTree) inorderRecursive(node *TreeNode, result *[]int) {
	if node == nil {
		return
	}
	bst.inorderRecursive(node.Left, result)
	*result = append(*result, node.Val)
	bst.inorderRecursive(node.Right, result)
}

// Postorder 后序遍历
func (bst *BinarySearchTree) Postorder() []int {
	result := make([]int, 0, bst.size)
	bst.postorderRecursive(bst.root, &result)
	return result
}

func (bst *BinarySearchTree) postorderRecursive(node *TreeNode, result *[]int) {
	if node == nil {
		return
	}
	bst.postorderRecursive(node.Left, result)
	bst.postorderRecursive(node.Right, result)
	*result = append(*result, node.Val)
}

// Height 获取树高
func (bst *BinarySearchTree) Height() int {
	return bst.heightRecursive(bst.root)
}

func (bst *BinarySearchTree) heightRecursive(node *TreeNode) int {
	if node == nil {
		return 0
	}
	leftH := bst.heightRecursive(node.Left)
	rightH := bst.heightRecursive(node.Right)
	return 1 + max(leftH, rightH)
}

// Size 返回节点数量
func (bst *BinarySearchTree) Size() int {
	return bst.size
}

// 最大堆
type MaxHeap struct {
	heap     []int
	size     int
	capacity int
}

// NewMaxHeap 创建新的最大堆
func NewMaxHeap(capacity int) *MaxHeap {
	return &MaxHeap{
		heap:     make([]int, capacity+1), // 1-based
		size:     0,
		capacity: capacity,
	}
}

// Size 返回大小
func (h *MaxHeap) Size() int {
	return h.size
}

// IsEmpty 判断是否为空
func (h *MaxHeap) IsEmpty() bool {
	return h.size == 0
}

// Peek 获取堆顶
func (h *MaxHeap) Peek() (int, error) {
	if h.IsEmpty() {
		return 0, errors.New("heap is empty")
	}
	return h.heap[1], nil
}

// Insert 插入元素
func (h *MaxHeap) Insert(val int) error {
	if h.size >= h.capacity {
		return errors.New("heap is full")
	}
	h.size++
	h.heap[h.size] = val
	h.bubbleUp(h.size)
	return nil
}

func (h *MaxHeap) bubbleUp(index int) {
	for index > 1 {
		parent := index / 2
		if h.heap[index] > h.heap[parent] {
			h.swap(index, parent)
			index = parent
		} else {
			break
		}
	}
}

// ExtractMax 弹出最大元素
func (h *MaxHeap) ExtractMax() (int, error) {
	if h.IsEmpty() {
		return 0, errors.New("heap is empty")
	}
	max := h.heap[1]
	h.heap[1] = h.heap[h.size]
	h.size--
	h.bubbleDown(1)
	return max, nil
}

func (h *MaxHeap) bubbleDown(index int) {
	for {
		left := 2 * index
		right := 2*index + 1
		largest := index

		if left <= h.size && h.heap[left] > h.heap[largest] {
			largest = left
		}
		if right <= h.size && h.heap[right] > h.heap[largest] {
			largest = right
		}

		if largest != index {
			h.swap(index, largest)
			index = largest
		} else {
			break
		}
	}
}

func (h *MaxHeap) swap(i, j int) {
	h.heap[i], h.heap[j] = h.heap[j], h.heap[i]
}

// ToArray 转换为数组
func (h *MaxHeap) ToArray() []int {
	result := make([]int, h.size)
	for i := 0; i < h.size; i++ {
		result[i] = h.heap[i+1]
	}
	return result
}

// HeapSort 堆排序
func HeapSort(arr []int) []int {
	n := len(arr)
	heap := NewMaxHeap(n)
	for _, num := range arr {
		heap.Insert(num)
	}
	result := make([]int, n)
	for i := n - 1; i >= 0; i-- {
		max, _ := heap.ExtractMax()
		result[i] = max
	}
	return result
}

// 并查集
type UnionFind struct {
	parent []int
	rank   []int
	count  int
}

// NewUnionFind 创建新的并查集
func NewUnionFind(size int) *UnionFind {
	parent := make([]int, size)
	rank := make([]int, size)
	for i := range parent {
		parent[i] = i
		rank[i] = 1
	}
	return &UnionFind{
		parent: parent,
		rank:   rank,
		count:  size,
	}
}

// Find 查找根（路径压缩）
func (uf *UnionFind) Find(x int) int {
	if uf.parent[x] != x {
		uf.parent[x] = uf.Find(uf.parent[x])
	}
	return uf.parent[x]
}

// Union 合并两个集合
func (uf *UnionFind) Union(x, y int) bool {
	rootX := uf.Find(x)
	rootY := uf.Find(y)
	if rootX == rootY {
		return false
	}

	if uf.rank[rootX] < uf.rank[rootY] {
		uf.parent[rootX] = rootY
	} else if uf.rank[rootX] > uf.rank[rootY] {
		uf.parent[rootY] = rootX
	} else {
		uf.parent[rootY] = rootX
		uf.rank[rootX]++
	}
	uf.count--
	return true
}

// Connected 判断是否连通
func (uf *UnionFind) Connected(x, y int) bool {
	return uf.Find(x) == uf.Find(y)
}

// Count 返回连通分量数量
func (uf *UnionFind) Count() int {
	return uf.count
}

// 图（邻接表实现）
type Graph struct {
	vertices int
	adj      [][]int
	directed bool
}

// NewGraph 创建新的图
func NewGraph(vertices int, directed bool) *Graph {
	adj := make([][]int, vertices)
	for i := range adj {
		adj[i] = make([]int, 0)
	}
	return &Graph{
		vertices: vertices,
		adj:      adj,
		directed: directed,
	}
}

// AddEdge 添加边
func (g *Graph) AddEdge(from, to int) error {
	if from < 0 || from >= g.vertices || to < 0 || to >= g.vertices {
		return errors.New("invalid vertex index")
	}
	g.adj[from] = append(g.adj[from], to)
	if !g.directed {
		g.adj[to] = append(g.adj[to], from)
	}
	return nil
}

// Vertices 返回顶点数
func (g *Graph) Vertices() int {
	return g.vertices
}

// Edges 返回边数
func (g *Graph) Edges() int {
	count := 0
	for _, neighbors := range g.adj {
		count += len(neighbors)
	}
	if g.directed {
		return count
	}
	return count / 2
}

// GetNeighbors 获取邻居
func (g *Graph) GetNeighbors(v int) []int {
	return g.adj[v]
}

// DFS 深度优先搜索
func (g *Graph) DFS(start int) []int {
	result := make([]int, 0, g.vertices)
	visited := make([]bool, g.vertices)
	g.dfsRecursive(start, visited, &result)
	return result
}

func (g *Graph) dfsRecursive(v int, visited []bool, result *[]int) {
	visited[v] = true
	*result = append(*result, v)
	for _, neighbor := range g.adj[v] {
		if !visited[neighbor] {
			g.dfsRecursive(neighbor, visited, result)
		}
	}
}

// BFS 广度优先搜索
func (g *Graph) BFS(start int) []int {
	result := make([]int, 0, g.vertices)
	visited := make([]bool, g.vertices)
	queue := make([]int, 0)

	visited[start] = true
	queue = append(queue, start)

	for len(queue) > 0 {
		v := queue[0]
		queue = queue[1:]
		result = append(result, v)
		for _, neighbor := range g.adj[v] {
			if !visited[neighbor] {
				visited[neighbor] = true
				queue = append(queue, neighbor)
			}
		}
	}
	return result
}

// HasCycle 检测是否有环
func (g *Graph) HasCycle() bool {
	if !g.directed {
		visited := make([]bool, g.vertices)
		for i := 0; i < g.vertices; i++ {
			if !visited[i] {
				if g.hasCycleUndirected(i, -1, visited) {
					return true
				}
			}
		}
	} else {
		// 0: unvisited, 1: visiting, 2: visited
		visited := make([]int, g.vertices)
		for i := 0; i < g.vertices; i++ {
			if visited[i] == 0 {
				if g.hasCycleDirected(i, visited) {
					return true
				}
			}
		}
	}
	return false
}

func (g *Graph) hasCycleUndirected(v int, parent int, visited []bool) bool {
	visited[v] = true
	for _, neighbor := range g.adj[v] {
		if !visited[neighbor] {
			if g.hasCycleUndirected(neighbor, v, visited) {
				return true
			}
		} else if neighbor != parent {
			return true
		}
	}
	return false
}

func (g *Graph) hasCycleDirected(v int, visited []int) bool {
	visited[v] = 1
	for _, neighbor := range g.adj[v] {
		if visited[neighbor] == 1 {
			return true
		}
		if visited[neighbor] == 0 && g.hasCycleDirected(neighbor, visited) {
			return true
		}
	}
	visited[v] = 2
	return false
}

// TopologicalSort 拓扑排序（仅用于有向图）
func (g *Graph) TopologicalSort() ([]int, error) {
	if !g.directed {
		return nil, errors.New("topological sort only for directed graphs")
	}

	inDegree := make([]int, g.vertices)
	for v := 0; v < g.vertices; v++ {
		for _, neighbor := range g.adj[v] {
			inDegree[neighbor]++
		}
	}

	queue := make([]int, 0)
	for v := 0; v < g.vertices; v++ {
		if inDegree[v] == 0 {
			queue = append(queue, v)
		}
	}

	result := make([]int, 0, g.vertices)
	for len(queue) > 0 {
		v := queue[0]
		queue = queue[1:]
		result = append(result, v)
		for _, neighbor := range g.adj[v] {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				queue = append(queue, neighbor)
			}
		}
	}

	if len(result) != g.vertices {
		return nil, errors.New("graph has a cycle, topological sort not possible")
	}

	return result, nil
}

// 循环队列
type CircularQueue struct {
	queue    []int
	front    int
	rear     int
	size     int
	capacity int
}

// NewCircularQueue 创建新的循环队列
func NewCircularQueue(capacity int) *CircularQueue {
	return &CircularQueue{
		queue:    make([]int, capacity),
		front:    0,
		rear:     -1,
		size:     0,
		capacity: capacity,
	}
}

// Enqueue 入队
func (cq *CircularQueue) Enqueue(val int) bool {
	if cq.IsFull() {
		return false
	}
	cq.rear = (cq.rear + 1) % cq.capacity
	cq.queue[cq.rear] = val
	cq.size++
	return true
}

// Dequeue 出队
func (cq *CircularQueue) Dequeue() (int, error) {
	if cq.IsEmpty() {
		return 0, errors.New("queue is empty")
	}
	val := cq.queue[cq.front]
	cq.front = (cq.front + 1) % cq.capacity
	cq.size--
	return val, nil
}

// Front 获取队首
func (cq *CircularQueue) Front() (int, error) {
	if cq.IsEmpty() {
		return 0, errors.New("queue is empty")
	}
	return cq.queue[cq.front], nil
}

// Rear 获取队尾
func (cq *CircularQueue) Rear() (int, error) {
	if cq.IsEmpty() {
		return 0, errors.New("queue is empty")
	}
	return cq.queue[cq.rear], nil
}

// IsEmpty 判断是否为空
func (cq *CircularQueue) IsEmpty() bool {
	return cq.size == 0
}

// IsFull 判断是否已满
func (cq *CircularQueue) IsFull() bool {
	return cq.size == cq.capacity
}

// Size 返回大小
func (cq *CircularQueue) Size() int {
	return cq.size
}

// 栈
type Stack struct {
	items    []int
	top      int
	capacity int
}

// NewStack 创建新的栈
func NewStack(capacity int) *Stack {
	return &Stack{
		items:    make([]int, capacity),
		top:      -1,
		capacity: capacity,
	}
}

// Push 压栈
func (s *Stack) Push(val int) error {
	if s.IsFull() {
		return errors.New("stack is full")
	}
	s.top++
	s.items[s.top] = val
	return nil
}

// Pop 弹栈
func (s *Stack) Pop() (int, error) {
	if s.IsEmpty() {
		return 0, errors.New("stack is empty")
	}
	val := s.items[s.top]
	s.top--
	return val, nil
}

// Peek 获取栈顶
func (s *Stack) Peek() (int, error) {
	if s.IsEmpty() {
		return 0, errors.New("stack is empty")
	}
	return s.items[s.top], nil
}

// IsEmpty 判断是否为空
func (s *Stack) IsEmpty() bool {
	return s.top == -1
}

// IsFull 判断是否已满
func (s *Stack) IsFull() bool {
	return s.top == s.capacity-1
}

// Size 返回大小
func (s *Stack) Size() int {
	return s.top + 1
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {
	fmt.Println("Testing Data Structures")
	fmt.Println("========================")

	// 测试链表
	fmt.Println("\nTesting SinglyLinkedList:")
	list := NewSinglyLinkedList()
	list.AddLast(1)
	list.AddLast(2)
	list.AddLast(3)
	list.AddFirst(0)
	list.Insert(2, 99)
	fmt.Printf("Size: %d\n", list.Size())
	fmt.Printf("ToArray: %v\n", list.ToArray())
	list.Reverse()
	fmt.Printf("Reversed: %v\n", list.ToArray())

	// 测试二叉搜索树
	fmt.Println("\nTesting BinarySearchTree:")
	bst := NewBinarySearchTree()
	values := []int{5, 3, 7, 2, 4, 6, 8}
	for _, v := range values {
		bst.Insert(v)
	}
	fmt.Printf("Inorder traversal: %v\n", bst.Inorder())
	fmt.Printf("Height: %d\n", bst.Height())
	fmt.Printf("Contains 4: %t\n", bst.Contains(4))
	fmt.Printf("Contains 99: %t\n", bst.Contains(99))

	// 测试堆排序
	fmt.Println("\nTesting MaxHeap and HeapSort:")
	arr := []int{3, 1, 4, 1, 5, 9, 2, 6}
	sorted := HeapSort(arr)
	fmt.Printf("Heap sorted: %v\n", sorted)

	// 测试并查集
	fmt.Println("\nTesting UnionFind:")
	uf := NewUnionFind(5)
	uf.Union(0, 1)
	uf.Union(1, 2)
	uf.Union(3, 4)
	fmt.Printf("Connected 0 and 2: %t\n", uf.Connected(0, 2))
	fmt.Printf("Connected 0 and 3: %t\n", uf.Connected(0, 3))
	fmt.Printf("Components: %d\n", uf.Count())

	// 测试图
	fmt.Println("\nTesting Graph:")
	g := NewGraph(5, false)
	g.AddEdge(0, 1)
	g.AddEdge(0, 2)
	g.AddEdge(1, 3)
	g.AddEdge(2, 4)
	fmt.Printf("DFS from 0: %v\n", g.DFS(0))
	fmt.Printf("BFS from 0: %v\n", g.BFS(0))
	fmt.Printf("Has cycle: %t\n", g.HasCycle())
}
