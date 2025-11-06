// DOM Elements
const functionInput = document.getElementById('functionInput');
const derivativeInput = document.getElementById('derivativeInput');
const algorithmSelect = document.getElementById('algorithmSelect');
const initialGuess = document.getElementById('initialGuess');
const intervalA = document.getElementById('intervalA');
const intervalB = document.getElementById('intervalB');
const initialGuess1 = document.getElementById('initialGuess1');
const initialGuess2 = document.getElementById('initialGuess2');
const regulaA = document.getElementById('regulaA');
const regulaB = document.getElementById('regulaB');
const fixedPointGuess = document.getElementById('fixedPointGuess');
const fixedPointFunction = document.getElementById('fixedPointFunction');
const tolerance = document.getElementById('tolerance');
const maxIterations = document.getElementById('maxIterations');
const runBtn = document.getElementById('runBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const rootResult = document.getElementById('rootResult');
const iterationsResult = document.getElementById('iterationsResult');
const errorResult = document.getElementById('errorResult');
const resultsBody = document.getElementById('resultsBody');

// Chart instances
const functionCtx = document.getElementById('functionChart').getContext('2d');
const errorCtx = document.getElementById('errorChart').getContext('2d');
let functionChart, errorChart;

// Animation control
let animationId;
let currentIteration = 0;
let iterationsData = [];
let isRunning = false;

// Algorithm implementations
const algorithms = {
    bisection: {
        name: "Bisection Method",
        params: ['intervalA', 'intervalB'],
        method: function(f, params, tol, maxIter) {
            const results = [];
            let a = parseFloat(params.intervalA);
            let b = parseFloat(params.intervalB);
            
            if (f(a) * f(b) >= 0) {
                alert("Bisection method requires f(a) and f(b) to have opposite signs");
                return results;
            }

            for (let i = 0; i < maxIter; i++) {
                const c = (a + b) / 2;
                const fc = f(c);
                const error = Math.abs(b - a) / 2;

                results.push({
                    iteration: i,
                    a: a,
                    b: b,
                    c: c,
                    fx: fc,
                    error: error,
                    x: c,
                    xNew: c
                });

                if (error < tol) break;
                
                if (fc * f(a) < 0) {
                    b = c;
                } else {
                    a = c;
                }
            }
            return results;
        },
        updateChart: function(chart, f, data, iteration) {
            const current = data[iteration];
            if (!current) return;

            const xMin = Math.min(current.a, current.b) - 1;
            const xMax = Math.max(current.a, current.b) + 1;
            const step = (xMax - xMin) / 100;
            
            const xValues = [];
            const yValues = [];
            const intervalLines = [];
            
            for (let xi = xMin; xi <= xMax; xi += step) {
                xValues.push(xi);
                yValues.push(f(xi));
                intervalLines.push(null);
            }
            
            // Add interval markers
            intervalLines[xValues.findIndex(x => x >= current.a)] = 0;
            intervalLines[xValues.findIndex(x => x >= current.b)] = 0;
            
            chart.data.labels = xValues;
            chart.data.datasets[0].data = xValues.map((x, i) => ({x, y: yValues[i]}));
            chart.data.datasets[1].data = xValues.map((x, i) => ({x, y: intervalLines[i]}));
            chart.data.datasets[2].data = [{x: current.c, y: 0}, {x: current.c, y: current.fx}];
            
            chart.update();
        }
    },
    
    newton: {
        name: "Newton-Raphson Method",
        params: ['initialGuess'],
        method: function(f, df, params, tol, maxIter) {
            const results = [];
            let x = parseFloat(params.initialGuess);
            
            for (let i = 0; i < maxIter; i++) {
                const fx = f(x);
                const dfx = df(x);
                
                if (Math.abs(dfx) < 1e-10) {
                    alert("Derivative is zero. Cannot continue.");
                    break;
                }
                
                const xNew = x - fx / dfx;
                const error = Math.abs(xNew - x);
                
                results.push({
                    iteration: i,
                    x: x,
                    fx: fx,
                    dfx: dfx,
                    xNew: xNew,
                    error: error
                });
                
                if (error < tol) break;
                x = xNew;
            }
            
            return results;
        },
        updateChart: function(chart, f, df, data, iteration) {
            const current = data[iteration];
            if (!current) return;

            const xRange = 3;
            const xMin = current.x - xRange;
            const xMax = current.x + xRange;
            const step = (xMax - xMin) / 100;
            
            const xValues = [];
            const yValues = [];
            const tangentValues = [];
            
            for (let xi = xMin; xi <= xMax; xi += step) {
                xValues.push(xi);
                yValues.push(f(xi));
                tangentValues.push(current.fx + current.dfx * (xi - current.x));
            }
            
            chart.data.labels = xValues;
            chart.data.datasets[0].data = xValues.map((x, i) => ({x, y: yValues[i]}));
            chart.data.datasets[1].data = xValues.map((x, i) => ({x, y: tangentValues[i]}));
            chart.data.datasets[2].data = [{x: current.x, y: 0}, {x: current.x, y: current.fx}];
            
            chart.update();
        }
    },
    
    secant: {
        name: "Secant Method",
        params: ['initialGuess1', 'initialGuess2'],
        method: function(f, params, tol, maxIter) {
            const results = [];
            let x0 = parseFloat(params.initialGuess1);
            let x1 = parseFloat(params.initialGuess2);
            let fx0 = f(x0);
            
            for (let i = 0; i < maxIter; i++) {
                const fx1 = f(x1);
                const denominator = fx1 - fx0;
                
                if (Math.abs(denominator) < 1e-10) {
                    alert("Denominator too small in secant method");
                    break;
                }
                
                const xNew = x1 - fx1 * (x1 - x0) / denominator;
                const error = Math.abs(xNew - x1);
                
                results.push({
                    iteration: i,
                    x0: x0,
                    x1: x1,
                    fx0: fx0,
                    fx1: fx1,
                    xNew: xNew,
                    error: error,
                    x: x1,
                    fx: fx1  // Added for consistent table display
                });
                
                if (error < tol) break;
                
                x0 = x1;
                fx0 = fx1;
                x1 = xNew;
            }
            
            return results;
        },
        updateChart: function(chart, f, data, iteration) {
            const current = data[iteration];
            if (!current) return;

            const xRange = 3;
            const xMin = Math.min(current.x0, current.x1) - xRange;
            const xMax = Math.max(current.x0, current.x1) + xRange;
            const step = (xMax - xMin) / 100;
            
            const xValues = [];
            const yValues = [];
            const secantValues = [];
            
            for (let xi = xMin; xi <= xMax; xi += step) {
                xValues.push(xi);
                yValues.push(f(xi));
                secantValues.push(current.fx1 + (current.fx1 - current.fx0)/(current.x1 - current.x0) * (xi - current.x1));
            }
            
            chart.data.labels = xValues;
            chart.data.datasets[0].data = xValues.map((x, i) => ({x, y: yValues[i]}));
            chart.data.datasets[1].data = xValues.map((x, i) => ({x, y: secantValues[i]}));
            chart.data.datasets[2].data = [
                {x: current.x0, y: 0}, {x: current.x0, y: current.fx0},
                {x: current.x1, y: 0}, {x: current.x1, y: current.fx1}
            ];
            
            chart.update();
        }
    },
    
    regula: {
        name: "Regula Falsi Method",
        params: ['regulaA', 'regulaB'],
        method: function(f, params, tol, maxIter) {
            const results = [];
            let a = parseFloat(params.regulaA);
            let b = parseFloat(params.regulaB);
            let fa = f(a);
            let fb = f(b);
            
            if (fa * fb >= 0) {
                alert("Regula Falsi method requires f(a) and f(b) to have opposite signs");
                return results;
            }

            for (let i = 0; i < maxIter; i++) {
                const c = (a * fb - b * fa) / (fb - fa);
                const fc = f(c);
                const error = Math.abs(fc);

                results.push({
                    iteration: i,
                    a: a,
                    b: b,
                    c: c,
                    fa: fa,
                    fb: fb,
                    fc: fc,
                    error: error,
                    x: c,
                    xNew: c,
                    fx: fc  // Added for consistent table display
                });

                if (error < tol) break;
                
                if (fc * fa < 0) {
                    b = c;
                    fb = fc;
                } else {
                    a = c;
                    fa = fc;
                }
            }
            return results;
        },
        updateChart: function(chart, f, data, iteration) {
            const current = data[iteration];
            if (!current) return;

            const xMin = Math.min(current.a, current.b) - 1;
            const xMax = Math.max(current.a, current.b) + 1;
            const step = (xMax - xMin) / 100;
            
            const xValues = [];
            const yValues = [];
            const lineValues = [];
            
            for (let xi = xMin; xi <= xMax; xi += step) {
                xValues.push(xi);
                yValues.push(f(xi));
                lineValues.push(
                    current.fa + (current.fb - current.fa)/(current.b - current.a) * (xi - current.a)
                );
            }
            
            chart.data.labels = xValues;
            chart.data.datasets[0].data = xValues.map((x, i) => ({x, y: yValues[i]}));
            chart.data.datasets[1].data = xValues.map((x, i) => ({x, y: lineValues[i]}));
            chart.data.datasets[2].data = [
                {x: current.a, y: 0}, {x: current.a, y: current.fa},
                {x: current.b, y: 0}, {x: current.b, y: current.fb},
                {x: current.c, y: 0}, {x: current.c, y: current.fc}
            ];
            
            chart.update();
        }
    },
    
    fixedpoint: {
        name: "Fixed-Point Iteration",
        params: ['fixedPointGuess', 'fixedPointFunction'],
        method: function(f, g, params, tol, maxIter) {
            const results = [];
            let x = parseFloat(params.fixedPointGuess);
            
            for (let i = 0; i < maxIter; i++) {
                const xNew = g(x);
                const error = Math.abs(xNew - x);
                const fx = f(x);
                
                results.push({
                    iteration: i,
                    x: x,
                    xNew: xNew,
                    fx: fx,
                    error: error
                });
                
                if (error < tol) break;
                x = xNew;
            }
            
            return results;
        },
        updateChart: function(chart, f, g, data, iteration) {
            const current = data[iteration];
            if (!current) return;

            const xRange = 3;
            const xMin = current.x - xRange;
            const xMax = current.x + xRange;
            const step = (xMax - xMin) / 100;
            
            const xValues = [];
            const yValues = [];
            const gValues = [];
            const identityValues = [];
            
            for (let xi = xMin; xi <= xMax; xi += step) {
                xValues.push(xi);
                yValues.push(f(xi));
                gValues.push(g(xi));
                identityValues.push(xi);
            }
            
            chart.data.labels = xValues;
            chart.data.datasets[0].data = xValues.map((x, i) => ({x, y: yValues[i]}));
            chart.data.datasets[1].data = xValues.map((x, i) => ({x, y: gValues[i]}));
            chart.data.datasets[2].data = xValues.map((x, i) => ({x, y: identityValues[i]}));
            chart.data.datasets[3] = {
                label: 'Current Point',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
                pointRadius: 5,
                showLine: false,
                data: [
                    {x: current.x, y: current.xNew},
                    {x: current.xNew, y: current.xNew}
                ]
            };
            
            chart.update();
        }
    }
};

// Initialize charts
function initCharts() {
    functionChart = new Chart(functionCtx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'f(x)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'center',
                    title: {
                        display: true,
                        text: 'x'
                    }
                },
                y: {
                    type: 'linear',
                    position: 'center',
                    title: {
                        display: true,
                        text: 'y'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });

    errorChart = new Chart(errorCtx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Error',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 2,
                fill: false,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Iteration'
                    }
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Error (log scale)'
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Parse math expression
function parseMath(expr) {
    try {
        const node = math.parse(expr);
        return x => node.evaluate({x: x});
    } catch (e) {
        alert(`Error parsing expression: ${e.message}`);
        return null;
    }
}

// Initialize chart for selected algorithm
function initializeChartForAlgorithm() {
    const algorithm = algorithms[algorithmSelect.value];
    
    // Clear existing datasets
    functionChart.data.datasets = [
        {
            label: 'f(x)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        }
    ];
    
    // Add algorithm-specific datasets
    if (algorithmSelect.value === 'newton') {
        functionChart.data.datasets.push({
            label: 'Tangent Line',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5]
        });
    } else if (algorithmSelect.value === 'secant') {
        functionChart.data.datasets.push({
            label: 'Secant Line',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5]
        });
    } else if (algorithmSelect.value === 'regula') {
        functionChart.data.datasets.push({
            label: 'False Position Line',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5]
        });
    } else if (algorithmSelect.value === 'fixedpoint') {
        functionChart.data.datasets.push({
            label: 'g(x)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0
        });
        functionChart.data.datasets.push({
            label: 'y = x',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0
        });
    } else if (algorithmSelect.value === 'bisection') {
        functionChart.data.datasets.push({
            label: 'Interval',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5]
        });
    }
    
    // Add current point dataset
    functionChart.data.datasets.push({
        label: 'Current Point',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        pointRadius: 5,
        showLine: false
    });
    
    functionChart.update();
}

// Run algorithm
function runAlgorithm() {
    const algorithm = algorithms[algorithmSelect.value];
    const f = parseMath(functionInput.value);
    if (!f) return;
    
    let df, g;
    if (algorithmSelect.value === 'newton') {
        df = parseMath(derivativeInput.value);
        if (!df) return;
    }
    
    if (algorithmSelect.value === 'fixedpoint') {
        g = parseMath(fixedPointFunction.value);
        if (!g) return;
    }
    
    // Get all parameters
    const params = {};
    algorithm.params.forEach(param => {
        params[param] = document.getElementById(param).value;
    });
    
    const tol = parseFloat(tolerance.value);
    const maxIter = parseInt(maxIterations.value);
    
    // Run the appropriate algorithm
    if (algorithmSelect.value === 'newton') {
        iterationsData = algorithm.method(f, df, params, tol, maxIter);
    } else if (algorithmSelect.value === 'fixedpoint') {
        iterationsData = algorithm.method(f, g, params, tol, maxIter);
    } else {
        iterationsData = algorithm.method(f, params, tol, maxIter);
    }
    
    currentIteration = 0;
    
    if (iterationsData.length === 0) {
        alert("No iterations were performed. Check your inputs.");
        return;
    }
    
    // Initialize chart based on algorithm
    initializeChartForAlgorithm();
    
    updateErrorChart(iterationsData);
    updateSummary(iterationsData);
    
    isRunning = true;
    runBtn.disabled = true;
    stepBtn.disabled = false;
    
    animate();
}

// Update error chart
function updateErrorChart(data) {
    const iterations = data.map(d => d.iteration);
    const errors = data.map(d => d.error);
    
    errorChart.data.labels = iterations;
    errorChart.data.datasets[0].data = errors.map((e, i) => ({x: i, y: e}));
    errorChart.update();
}

// Update results table to handle all algorithm formats
function updateResultsTable(data, iteration) {
    resultsBody.innerHTML = '';
    
    for (let i = 0; i <= iteration; i++) {
        if (!data[i]) continue;
        
        const row = document.createElement('tr');
        
        // Handle different algorithm data formats
        let xValue, fxValue;
        
        if (algorithmSelect.value === 'bisection' || algorithmSelect.value === 'regula') {
            xValue = data[i].c;
            fxValue = data[i].fc || data[i].fx;
        } else if (algorithmSelect.value === 'secant') {
            xValue = data[i].x1;
            fxValue = data[i].fx1 || data[i].fx;
        } else {
            xValue = data[i].x;
            fxValue = data[i].fx;
        }
        
        row.innerHTML = `
            <td>${data[i].iteration}</td>
            <td>${xValue.toFixed(6)}</td>
            <td>${fxValue.toFixed(6)}</td>
            <td>${data[i].error.toFixed(6)}</td>
        `;
        
        if (i === iteration) {
            row.style.backgroundColor = '#e3f2fd';
        }
        
        resultsBody.appendChild(row);
    }
}

// Update summary
function updateSummary(data) {
    if (data.length === 0) return;
    
    const lastIteration = data[data.length - 1];
    const rootValue = lastIteration.xNew ? lastIteration.xNew : 
                    (lastIteration.c ? lastIteration.c : lastIteration.x);
    rootResult.textContent = `Root: ${rootValue.toFixed(6)}`;
    iterationsResult.textContent = `Iterations: ${lastIteration.iteration + 1}`;
    errorResult.textContent = `Final Error: ${lastIteration.error.toFixed(6)}`;
}

// Animation loop
function animate() {
    if (currentIteration >= iterationsData.length || !isRunning) {
        isRunning = false;
        runBtn.disabled = false;
        return;
    }
    
    const algorithm = algorithms[algorithmSelect.value];
    const f = parseMath(functionInput.value);
    
    if (algorithmSelect.value === 'newton') {
        const df = parseMath(derivativeInput.value);
        algorithm.updateChart(functionChart, f, df, iterationsData, currentIteration);
    } else if (algorithmSelect.value === 'fixedpoint') {
        const g = parseMath(fixedPointFunction.value);
        algorithm.updateChart(functionChart, f, g, iterationsData, currentIteration);
    } else {
        algorithm.updateChart(functionChart, f, iterationsData, currentIteration);
    }
    
    updateResultsTable(iterationsData, currentIteration);
    currentIteration++;
    
    const speed = 1100 - (speedSlider.value * 100);
    animationId = setTimeout(animate, speed);
}

// Step through iterations
function step() {
    if (currentIteration >= iterationsData.length) {
        stepBtn.disabled = true;
        return;
    }
    
    const algorithm = algorithms[algorithmSelect.value];
    const f = parseMath(functionInput.value);
    
    if (algorithmSelect.value === 'newton') {
        const df = parseMath(derivativeInput.value);
        algorithm.updateChart(functionChart, f, df, iterationsData, currentIteration);
    } else if (algorithmSelect.value === 'fixedpoint') {
        const g = parseMath(fixedPointFunction.value);
        algorithm.updateChart(functionChart, f, g, iterationsData, currentIteration);
    } else {
        algorithm.updateChart(functionChart, f, iterationsData, currentIteration);
    }
    
    updateResultsTable(iterationsData, currentIteration);
    currentIteration++;
    
    if (currentIteration >= iterationsData.length) {
        stepBtn.disabled = true;
    }
}

// Reset everything
function reset() {
    clearTimeout(animationId);
    isRunning = false;
    currentIteration = 0;
    iterationsData = [];
    
    runBtn.disabled = false;
    stepBtn.disabled = true;
    
    functionChart.data.datasets[0].data = [];
    functionChart.data.datasets[1].data = [];
    functionChart.data.datasets[2].data = [];
    functionChart.update();
    
    errorChart.data.datasets[0].data = [];
    errorChart.update();
    
    resultsBody.innerHTML = '';
    rootResult.textContent = 'Root: Not calculated';
    iterationsResult.textContent = 'Iterations: 0';
    errorResult.textContent = 'Final Error: 0';
}

// Event listeners
runBtn.addEventListener('click', runAlgorithm);
stepBtn.addEventListener('click', step);
resetBtn.addEventListener('click', reset);

algorithmSelect.addEventListener('change', (e) => {
    // Hide all parameter groups first
    document.querySelectorAll('.input-group[id$="Params"]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show the selected algorithm's parameters
    const algorithm = algorithms[e.target.value];
    algorithm.params.forEach(param => {
        document.getElementById(param).parentElement.style.display = 'block';
    });
    
    // Special case for derivative input
    if (e.target.value === 'newton') {
        document.getElementById('derivativeGroup').style.display = 'block';
    } else {
        document.getElementById('derivativeGroup').style.display = 'none';
    }
    
    // Hide all docs and show current
    document.querySelectorAll('.method-doc').forEach(doc => {
        doc.classList.remove('active');
    });
    document.getElementById(`${e.target.value}Doc`).classList.add('active');
    
    // Initialize chart for new algorithm
    initializeChartForAlgorithm();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    reset();
    
    // Show initial algorithm's parameters
    const initialAlgorithm = algorithms[algorithmSelect.value];
    initialAlgorithm.params.forEach(param => {
        document.getElementById(param).parentElement.style.display = 'block';
    });
});