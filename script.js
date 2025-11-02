class LogicPuzzleGame {
    constructor() {
        this.gridSize = 8;
        this.level = 1;
        this.score = 0;
        this.time = 0;
        this.timer = null;
        
        this.shapes = [
            [[1,1],[1,1]], // квадрат
            [[1,1,1]], // линия
            [[1,1,1],[0,1,0]], // T
            [[1,1],[1,0]], // L
            [[1,1,0],[0,1,1]], // зигзаг
            [[1],[1],[1],[1]], // длинная линия
            [[1,1,1],[1,0,0]] // уголок
        ];
        
        this.colors = ['#4dabf7', '#20c997', '#ffa94d', '#da77f2', '#ff6b6b', '#51cf66', '#ffd43b'];
        
        this.currentShape = null;
        this.nextShape = null;
        
        this.initializeGame();
        this.startTimer();
    }
    
    initializeGame() {
        this.createGrid();
        this.generateNewShape();
        this.updateUI();
        this.setupEventListeners();
    }
    
    createGrid() {
        const grid = document.getElementById('gameGrid');
        grid.innerHTML = '';
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // Случайные целевые ячейки для заполнения
            if (Math.random() < 0.3) {
                cell.classList.add('target');
            }
            
            grid.appendChild(cell);
        }
    }
    
    generateNewShape() {
        if (!this.nextShape) {
            const randomIndex = Math.floor(Math.random() * this.shapes.length);
            this.nextShape = {
                shape: this.shapes[randomIndex],
                color: this.colors[randomIndex]
            };
        }
        
        this.currentShape = this.nextShape;
        
        // Генерируем следующую фигуру
        const nextIndex = Math.floor(Math.random() * this.shapes.length);
        this.nextShape = {
            shape: this.shapes[nextIndex],
            color: this.colors[nextIndex]
        };
        
        this.displayNextShape();
    }
    
    displayNextShape() {
        const preview = document.getElementById('nextShape');
        preview.innerHTML = '';
        
        const shape = this.nextShape.shape;
        const color = this.nextShape.color;
        
        // Создаем сетку для предпросмотра
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'shape-cell';
            cell.style.background = 'transparent';
            preview.appendChild(cell);
        }
        
        // Заполняем фигуру
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const index = y * 3 + x;
                    preview.children[index].style.background = color;
                }
            });
        });
    }
    
    setupEventListeners() {
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotateShape());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        
        // Drag and drop функциональность
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }
    
    handleDrop(event) {
        event.preventDefault();
        const targetIndex = parseInt(event.target.dataset.index);
        
        if (this.currentShape && this.isValidPlacement(targetIndex)) {
            this.placeShape(targetIndex);
            this.checkLevelCompletion();
            this.generateNewShape();
        }
    }
    
    isValidPlacement(startIndex) {
        // Проверяем, можно ли разместить фигуру
        return true; // Упрощенная проверка
    }
    
    placeShape(startIndex) {
        const shape = this.currentShape.shape;
        const color = this.currentShape.color;
        const startX = startIndex % this.gridSize;
        const startY = Math.floor(startIndex / this.gridSize);
        
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const cellIndex = (startY + y) * this.gridSize + (startX + x);
                    if (cellIndex < this.gridSize * this.gridSize) {
                        const targetCell = document.querySelector(`.cell[data-index="${cellIndex}"]`);
                        targetCell.classList.add('filled');
                        targetCell.style.background = color;
                    }
                }
            });
        });
        
        this.score += 10 * this.level;
        this.updateUI();
    }
    
    rotateShape() {
        if (!this.currentShape) return;
        
        const shape = this.currentShape.shape;
        const rows = shape.length;
        const cols = shape[0].length;
        
        // Поворачиваем матрицу на 90 градусов
        const rotated = [];
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = shape[rows - 1 - j][i];
            }
        }
        
        this.currentShape.shape = rotated;
        // Здесь можно добавить визуализацию поворота
    }
    
    checkLevelCompletion() {
        const targetCells = document.querySelectorAll('.cell.target');
        const filledTargets = document.querySelectorAll('.cell.target.filled');
        
        if (filledTargets.length === targetCells.length) {
            this.levelComplete();
        }
    }
    
    levelComplete() {
        this.score += 100 * this.level;
        this.level++;
        this.updateUI();
        
        setTimeout(() => {
            alert(`Уровень ${this.level-1} пройден! Переходим к уровню ${this.level}`);
            this.createGrid();
        }, 500);
    }
    
    showHint() {
        // Простая подсказка - подсвечиваем случайную целевую ячейку
        const targetCells = document.querySelectorAll('.cell.target:not(.filled)');
        if (targetCells.length > 0) {
            const randomCell = targetCells[Math.floor(Math.random() * targetCells.length)];
            randomCell.style.boxShadow = '0 0 10px gold';
            setTimeout(() => {
                randomCell.style.boxShadow = '';
            }, 1000);
        }
    }
    
    resetGame() {
        this.level = 1;
        this.score = 0;
        this.time = 0;
        clearInterval(this.timer);
        this.createGrid();
        this.generateNewShape();
        this.updateUI();
        this.startTimer();
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.updateUI();
        }, 1000);
    }
    
    updateUI() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('timer').textContent = this.time;
    }
}

// Запускаем игру когда страница загружена
document.addEventListener('DOMContentLoaded', () => {
    new LogicPuzzleGame();
});
