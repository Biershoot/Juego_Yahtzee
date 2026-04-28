/* ============================================================
   SIMULACIÓN MONTECARLO – Análisis Estadístico de Dados
   Explota los resultados aleatorios para estimar probabilidades
   ============================================================ */

(() => {
    'use strict';

    const $ = (sel) => document.querySelector(sel);

    /* ---------- DOM ---------- */
    const btnRun       = $('#btnRunMC');
    const inputIter    = $('#mcIterations');
    const selectDice   = $('#mcDiceCount');
    const progressWrap = $('#mcProgress');
    const progressBar  = $('#mcBar');
    const percentLabel = $('#mcPercent');
    const resultsArea  = $('#mcResults');

    /* ---------- CHART INSTANCES ---------- */
    let chartHistogram    = null;
    let chartFaces        = null;
    let chartCombinations = null;
    let chartConvergence  = null;

    /* ---------- THEORETICAL PROBABILITIES (5 dados) ---------- */
    // Probabilidades teóricas exactas para Yahtzee con 5 dados de 6 caras
    const THEORETICAL = {
        yahtzee:        6 / 7776,                           // ~0.077%
        largeStraight:  240 / 7776,                         // ~3.086%
        smallStraight:  1156 / 7776,                         // ~14.87% (4+ consecutivos)
        fullHouse:      300 / 7776,                         // ~3.858%
        fourOfKind:     (150 + 6) / 7776,                   // ~2.006% (incluye yahtzee)
        threeOfKind:    (1200 + 300 + 150 + 6) / 7776,      // ~21.296% (incluye full, 4ok, yahtzee)
        chance:         1.0                                  // siempre se puede anotar
    };

    /* ---------- CORE SIMULATION ---------- */

    /**
     * Simula N lanzamientos de `numDice` dados usando el método de Montecarlo.
     * Cada dado sigue una distribución uniforme discreta en {1,2,3,4,5,6}.
     *
     * @param {number} iterations - Número de lanzamientos a simular
     * @param {number} numDice    - Cantidad de dados por lanzamiento
     * @param {function} onProgress - Callback de progreso (0-1)
     * @returns {Promise<Object>} Resultados de la simulación
     */
    async function runSimulation(iterations, numDice, onProgress) {
        // Almacenamiento de resultados
        const sumFreq = {};          // frecuencia de cada suma posible
        const faceFreq = [0, 0, 0, 0, 0, 0]; // frecuencia de cada cara (1-6)
        const combFreq = {           // frecuencia de combinaciones Yahtzee
            yahtzee: 0,
            largeStraight: 0,
            smallStraight: 0,
            fullHouse: 0,
            fourOfKind: 0,
            threeOfKind: 0
        };

        // Para gráfica de convergencia de la media
        const convergencePoints = [];
        const convergenceInterval = Math.max(1, Math.floor(iterations / 200));
        let runningSum = 0;

        const BATCH_SIZE = 5000;

        for (let i = 0; i < iterations; i++) {
            // Lanzar dados (simulación Montecarlo – distribución uniforme)
            const dice = [];
            for (let d = 0; d < numDice; d++) {
                const face = Math.floor(Math.random() * 6) + 1;
                dice.push(face);
                faceFreq[face - 1]++;
            }

            // Suma de los dados
            const sum = dice.reduce((a, b) => a + b, 0);
            sumFreq[sum] = (sumFreq[sum] || 0) + 1;
            runningSum += sum;

            // Clasificar combinaciones (solo para 5 dados)
            if (numDice === 5) {
                classifyCombination(dice, combFreq);
            }

            // Convergencia
            if ((i + 1) % convergenceInterval === 0 || i === iterations - 1) {
                convergencePoints.push({
                    n: i + 1,
                    mean: runningSum / (i + 1)
                });
            }

            // Reportar progreso (yield al event loop cada BATCH_SIZE)
            if (i % BATCH_SIZE === 0) {
                onProgress(i / iterations);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        onProgress(1);

        // Calcular estadísticas
        const totalDiceRolled = iterations * numDice;
        const sums = Object.keys(sumFreq).map(Number).sort((a, b) => a - b);
        const meanSum = runningSum / iterations;

        let varianceSum = 0;
        for (const [s, f] of Object.entries(sumFreq)) {
            varianceSum += f * Math.pow(Number(s) - meanSum, 2);
        }
        const stdDev = Math.sqrt(varianceSum / iterations);

        return {
            iterations,
            numDice,
            totalDiceRolled,
            sumFreq,
            sums,
            faceFreq,
            combFreq,
            convergencePoints,
            meanSum,
            stdDev,
            minSum: Math.min(...sums),
            maxSum: Math.max(...sums)
        };
    }

    /**
     * Clasifica un lanzamiento de 5 dados en las combinaciones de Yahtzee.
     */
    function classifyCombination(dice, combFreq) {
        const counts = [0, 0, 0, 0, 0, 0];
        dice.forEach(d => counts[d - 1]++);
        const maxCount = Math.max(...counts);
        const sorted = [...dice].sort((a, b) => a - b);
        const unique = [...new Set(sorted)];
        const uStr = unique.join('');

        // Yahtzee
        if (maxCount === 5) combFreq.yahtzee++;

        // Four of a Kind
        if (maxCount >= 4) combFreq.fourOfKind++;

        // Three of a Kind
        if (maxCount >= 3) combFreq.threeOfKind++;

        // Full House
        if (counts.includes(3) && counts.includes(2)) combFreq.fullHouse++;

        // Large Straight
        const sKey = sorted.join('');
        if (sKey === '12345' || sKey === '23456') combFreq.largeStraight++;

        // Small Straight
        if (['1234', '2345', '3456'].some(s => uStr.includes(s))) combFreq.smallStraight++;
    }

    /* ---------- RENDER RESULTS ---------- */

    function renderResults(data) {
        resultsArea.classList.remove('hidden');

        // Stats cards
        $('#statTotal').textContent = data.iterations.toLocaleString();
        $('#statMean').textContent = data.meanSum.toFixed(3);
        $('#statStdDev').textContent = data.stdDev.toFixed(3);
        $('#statMin').textContent = data.minSum;
        $('#statMax').textContent = data.maxSum;

        if (data.numDice === 5) {
            const pYahtzee = (data.combFreq.yahtzee / data.iterations * 100);
            $('#statYahtzee').textContent = pYahtzee.toFixed(4) + '%';
        } else {
            $('#statYahtzee').textContent = 'N/A';
        }

        renderHistogram(data);
        renderFacesChart(data);
        renderCombinationsChart(data);
        renderConvergenceChart(data);
        renderProbabilityTable(data);
    }

    /* ---------- CHART: HISTOGRAM ---------- */
    function renderHistogram(data) {
        const ctx = $('#chartHistogram').getContext('2d');
        if (chartHistogram) chartHistogram.destroy();

        const labels = data.sums.map(String);
        const values = data.sums.map(s => data.sumFreq[s]);
        const maxVal = Math.max(...values);

        chartHistogram = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Frecuencia',
                    data: values,
                    backgroundColor: values.map(v => {
                        const ratio = v / maxVal;
                        return `rgba(108, 99, 255, ${0.3 + ratio * 0.7})`;
                    }),
                    borderColor: 'rgba(108, 99, 255, 0.8)',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: chartBaseOptions('Suma', 'Frecuencia')
        });
    }

    /* ---------- CHART: FACE FREQUENCIES ---------- */
    function renderFacesChart(data) {
        const ctx = $('#chartFaces').getContext('2d');
        if (chartFaces) chartFaces.destroy();

        const total = data.totalDiceRolled;
        const theoreticalPct = (100 / 6).toFixed(2);

        chartFaces = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['⚀ (1)', '⚁ (2)', '⚂ (3)', '⚃ (4)', '⚄ (5)', '⚅ (6)'],
                datasets: [
                    {
                        label: 'Simulado (%)',
                        data: data.faceFreq.map(f => (f / total * 100).toFixed(2)),
                        backgroundColor: 'rgba(0, 212, 170, 0.6)',
                        borderColor: 'rgba(0, 212, 170, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: `Teórico (${theoreticalPct}%)`,
                        data: Array(6).fill(theoreticalPct),
                        type: 'line',
                        borderColor: 'rgba(255, 107, 157, 1)',
                        borderWidth: 2,
                        borderDash: [6, 3],
                        pointRadius: 0,
                        fill: false,
                    }
                ]
            },
            options: chartBaseOptions('Cara', 'Porcentaje (%)')
        });
    }

    /* ---------- CHART: COMBINATION PROBABILITIES ---------- */
    function renderCombinationsChart(data) {
        const ctx = $('#chartCombinations').getContext('2d');
        if (chartCombinations) chartCombinations.destroy();

        if (data.numDice !== 5) {
            chartCombinations = new Chart(ctx, {
                type: 'bar',
                data: { labels: ['N/A'], datasets: [{ data: [0] }] },
                options: { ...chartBaseOptions(), plugins: { title: { display: true, text: 'Solo disponible para 5 dados', color: '#9ca3c4' } } }
            });
            return;
        }

        const combLabels = ['Yahtzee', 'Póker (4)', 'Tercia (3)', 'Full House', 'Esc. Larga', 'Esc. Corta'];
        const combKeys   = ['yahtzee', 'fourOfKind', 'threeOfKind', 'fullHouse', 'largeStraight', 'smallStraight'];

        const simulated = combKeys.map(k => (data.combFreq[k] / data.iterations * 100));
        const theoretical = combKeys.map(k => (THEORETICAL[k] * 100));

        chartCombinations = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: combLabels,
                datasets: [
                    {
                        label: 'Simulado (%)',
                        data: simulated.map(v => v.toFixed(3)),
                        backgroundColor: 'rgba(255, 200, 87, 0.6)',
                        borderColor: 'rgba(255, 200, 87, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'Teórico (%)',
                        data: theoretical.map(v => v.toFixed(3)),
                        backgroundColor: 'rgba(108, 99, 255, 0.4)',
                        borderColor: 'rgba(108, 99, 255, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    }
                ]
            },
            options: chartBaseOptions('Combinación', 'Probabilidad (%)')
        });
    }

    /* ---------- CHART: CONVERGENCE ---------- */
    function renderConvergenceChart(data) {
        const ctx = $('#chartConvergence').getContext('2d');
        if (chartConvergence) chartConvergence.destroy();

        // Theoretical mean for numDice × 3.5
        const theoreticalMean = data.numDice * 3.5;

        chartConvergence = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.convergencePoints.map(p => p.n),
                datasets: [
                    {
                        label: 'Media simulada',
                        data: data.convergencePoints.map(p => p.mean.toFixed(4)),
                        borderColor: 'rgba(0, 212, 170, 1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.3,
                    },
                    {
                        label: `Media teórica (${theoreticalMean.toFixed(1)})`,
                        data: data.convergencePoints.map(() => theoreticalMean),
                        borderColor: 'rgba(255, 107, 157, 1)',
                        borderWidth: 2,
                        borderDash: [8, 4],
                        pointRadius: 0,
                        fill: false,
                    }
                ]
            },
            options: {
                ...chartBaseOptions('Iteraciones', 'Media de la suma'),
                scales: {
                    x: {
                        ticks: {
                            color: '#5c6396',
                            maxTicksLimit: 8,
                            callback: (val, idx, ticks) => {
                                const v = data.convergencePoints[idx]?.n;
                                return v ? (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) : '';
                            }
                        },
                        grid: { color: 'rgba(255,255,255,0.03)' }
                    },
                    y: {
                        ticks: { color: '#5c6396' },
                        grid: { color: 'rgba(255,255,255,0.03)' }
                    }
                }
            }
        });
    }

    /* ---------- PROBABILITY TABLE ---------- */
    function renderProbabilityTable(data) {
        const tbody = $('#mcProbBody');
        tbody.innerHTML = '';

        if (data.numDice !== 5) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted)">Tabla disponible solo para simulación con 5 dados</td></tr>';
            return;
        }

        const rows = [
            { name: 'Yahtzee (5 iguales)',     key: 'yahtzee' },
            { name: 'Póker (4 iguales)',       key: 'fourOfKind' },
            { name: 'Tercia (3 iguales)',      key: 'threeOfKind' },
            { name: 'Full House (3+2)',        key: 'fullHouse' },
            { name: 'Escalera Larga (5 seg.)', key: 'largeStraight' },
            { name: 'Escalera Corta (4 seg.)', key: 'smallStraight' },
        ];

        rows.forEach(({ name, key }) => {
            const simProb = data.combFreq[key] / data.iterations;
            const theoProb = THEORETICAL[key];
            const error = theoProb > 0
                ? Math.abs(simProb - theoProb) / theoProb * 100
                : 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:left; font-family:var(--font-main)">${name}</td>
                <td>${(theoProb * 100).toFixed(4)}%</td>
                <td>${(simProb * 100).toFixed(4)}%</td>
                <td style="color:${error < 5 ? 'var(--accent-2)' : error < 15 ? 'var(--accent-4)' : 'var(--accent-3)'}">${error.toFixed(2)}%</td>
                <td>${data.combFreq[key].toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /* ---------- CHART BASE OPTIONS ---------- */
    function chartBaseOptions(xLabel = '', yLabel = '') {
        return {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#9ca3c4', font: { family: "'Outfit', sans-serif", size: 11 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(19, 23, 41, 0.95)',
                    titleColor: '#e8eaf6',
                    bodyColor: '#9ca3c4',
                    borderColor: 'rgba(108,99,255,0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    titleFont: { family: "'Outfit', sans-serif" },
                    bodyFont: { family: "'JetBrains Mono', monospace", size: 12 }
                }
            },
            scales: {
                x: {
                    title: { display: !!xLabel, text: xLabel, color: '#5c6396', font: { family: "'Outfit', sans-serif" } },
                    ticks: { color: '#5c6396', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.03)' }
                },
                y: {
                    title: { display: !!yLabel, text: yLabel, color: '#5c6396', font: { family: "'Outfit', sans-serif" } },
                    ticks: { color: '#5c6396', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    beginAtZero: true
                }
            }
        };
    }

    /* ---------- EVENT LISTENER ---------- */
    btnRun.addEventListener('click', async () => {
        const iterations = parseInt(inputIter.value) || 10000;
        const numDice = parseInt(selectDice.value) || 5;

        btnRun.disabled = true;
        progressWrap.classList.remove('hidden');
        progressBar.style.width = '0%';
        percentLabel.textContent = '0%';

        const data = await runSimulation(iterations, numDice, (progress) => {
            const pct = Math.round(progress * 100);
            progressBar.style.width = pct + '%';
            percentLabel.textContent = pct + '%';
        });

        renderResults(data);

        btnRun.disabled = false;
        setTimeout(() => progressWrap.classList.add('hidden'), 800);
    });

})();
