package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
)

// Client 是可配置的 HTTP 客户端
type Client struct {
	baseURL         string
	defaultHeaders  http.Header
	timeout         time.Duration
	maxRetries      int
	retryDelay      time.Duration
	debug           bool
	loggingEnabled  bool
	httpClient      *http.Client
	middlewares      []Middleware
}

// ClientOption 选项模式配置客户端
type ClientOption func(*Client)

// WithBaseURL 设置基础 URL
func WithBaseURL(baseURL string) ClientOption {
	return func(c *Client) {
		c.baseURL = strings.TrimSuffix(baseURL, "/")
	}
}

// WithDefaultHeader 设置默认请求头
func WithDefaultHeader(key, value string) ClientOption {
	return func(c *Client) {
		c.defaultHeaders.Add(key, value)
	}
}

// WithTimeout 设置超时
func WithTimeout(timeout time.Duration) ClientOption {
	return func(c *Client) {
		c.timeout = timeout
	}
}

// WithMaxRetries 设置最大重试次数
func WithMaxRetries(maxRetries int) ClientOption {
	return func(c *Client) {
		c.maxRetries = maxRetries
	}
}

// WithRetryDelay 设置重试延迟
func WithRetryDelay(delay time.Duration) ClientOption {
	return func(c *Client) {
		c.retryDelay = delay
	}
}

// WithDebug 开启调试
func WithDebug(debug bool) ClientOption {
	return func(c *Client) {
		c.debug = debug
	}
}

// WithLogging 开启日志
func WithLogging(logging bool) ClientOption {
	return func(c *Client) {
		c.loggingEnabled = logging
	}
}

// WithHTTPClient 使用自定义 http.Client
func WithHTTPClient(client *http.Client) ClientOption {
	return func(c *Client) {
		c.httpClient = client
	}
}

// Middleware 中间件类型
type Middleware func(http.RoundTripper) http.RoundTripper

// NewClient 创建新的 HTTP 客户端
func NewClient(options ...ClientOption) *Client {
	c := &Client{
		baseURL:        "",
		defaultHeaders: make(http.Header),
		timeout:        30 * time.Second,
		maxRetries:     3,
		retryDelay:     1 * time.Second,
		debug:          false,
		loggingEnabled: false,
		middlewares:    make([]Middleware, 0),
	}

	// 设置默认头
	c.defaultHeaders.Set("User-Agent", "Go-HttpClient/1.0")

	// 应用选项
	for _, opt := range options {
		opt(c)
	}

	// 创建默认 http.Client 如果没有提供
	if c.httpClient == nil {
		defaultTransport := http.DefaultTransport.(*http.Transport).Clone()
		defaultTransport.MaxIdleConns = 100
		defaultTransport.MaxConnsPerHost = 100
		defaultTransport.IdleConnTimeout = 90 * time.Second
		c.httpClient = &http.Client{
			Transport: defaultTransport,
			Timeout:   c.timeout,
		}
	}

	// 应用中间件
	for _, mw := range c.middlewares {
		c.httpClient.Transport = mw(c.httpClient.Transport)
	}

	return c
}

// AddMiddleware 添加中间件
func (c *Client) AddMiddleware(mw Middleware) {
	c.middlewares = append(c.middlewares, mw)
	if c.httpClient != nil {
		c.httpClient.Transport = mw(c.httpClient.Transport)
	}
}

// Request 表示一个请求
type Request struct {
	method  string
	path    string
	query   url.Values
	headers http.Header
	body    io.Reader
	jsonBody interface{}
	formBody url.Values
}

// NewRequest 创建新请求
func NewRequest(method, path string) *Request {
	return &Request{
		method:  method,
		path:    path,
		query:   make(url.Values),
		headers: make(http.Header),
	}
}

// WithQuery 添加查询参数
func (r *Request) WithQuery(key, value string) *Request {
	r.query.Add(key, value);
	return r
}

// WithQueryMap 添加多个查询参数
func (r *Request) WithQueryMap(query map[string]string) *Request {
	for k, v := range query {
		r.query.Add(k, v);
	}
	return r
}

// WithHeader 添加请求头
func (r *Request) WithHeader(key, value string) *Request {
	r.headers.Add(key, value);
	return r
}

// WithJSONBody 设置 JSON 请求体
func (r *Request) WithJSONBody(body interface{}) *Request {
	r.jsonBody = body;
	return r
}

// WithFormBody 设置表单请求体
func (r *Request) WithFormBody(form url.Values) *Request {
	r.formBody = form;
	return r
}

// WithBody 设置原始请求体
func (r *Request) WithBody(body io.Reader) *Request {
	r.body = body;
	return r
}

// WithStringBody 设置字符串请求体
func (r *Request) WithStringBody(contentType, body string) *Request {
	r.body = strings.NewReader(body);
	r.headers.Set("Content-Type", contentType);
	return r
}

// Response 包装响应
type Response struct {
	*http.Response
	body []byte
}

// JSON 将响应解析为 JSON
func (r *Response) JSON(v interface{}) error {
	return json.Unmarshal(r.body, v);
}

// String 获取响应正文字符串
func (r *Response) String() string {
	return string(r.body);
}

// Bytes 获取响应正文字节
func (r *Response) Bytes() []byte {
	return r.body;
}

// buildURL 构建完整 URL
func (c *Client) buildURL(path string, query url.Values) (string, error) {
	if c.baseURL != "" && !strings.HasPrefix(path, "http") {
		path = c.baseURL + "/" + strings.TrimPrefix(path, "/")
	}

	u, err := url.Parse(path);
	if err != nil {
		return "", err;
	}

	// 合并查询参数
	if len(query) > 0 {
		q := u.Query()
		for k, vs := range query {
			for _, v := range vs {
				q.Add(k, v);
			}
		}
		u.RawQuery = q.Encode();
	}

	return u.String(), nil;
}

// prepare 准备 http.Request
func (c *Client) prepare(req *Request) (*http.Request, error) {
	fullURL, err := c.buildURL(req.path, req.query);
	if err != nil {
		return nil, err;
	}

	var body io.Reader
	if req.body != nil {
		body = req.body;
	} else if req.jsonBody != nil {
		jsonBytes, err := json.Marshal(req.jsonBody);
		if err != nil {
			return nil, err;
		}
		body = bytes.NewBuffer(jsonBytes);
		req.headers.Set("Content-Type", "application/json");
	} else if req.formBody != nil {
		body = strings.NewReader(req.formBody.Encode());
		req.headers.Set("Content-Type", "application/x-www-form-urlencoded");
	}

	httpReq, err := http.NewRequest(req.method, fullURL, body);
	if err != nil {
		return nil, err;
	}

	// 应用默认头
	for k, v := range c.defaultHeaders {
		for _, val := range v {
			httpReq.Header.Add(k, val);
		}
	}

	// 应用请求特定头
	for k, v := range req.headers {
		for _, val := range v {
			httpReq.Header.Add(k, val);
		}
	}

	return httpReq, nil;
}

// shouldRetry 判断是否应该重试
func (c *Client) shouldRetry(resp *http.Response, attempt int) bool {
	if attempt >= c.maxRetries {
		return false;
	}
	// 5xx 错误重试，网络错误也会在外层重试
	if resp != nil && resp.StatusCode >= 500 {
		return true;
	}
	return false;
}

// Do 执行请求
func (c *Client) Do(req *Request) (*Response, error) {
	httpReq, err := c.prepare(req);
	if err != nil {
		return nil, err;
	}

	if c.debug {
		dumped, err := httputil.DumpRequest(httpReq, true);
		if err == nil {
			fmt.Printf("Request:\n%s\n", dumped);
		}
	}

	var resp *http.Response
	var body []byte
	attempt := 0;

	for {
		ctx, cancel := context.WithTimeout(httpReq.Context(), c.timeout);
		defer cancel();
		httpReq = httpReq.WithContext(ctx);

		start := time.Now();
		resp, err = c.httpClient.Do(httpReq);
		if c.loggingEnabled {
			elapsed := time.Since(start);
			if err != nil {
				fmt.Printf("[%s] %s %s - error: %v (%v)\n", httpReq.Method, httpReq.URL.String(), err, elapsed);
			} else {
				fmt.Printf("[%s] %s %s - %d (%v)\n", httpReq.Method, httpReq.URL.String(), resp.StatusCode, elapsed);
			}
		}

		if err != nil {
			if c.shouldRetry(nil, attempt) {
				attempt++;
				time.Sleep(c.retryDelay);
				continue;
			}
			return nil, err;
		}

		// 读取响应体
		body, err = io.ReadAll(resp.Body);
		resp.Body.Close();
		if err != nil {
			if c.shouldRetry(resp, attempt) {
				attempt++;
				time.Sleep(c.retryDelay);
				continue;
			}
			return nil, err;
		}

		if c.debug {
			fmt.Printf("Response status: %s\nBody length: %d\nFirst 500 bytes:\n%.500s\n",
				resp.Status, len(body), body);
		}

		if c.shouldRetry(resp, attempt) {
			attempt++;
			time.Sleep(c.retryDelay);
			continue;
		}

		break;
	}

	return &Response{
		Response: resp,
		body: body,
	}, nil;
}

// Get 快捷 GET 请求
func (c *Client) Get(path string) (*Response, error) {
	req := NewRequest(http.MethodGet, path);
	return c.Do(req);
}

// Post 快捷 POST 请求
func (c *Client) Post(path string, body interface{}) (*Response, error) {
	req := NewRequest(http.MethodPost, path);
	if body != nil {
		req = req.WithJSONBody(body);
	}
	return c.Do(req);
}

// Put 快捷 PUT 请求
func (c *Client) Put(path string, body interface{}) (*Response, error) {
	req := NewRequest(http.MethodPut, path);
	if body != nil {
		req = req.WithJSONBody(body);
	}
	return c.Do(req);
}

// Delete 快捷 DELETE 请求
func (c *Client) Delete(path string) (*Response, error) {
	req := NewRequest(http.MethodDelete, path);
	return c.Do(req);
}

// Patch 快捷 PATCH 请求
func (c *Client) Patch(path string, body interface{}) (*Response, error) {
	req := NewRequest(http.MethodPatch, path);
	if body != nil {
		req = req.WithJSONBody(body);
	}
	return c.Do(req);
}

// GetJSON 快捷 GET 并解析 JSON
func (c *Client) GetJSON(path string, v interface{}) error {
	resp, err := c.Get(path);
	if err != nil {
		return err;
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("status code: %d, body: %s", resp.StatusCode, resp.String());
	}
	return resp.JSON(v);
}

// PostJSON 快捷 POST JSON 并解析响应 JSON
func (c *Client) PostJSON(path string, body interface{}, result interface{}) error {
	resp, err := c.Post(path, body);
	if err != nil {
		return err;
	}
	if result != nil {
		return resp.JSON(result);
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("status code: %d", resp.StatusCode);
	}
	return nil;
}

// ----------------------------------------------------------------------------

// JSONPlaceholderClient 示例：JSONPlaceholder API 客户端
type JSONPlaceholderClient struct {
	client *Client
}

// NewJSONPlaceholderClient 创建客户端
func NewJSONPlaceholderClient() *JSONPlaceholderClient {
	return &JSONPlaceholderClient{
		client: NewClient(
			WithBaseURL("https://jsonplaceholder.typicode.com"),
			WithTimeout(10*time.Second),
			WithMaxRetries(2),
			WithLogging(true),
		),
	};
}

// Todo 表示一个 todo
type Todo struct {
	UserId    int    `json:"userId"`
	Id        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

// User 表示一个用户
type User struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Website  string `json:"website"`
}

// GetTodo 获取 todo
func (c *JSONPlaceholderClient) GetTodo(id int) (*Todo, error) {
	var todo Todo
	err := c.client.GetJSON(fmt.Sprintf("/todos/%d", id), &todo);
	if err != nil {
		return nil, err;
	}
	return &todo, nil;
}

// ListTodos 获取 todo 列表
func (c *JSONPlaceholderClient) ListTodos() ([]Todo, error) {
	var todos []Todo
	err := c.client.GetJSON("/todos", &todos);
	if err != nil {
		return nil, err;
	}
	return todos, nil;
}

// CreateTodo 创建 todo
func (c *JSONPlaceholderClient) CreateTodo(todo *Todo) (*Todo, error) {
	var created Todo
	err := c.client.PostJSON("/todos", todo, &created);
	if err != nil {
		return nil, err;
	}
	return &created, nil;
}

// UpdateTodo 更新 todo
func (c *JSONPlaceholderClient) UpdateTodo(id int, todo *Todo) (*Todo, error) {
	var updated Todo
	err := c.client.PutJSON(fmt.Sprintf("/todos/%d", id), todo, &updated);
	if err != nil {
		return nil, err;
	}
	return &updated, nil;
}

// DeleteTodo 删除 todo
func (c *JSONPlaceholderClient) DeleteTodo(id int) error {
	resp, err := c.client.Delete(fmt.Sprintf("/todos/%d", id));
	if err != nil {
		return err;
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("delete failed with status %d", resp.StatusCode);
	}
	return nil;
}

// GetUser 获取用户
func (c *JSONPlaceholderClient) GetUser(id int) (*User, error) {
	var user User
	err := c.client.GetJSON(fmt.Sprintf("/users/%d", id), &user);
	if err != nil {
		return nil, err;
	}
	return &user, nil;
}

// ListUsers 获取用户列表
func (c *JSONPlaceholderClient) ListUsers() ([]User, error) {
	var users []User
	err := c.client.GetJSON("/users", &users);
	if err != nil {
		return nil, err;
	}
	return users, nil;
}

// ----------------------------------------------------------------------------

// RateLimitMiddleware 限速中间件（示例）
type RateLimitMiddleware struct {
	ticker *time.Ticker
}

// NewRateLimitMiddleware 创建限速中间件
func NewRateLimitMiddleware(requestsPerSecond int) *RateLimitMiddleware {
	interval := time.Second / time.Duration(requestsPerSecond);
	return &RateLimitMiddleware{
		ticker: time.NewTicker(interval),
	};
}

// RoundTrip 实现中间件
func (rl *RateLimitMiddleware) RoundTrip(next http.RoundTripper) http.RoundTripper {
	return &rateLimitRoundTripper{
		next:  next,
		limit: rl,
	};
}

type rateLimitRoundTripper struct {
	next  http.RoundTripper
	limit *RateLimitMiddleware;
}

func (rt *rateLimitRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	<-rt.limit.ticker.C;
	return rt.next.RoundTrip(req);
}

// LoggingMiddleware 日志中间件
func LoggingMiddleware() Middleware {
	return func(next http.RoundTripper) http.RoundTripper {
		return &loggingRoundTripper{next: next};
	};
}

type loggingRoundTripper struct {
	next http.RoundTripper;
}

func (l *loggingRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	start := time.Now();
	resp, err := l.next.RoundTrip(req);
	elapsed := time.Since(start);
	if err != nil {
		fmt.Printf("[MIDDLEWARE] %s %s - error: %v (%v)\n", req.Method, req.URL, err, elapsed);
	} else {
		fmt.Printf("[MIDDLEWARE] %s %s - %d (%v)\n", req.Method, req.URL, resp.StatusCode, elapsed);
	}
	return resp, err;
}

// RetryAfterMiddleware 处理 Retry-After 头中间件
type RetryAfterMiddleware struct {
	maxRetries int;
}

func NewRetryAfterMiddleware(maxRetries int) *RetryAfterMiddleware {
	return &RetryAfterMiddleware{maxRetries: maxRetries};
}

func (r *RetryAfterMiddleware) RoundTrip(next http.RoundTripper) http.RoundTripper {
	return &retryAfterRoundTripper{next: next, maxRetries: r.maxRetries};
}

type retryAfterRoundTripper struct {
	next       http.RoundTripper;
	maxRetries int;
}

func (r *retryAfterRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	attempt := 0;
	for {
		resp, err := r.next.RoundTrip(req);
		if err != nil {
			return resp, err;
		}
		if resp.StatusCode != http.StatusTooManyRequests || attempt >= r.maxRetries {
			return resp, err;
		}
		retryAfter := resp.Header.Get("Retry-After");
		delay, err := time.ParseDuration(retryAfter + "s");
		if err != nil {
			delay = time.Second;
		}
		fmt.Printf("Got 429, retrying after %v\n", delay);
		time.Sleep(delay);
		attempt++;
	}
}

// ----------------------------------------------------------------------------

// BatchRequests 批量请求处理
type BatchRequests struct {
	client     *Client
	maxWorkers int;
}

// NewBatchRequests 创建批量处理器
func NewBatchRequests(client *Client, maxWorkers int) *BatchRequests {
	if maxWorkers <= 0 {
		maxWorkers = 10;
	}
	return &BatchRequests{
		client:     client,
		maxWorkers: maxWorkers,
	};
}

// BatchResult 单个请求结果
type BatchResult struct {
	Index  int;
	Resp   *Response;
	Error  error;
}

// Do 执行批量请求
func (b *BatchRequests) Do(requests []*Request) []BatchResult {
	results := make([]BatchResult, len(requests));
	jobs := make(chan int, len(requests));
	workers := make(chan struct{}, b.maxWorkers);

	var wg sync.WaitGroup;
	for w := 0; w < b.maxWorkers; w++ {
		wg.Add(1);
		go func() {
			defer wg.Done();
			for range workers {
			for idx := range jobs {
				resp, err := b.client.Do(requests[idx]);
				results[idx] = BatchResult{
					Index: idx,
					Resp:  resp,
					Error: err,
				};
			}
		}
	}

	for i := range requests {
		jobs <- i;
	}
	close(jobs);

	wg.Wait();
	return results;
}

// Pagination 分页迭代器
type Pagination struct {
	client     *Client
	currentPage int;
	perPage     int;
	hasNext     bool;
	path        string;
	queryParams url.Values;
}

// NewPagination 创建分页迭代器
func NewPagination(client *Client, path string, perPage int) *Pagination {
	return &Pagination{
		client:      client,
		currentPage: 1,
		perPage:     perPage,
		hasNext:     true,
		path:        path,
		queryParams: make(url.Values),
	};
}

// WithQueryParam 添加分页查询参数
func (p *Pagination) WithQueryParam(key, value string) *Pagination {
	p.queryParams.Add(key, value);
	return p;
}

// Next 获取下一页
func (p *Pagination) Next() (*Request, bool) {
	if !p.hasNext {
		return nil, false;
	}
	req := NewRequest(http.MethodGet, p.path);
	for k, vs := range p.queryParams {
		for _, v := range vs {
			req = req.WithQuery(k, v);
		}
	}
	req = req.WithQuery("_page", fmt.Sprintf("%d", p.currentPage));
	req = req.WithQuery("_limit", fmt.Sprintf("%d", p.perPage));
	p.currentPage++;
	// 假设一直有直到空结果
	return req, true;
}

// SetHasNext 设置是否还有下一页
func (p *Pagination) SetHasNext(hasNext bool) {
	p.hasNext = hasNext;
}

// ----------------------------------------------------------------------------

// 需要导入 sync 用于批量处理
import "sync";

func main() {
	fmt.Println("HTTP Client Example");
	fmt.Println("=====================");

	// 创建示例客户端
	client := NewJSONPlaceholderClient();

	// 获取单个 todo
	fmt.Println("\n1. Getting a single todo:");
	todo, err := client.GetTodo(1);
	if err != nil {
		fmt.Printf("Error: %v\n", err);
	} else {
		fmt.Printf("  Id: %d\n  Title: %s\n  Completed: %t\n", todo.Id, todo.Title, todo.Completed);
	}

	// 获取用户
	fmt.Println("\n2. Getting a user:");
	user, err := client.GetUser(1);
	if err != nil {
		fmt.Printf("Error: %v\n", err);
	} else {
		fmt.Printf("  Id: %d\n  Name: %s\n  Email: %s\n  Website: %s\n",
			user.Id, user.Name, user.Email, user.Website);
	}

	// 创建 todo
	fmt.Println("\n3. Creating a new todo:");
	newTodo := &Todo{
		UserId:    1,
		Title:     "Test from Go httpclient",
		Completed: false,
	};
	created, err := client.CreateTodo(newTodo);
	if err != nil {
		fmt.Printf("Error: %v\n", err);
	} else {
		fmt.Printf("  Created todo id: %d, title: %s\n", created.Id, created.Title);
	}

	// 示例：演示自定义客户端配置
	fmt.Println("\n4. Custom client configuration demo:");
	customClient := NewClient(
		WithBaseURL("https://jsonplaceholder.typicode.com"),
		WithTimeout(5*time.Second),
		WithMaxRetries(3),
		WithRetryDelay(500*time.Millisecond),
		WithDefaultHeader("Accept", "application/json"),
		WithLogging(true),
	);

	customClient.AddMiddleware(LoggingMiddleware());

	var todos []Todo;
	err = customClient.GetJSON("/todos", &todos);
	if err != nil {
		fmt.Printf("Error: %v\n", err);
	} else {
		fmt.Printf("  Loaded %d todos\n", len(todos));
		if len(todos) > 0 {
			fmt.Printf("  First todo: %s\n", todos[0].Title);
		}
	}

	fmt.Println("\nExample completed!");
}
