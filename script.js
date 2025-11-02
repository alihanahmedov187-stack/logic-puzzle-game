class LogicPuzzleGame {
    constructor() {
        this.gridSize = 8;
        this.level = 1;
        this.score = 0;
        this.time = 0;
        this.timer = null;
        this.isDragging = false;
        this.dragShape = null;
        this.dragOffset = { x: 0, y: 0 };
        
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
        this.createDraggableShapes();
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
    
    createDraggableShapes() {
        const shapesContainer = document.querySelector('.shapes-container');
        if (!shapesContainer) {
            const newContainer = document.createElement('div');
            newContainer.className = 'shapes-container';
            newContainer.innerHTML = '<h3>Перетащите фигуру:</h3>';
            document.querySelector('.controls').prepend(newContainer);
        }
        
        this.updateDraggableShapes();
    }
    
    updateDraggableShapes() {
        const shapesContainer = document.querySelector('.shapes-container');
        shapesContainer.innerHTML = '<h3>Перетащите фигуру:</h3>';
        
        if (this.currentShape) {
            const draggableShape = document.createElement('div');
            draggableShape.className = 'draggable-shape';
            draggableShape.innerHTML = this.createShapeHTML(this.currentShape);
            draggableShape.style.background = this.currentShape.color;
            draggableShape.draggable = true;
            
            draggableShape.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, this.currentShape);
            });
            
            shapesContainer.appendChild(draggableShape);
        }
    }
    
    createShapeHTML(shapeObj) {
        const shape = shapeObj.shape;
        let html = '<div class="shape-grid">';
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    html += '<div class="shape-cell" style="background:' + shapeObj.color + '"></div>';
                } else {
                    html += '<div class="shape-cell empty"></div>';
                }
            }
        }
        html += '</div>';
        return html;
    }
    
    handleDragStart(e, shape) {
        this.dragShape = shape;
        e.dataTransfer.setData('text/plain', 'shape');
        e.dataTransfer.effectAllowed = 'copy';
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
        this.updateDraggableShapes();
    }
    
    displayNextShape() {
        const preview = document.getElementById('nextShape');
        preview.innerHTML = '';
        
        const shape = this.nextShape.shape;
        const color = this.nextShape.color;
        
        // Создаем сетку для предпросмотра
        const previewGrid = document.createElement('div');
        previewGrid.className = 'shape-preview-grid';
        
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'shape-preview-cell';
                if (cell) {
                    cellElement.style.background = color;
                }
                previewGrid.appendChild(cellElement);
            });
        });
        
        preview.appendChild(previewGrid);
    }
    
    setupEventListeners() {
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotateShape());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        
        // Drag and drop функциональность
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const grid = document.getElementById('gameGrid');
        const cells = document.querySelectorAll('.cell');
        
        // Разрешаем перетаскивание на сетку
        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        // Обработка сброса фигуры
        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (cell && this.dragShape) {
                const index = parseInt(cell.dataset.index);
                this.tryPlaceShape(index);
            }
        });
        
        // Также разрешаем drop на отдельные ячейки
        cells.forEach(cell => {
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.dragShape) {
                    const index = parseInt(e.target.dataset.index);
                    this.tryPlaceShape(index);
                }
            });
        });
    }
    
    tryPlaceShape(startIndex) {
        if (!this.dragShape || !this.isValidPlacement(startIndex)) {
            return false;
        }
        
        this.placeShape(startIndex);
        this.checkLevelCompletion();
        this.generateNewShape();
        return true;
    }
    
    isValidPlacement(startIndex) {
        if (!this.dragShape) return false;
        
        const shape = this.dragShape.shape;
        const startX = startIndex % this.gridSize;
        const startY = Math.floor(startIndex / this.gridSize);
        
        // Проверяем, что фигура помещается в границы
        if (startX + shape[0].length > this.gridSize || startY + shape.length > this.gridSize) {
            return false;
        }
        
        // Проверяем, что ячейки не заняты
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const cellIndex = (startY + y) * this.gridSize + (startX + x);
                    const targetCell = document.querySelector(`.cell[data-index="${cellIndex}"]`);
                    if (targetCell.classList.contains('filled')) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    placeShape(startIndex) {
        const shape = this.dragShape.shape;
        const color = this.dragShape.color;
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
        this.updateDraggableShapes();
    }
    
    checkLevelCompletion() {
        const targetCells = document.querySelectorAll('.cell.target');
        const filledTargets = document.querySelectorAll('.cell.target.filled');
        
        if (filledTargets.length > 0 && filledTargets.length === targetCells.length) {
            this.levelComplete();
        }
        
        // Также проверяем заполнение строк
        this.checkLineCompletion();
    }
    
    checkLineCompletion() {
        let linesCompleted = 0;
        
        // Проверяем строки
        for (let y = 0; y < this.gridSize; y++) {
            let rowFilled = true;
            for (let x = 0; x < this.gridSize; x++) {
                const index = y * this.gridSize + x;
                const cell = document.querySelector(`.cell[data-index="${index}"]`);
                if (!cell.classList.contains('filled')) {
                    rowFilled = false;
                    break;
                }
            }
            if (rowFilled) {
                linesCompleted++;
                // Очищаем строку
                for (let x = 0; x < this.gridSize; x++) {
                    const index = y * this.gridSize + x;
                    const cell = document.querySelector(`.cell[data-index="${index}"]`);
                    cell.classList.remove('filled');
                    cell.style.background = '';
                }
            }
        }
        
        if (linesCompleted > 0) {
            this.score += 100 * linesCompleted * this.level;
            this.updateUI();
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
        // Находим случайную пустую целевую ячейку
        const targetCells = document.querySelectorAll('.cell.target:not(.filled)');
        if (targetCells.length > 0) {
            const randomCell = targetCells[Math.floor(Math.random() * targetCells.length)];
            randomCell.style.boxShadow = '0 0 15px gold, 0 0 30px orange';
            randomCell.style.transition = 'box-shadow 0.3s ease';
            
            setTimeout(() => {
                randomCell.style.boxShadow = '';
            }, 1500);
        } else {
            alert('Все целевые ячейки заполнены!');
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
