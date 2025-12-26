function largestRectangleArea(heights) {
  const stack = [];
  let max = 0;
  for (let i = 0; i < heights.length; i++) {
    while (stack.length > 0 && heights[i] < stack[stack.length - 1][1]) {
      const [idx, height] = stack.pop();
      const width = i - idx;
      max = Math.max(max, height * width);
    }
    stack.push([i, heights[i]]);
  }
  return max;
}
console.log(largestRectangleArea([2, 1, 5, 6, 2, 3]));
