package com.example.algorithms;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 常见算法实现集合
 * 包含排序、搜索、动态规划、贪心等算法
 */
public class Algorithm {

    // ========== 排序算法 ==========

    /**
     * 冒泡排序
     * 时间复杂度: O(n^2)
     * 空间复杂度: O(1)
     */
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    swap(arr, j, j + 1);
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
    }

    /**
     * 选择排序
     * 时间复杂度: O(n^2)
     * 空间复杂度: O(1)
     */
    public static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            swap(arr, i, minIdx);
        }
    }

    /**
     * 插入排序
     * 时间复杂度: O(n^2)
     * 空间复杂度: O(1)
     */
    public static void insertionSort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

    /**
     * 希尔排序
     * 时间复杂度: O(n log n) ~ O(n^2)
     * 空间复杂度: O(1)
     */
    public static void shellSort(int[] arr) {
        int n = arr.length;
        for (int gap = n / 2; gap > 0; gap /= 2) {
            for (int i = gap; i < n; i++) {
                int temp = arr[i];
                int j = i;
                while (j >= gap && arr[j - gap] > temp) {
                    arr[j] = arr[j - gap];
                    j -= gap;
                }
                arr[j] = temp;
            }
        }
    }

    /**
     * 归并排序
     * 时间复杂度: O(n log n)
     * 空间复杂度: O(n)
     */
    public static void mergeSort(int[] arr) {
        if (arr.length > 1) {
            int mid = arr.length / 2;
            int[] left = Arrays.copyOfRange(arr, 0, mid);
            int[] right = Arrays.copyOfRange(arr, mid, arr.length);

            mergeSort(left);
            mergeSort(right);
            merge(arr, left, right);
        }
    }

    private static void merge(int[] arr, int[] left, int[] right) {
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] < right[j]) {
                arr[k++] = left[i++];
            } else {
                arr[k++] = right[j++];
            }
        }
        while (i < left.length) {
            arr[k++] = left[i++];
        }
        while (j < right.length) {
            arr[k++] = right[j++];
        }
    }

    /**
     * 快速排序
     * 时间复杂度: O(n log n) 平均，O(n^2) 最坏
     * 空间复杂度: O(log n) 递归栈
     */
    public static void quickSort(int[] arr) {
        quickSort(arr, 0, arr.length - 1);
    }

    private static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }

    private static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, high);
        return i + 1;
    }

    /**
     * 随机化快速排序
     */
    public static void quickSortRandom(int[] arr) {
        quickSortRandom(arr, 0, arr.length - 1);
    }

    private static void quickSortRandom(int[] arr, int low, int high) {
        if (low < high) {
            int pi = randomPartition(arr, low, high);
            quickSortRandom(arr, low, pi - 1);
            quickSortRandom(arr, pi + 1, high);
        }
    }

    private static int randomPartition(int[] arr, int low, int high) {
        int pivotIdx = ThreadLocalRandom.current().nextInt(low, high + 1);
        swap(arr, pivotIdx, high);
        return partition(arr, low, high);
    }

    /**
     * 堆排序
     * 时间复杂度: O(n log n)
     * 空间复杂度: O(1)
     */
    public static void heapSort(int[] arr) {
        int n = arr.length;

        // Build max heap
        for (int i = n / 2 - 1; i >= 0; i--) {
            heapify(arr, n, i);
        }

        // Extract elements from heap one by one
        for (int i = n - 1; i > 0; i--) {
            swap(arr, 0, i);
            heapify(arr, i, 0);
        }
    }

    private static void heapify(int[] arr, int n, int i) {
        int largest = i;
        int left = 2 * i + 1;
        int right = 2 * i + 2;

        if (left < n && arr[left] > arr[largest]) {
            largest = left;
        }
        if (right < n && arr[right] > arr[largest]) {
            largest = right;
        }

        if (largest != i) {
            swap(arr, i, largest);
            heapify(arr, n, largest);
        }
    }

    /**
     * 计数排序
     * 时间复杂度: O(n + k)，k是数据范围
     * 空间复杂度: O(k)
     */
    public static void countingSort(int[] arr, int maxValue) {
        int n = arr.length;
        int[] count = new int[maxValue + 1];
        int[] output = new int[n];

        for (int num : arr) {
            count[num]++;
        }

        for (int i = 1; i <= maxValue; i++) {
            count[i] += count[i - 1];
        }

        for (int i = n - 1; i >= 0; i--) {
            output[count[arr[i]] - 1] = arr[i];
            count[arr[i]]--;
        }

        System.arraycopy(output, 0, arr, 0, n);
    }

    /**
     * 交换数组中两个位置
     */
    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    // ========== 搜索算法 ==========

    /**
     * 二分查找（迭代版本）
     * 时间复杂度: O(log n)
     * 空间复杂度: O(1)
     */
    public static int binarySearch(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1; // not found
    }

    /**
     * 二分查找（递归版本）
     */
    public static int binarySearchRecursive(int[] arr, int target) {
        return binarySearchRecursiveHelper(arr, target, 0, arr.length - 1);
    }

    private static int binarySearchRecursiveHelper(int[] arr, int target, int left, int right) {
        if (left > right) {
            return -1;
        }
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            return binarySearchRecursiveHelper(arr, target, mid + 1, right);
        } else {
            return binarySearchRecursiveHelper(arr, target, left, mid - 1);
        }
    }

    /**
     * 查找第一个大于等于target的位置（下界）
     */
    public static int lowerBound(int[] arr, int target) {
        int left = 0;
        int right = arr.length;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] >= target) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        return left;
    }

    /**
     * 查找第一个大于target的位置（上界）
     */
    public static int upperBound(int[] arr, int target) {
        int left = 0;
        int right = arr.length;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] > target) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        return left;
    }

    /**
     * 线性查找
     */
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }

    // ========== 字符串算法 ==========

    /**
     * KMP算法进行模式匹配
     * 返回第一个匹配位置，-1表示不匹配
     */
    public static int kmpSearch(String text, String pattern) {
        int n = text.length();
        int m = pattern.length();

        if (m == 0) return 0;

        int[] lps = computeLPS(pattern);
        int i = 0; // index for text
        int j = 0; // index for pattern

        while (i < n) {
            if (pattern.charAt(j) == text.charAt(i)) {
                i++;
                j++;
            }
            if (j == m) {
                return i - j; // found
            } else if (i < n && pattern.charAt(j) != text.charAt(i)) {
                if (j != 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }
        return -1; // not found
    }

    /**
     * 计算LPS数组
     */
    private static int[] computeLPS(String pattern) {
        int m = pattern.length();
        int[] lps = new int[m];
        int len = 0;
        int i = 1;

        while (i < m) {
            if (pattern.charAt(i) == pattern.charAt(len)) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len != 0) {
                    len = lps[len - 1];
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        return lps;
    }

    /**
     * 最长公共子序列
     * 时间复杂度: O(m * n)
     */
    public static int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length();
        int n = text2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[m][n];
    }

    /**
     * 最长回文子串 - 中心扩展法
     */
    public static String longestPalindromicSubstring(String s) {
        if (s == null || s.length() < 1) return "";

        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > end - start) {
                start = i - (len - 1) / 2;
                end = i + len / 2;
            }
        }
        return s.substring(start, end + 1);
    }

    private static int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }

    /**
     * 编辑距离
     * 将word1转换为word2的最少操作次数
     */
    public static int editDistance(String word1, String word2) {
        int m = word1.length();
        int n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        Math.min(dp[i - 1][j], dp[i][j - 1]),
                        dp[i - 1][j - 1]
                    );
                }
            }
        }
        return dp[m][n];
    }

    // ========== 动态规划 ==========

    /**
     * 零钱兑换问题
     * 最少硬币数凑出amount，返回-1表示不能凑出
     */
    public static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;

        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                }
            }
        }

        return dp[amount] > amount ? -1 : dp[amount];
    }

    /**
     * 爬楼梯问题
     * n阶楼梯，每次走1或2步，有多少种走法
     */
    public static int climbStairs(int n) {
        if (n <= 2) return n;
        int[] dp = new int[n + 1];
        dp[1] = 1;
        dp[2] = 2;
        for (int i = 3; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    /**
     * 最大子数组和（Kadane算法）
     */
    public static int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int currentMax = nums[0];

        for (int i = 1; i < nums.length; i++) {
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }

        return maxSoFar;
    }

    /**
     * 最长递增子序列长度
     */
    public static int longestIncreasingSubsequence(int[] nums) {
        int n = nums.length;
        if (n == 0) return 0;

        int[] tails = new int[n];
        int len = 0;

        for (int num : nums) {
            int left = 0, right = len;
            while (left < right) {
                int mid = left + (right - left) / 2;
                if (tails[mid] < num) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }
            tails[left] = num;
            if (left == len) {
                len++;
            }
        }

        return len;
    }

    /**
     * 0-1背包问题
     */
    public static int knapsack(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        int[][] dp = new int[n + 1][capacity + 1];

        for (int i = 1; i <= n; i++) {
            int w = weights[i - 1];
            int v = values[i - 1];
            for (int j = 0; j <= capacity; j++) {
                if (w > j) {
                    dp[i][j] = dp[i - 1][j];
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
                }
            }
        }

        return dp[n][capacity];
    }

    /**
     * 0-1背包问题优化空间版本
     */
    public static int knapsackOptimized(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        int[] dp = new int[capacity + 1];

        for (int i = 0; i < n; i++) {
            int w = weights[i];
            int v = values[i];
            for (int j = capacity; j >= w; j--) {
                dp[j] = Math.max(dp[j], dp[j - w] + v);
            }
        }

        return dp[capacity];
    }

    /**
     * 分割等和子集问题
     * 判断是否能将数组分成两个和相等的子集
     */
    public static boolean canPartition(int[] nums) {
        int sum = 0;
        for (int num : nums) {
            sum += num;
        }

        if (sum % 2 != 0) {
            return false;
        }

        int target = sum / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;

        for (int num : nums) {
            for (int j = target; j >= num; j--) {
                dp[j] = dp[j] || dp[j - num];
            }
        }

        return dp[target];
    }

    /**
     * 打家劫舍
     * 不能偷相邻的房子，求最大金额
     */
    public static int rob(int[] nums) {
        int n = nums.length;
        if (n == 0) return 0;
        if (n == 1) return nums[0];

        int prevPrev = 0;
        int prev = nums[0];

        for (int i = 1; i < n; i++) {
            int current = Math.max(prev, prevPrev + nums[i]);
            prevPrev = prev;
            prev = current;
        }

        return prev;
    }

    /**
     * 不同路径问题
     * 从左上角到右下角有多少种不同路径（只能向右向下）
     */
    public static int uniquePaths(int m, int n) {
        int[][] dp = new int[m][n];

        for (int i = 0; i < m; i++) {
            dp[i][0] = 1;
        }
        for (int j = 0; j < n; j++) {
            dp[0][j] = 1;
        }

        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
            }
        }

        return dp[m - 1][n - 1];
    }

    /**
     * 最小路径和
     * 从左上角到右下角路径上的最小和
     */
    public static int minPathSum(int[][] grid) {
        int m = grid.length;
        int n = grid[0].length;

        int[][] dp = new int[m][n];
        dp[0][0] = grid[0][0];

        for (int i = 1; i < m; i++) {
            dp[i][0] = dp[i - 1][0] + grid[i][0];
        }
        for (int j = 1; j < n; j++) {
            dp[0][j] = dp[0][j - 1] + grid[0][j];
        }

        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + grid[i][j];
            }
        }

        return dp[m - 1][n - 1];
    }

    // ========== 贪心算法 ==========

    /**
     * 活动选择问题
     * 给定开始和结束时间，选择最多不重叠的活动
     */
    public static List<int[]> activitySelection(int[] start, int[] end) {
        int n = start.length;
        List<int[]> activities = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            activities.add(new int[]{start[i], end[i]});
        }

        // 按结束时间排序
        activities.sort(Comparator.comparingInt(a -> a[1]));

        List<int[]> result = new ArrayList<>();
        int lastEnd = -1;

        for (int[] activity : activities) {
            if (activity[0] >= lastEnd) {
                result.add(activity);
                lastEnd = activity[1];
            }
        }

        return result;
    }

    /**
     * 分数背包问题
     * 可以切分物品，求最大价值
     */
    public static double fractionalKnapsack(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        double[][] items = new double[n][3];
        for (int i = 0; i < n; i++) {
            items[i][0] = weights[i];
            items[i][1] = values[i];
            items[i][2] = (double) values[i] / weights[i];
        }

        // 按价值密度排序
        Arrays.sort(items, (a, b) -> Double.compare(b[2], a[2]));

        double totalValue = 0;
        int remainingCapacity = capacity;

        for (double[] item : items) {
            int w = (int) item[0];
            int v = (int) item[1];
            if (w <= remainingCapacity) {
                totalValue += v;
                remainingCapacity -= w;
            } else {
                totalValue += item[2] * remainingCapacity;
                break;
            }
        }

        return totalValue;
    }

    /**
     * 跳跃游戏
     * 判断是否能到达最后一个位置
     */
    public static boolean canJump(int[] nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) {
                return false;
            }
            maxReach = Math.max(maxReach, i + nums[i]);
            if (maxReach >= nums.length - 1) {
                return true;
            }
        }
        return false;
    }

    /**
     * 跳跃游戏II
     * 最少跳跃次数到达最后
     */
    public static int jump(int[] nums) {
        int jumps = 0;
        int currentEnd = 0;
        int farthest = 0;

        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) {
                jumps++;
                currentEnd = farthest;
            }
        }

        return jumps;
    }

    // ========== 滑动窗口 ==========

    /**
     * 长度最小的子数组
     * 找出和大于等于target的长度最小的子数组长度
     */
    public static int minSubArrayLen(int target, int[] nums) {
        int n = nums.length;
        int left = 0;
        int sum = 0;
        int minLen = Integer.MAX_VALUE;

        for (int right = 0; right < n; right++) {
            sum += nums[right];
            while (sum >= target) {
                minLen = Math.min(minLen, right - left + 1);
                sum -= nums[left];
                left++;
            }
        }

        return minLen == Integer.MAX_VALUE ? 0 : minLen;
    }

    /**
     * 无重复字符的最长子串
     */
    public static int lengthOfLongestSubstring(String s) {
        int n = s.length();
        int maxLen = 0;
        int[] lastSeen = new int[128];
        Arrays.fill(lastSeen, -1);

        int left = 0;
        for (int right = 0; right < n; right++) {
            char c = s.charAt(right);
            if (lastSeen[c] >= left) {
                left = lastSeen[c] + 1;
            }
            lastSeen[c] = right;
            maxLen = Math.max(maxLen, right - left + 1);
        }

        return maxLen;
    }

    /**
     * 滑动窗口最大值
     */
    public static int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new LinkedList<>();

        for (int i = 0; i < n; i++) {
            // 移除窗口外的元素
            while (!deque.isEmpty() && deque.peekFirst() <= i - k) {
                deque.pollFirst();
            }

            // 移除所有比当前元素小的元素
            while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) {
                deque.pollLast();
            }

            deque.offerLast(i);

            // 记录窗口最大值
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }

        return result;
    }

    // ========== 双指针 ==========

    /**
     * 三数之和
     */
    public static List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(nums);

        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) {
                continue;
            }

            int left = i + 1;
            int right = nums.length - 1;
            int target = -nums[i];

            while (left < right) {
                int sum = nums[left] + nums[right];
                if (sum == target) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    left++;
                    right--;
                    while (left < right && nums[left] == nums[left - 1]) left++;
                    while (left < right && nums[right] == nums[right + 1]) right--;
                } else if (sum < target) {
                    left++;
                } else {
                    right--;
                }
            }
        }

        return result;
    }

    /**
     * 盛最多水的容器
     */
    public static int maxArea(int[] height) {
        int left = 0;
        int right = height.length - 1;
        int maxArea = 0;

        while (left < right) {
            int width = right - left;
            int currentHeight = Math.min(height[left], height[right]);
            int area = width * currentHeight;
            maxArea = Math.max(maxArea, area);

            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }

        return maxArea;
    }

    /**
     * 移动零
     * 将所有0移到末尾，保持非零元素顺序
     */
    public static void moveZeroes(int[] nums) {
        int slow = 0;
        for (int fast = 0; fast < nums.length; fast++) {
            if (nums[fast] != 0) {
                swap(nums, slow, fast);
                slow++;
            }
        }
    }

    // ========== 数学问题 ==========

    /**
     * 欧几里得算法求最大公约数
     */
    public static int gcd(int a, int b) {
        while (b != 0) {
            int temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    /**
     * 最小公倍数
     */
    public static int lcm(int a, int b) {
        return a * b / gcd(a, b);
    }

    /**
     * 判断素数
     */
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;

        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * 埃拉托斯特尼筛法求素数
     */
    public static List<Integer> sieveOfEratosthenes(int n) {
        boolean[] isPrime = new boolean[n + 1];
        Arrays.fill(isPrime, true);
        isPrime[0] = isPrime[1] = false;

        for (int p = 2; p * p <= n; p++) {
            if (isPrime[p]) {
                for (int multiple = p * p; multiple <= n; multiple += p) {
                    isPrime[multiple] = false;
                }
            }
        }

        List<Integer> primes = new ArrayList<>();
        for (int i = 2; i <= n; i++) {
            if (isPrime[i]) {
                primes.add(i);
            }
        }
        return primes;
    }

    /**
     * 快速幂
     * 计算 base^exponent
     */
    public static long fastPow(long base, long exponent) {
        long result = 1;
        base = base;
        while (exponent > 0) {
            if (exponent % 2 == 1) {
                result = result * base;
            }
            base = base * base;
            exponent = exponent / 2;
        }
        return result;
    }

    /**
     * 模快速幂
     */
    public static long fastPowMod(long base, long exponent, long mod) {
        long result = 1;
        base = base % mod;
        while (exponent > 0) {
            if (exponent % 2 == 1) {
                result = (result * base) % mod;
            }
            base = (base * base) % mod;
            exponent = exponent / 2;
        }
        return result;
    }

    /**
     * 斐波那契数列
     */
    public static long fibonacci(int n) {
        if (n <= 1) return n;
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long temp = b;
            b = a + b;
            a = temp;
        }
        return b;
    }

    /**
     * 矩阵乘法
     */
    public static int[][] multiply(int[][] a, int[][] b) {
        int m = a.length;
        int n = b[0].length;
        int p = b.length;
        int[][] result = new int[m][n];

        for (int i = 0; i < m; i++) {
            for (int k = 0; k < p; k++) {
                if (a[i][k] != 0) {
                    for (int j = 0; j < n; j++) {
                        result[i][j] += a[i][k] * b[k][j];
                    }
                }
            }
        }
        return result;
    }

    // ========== 工具方法 ==========

    /**
     * 生成随机数组
     */
    public static int[] generateRandomArray(int size, int min, int max) {
        int[] arr = new int[size];
        for (int i = 0; i < size; i++) {
            arr[i] = ThreadLocalRandom.current().nextInt(min, max + 1);
        }
        return arr;
    }

    /**
     * 打印数组
     */
    public static void printArray(int[] arr) {
        System.out.println(Arrays.toString(arr));
    }

    /**
     * 判断数组是否已排序
     */
    public static boolean isSorted(int[] arr) {
        for (int i = 0; i < arr.length - 1; i++) {
            if (arr[i] > arr[i + 1]) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        // 测试排序算法
        System.out.println("Testing sorting algorithms:");
        int[] arr = generateRandomArray(10, 1, 100);
        System.out.println("Original: " + Arrays.toString(arr));
        quickSort(arr);
        System.out.println("After quickSort: " + Arrays.toString(arr));
        System.out.println("Is sorted: " + isSorted(arr));

        // 测试二分查找
        System.out.println("\nTesting binarySearch:");
        int[] sortedArr = {1, 3, 5, 7, 9, 11, 13, 15};
        int target = 7;
        int idx = binarySearch(sortedArr, target);
        System.out.println("Found " + target + " at index: " + idx);

        // 测试字符串算法
        System.out.println("\nTesting string algorithms:");
        String text = "ABABDABACDABABCABAB";
        String pattern = "ABABCABAB";
        int kmpIdx = kmpSearch(text, pattern);
        System.out.println("KMP search found at: " + kmpIdx);

        String lps = longestPalindromicSubstring("babad");
        System.out.println("Longest palindromic substring of 'babad': " + lps);

        int lcs = longestCommonSubsequence("abcde", "ace");
        System.out.println("LCS length of 'abcde' and 'ace': " + lcs);

        // 测试动态规划
        System.out.println("\nTesting dynamic programming:");
        int[] coins = {1, 2, 5};
        int amount = 11;
        System.out.println("Coin change " + amount + ": " + coinChange(coins, amount));

        int[] nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println("Max subarray sum: " + maxSubArray(nums));

        int uniquePaths = uniquePaths(3, 7);
        System.out.println("Unique paths 3x7: " + uniquePaths);

        // 测试贪心算法
        System.out.println("\nTesting greedy algorithms:");
        int[] jumps = {2, 3, 1, 1, 4};
        System.out.println("Can jump: " + canJump(jumps));
        System.out.println("Min jumps: " + jump(jumps));

        // 测试滑动窗口
        System.out.println("\nTesting sliding window:");
        String s = "abcabcbb";
        System.out.println("Longest substring without repeating chars: " + lengthOfLongestSubstring(s));

        // 测试数学方法
        System.out.println("\nTesting math:");
        System.out.println("GCD of 48 and 18: " + gcd(48, 18));
        System.out.println("Is 17 prime: " + isPrime(17));
        System.out.println("Primes up to 30: " + sieveOfEratosthenes(30));
        System.out.println("2^10: " + fastPow(2, 10));
        System.out.println("Fibonacci(10): " + fibonacci(10));
    }
}
