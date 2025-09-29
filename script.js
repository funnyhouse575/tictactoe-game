// ===== API ФУНКЦИИ =====
const API_BASE = '/api';

const api = {
    // Игры
    async createGame(playerName, gameType = 'normal') {
        const response = await fetch(`${API_BASE}/game/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, gameType })
        });
        return await response.json();
    },

    async getGame(gameId) {
        const response = await fetch(`${API_BASE}/game/${gameId}`);
        return await response.json();
    },

    async makeMove(gameId, player, position) {
        const response = await fetch(`${API_BASE}/game/${gameId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, position })
        });
        return await response.json();
    },

    async joinGame(gameId, playerName) {
        const response = await fetch(`${API_BASE}/game/${gameId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName })
        });
        return await response.json();
    },

    // Лобби
    async getLobbies() {
        const response = await fetch(`${API_BASE}/lobbies`);
        return await response.json();
    },

    async createLobby(lobbyData) {
        const response = await fetch(`${API_BASE}/lobbies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lobbyData)
        });
        return await response.json();
    }
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let moveTimer = null;
let timeLeft = 30;

// ===== СИСТЕМА АВТОРИЗАЦИИ =====
let users = JSON.parse(localStorage.getItem('tictactoe_users')) || [];

function getUsers() {
    const usersData = localStorage.getItem('tictactoe_users');
    if (!usersData) return [];
    try {
        const users = JSON.parse(usersData);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('tictactoe_users', JSON.stringify(users));
}

function showMessage(text, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');

    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 3000);
}

function generateGuestName() {
    const adjectives = ['Быстрый', 'Смелый', 'Умный', 'Ловкий', 'Сильный', 'Весёлый'];
    const nouns = ['Игрок', 'Боец', 'Стратег', 'Чемпион', 'Мастер', 'Гений'];
    const randomNum = Math.floor(Math.random() * 1000);

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}${noun}${randomNum}`;
}

// Обработка формы входа
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username.length < 3) {
            showMessage('Ник должен быть не менее 3 символов');
            return;
        }

        if (password.length < 4) {
            showMessage('Пароль должен быть не менее 4 символов');
            return;
        }

        const users = getUsers();
        const existingUser = users.find(user => user.username === username);

        if (existingUser) {
            if (existingUser.password === password) {
                loginSuccess(username, false);
            } else {
                showMessage('Неверный пароль');
            }
        } else {
            const newUser = {
                username: username,
                password: password,
                isGuest: false,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            saveUsers(users);
            loginSuccess(username, false);
        }
    });
}

// Вход как гость
const guestLogin = document.getElementById('guestLogin');
if (guestLogin) {
    guestLogin.addEventListener('click', function(e) {
        e.preventDefault();
        const guestName = generateGuestName();
        const users = getUsers();

        const guestUser = {
            username: guestName,
            password: '',
            isGuest: true,
            createdAt: new Date().toISOString()
        };
        users.push(guestUser);
        saveUsers(users);
        loginSuccess(guestName, true);
    });
}

function loginSuccess(username, isGuest) {
    const currentUser = {
        username: username,
        isGuest: isGuest,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('tictactoe_current_user', JSON.stringify(currentUser));
    showMessage(`Добро пожаловать, ${username}!`, 'success');

    setTimeout(() => {
        window.location.href = 'game.html';
    }, 1000);
}

function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('tictactoe_current_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// ===== ГЛАВНОЕ МЕНЮ =====
function startQuickGame() {
    showOpponentModal();
}

async function createLobby(type) {
    if (type === 'normal' || type === 'super') {
        showCreateLobbyModal();
    } else {
        const currentUser = JSON.parse(localStorage.getItem('tictactoe_current_user'));
        try {
            const result = await api.createLobby({
                name: `Лобби ${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                type: type,
                creator: currentUser.username,
                privacy: 'public'
            });

            if (result.success) {
                localStorage.setItem('currentLobby', result.lobby.id);
                window.location.href = 'lobby-waiting.html';
            }
        } catch (error) {
            alert('Не удалось создать лобби');
        }
    }
}

function startRatedGame() {
    alert('Запуск рейтинговой игры...');
}

function startUnratedGame() {
    alert('Запуск нерейтинговой игры...');
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showOpponentModal() {
    const modal = document.getElementById('opponentModal');
    if (modal) modal.classList.remove('hidden');
}

function hideOpponentModal() {
    const modal = document.getElementById('opponentModal');
    if (modal) modal.classList.add('hidden');
}

function showCreateLobbyModal() {
    const modal = document.getElementById('createLobbyModal');
    if (modal) modal.classList.remove('hidden');
}

function hideCreateLobbyModal() {
    const modal = document.getElementById('createLobbyModal');
    if (modal) modal.classList.add('hidden');
}

// ===== ИГРА С КОМПЬЮТЕРОМ =====
function makeComputerMove() {
    if (!gameActive) return;

    const gameType = localStorage.getItem('gameType');
    if (gameType !== 'computer' || currentPlayer === 'X') return;

    setTimeout(() => {
        let move = findWinningMove('O') || findWinningMove('X') || findRandomMove();

        if (move !== -1) {
            gameBoard[move] = 'O';
            const cell = document.querySelector(`.cell[data-index="${move}"]`);
            cell.textContent = 'O';
            cell.classList.add('o');

            if (checkWin()) {
                gameActive = false;
                highlightWinningCells();
                updateStatusMessage('Компьютер победил!', 'status-win');
                return;
            }

            if (checkDraw()) {
                gameActive = false;
                updateStatusMessage('Ничья!', 'status-draw');
                return;
            }

            currentPlayer = 'X';
            updateStatusMessage('Ваш ход!', 'status-turn');
        }
    }, 500);
}

function findWinningMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        let playerCount = 0;
        let emptyIndex = -1;

        if (gameBoard[a] === player) playerCount++;
        else if (gameBoard[a] === '') emptyIndex = a;

        if (gameBoard[b] === player) playerCount++;
        else if (gameBoard[b] === '') emptyIndex = b;

        if (gameBoard[c] === player) playerCount++;
        else if (gameBoard[c] === '') emptyIndex = c;

        if (playerCount === 2 && emptyIndex !== -1) {
            return emptyIndex;
        }
    }
    return -1;
}

function findRandomMove() {
    const emptyCells = [];
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            emptyCells.push(i);
        }
    }

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
    return -1;
}

// ===== MULTIPLAYER ЛОГИКА =====
async function initMultiplayerGame() {
    const gameId = localStorage.getItem('currentGame');
    const currentUser = checkAuth();

    if (!gameId || !currentUser) {
        window.location.href = 'game.html';
        return;
    }

    try {
        const result = await api.getGame(gameId);
        if (result.success) {
            setupMultiplayerGame(result.game, currentUser);
        } else {
            window.location.href = 'game.html';
        }
    } catch (error) {
        window.location.href = 'game.html';
    }
}

function setupMultiplayerGame(game, currentUser) {
    gameBoard = [...game.board];
    gameActive = game.status === 'playing';
    currentPlayer = game.currentPlayer;

    const isPlayerX = game.players[0] === currentUser.username;
    const mySymbol = isPlayerX ? 'X' : 'O';

    updateMultiplayerUI(game, currentUser);
    updateGameBoardUI();

    if (gameActive && currentPlayer === mySymbol) {
        unlockGameBoard();
        updateStatusMessage('Ваш ход!', 'status-turn');
        startMoveTimer();
    } else if (gameActive) {
        lockGameBoard();
        updateStatusMessage('Ожидание хода соперника...', 'status-waiting-opponent');
        startGamePolling();
    } else {
        endMultiplayerGame(game);
    }
}

function startGamePolling() {
    if (window.gamePollInterval) clearInterval(window.gamePollInterval);

    window.gamePollInterval = setInterval(async () => {
        await checkGameUpdates();
    }, 2000);
}

async function checkGameUpdates() {
    const gameId = localStorage.getItem('currentGame');
    const currentUser = checkAuth();

    try {
        const result = await api.getGame(gameId);
        if (result.success) {
            const game = result.game;

            if (JSON.stringify(gameBoard) !== JSON.stringify(game.board)) {
                gameBoard = [...game.board];
                gameActive = game.status === 'playing';
                currentPlayer = game.currentPlayer;

                updateGameBoardUI();

                const isPlayerX = game.players[0] === currentUser.username;
                const mySymbol = isPlayerX ? 'X' : 'O';

                if (gameActive && currentPlayer === mySymbol) {
                    unlockGameBoard();
                    updateStatusMessage('Ваш ход!', 'status-turn');
                    startMoveTimer();
                    stopGamePolling();
                } else if (!gameActive) {
                    endMultiplayerGame(game);
                    stopGamePolling();
                }
            }
        }
    } catch (error) {
        console.error('Ошибка проверки обновлений:', error);
    }
}

function stopGamePolling() {
    if (window.gamePollInterval) {
        clearInterval(window.gamePollInterval);
        window.gamePollInterval = null;
    }
}

// ===== ОСНОВНАЯ ИГРОВАЯ ЛОГИКА =====
function initGame() {
    const gameType = localStorage.getItem('gameType') || 'player';
    const gameTitle = document.getElementById('gameTitle');
    const opponentType = document.getElementById('opponentType');

    if (gameTitle) {
        if (gameType === 'computer') gameTitle.textContent = 'Игра с компьютером';
        else if (gameType === 'multiplayer') gameTitle.textContent = 'Мультиплеер';
        else gameTitle.textContent = 'Игра с игроком';
    }

    if (opponentType) {
        if (gameType === 'computer') opponentType.textContent = ' vs 🤖 Компьютер';
        else if (gameType === 'multiplayer') {
            const currentUser = checkAuth();
            opponentType.textContent = ` vs 👤 Игрок`;
        } else opponentType.textContent = ' vs 👤 Игрок';
    }

    const cells = document.querySelectorAll('.cell');
    const statusMessage = document.getElementById('statusMessage');
    const restartBtn = document.getElementById('restartBtn');
    const backBtn = document.getElementById('backBtn');

    if (cells.length > 0) {
        cells.forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });

        if (restartBtn) restartBtn.addEventListener('click', restartGame);
        if (backBtn) backBtn.addEventListener('click', () => {
            window.location.href = localStorage.getItem('gameType') === 'multiplayer'
                ? 'lobby-waiting.html'
                : 'game.html';
        });

        if (gameType === 'multiplayer') {
            initMultiplayerGame();
        } else {
            updateStatusMessage('Ваш ход!', 'status-turn');
            if (gameType === 'computer' && currentPlayer === 'O') {
                makeComputerMove();
            }
        }
    }
}

async function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));
    const gameType = localStorage.getItem('gameType');

    if (gameBoard[index] !== '' || !gameActive) return;

    if (gameType === 'multiplayer') {
        await handleMultiplayerMove(index);
    } else {
        handleSingleplayerMove(index);
    }
}

function handleSingleplayerMove(index) {
    gameBoard[index] = currentPlayer;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());

    if (checkWin()) {
        gameActive = false;
        highlightWinningCells();
        updateStatusMessage(`Поздравляем! ${currentPlayer} победил!`, 'status-win');
        return;
    }

    if (checkDraw()) {
        gameActive = false;
        updateStatusMessage('Ничья!', 'status-draw');
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatusMessage(`Ход игрока ${currentPlayer}`, 'status-turn');

    if (localStorage.getItem('gameType') === 'computer' && currentPlayer === 'O') {
        makeComputerMove();
    }
}

async function handleMultiplayerMove(index) {
    const gameId = localStorage.getItem('currentGame');
    const currentUser = checkAuth();

    try {
        const gameResult = await api.getGame(gameId);
        if (!gameResult.success) return;

        const game = gameResult.game;
        const isPlayerX = game.players[0] === currentUser.username;
        const mySymbol = isPlayerX ? 'X' : 'O';

        if (game.currentPlayer !== mySymbol) {
            alert('Не ваш ход!');
            return;
        }

        const moveResult = await api.makeMove(gameId, mySymbol, index);

        if (moveResult.success) {
            gameBoard = [...moveResult.game.board];
            gameActive = moveResult.game.status === 'playing';
            currentPlayer = moveResult.game.currentPlayer;

            updateGameBoardUI();

            if (gameActive) {
                lockGameBoard();
                updateStatusMessage('Ожидание хода соперника...', 'status-waiting-opponent');
                startGamePolling();
                stopMoveTimer();
            } else {
                endMultiplayerGame(moveResult.game);
            }
        } else {
            alert('Ошибка хода: ' + moveResult.error);
        }
    } catch (error) {
        alert('Не удалось сделать ход');
    }
}

function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return gameBoard[a] !== '' && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c];
    });
}

function checkDraw() {
    return gameBoard.every(cell => cell !== '');
}

function highlightWinningCells(board = gameBoard) {
    const winner = checkWinFromBoard(board);
    if (!winner) return;

    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    const winningPattern = winPatterns.find(pattern => {
        const [a, b, c] = pattern;
        return board[a] !== '' && board[a] === board[b] && board[a] === board[c];
    });

    if (winningPattern) {
        winningPattern.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            if (cell) cell.classList.add('winner');
        });
    }
}

function checkWinFromBoard(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] !== '' && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function updateGameBoardUI() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = gameBoard[index];
        cell.className = 'cell';
        if (gameBoard[index] === 'X') cell.classList.add('x');
        else if (gameBoard[index] === 'O') cell.classList.add('o');
    });
}

function lockGameBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.pointerEvents = 'none';
        cell.classList.add('player-waiting');
    });
}

function unlockGameBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.classList.remove('player-waiting');
    });
}

function updateStatusMessage(message, className = 'status-turn') {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = className;
    }
}

function restartGame() {
    const gameType = localStorage.getItem('gameType');
    if (gameType === 'multiplayer') {
        alert('В multiplayer игре перезапуск возможен только из лобби');
        return;
    }

    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';

    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });

    updateStatusMessage('Ваш ход!', 'status-turn');

    if (gameType === 'computer' && currentPlayer === 'O') {
        makeComputerMove();
    }
}

function endMultiplayerGame(game) {
    gameActive = false;
    stopMoveTimer();
    stopGamePolling();
    lockGameBoard();

    let message = 'Игра завершена';
    if (game.winner) {
        const currentUser = checkAuth();
        const isPlayerX = game.players[0] === currentUser.username;
        const mySymbol = isPlayerX ? 'X' : 'O';

        if (game.winner === mySymbol) {
            message = 'Поздравляем! Вы победили! 🎉';
        } else {
            message = 'Вы проиграли. Попробуйте еще раз!';
        }
    } else if (game.status === 'draw') {
        message = 'Ничья! 🤝';
    }

    updateStatusMessage(message, message.includes('победили') ? 'status-win' : 'status-draw');
    highlightWinningCells(game.board);
}

// ===== ТАЙМЕР ХОДА =====
function startMoveTimer() {
    stopMoveTimer();
    timeLeft = 30;
    updateTimerDisplay();

    moveTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            handleTimeOut();
        }
    }, 1000);
}

function stopMoveTimer() {
    if (moveTimer) {
        clearInterval(moveTimer);
        moveTimer = null;
    }
}

function updateTimerDisplay() {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage && localStorage.getItem('gameType') === 'multiplayer') {
        const timerText = timeLeft <= 10 ?
            `<span class="timer-warning">${timeLeft}с</span>` :
            `${timeLeft}с`;

        const baseMessage = statusMessage.textContent.replace(/\d+с$/, '').trim();
        statusMessage.innerHTML = `${baseMessage} (${timerText})`;
    }
}

function handleTimeOut() {
    if (localStorage.getItem('gameType') === 'multiplayer') {
        endMultiplayerGame({ status: 'finished', winner: null });
    }
}

// ===== СПИСОК ЛОББИ =====
async function loadLobbies() {
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');

    if (loadingState) loadingState.classList.remove('hidden');

    try {
        const result = await api.getLobbies();

        if (result.success) {
            let filteredLobbies = result.lobbies;
            const gameTypeFilter = document.getElementById('gameTypeFilter');
            const privacyFilter = document.getElementById('privacyFilter');

            if (gameTypeFilter && gameTypeFilter.value !== 'all') {
                filteredLobbies = filteredLobbies.filter(lobby => lobby.type === gameTypeFilter.value);
            }

            if (privacyFilter && privacyFilter.value !== 'all') {
                filteredLobbies = filteredLobbies.filter(lobby => lobby.privacy === privacyFilter.value);
            }

            displayLobbies(filteredLobbies);

            if (emptyState) {
                emptyState.classList.toggle('hidden', filteredLobbies.length > 0);
            }
        }
    } catch (error) {
        alert('Не удалось загрузить список лобби');
    } finally {
        if (loadingState) loadingState.classList.add('hidden');
    }
}

function displayLobbies(lobbies) {
    const lobbiesList = document.getElementById('lobbiesList');
    if (!lobbiesList) return;

    lobbiesList.innerHTML = '';

    lobbies.forEach(lobby => {
        const lobbyItem = document.createElement('div');
        lobbyItem.className = `lobby-item ${lobby.players.length >= lobby.maxPlayers ? 'lobby-full' : ''}`;
        lobbyItem.innerHTML = `
            <div class="lobby-item-header">
                <div class="lobby-name">${lobby.name}</div>
                <div class="lobby-type ${lobby.type}">
                    ${lobby.type === 'super' ? 'Супер игра' : 'Обычная игра'}
                </div>
            </div>
            <div class="lobby-details-row">
                <div class="lobby-detail">
                    <span>👥</span>
                    <span class="lobby-players">${lobby.players.length}/${lobby.maxPlayers}</span>
                </div>
                <div class="lobby-detail">
                    <span class="lobby-privacy privacy-${lobby.privacy}">
                        ${lobby.privacy === 'public' ? 'Публичное' : 'Приватное'}
                    </span>
                </div>
            </div>
            <div class="lobby-details-row">
                <div class="lobby-detail">
                    <span>👑 Создатель:</span>
                    <span class="lobby-creator">${lobby.creator}</span>
                </div>
                <div class="lobby-detail">
                    <span>🆔 ID:</span>
                    <span>${lobby.id}</span>
                </div>
            </div>
        `;

        if (lobby.players.length < lobby.maxPlayers) {
            lobbyItem.addEventListener('click', () => joinLobbyFromList(lobby));
        }

        lobbiesList.appendChild(lobbyItem);
    });
}

async function joinLobbyFromList(lobby) {
    const currentUser = checkAuth();

    if (lobby.players.includes(currentUser.username)) {
        alert('Вы уже находитесь в этом лобби!');
        return;
    }

    if (lobby.privacy === 'private') {
        showPasswordModal(lobby);
    } else {
        await addPlayerToLobby(lobby.id, currentUser.username);
    }
}

async function addPlayerToLobby(lobbyId, username) {
    try {
        // Создаем игру при присоединении к лобби
        const gameResult = await api.createGame(username, 'multiplayer');

        if (gameResult.success) {
            localStorage.setItem('currentGame', gameResult.gameId);
            localStorage.setItem('gameType', 'multiplayer');
            window.location.href = 'game-board.html';
        }
    } catch (error) {
        alert('Не удалось присоединиться к лобби');
    }
}

// ===== ОЖИДАНИЕ ЛОББИ =====
async function initLobbyWaiting() {
    const currentUser = checkAuth();

    // Создаем игру при заходе в лобби
    try {
        const result = await api.createGame(currentUser.username, 'multiplayer');

        if (result.success) {
            localStorage.setItem('currentGame', result.gameId);
            await updateLobbyUI(result.gameId, currentUser);
            startLobbyPolling(result.gameId);
        }
    } catch (error) {
        alert('Не удалось создать игру');
    }

    // Обработчики кнопок
    const backBtn = document.getElementById('backBtn');
    const copyBtn = document.getElementById('copyBtn');
    const startBtn = document.getElementById('startBtn');
    const leaveBtn = document.getElementById('leaveBtn');

    if (backBtn) backBtn.addEventListener('click', leaveLobby);
    if (copyBtn) copyBtn.addEventListener('click', () => {
        const gameId = localStorage.getItem('currentGame');
        navigator.clipboard.writeText(gameId).then(() => alert('ID игры скопирован!'));
    });
    if (startBtn) startBtn.addEventListener('click', () => startGame());
    if (leaveBtn) leaveBtn.addEventListener('click', leaveLobby);
}

async function updateLobbyUI(gameId, currentUser) {
    try {
        const result = await api.getGame(gameId);
        if (result.success) {
            const game = result.game;
            document.getElementById('lobbyName').textContent = `Игра ${gameId}`;
            document.getElementById('lobbyId').textContent = gameId;
            document.getElementById('lobbyCreator').textContent = game.creator;
            document.getElementById('lobbyType').textContent = game.type === 'super' ? 'Супер игра' : 'Обычная игра';

            updatePlayersList(game.players, game.creator);

            const startBtn = document.getElementById('startBtn');
            if (startBtn) {
                startBtn.classList.toggle('hidden', game.creator !== currentUser.username || game.players.length < 2);
            }
        }
    } catch (error) {
        console.error('Ошибка обновления лобби:', error);
    }
}

function updatePlayersList(players, creator) {
    const playersList = document.getElementById('playersList');
    const playersCount = document.getElementById('playersCount');

    if (playersList && playersCount) {
        playersCount.textContent = players.length;
        playersList.innerHTML = '';

        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = `player-item ${player === creator ? 'player-creator' : ''}`;
            playerItem.textContent = `${player} ${player === creator ? '👑' : ''}`;
            playersList.appendChild(playerItem);
        });
    }
}

function startLobbyPolling(gameId) {
    setInterval(async () => {
        const result = await api.getGame(gameId);
        if (result.success && result.game.players.length === 2) {
            window.location.href = 'game-board.html';
        }
    }, 2000);
}

function startGame() {
    window.location.href = 'game-board.html';
}

function leaveLobby() {
    localStorage.removeItem('currentGame');
    localStorage.removeItem('currentLobby');
    window.location.href = 'game.html';
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации для защищенных страниц
    if (!window.location.pathname.includes('index.html')) {
        checkAuth();
    }

    // Инициализация страниц
    if (window.location.pathname.includes('game.html')) {
        // Главное меню
        const quickGameBtn = document.getElementById('quickGame');
        const createLobbyBtn = document.getElementById('createLobby');
        const viewLobbiesBtn = document.getElementById('viewLobbies');
        const ratedGameBtn = document.getElementById('ratedGame');
        const unratedGameBtn = document.getElementById('unratedGame');
        const createSuperLobbyBtn = document.getElementById('createSuperLobby');
        const logoutBtn = document.getElementById('logoutBtn');

        if (quickGameBtn) quickGameBtn.addEventListener('click', startQuickGame);
        if (createLobbyBtn) createLobbyBtn.addEventListener('click', () => createLobby('normal'));
        if (viewLobbiesBtn) viewLobbiesBtn.addEventListener('click', () => window.location.href = 'lobby-list.html');
        if (ratedGameBtn) ratedGameBtn.addEventListener('click', startRatedGame);
        if (unratedGameBtn) unratedGameBtn.addEventListener('click', startUnratedGame);
        if (createSuperLobbyBtn) createSuperLobbyBtn.addEventListener('click', () => createLobby('super'));
        if (logoutBtn) logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('tictactoe_current_user');
            window.location.href = 'index.html';
        });

        // Обработчики модальных окон
        const vsComputerBtn = document.getElementById('vsComputer');
        const vsPlayerBtn = document.getElementById('vsPlayer');
        const cancelBtn = document.getElementById('cancelGame');

        if (vsComputerBtn) vsComputerBtn.addEventListener('click', () => {
            hideOpponentModal();
            localStorage.setItem('gameType', 'computer');
            window.location.href = 'game-board.html';
        });
        if (vsPlayerBtn) vsPlayerBtn.addEventListener('click', () => {
            hideOpponentModal();
            localStorage.setItem('gameType', 'player');
            window.location.href = 'game-board.html';
        });
        if (cancelBtn) cancelBtn.addEventListener('click', hideOpponentModal);

        const opponentModal = document.getElementById('opponentModal');
        if (opponentModal) {
            opponentModal.addEventListener('click', function(e) {
                if (e.target === this) hideOpponentModal();
            });
        }

        // Создание лобби
        const confirmCreateLobby = document.getElementById('confirmCreateLobby');
        const cancelCreateLobby = document.getElementById('cancelCreateLobby');
        const lobbyPrivacy = document.getElementById('lobbyPrivacy');
        const passwordGroup = document.getElementById('passwordGroup');

        if (lobbyPrivacy && passwordGroup) {
            lobbyPrivacy.addEventListener('change', function() {
                passwordGroup.classList.toggle('hidden', this.value !== 'private');
            });
        }

        if (confirmCreateLobby) {
            confirmCreateLobby.addEventListener('click', async function() {
                const lobbyName = document.getElementById('lobbyName').value.trim() || 'Без названия';
                const lobbyType = document.getElementById('lobbyType').value;
                const privacy = document.getElementById('lobbyPrivacy').value;
                const currentUser = JSON.parse(localStorage.getItem('tictactoe_current_user'));

                try {
                    const result = await api.createLobby({
                        name: lobbyName,
                        type: lobbyType,
                        creator: currentUser.username,
                        privacy: privacy,
                        password: privacy === 'private' ? document.getElementById('lobbyPassword').value : ''
                    });

                    if (result.success) {
                        localStorage.setItem('currentLobby', result.lobby.id);
                        hideCreateLobbyModal();
                        window.location.href = 'lobby-waiting.html';
                    }
                } catch (error) {
                    alert('Не удалось создать лобби');
                }
            });
        }

        if (cancelCreateLobby) cancelCreateLobby.addEventListener('click', hideCreateLobbyModal);

        const createLobbyModal = document.getElementById('createLobbyModal');
        if (createLobbyModal) {
            createLobbyModal.addEventListener('click', function(e) {
                if (e.target === this) hideCreateLobbyModal();
            });
        }

    } else if (window.location.pathname.includes('game-board.html')) {
        // Игровая страница
        initGame();
    } else if (window.location.pathname.includes('lobby-list.html')) {
        // Список лобби
        loadLobbies();

        const backBtn = document.getElementById('backBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const gameTypeFilter = document.getElementById('gameTypeFilter');
        const privacyFilter = document.getElementById('privacyFilter');

        if (backBtn) backBtn.addEventListener('click', () => window.location.href = 'game.html');
        if (refreshBtn) refreshBtn.addEventListener('click', loadLobbies);
        if (gameTypeFilter) gameTypeFilter.addEventListener('change', loadLobbies);
        if (privacyFilter) privacyFilter.addEventListener('change', loadLobbies);

    } else if (window.location.pathname.includes('lobby-waiting.html')) {
        // Ожидание лобби
        initLobbyWaiting();
    }

    // Фокус на поле ввода при загрузке страницы входа
    const usernameInput = document.getElementById('username');
    if (usernameInput) usernameInput.focus();
});