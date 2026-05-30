document.documentElement.requestFullscreen();
let nodes = [];
let edges = [];
let graph = {};
let selectedNodes = [];
let draggingNode = null;
let pointerDown = false;
let didMove = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let downX = 0;
let downY = 0;
let highlightPath = [];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const edgesCard = document.getElementById("edgesCard");
const nodesCard = document.getElementById("nodesCard");

const landing = document.getElementById("landing");
const app = document.getElementById("app");
const startBtn = document.getElementById("startBtn");
const addNodeBtn = document.getElementById("addNodeBtn");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");
const output = document.getElementById("output");
const tableBody = document.getElementById("tableBody");

const nodeNameInput = document.getElementById("nodeName");
const startNodeInput = document.getElementById("startNode");
const goalNodeInput = document.getElementById("goalNode");
const algorithmSelect = document.getElementById("algorithm");
const nodeCostInput = document.getElementById("nodeCost");
const nodesTableBody = document.getElementById("nodesTableBody");

startBtn.addEventListener("click", () => {
  landing.classList.add("hidden");
  app.classList.remove("hidden");
  draw();
});

addNodeBtn.addEventListener("click", () => {
  addNode();
  updateNodesTable();
  draw();
});
runBtn.addEventListener("click", runAlgorithm);
resetBtn.addEventListener("click", resetGraph);
clearSelectionBtn.addEventListener("click", () => {
  selectedNodes = [];
  draw();
});

function getCanvasPos(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function sameName(a, b) {
  return String(a).trim().toUpperCase() === String(b).trim().toUpperCase();
}

function findNode(name) {
  return nodes.find(node => sameName(node.name, name));
}

function getNodeAt(x, y) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (Math.hypot(node.x - x, node.y - y) <= 24) {
      return node;
    }
  }
  return null;
}

function edgeKey(a, b) {
  const first = String(a).toUpperCase();
  const second = String(b).toUpperCase();
  return [first, second].sort().join("::");
}

function getEdgeCost(a, b) {
  const n1 = String(a).trim();
  const n2 = String(b).trim();
  const list = graph[n1] || [];
  const match = list.find(item => sameName(item.node, n2));
  return match ? match.cost : null;
}

function addNode() {
  const name = nodeNameInput.value.trim().toUpperCase();
  const cost = nodeCostInput.value.trim();

  if (!name) {
    alert("Enter node name");
    return;
  }

  if (nodes.some(n => sameName(n.name, name))) {
    alert("Node already exists!");
    return;
  }

  const x = 70 + Math.random() * (canvas.width - 140);
  const y = 70 + Math.random() * (canvas.height - 140);

  let hValue = null;

  if (cost !== "") {
    if (isNaN(Number(cost))) {
      alert("Heuristic must be a number");
      return;
    }
    hValue = Number(cost);
  }

  nodes.push({
    name,
    x,
    y,
    h: hValue
  });

  graph[name] = [];

  nodeNameInput.value = "";
  nodeCostInput.value = "";

  updateNodesTable();
  draw();
}

// Nodes Table
function updateNodesTable() {
  nodesTableBody.innerHTML = "";

  nodes.forEach(node => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${node.name}</td>
      <td>${node.h}</td>
      <td><button class="delete-btn" onclick="deleteNode('${node.name}')">Delete</button></td>
    `;

    nodesTableBody.appendChild(row);
  });
  nodesCard.style.display = nodes.length ? "block" : "none";
}

// Delete Node
function deleteNode(name) {
  nodes = nodes.filter(n => !sameName(n.name, name));

  edges = edges.filter(e => !sameName(e.from, name) && !sameName(e.to, name));

  delete graph[name];

  for (let key in graph) {
    graph[key] = graph[key].filter(n => !sameName(n.node, name));
  }

  updateTable();
  updateNodesTable();
  draw();
}

// Delete Edge
function deleteEdge(from, to) {
  edges = edges.filter(e =>
    !(sameName(e.from, from) && sameName(e.to, to)) &&
    !(sameName(e.from, to) && sameName(e.to, from))
  );

  graph[from] = graph[from].filter(n => !sameName(n.node, to));
  graph[to] = graph[to].filter(n => !sameName(n.node, from));

  updateTable();
  draw();
}

function addEdgeManual(from, to, cost) {
  const fromNode = findNode(from);
  const toNode = findNode(to);
  const numericCost = Number(cost);

  if (!fromNode || !toNode) {
    alert("Invalid nodes");
    return false;
  }

  if (Number.isNaN(numericCost)) {
    alert("Cost must be a number");
    return false;
  }

  if (sameName(fromNode.name, toNode.name)) {
    alert("Choose two different nodes");
    return false;
  }

  const duplicate = edges.some(edge =>
    (edge.from === from && edge.to === to) ||
    (edge.from === to && edge.to === from)
  );

  if (duplicate) {
    alert("Edge already exists");
    return false;
  }

  edges.push({ from: fromNode.name, to: toNode.name, cost: numericCost });
  graph[fromNode.name].push({ node: toNode.name, cost: numericCost });
  graph[toNode.name].push({ node: fromNode.name, cost: numericCost });

  updateTable();
  return true;
}

function updateTable() {
  tableBody.innerHTML = "";

  edges.forEach(edge => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${edge.from}</td>
      <td>${edge.to}</td>
      <td>${edge.cost}</td>
      <td><button class="delete-btn" onclick="deleteEdge('${edge.from}','${edge.to}')">Delete</button></td>
    `;

    tableBody.appendChild(row);
  });
  edgesCard.style.display = edges.length ? "block" : "none";
}

function resetGraph() {
  nodes = [];
  edges = [];
  graph = {};
  selectedNodes = [];
  draggingNode = null;
  pointerDown = false;
  didMove = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  downX = 0;
  downY = 0;
  highlightPath = [];
  tableBody.innerHTML = "";
  output.textContent = "Graph cleared.";
  draw();
  edgesCard.style.display = "none";
  nodesCard.style.display = "none";
}

function pathCost(path) {
  let total = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const cost = getEdgeCost(path[i], path[i + 1]);
    if (cost === null) return Infinity;
    total += cost;
  }

  return total;
}

function heuristic(nodeName, goalName) {
  const node = findNode(nodeName);
  return node ? node.h : Infinity;
}

// BFS
function bfs(start, goal) {
  const queue = [[start]];
  const visited = new Set([start]);
  const steps = [];

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];

    steps.push(`Expand ${current}`);

    if (sameName(current, goal)) {
      return { path, steps };
    }

    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor.node)) {
        visited.add(neighbor.node);
        queue.push([...path, neighbor.node]);
      }
    }
  }

  return null;
}

 // DFS
function dfs(start, goal) {
  const stack = [[start]];
  const visited = new Set([start]);
  const steps = [];

  while (stack.length) {
    const path = stack.pop();
    const current = path[path.length - 1];

    steps.push(`Expand ${current}`);

    if (sameName(current, goal)) {
      return { path, steps };
    }

    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor.node)) {
        visited.add(neighbor.node);
        stack.push([...path, neighbor.node]);
      }
    }
  }

  return null;
}

// Greedy
function greedy(start, goal) {
  const open = [[start]];
  const visited = new Set([start]);
  const steps = [];

  function heuristic(node) {
    const n = findNode(node);
    return n ? n.h : Infinity;
  }

  while (open.length) {
    open.sort((a, b) =>
      heuristic(a[a.length - 1]) - heuristic(b[b.length - 1])
    );

    const path = open.shift();
    const current = path[path.length - 1];

    steps.push(`Expand ${current} | h=${heuristic(current)}`);

    if (sameName(current, goal)) {
      return { path, steps };
    }

    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor.node)) {
        visited.add(neighbor.node);
        open.push([...path, neighbor.node]);
      }
    }
  }

  return null;
}

// A*
function astar(start, goal) {
  const open = [{ node: start, path: [start], g: 0 }];
  const steps = [];

  const gScore = {};
  gScore[start] = 0;

  function heuristic(node) {
    const n = findNode(node);
    return n ? n.h : Infinity;
  }

  while (open.length) {
    open.sort((a, b) =>
      (a.g + heuristic(a.node)) - (b.g + heuristic(b.node))
    );

    const current = open.shift();

    steps.push(
      `Expand ${current.node} | g=${current.g} | h=${heuristic(current.node)}`
    );

    if (sameName(current.node, goal)) {
      return { path: current.path, cost: current.g, steps };
    }

    for (const neighbor of graph[current.node] || []) {
      const newG = current.g + neighbor.cost;

      if (gScore[neighbor.node] === undefined || newG < gScore[neighbor.node]) {
        gScore[neighbor.node] = newG;

        open.push({
          node: neighbor.node,
          path: [...current.path, neighbor.node],
          g: newG
        });
      }
    }
  }

  return null;
}

// UCS
function ucs(start, goal) {
  let queue = [{ node: start, path: [start], cost: 0 }];
  let steps = [];

  let costMap = {};
  costMap[start] = 0;

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);

    let current = queue.shift();

    steps.push(`Expand ${current.node} | cost=${current.cost}`);

    if (sameName(current.node, goal)) {
      return {
        path: current.path,
        cost: current.cost,
        steps
      };
    }

    for (const neighbor of graph[current.node] || []) {
      let newCost = current.cost + neighbor.cost;

      if (
        costMap[neighbor.node] === undefined ||
        newCost < costMap[neighbor.node]
      ) {
        costMap[neighbor.node] = newCost;

        queue.push({
          node: neighbor.node,
          path: [...current.path, neighbor.node],
          cost: newCost
        });
      }
    }
  }

  return null;
}

// IDDFS
function iddfs(start, goal, maxDepth = 10) {
  let steps = [];

  for (let depth = 0; depth <= maxDepth; depth++) {
    steps.push(`Trying depth = ${depth}`);

    const result = dls(start, goal, depth);

    if (result) {
      return {
        path: result.path,
        steps: [...steps, ...result.steps]
      };
    }
  }

  return null;
}

// DLS
function dls(start, goal, limit) {
  const stack = [{ node: start, path: [start], depth: 0 }];
  const steps = [];

  while (stack.length) {
    const current = stack.pop();

    steps.push(`Expand ${current.node} at depth ${current.depth}`);

    if (sameName(current.node, goal)) {
      return { path: current.path, steps };
    }

    if (current.depth < limit) {
      for (const neighbor of graph[current.node] || []) {
        // optional safety check to reduce cycles
        if (!current.path.includes(neighbor.node)) {
          stack.push({
            node: neighbor.node,
            path: [...current.path, neighbor.node],
            depth: current.depth + 1
          });
        }
      }
    }
  }

  return null;
}

// Bidirectional
function bidirectional(start, goal) {
  let queueStart = [start];
  let queueGoal = [goal];

  let visitedStart = new Set([start]);
  let visitedGoal = new Set([goal]);

  let parentStart = {};
  let parentGoal = {};

  const steps = [];

  parentStart[start] = null;
  parentGoal[goal] = null;

  let meetingNode = null;

  while (queueStart.length && queueGoal.length) {

    // BFS from start
    let currentStart = queueStart.shift();
    steps.push(`Expand from start: ${currentStart}`);

    for (const neighbor of graph[currentStart] || []) {
      if (!visitedStart.has(neighbor.node)) {
        visitedStart.add(neighbor.node);
        parentStart[neighbor.node] = currentStart;
        queueStart.push(neighbor.node);

        if (visitedGoal.has(neighbor.node)) {
          meetingNode = neighbor.node;
          break;
        }
      }
    }

    if (meetingNode) break;

    // BFS from goal
    let currentGoal = queueGoal.shift();
    steps.push(`Expand from goal: ${currentGoal}`);

    for (const neighbor of graph[currentGoal] || []) {
      if (!visitedGoal.has(neighbor.node)) {
        visitedGoal.add(neighbor.node);
        parentGoal[neighbor.node] = currentGoal;
        queueGoal.push(neighbor.node);

        if (visitedStart.has(neighbor.node)) {
          meetingNode = neighbor.node;
          break;
        }
      }
    }

    if (meetingNode) break;
  }

  if (!meetingNode) return null;

  // reconstruct path from start → meeting
  let path1 = [];
  let n = meetingNode;

  while (n !== null) {
    path1.push(n);
    n = parentStart[n];
  }
  path1.reverse();

  // reconstruct path from meeting → goal
  let path2 = [];
  n = parentGoal[meetingNode];

  while (n !== null) {
    path2.push(n);
    n = parentGoal[n];
  }

  return {
    path: [...path1, ...path2],
    steps
  };
}

function runAlgorithm() {
  const startInput = startNodeInput.value.trim();
  const goalInput = goalNodeInput.value.trim();
  const algorithm = algorithmSelect.value;

  const startNode = findNode(startInput);
  const goalNode = findNode(goalInput);

  if (!startNode || !goalNode) {
    alert("Enter valid start and goal node names");
    return;
  }

  let result = null;
  let algoName = "";

  if (algorithm === "bfs") {
    result = bfs(startNode.name, goalNode.name);
    algoName = "BFS";
  }

  if (algorithm === "dfs") {
    result = dfs(startNode.name, goalNode.name);
    algoName = "DFS";
  }

  if (algorithm === "greedy") {
    result = greedy(startNode.name, goalNode.name);
    algoName = "Greedy";
  }

  if (algorithm === "astar") {
    result = astar(startNode.name, goalNode.name);
    algoName = "A*";
  }

  if (algorithm === "ucs") {
    result = ucs(startNode.name, goalNode.name);
    algoName = "UCS";
  }

  if (algorithm === "iddfs") {
    result = iddfs(startNode.name, goalNode.name);
    algoName = "IDDFS";
  }

  if (algorithm === "dls") {
    const limit = parseInt(prompt("Enter depth limit:", "3"));
    result = dls(startNode.name, goalNode.name, limit);
    algoName = "DLS";
  }

  if (algorithm === "bidirectional") {
    result = bidirectional(startNode.name, goalNode.name);
    algoName = "Bidirectional";
  }

  if (!result) {
    highlightPath = [];
    output.textContent = "No path found.";
    draw();
    return;
  }

  highlightPath = result.path.slice();

  output.textContent =
    `Algorithm: ${algoName}\n` +
    `Path: ${result.path.join(" → ")}\n` +
    `Cost: ${result.cost ?? pathCost(result.path)}\n\n` +
    `Steps:\n${result.steps.join("\n")}`;

  draw();
}

function drawEdge(edge, strokeColor, lineWidth) {
  const n1 = findNode(edge.from);
  const n2 = findNode(edge.to);

  if (!n1 || !n2) return;

  ctx.beginPath();
  ctx.moveTo(n1.x, n1.y);
  ctx.lineTo(n2.x, n2.y);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const midX = (n1.x + n2.x) / 2;
  const midY = (n1.y + n2.y) / 2;

  const text = String(edge.cost);

  ctx.font = "13px Arial";
  const textWidth = ctx.measureText(text).width;

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(midX - textWidth / 2 - 8, midY - 15, textWidth + 16, 20);

  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, midX, midY - 5);
}

function usesHeuristic(algo) {
  return algo === "greedy" || algo === "astar";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const edge of edges) {
    drawEdge(edge, "#9ca3af", 2);
  }

  if (highlightPath.length > 1) {
    for (let i = 0; i < highlightPath.length - 1; i++) {
      const a = highlightPath[i];
      const b = highlightPath[i + 1];
      const edge = edges.find(
        e =>
          (sameName(e.from, a) && sameName(e.to, b)) ||
          (sameName(e.from, b) && sameName(e.to, a))
      );

      if (edge) {
        drawEdge(edge, "#f59e0b", 5);
      }
    }
  }

  for (const node of nodes) {
    const isSelected = selectedNodes.some(item => sameName(item.name, node.name));
    const isInPath = highlightPath.some(name => sameName(name, node.name));

    ctx.beginPath();
    ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = isInPath ? "#10b981" : "#2563eb";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isSelected ? "#ef4444" : "#1e3a8a";
    ctx.stroke();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 32, 0, Math.PI * 2);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(node.x, node.y, 40, 0, Math.PI * 2);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 2;
    }

    ctx.fillStyle = "white";
    ctx.font = "bold 25px Arial";
    ctx.fillText(node.name, node.x, node.y);

    if (
      usesHeuristic(algorithmSelect.value) &&
      node.h !== undefined &&
      node.h !== null &&
      node.h !== ""
    ) {
      ctx.font = "20px Arial";
      ctx.fillText("h=" + node.h, node.x, node.y + 14);
    }
  }
}

canvas.addEventListener("pointerdown", (event) => {
  pointerDown = true;
  didMove = false;

  const pos = getCanvasPos(event);
  downX = pos.x;
  downY = pos.y;

  const node = getNodeAt(pos.x, pos.y);

  if (node) {
    draggingNode = node;
    dragOffsetX = pos.x - node.x;
    dragOffsetY = pos.y - node.y;
  } else {
    draggingNode = null;
  }

  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (e) {}
});

canvas.addEventListener("pointermove", (event) => {
  if (!pointerDown || !draggingNode) return;

  const pos = getCanvasPos(event);
  const distance = Math.hypot(pos.x - downX, pos.y - downY);

  if (distance > 2) {
    didMove = true;
  }

  draggingNode.x = Math.max(30, Math.min(canvas.width - 30, pos.x - dragOffsetX));
  draggingNode.y = Math.max(30, Math.min(canvas.height - 30, pos.y - dragOffsetY));

  draw();
});

canvas.addEventListener("pointerup", (event) => {
  const pos = getCanvasPos(event);
  const node = getNodeAt(pos.x, pos.y);

  if (!didMove && node) {
    handleNodeSelection(node);
  }

  pointerDown = false;
  draggingNode = null;
  didMove = false;

  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (e) {}
});

function handleNodeSelection(node) {
  if (selectedNodes.length === 0) {
    selectedNodes = [node];
    draw();
    return;
  }

  if (selectedNodes.length === 1) {
    const first = selectedNodes[0];

    if (sameName(first.name, node.name)) {
      alert("اختاري نود مختلفة");
      selectedNodes = [];
      draw();
      return;
    }

    selectedNodes.push(node);

    const cost = prompt(`Enter cost for ${first.name} → ${node.name}:`, "1");

    if (cost === null) {
      selectedNodes = [];
      draw();
      return;
    }

    const ok = addEdgeManual(first.name, node.name, cost);
    selectedNodes = [];
    if (ok) {
      output.textContent = `Edge added: ${first.name} ↔ ${node.name}`;
    }
    draw();
  }
}

draw();

const eyebrowEl = document.querySelector(".eyebrow");
const titleEl = document.querySelector(".hero h1");
const subtextEl = document.querySelector(".subtext");

const eyebrowText = eyebrowEl.textContent;
const titleText = titleEl.textContent;
const subtextText = subtextEl.textContent;

eyebrowEl.textContent = "";
titleEl.textContent = "";
subtextEl.textContent = "";

function typeText(element, text, speed, callback) {
  let i = 0;

  element.classList.add("typing"); 

  function typing() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    } else {
      element.classList.remove("typing"); 
      if (callback) callback();
    }
  }

  typing();
}

typeText(eyebrowEl, eyebrowText, 40, () => {
  typeText(titleEl, titleText, 35, () => {
    typeText(subtextEl, subtextText, 20);
  });
});

