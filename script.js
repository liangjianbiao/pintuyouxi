const GRID_SIZE = 4;
const PIECES = GRID_SIZE * GRID_SIZE;
const PIECES_SIZE = 70;

const defaultImages = [
    'image.png',
    'image1.png',
    'image3.png'
];

let images = [...defaultImages];
let currentLevel = 0;
let puzzlePieces = [];
let selectedPiece = null;
let steps = 0; 
let startTime = null;
let timerInterval = null;
let bestScores = {};
let canvas = null;
let ctx = null;
let previewImage = null;
let currentImage = new Image();
let isDragging = false;
let dragStartIndex = null;
let customImages = [];

function initGame() {
    canvas = document.getElementById('puzzle-canvas');
    ctx = canvas.getContext('2d');
    previewImage = document.getElementById('preview-image');
    
    canvas.width = GRID_SIZE * PIECES_SIZE;
    canvas.height = GRID_SIZE * PIECES_SIZE;
    
    setupEventListeners();
    loadBestScores();
    loadLevel(currentLevel);
}

function setupEventListeners() {
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    document.getElementById('btn-shuffle').addEventListener('click', shufflePuzzle);
    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-solve').addEventListener('click', solvePuzzle);
    document.getElementById('btn-restart').addEventListener('click', restartGame);
    document.getElementById('btn-next').addEventListener('click', nextLevel);
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    
    document.addEventListener('keydown', handleKeyDown);
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index >= 0 && index < PIECES) {
        isDragging = true;
        dragStartIndex = index;
        selectedPiece = index;
        drawPuzzle();
    }
}

function handleMouseMove(e) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index >= 0 && index < PIECES && index !== dragStartIndex) {
        selectedPiece = index;
        drawPuzzle();
    }
}

function handleMouseUp(e) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index >= 0 && index < PIECES && index !== dragStartIndex) {
        swapPieces(dragStartIndex, index);
        steps++;
        updateUI();
        checkCompletion();
    }
    
    isDragging = false;
    dragStartIndex = null;
    drawPuzzle();
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((touch.clientX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((touch.clientY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index >= 0 && index < PIECES) {
        isDragging = true;
        dragStartIndex = index;
        selectedPiece = index;
        drawPuzzle();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((touch.clientX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((touch.clientY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index >= 0 && index < PIECES && index !== dragStartIndex) {
        selectedPiece = index;
        drawPuzzle();
    }
}

function handleTouchEnd(e) {
    if (!isDragging || dragStartIndex === null) {
        isDragging = false;
        dragStartIndex = null;
        drawPuzzle();
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let touchX, touchY;
    if (e.changedTouches && e.changedTouches.length > 0) {
        touchX = e.changedTouches[0].clientX;
        touchY = e.changedTouches[0].clientY;
    } else {
        isDragging = false;
        dragStartIndex = null;
        drawPuzzle();
        return;
    }
    
    const x = Math.floor((touchX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((touchY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index >= 0 && index < PIECES && index !== dragStartIndex) {
        swapPieces(dragStartIndex, index);
        steps++;
        updateUI();
        checkCompletion();
    }
    
    isDragging = false;
    dragStartIndex = null;
    selectedPiece = null;
    drawPuzzle();
}

function handleKeyDown(e) {
    if (!selectedPiece || selectedPiece < 0 || selectedPiece >= PIECES) return;
    
    const selectedX = selectedPiece % GRID_SIZE;
    const selectedY = Math.floor(selectedPiece / GRID_SIZE);
    let targetIndex = -1;
    
    switch(e.key) {
        case 'ArrowUp':
            if (selectedY > 0) targetIndex = (selectedY - 1) * GRID_SIZE + selectedX;
            break;
        case 'ArrowDown':
            if (selectedY < GRID_SIZE - 1) targetIndex = (selectedY + 1) * GRID_SIZE + selectedX;
            break;
        case 'ArrowLeft':
            if (selectedX > 0) targetIndex = selectedY * GRID_SIZE + (selectedX - 1);
            break;
        case 'ArrowRight':
            if (selectedX < GRID_SIZE - 1) targetIndex = selectedY * GRID_SIZE + (selectedX + 1);
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            selectedPiece = null;
            drawPuzzle();
            return;
    }
    
    if (targetIndex >= 0 && targetIndex < PIECES) {
        swapPieces(selectedPiece, targetIndex);
        selectedPiece = targetIndex;
        steps++;
        updateUI();
        checkCompletion();
        drawPuzzle();
    }
}

function loadLevel(levelIndex) {
    currentLevel = levelIndex;
    const imageUrl = images[currentLevel];
    
    currentImage = new Image();
    currentImage.onload = function() {
        previewImage.src = imageUrl;
        initializePuzzle();
    };
    currentImage.onerror = function() {
        console.error('Failed to load image:', imageUrl);
    };
    currentImage.src = imageUrl;
    
    steps = 0;
    selectedPiece = null;
    updateUI();
}

function initializePuzzle() {
    puzzlePieces = [];
    for (let i = 0; i < PIECES; i++) {
        puzzlePieces.push(i);
    }
    
    shufflePuzzlePieces();
    drawPuzzle();
    startTimer();
}

function shufflePuzzlePieces() {
    let attempts = 0;
    do {
        for (let i = puzzlePieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [puzzlePieces[i], puzzlePieces[j]] = [puzzlePieces[j], puzzlePieces[i]];
        }
        attempts++;
    } while (!isSolvable() && attempts < 100);
}

function isSolvable() {
    let inversions = 0;
    for (let i = 0; i < PIECES - 1; i++) {
        for (let j = i + 1; j < PIECES; j++) {
            if (puzzlePieces[i] > puzzlePieces[j]) {
                inversions++;
            }
        }
    }
    
    if (GRID_SIZE % 2 === 1) {
        return inversions % 2 === 0;
    } else {
        const emptyRow = Math.floor(puzzlePieces.indexOf(PIECES - 1) / GRID_SIZE);
        const emptyRowFromBottom = GRID_SIZE - emptyRow;
        return (inversions + emptyRowFromBottom) % 2 === 1;
    }
}

function shufflePuzzle() {
    shufflePuzzlePieces();
    steps = 0;
    selectedPiece = null;
    updateUI();
    drawPuzzle();
    startTimer();
}

function handleCanvasClick(e) {
    if (isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIECES_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIECES_SIZE);
    
    const index = y * GRID_SIZE + x;
    
    if (index < 0 || index >= PIECES) return;
    
    if (selectedPiece === null) {
        selectedPiece = index;
        drawPuzzle();
    } else if (selectedPiece === index) {
        selectedPiece = null;
        drawPuzzle();
    } else {
        swapPieces(selectedPiece, index);
        selectedPiece = null;
        steps++;
        updateUI();
        drawPuzzle();
        checkCompletion();
    }
}

function swapPieces(index1, index2) {
    [puzzlePieces[index1], puzzlePieces[index2]] = [puzzlePieces[index2], puzzlePieces[index1]];
}

function checkCompletion() {
    if (isPuzzleComplete()) {
        stopTimer();
        saveBestScore();
        showWinMessage();
    }
}

function isPuzzleComplete() {
    for (let i = 0; i < PIECES - 1; i++) {
        if (puzzlePieces[i] !== i) {
            return false;
        }
    }
    return true;
}

function drawPuzzle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const imageSize = Math.min(currentImage.width, currentImage.height);
    const offsetX = (currentImage.width - imageSize) / 2;
    const offsetY = (currentImage.height - imageSize) / 2;
    
    const pieceSrcSize = imageSize / GRID_SIZE;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const index = y * GRID_SIZE + x;
            const pieceIndex = puzzlePieces[index];
            
            if (pieceIndex === PIECES - 1) {
                ctx.fillStyle = '#f5f5f5';
                ctx.fillRect(x * PIECES_SIZE, y * PIECES_SIZE, PIECES_SIZE, PIECES_SIZE);
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(x * PIECES_SIZE + 2, y * PIECES_SIZE + 2, PIECES_SIZE - 4, PIECES_SIZE - 4);
                ctx.setLineDash([]);
            } else {
                const originalX = offsetX + (pieceIndex % GRID_SIZE) * pieceSrcSize;
                const originalY = offsetY + Math.floor(pieceIndex / GRID_SIZE) * pieceSrcSize;
                
                ctx.drawImage(
                    currentImage,
                    originalX, originalY, pieceSrcSize, pieceSrcSize,
                    x * PIECES_SIZE, y * PIECES_SIZE, PIECES_SIZE, PIECES_SIZE
                );
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pieceIndex + 1, x * PIECES_SIZE + PIECES_SIZE/2, y * PIECES_SIZE + PIECES_SIZE - 10);
            }
            
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * PIECES_SIZE, y * PIECES_SIZE, PIECES_SIZE, PIECES_SIZE);
            
            if (index === selectedPiece) {
                ctx.fillStyle = 'rgba(102, 126, 234, 0.4)';
                ctx.fillRect(x * PIECES_SIZE, y * PIECES_SIZE, PIECES_SIZE, PIECES_SIZE);
                ctx.strokeStyle = '#667eea';
                ctx.lineWidth = 3;
                ctx.strokeRect(x * PIECES_SIZE + 2, y * PIECES_SIZE + 2, PIECES_SIZE - 4, PIECES_SIZE - 4);
            }
            
            if (pieceIndex === index && pieceIndex !== PIECES - 1) {
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * PIECES_SIZE + 1, y * PIECES_SIZE + 1, PIECES_SIZE - 2, PIECES_SIZE - 2);
            }
        }
    }
    
    const progress = calculateProgress();
    document.getElementById('progress').style.width = `${progress}%`;
}

function calculateProgress() {
    let correct = 0;
    for (let i = 0; i < PIECES; i++) {
        if (puzzlePieces[i] === i) correct++;
    }
    return Math.round((correct / PIECES) * 100);
}

function showHint() {
    for (let i = 0; i < PIECES; i++) {
        if (puzzlePieces[i] !== i) {
            const correctIndex = puzzlePieces[i];
            const currentX = i % GRID_SIZE;
            const currentY = Math.floor(i / GRID_SIZE);
            const correctX = correctIndex % GRID_SIZE;
            const correctY = Math.floor(correctIndex / GRID_SIZE);
            
            alert(`提示：将位置 (${currentX + 1}, ${currentY + 1}) 的拼图块移动到 (${correctX + 1}, ${correctY + 1})`);
            return;
        }
    }
    alert('拼图已经完成！');
}

function solvePuzzle() {
    puzzlePieces = [];
    for (let i = 0; i < PIECES; i++) {
        puzzlePieces.push(i);
    }
    selectedPiece = null;
    drawPuzzle();
    stopTimer();
    showWinMessage();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageDataUrl = event.target.result;
        customImages.push(imageDataUrl);
        images.push(imageDataUrl);
        
        currentLevel = images.length - 1;
        loadLevel(currentLevel);
        
        document.getElementById('file-upload').value = '';
        
        alert('图片上传成功！现在可以开始新的拼图关卡。');
    };
    reader.readAsDataURL(file);
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('time').textContent = `${minutes}:${seconds}`;
}

function getElapsedTime() {
    return Math.floor((Date.now() - startTime) / 1000);
}

function updateUI() {
    document.getElementById('current-level').textContent = currentLevel + 1;
    document.querySelector('.level-info').innerHTML = `第 <span id="current-level">${currentLevel + 1}</span> / ${images.length} 关`;
    document.getElementById('steps').textContent = steps;
    document.getElementById('best').textContent = bestScores[currentLevel] ? `${bestScores[currentLevel]}步` : '--';
}

function saveBestScore() {
    if (!bestScores[currentLevel] || steps < bestScores[currentLevel]) {
        bestScores[currentLevel] = steps;
        localStorage.setItem('puzzle_best', JSON.stringify(bestScores));
    }
}

function loadBestScores() {
    const saved = localStorage.getItem('puzzle_best');
    if (saved) {
        bestScores = JSON.parse(saved);
    }
}

function showWinMessage() {
    const elapsed = getElapsedTime();
    const stars = steps <= 15 ? '⭐⭐⭐' : steps <= 30 ? '⭐⭐' : '⭐';
    document.getElementById('message-icon').textContent = '🎉';
    document.getElementById('message-title').textContent = '恭喜完成！';
    document.getElementById('message-text').textContent = `太棒了！用了 ${steps} 步，用时 ${formatTime(elapsed)}！`;
    document.getElementById('message-stars').textContent = stars;
    document.getElementById('message-overlay').classList.add('show');
    
    if (currentLevel >= images.length - 1) {
        document.getElementById('btn-next').textContent = '重新开始';
        document.getElementById('btn-next').onclick = restartGame;
    } else {
        document.getElementById('btn-next').textContent = '下一关 →';
        document.getElementById('btn-next').onclick = nextLevel;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function hideMessage() {
    document.getElementById('message-overlay').classList.remove('show');
}

function nextLevel() {
    if (currentLevel < images.length - 1) {
        currentLevel++;
        loadLevel(currentLevel);
        hideMessage();
    }
}

function restartGame() {
    currentLevel = 0;
    loadLevel(currentLevel);
    hideMessage();
}

window.addEventListener('load', initGame);