/* ============================================================
   YAHTZEE GAME ENGINE
   Lógica completa del juego clásico Yahtzee para 2 jugadores
   ============================================================ */

(() => {
    'use strict';

    /* ---------- CONSTANTS ---------- */
    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const DICE_DOTS = {
        1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
    };
    const NUM_DICE = 5;
    const MAX_ROLLS = 3;
    const NUM_PLAYERS = 2;
    const UPPER_BONUS_THRESHOLD = 63;
    const UPPER_BONUS_VALUE = 35;

    const CATEGORIES = [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'threeOfKind', 'fourOfKind', 'fullHouse',
        'smallStraight', 'largeStraight', 'yahtzee', 'chance'
    ];
    const UPPER_CATEGORIES = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

    /* ---------- GAME STATE ---------- */
    let state = {
        currentPlayer: 0,        // 0 or 1
        rollsLeft: MAX_ROLLS,
        dice: [0, 0, 0, 0, 0],   // current values 1-6
        kept: [false, false, false, false, false],
        hasRolled: false,
        scores: [
            {},  // player 0
            {}   // player 1
        ],
        playerNames: ['Jugador 1', 'Jugador 2'],
        gameOver: false,
        turnsPlayed: 0  // total turns across both players
    };

    /* ---------- DOM REFERENCES ---------- */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const els = {
        startScreen:      $('#startScreen'),
        gameScreen:       $('#gameScreen'),
        montecarloScreen: $('#montecarloScreen'),
        gameOverOverlay:  $('#gameOverOverlay'),
        gameOverContent:  $('#gameOverContent'),
        btnStartGame:     $('#btnStartGame'),
        btnShowStats:     $('#btnShowStats'),
        btnBackToMenu:    $('#btnBackToMenu'),
        btnRoll:          $('#btnRoll'),
        btnPlayAgain:     $('#btnPlayAgain'),
        btnGoMenu:        $('#btnGoMenu'),
        btnBackFromMC:    $('#btnBackFromMC'),
        player1Name:      $('#player1Name'),
        player2Name:      $('#player2Name'),
        currentPlayerLabel: $('#currentPlayerLabel'),
        rollCounter:      $('#rollCounter'),
        p1Header:         $('#p1Header'),
        p2Header:         $('#p2Header'),
        toast:            $('#toast'),
    };

    /* ---------- SCORING FUNCTIONS ---------- */

    /**
     * Genera un valor aleatorio de un dado (distribución uniforme 1-6).
     * Usa Math.random() que genera valores pseudo-aleatorios uniformes en [0,1).
     */
    function rollDie() {
        return Math.floor(Math.random() * 6) + 1;
    }

    /**
     * Cuenta la frecuencia de cada cara en el arreglo de dados.
     */
    function countFaces(dice) {
        const counts = [0, 0, 0, 0, 0, 0]; // index 0 = face 1, etc.
        dice.forEach(d => counts[d - 1]++);
        return counts;
    }

    /**
     * Calcula el puntaje para una categoría dada y un conjunto de dados.
     */
    function calculateScore(category, dice) {
        const counts = countFaces(dice);
        const sum = dice.reduce((a, b) => a + b, 0);
        const maxCount = Math.max(...counts);
        const sorted = [...dice].sort((a, b) => a - b);

        switch (category) {
            // --- Upper section ---
            case 'ones':   return counts[0] * 1;
            case 'twos':   return counts[1] * 2;
            case 'threes': return counts[2] * 3;
            case 'fours':  return counts[3] * 4;
            case 'fives':  return counts[4] * 5;
            case 'sixes':  return counts[5] * 6;

            // --- Lower section ---
            case 'threeOfKind':
                return maxCount >= 3 ? sum : 0;

            case 'fourOfKind':
                return maxCount >= 4 ? sum : 0;

            case 'fullHouse': {
                const has3 = counts.includes(3);
                const has2 = counts.includes(2);
                return (has3 && has2) ? 25 : 0;
            }

            case 'smallStraight': {
                // Verifica si hay al menos 4 consecutivos
                const unique = [...new Set(sorted)];
                const straights = ['1234', '2345', '3456'];
                const uStr = unique.join('');
                return straights.some(s => uStr.includes(s)) ? 30 : 0;
            }

            case 'largeStraight': {
                const key = sorted.join('');
                return (key === '12345' || key === '23456') ? 40 : 0;
            }

            case 'yahtzee':
                return maxCount === 5 ? 50 : 0;

            case 'chance':
                return sum;

            default:
                return 0;
        }
    }

    /* ---------- UI HELPERS ---------- */

    function showScreen(screen) {
        $$('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    let toastTimer = null;
    function showToast(msg, duration = 2500) {
        els.toast.textContent = msg;
        els.toast.classList.remove('hidden');
        requestAnimationFrame(() => els.toast.classList.add('show'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            els.toast.classList.remove('show');
            setTimeout(() => els.toast.classList.add('hidden'), 400);
        }, duration);
    }

    function updateDieDisplay(index, value, animate = false) {
        const dieEl = $(`#die${index}`);
        const faceEl = dieEl.querySelector('.die-face');

        if (animate) {
            dieEl.classList.add('rolling');
            setTimeout(() => {
                dieEl.classList.remove('rolling');
                faceEl.textContent = DICE_DOTS[value];
            }, 450);
        } else {
            faceEl.textContent = value === 0 ? '?' : DICE_DOTS[value];
        }
    }

    function updateAllDiceDisplay(animate = false) {
        state.dice.forEach((val, i) => {
            const dieEl = $(`#die${i}`);
            if (state.kept[i]) {
                dieEl.classList.add('kept');
            } else {
                dieEl.classList.remove('kept');
                if (val > 0) {
                    updateDieDisplay(i, val, animate);
                }
            }
        });
    }

    function updateTurnUI() {
        const name = state.playerNames[state.currentPlayer];
        els.currentPlayerLabel.textContent = `Turno de ${name}`;
        els.currentPlayerLabel.style.color =
            state.currentPlayer === 0 ? 'var(--accent-1)' : 'var(--accent-2)';
        els.rollCounter.textContent = `Lanzamiento ${MAX_ROLLS - state.rollsLeft + 1}/${MAX_ROLLS}`;

        // Enable/disable roll button
        els.btnRoll.disabled = state.rollsLeft <= 0;
        if (state.rollsLeft <= 0) {
            els.btnRoll.innerHTML = '<span class="roll-icon">✋</span> Selecciona categoría';
        } else if (!state.hasRolled) {
            els.btnRoll.innerHTML = '<span class="roll-icon">🎲</span> Lanzar Dados';
        } else {
            els.btnRoll.innerHTML = `<span class="roll-icon">🎲</span> Re-lanzar (${state.rollsLeft})`;
        }
    }

    function updateScorecard() {
        CATEGORIES.forEach(cat => {
            const row = $(`tr[data-category="${cat}"]`);
            if (!row) return;
            const cells = row.querySelectorAll('td');

            for (let p = 0; p < NUM_PLAYERS; p++) {
                const cell = cells[p + 1]; // skip first (name) column
                const scored = state.scores[p][cat];

                // Remove previous classes
                cell.classList.remove('selectable', 'scored', 'scored-zero');

                if (scored !== undefined) {
                    // Already scored
                    cell.textContent = scored;
                    cell.classList.add(scored > 0 ? 'scored' : 'scored-zero');
                } else if (p === state.currentPlayer && state.hasRolled) {
                    // Potential score (selectable)
                    const potential = calculateScore(cat, state.dice);
                    cell.textContent = potential;
                    cell.classList.add('selectable');
                } else {
                    cell.textContent = '';
                }
            }
        });

        // Update totals
        for (let p = 0; p < NUM_PLAYERS; p++) {
            const upperSum = UPPER_CATEGORIES.reduce((sum, cat) =>
                sum + (state.scores[p][cat] || 0), 0);
            const bonus = upperSum >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS_VALUE : 0;
            const lowerSum = CATEGORIES.filter(c => !UPPER_CATEGORIES.includes(c))
                .reduce((sum, cat) => sum + (state.scores[p][cat] || 0), 0);
            const grandTotal = upperSum + bonus + lowerSum;

            $(`#upperTotal${p}`).textContent = upperSum;
            $(`#bonus${p}`).textContent = bonus;
            $(`#grandTotal${p}`).textContent = grandTotal;
        }
    }

    /* ---------- GAME ACTIONS ---------- */

    function rollDice() {
        if (state.rollsLeft <= 0 || state.gameOver) return;

        state.rollsLeft--;
        state.hasRolled = true;

        for (let i = 0; i < NUM_DICE; i++) {
            if (!state.kept[i]) {
                state.dice[i] = rollDie();
            }
        }

        updateAllDiceDisplay(true);
        updateTurnUI();

        // Delay scorecard update to sync with animation
        setTimeout(() => updateScorecard(), 500);
    }

    function toggleKeep(index) {
        if (!state.hasRolled || state.rollsLeft <= 0) return;
        state.kept[index] = !state.kept[index];
        const dieEl = $(`#die${index}`);
        dieEl.classList.toggle('kept', state.kept[index]);
    }

    function selectCategory(category, playerIndex) {
        if (playerIndex !== state.currentPlayer) return;
        if (!state.hasRolled) return;
        if (state.scores[playerIndex][category] !== undefined) return;

        const score = calculateScore(category, state.dice);
        state.scores[playerIndex][category] = score;
        state.turnsPlayed++;

        if (score > 0) {
            showToast(`${state.playerNames[playerIndex]} anotó ${score} puntos en ${getCategoryName(category)}`);
        } else {
            showToast(`${state.playerNames[playerIndex]} anotó 0 puntos en ${getCategoryName(category)}`);
        }

        // Check game over (13 categories × 2 players = 26 total turns)
        if (state.turnsPlayed >= CATEGORIES.length * NUM_PLAYERS) {
            setTimeout(() => endGame(), 600);
            return;
        }

        // Next turn
        nextTurn();
    }

    function nextTurn() {
        state.currentPlayer = (state.currentPlayer + 1) % NUM_PLAYERS;
        state.rollsLeft = MAX_ROLLS;
        state.dice = [0, 0, 0, 0, 0];
        state.kept = [false, false, false, false, false];
        state.hasRolled = false;

        // Reset die displays
        for (let i = 0; i < NUM_DICE; i++) {
            const dieEl = $(`#die${i}`);
            dieEl.classList.remove('kept');
            dieEl.querySelector('.die-face').textContent = '?';
        }

        updateTurnUI();
        updateScorecard();
    }

    function endGame() {
        state.gameOver = true;

        const scores = [0, 1].map(p => {
            const upperSum = UPPER_CATEGORIES.reduce((s, c) => s + (state.scores[p][c] || 0), 0);
            const bonus = upperSum >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS_VALUE : 0;
            const lowerSum = CATEGORIES.filter(c => !UPPER_CATEGORIES.includes(c))
                .reduce((s, c) => s + (state.scores[p][c] || 0), 0);
            return upperSum + bonus + lowerSum;
        });

        let html = '';
        if (scores[0] === scores[1]) {
            html = `<span class="winner-name">¡Empate!</span>
                    <p class="score-line">${state.playerNames[0]}: ${scores[0]} pts</p>
                    <p class="score-line">${state.playerNames[1]}: ${scores[1]} pts</p>`;
        } else {
            const winner = scores[0] > scores[1] ? 0 : 1;
            const loser = 1 - winner;
            html = `<span class="winner-name">🎉 ${state.playerNames[winner]} Gana!</span>
                    <p class="score-line">${state.playerNames[winner]}: ${scores[winner]} pts</p>
                    <p class="score-line">${state.playerNames[loser]}: ${scores[loser]} pts</p>
                    <p style="margin-top:0.5rem; color: var(--text-muted);">
                        Diferencia: ${Math.abs(scores[0] - scores[1])} puntos
                    </p>`;
        }

        els.gameOverContent.innerHTML = html;
        els.gameOverOverlay.classList.remove('hidden');
    }

    function getCategoryName(cat) {
        const names = {
            ones: 'Unos', twos: 'Doses', threes: 'Treses', fours: 'Cuatros',
            fives: 'Cincos', sixes: 'Seises', threeOfKind: 'Tercia',
            fourOfKind: 'Póker', fullHouse: 'Full House',
            smallStraight: 'Escalera Corta', largeStraight: 'Escalera Larga',
            yahtzee: 'Yahtzee', chance: 'Chance'
        };
        return names[cat] || cat;
    }

    function resetGame() {
        state = {
            currentPlayer: 0,
            rollsLeft: MAX_ROLLS,
            dice: [0, 0, 0, 0, 0],
            kept: [false, false, false, false, false],
            hasRolled: false,
            scores: [{}, {}],
            playerNames: state.playerNames,
            gameOver: false,
            turnsPlayed: 0
        };

        els.gameOverOverlay.classList.add('hidden');

        // Reset die displays
        for (let i = 0; i < NUM_DICE; i++) {
            const dieEl = $(`#die${i}`);
            dieEl.classList.remove('kept');
            dieEl.querySelector('.die-face').textContent = '?';
        }

        updateTurnUI();
        updateScorecard();
    }

    function startGame() {
        state.playerNames[0] = els.player1Name.value.trim() || 'Jugador 1';
        state.playerNames[1] = els.player2Name.value.trim() || 'Jugador 2';

        els.p1Header.textContent = state.playerNames[0].substring(0, 8);
        els.p2Header.textContent = state.playerNames[1].substring(0, 8);

        resetGame();
        showScreen(els.gameScreen);
    }

    /* ---------- EVENT LISTENERS ---------- */

    // Start & navigation
    els.btnStartGame.addEventListener('click', startGame);
    els.btnShowStats.addEventListener('click', () => showScreen(els.montecarloScreen));
    els.btnBackToMenu.addEventListener('click', () => {
        resetGame();
        showScreen(els.startScreen);
    });
    els.btnBackFromMC.addEventListener('click', () => showScreen(els.startScreen));
    els.btnPlayAgain.addEventListener('click', () => {
        resetGame();
        showScreen(els.gameScreen);
    });
    els.btnGoMenu.addEventListener('click', () => {
        resetGame();
        showScreen(els.startScreen);
    });

    // Roll dice
    els.btnRoll.addEventListener('click', rollDice);

    // Toggle keep on die click
    for (let i = 0; i < NUM_DICE; i++) {
        $(`#die${i}`).addEventListener('click', () => toggleKeep(i));
    }

    // Score selection via event delegation on table
    $('#scorecardTable').addEventListener('click', (e) => {
        const cell = e.target.closest('td.selectable');
        if (!cell) return;
        const row = cell.closest('tr');
        const category = row.dataset.category;
        const playerIndex = parseInt(cell.dataset.player);
        if (category && playerIndex === state.currentPlayer) {
            selectCategory(category, playerIndex);
        }
    });

    // Keyboard shortcut: Space to roll
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && els.gameScreen.classList.contains('active')) {
            e.preventDefault();
            rollDice();
        }
        // 1-5 to toggle dice
        if (['Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code) && els.gameScreen.classList.contains('active')) {
            const idx = parseInt(e.code.replace('Digit','')) - 1;
            toggleKeep(idx);
        }
    });

    // Expose for Montecarlo module
    window.YahtzeeEngine = {
        calculateScore,
        rollDie,
        countFaces,
        CATEGORIES,
        UPPER_CATEGORIES,
        UPPER_BONUS_THRESHOLD,
        UPPER_BONUS_VALUE
    };

})();
