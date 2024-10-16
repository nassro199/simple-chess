class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
        this.selectedPiece = null;
        this.turn = 'white';
        this.promotionChoice = null;
        this.moveIndicators = [];
        this.inCheck = false;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.moveHistory = [];
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }

    preload ()
    {
        this.load.image('white-pawn', 'https://assets-themes.chess.com/image/ejgfv/150/wp.png');
        this.load.image('white-knight', 'https://assets-themes.chess.com/image/ejgfv/150/wn.png');
        this.load.image('white-rook', 'https://assets-themes.chess.com/image/ejgfv/150/wr.png');
        this.load.image('white-queen', 'https://assets-themes.chess.com/image/ejgfv/150/wq.png');
        this.load.image('white-king', 'https://assets-themes.chess.com/image/ejgfv/150/wk.png');
        this.load.image('white-bishop', 'https://assets-themes.chess.com/image/ejgfv/150/wb.png');
        this.load.image('black-rook', 'https://assets-themes.chess.com/image/ejgfv/150/br.png');
        this.load.image('black-king', 'https://assets-themes.chess.com/image/ejgfv/150/bk.png');
        this.load.image('black-queen', 'https://assets-themes.chess.com/image/ejgfv/150/bq.png');
        this.load.image('black-bishop', 'https://assets-themes.chess.com/image/ejgfv/150/bb.png');
        this.load.image('black-knight', 'https://assets-themes.chess.com/image/ejgfv/150/bn.png');
        this.load.image('black-pawn', 'https://assets-themes.chess.com/image/ejgfv/150/bp.png');

        this.load.audio('move-sound', 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
        this.load.audio('capture-sound', 'https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3');
    }

    create ()
    {
        this.moveSound = this.sound.add('move-sound');
        this.captureSound = this.sound.add('capture-sound');

        this.createCheckerboard();
        this.placePieces();
        this.input.on('gameobjectdown', this.onPieceSelected, this);
        this.input.on('pointerdown', this.onBoardClicked, this);
    }

    resetBoard()
    {
        if (this.pieces) {
            this.pieces.clear(true, true);
        }
        this.placePieces();
        this.selectedPiece = null;
        this.turn = 'white';
        this.clearMoveIndicators();
        this.inCheck = false;
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.moveHistory = [];
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }

    createCheckerboard()
    {
        const graphics = this.add.graphics();
        const squareSize = 60;
        const boardSize = 8;
        const borderSize = 20;
        const lightSquareColor = 0xE9EDCC;
        const darkSquareColor = 0x779954;
        const borderColor = 0x404040;

        const boardWidth = boardSize * squareSize;
        const boardHeight = boardSize * squareSize;
        const totalWidth = boardWidth + 2 * borderSize;
        const totalHeight = boardHeight + 2 * borderSize;

        const startX = (800 - totalWidth) / 2;
        const startY = (600 - totalHeight) / 2;

        graphics.fillStyle(borderColor);
        graphics.fillRect(startX, startY, totalWidth, totalHeight);

        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const x = startX + col * squareSize + borderSize;
                const y = startY + row * squareSize + borderSize;
                
                if ((row + col) % 2 === 0) {
                    graphics.fillStyle(lightSquareColor);
                } else {
                    graphics.fillStyle(darkSquareColor);
                }
                
                graphics.fillRect(x, y, squareSize, squareSize);
            }
        }

        const textStyle = { font: '14px Arial', fill: '#ffffff' };
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        for (let i = 0; i < 8; i++) {
            this.add.text(startX + i * squareSize + borderSize + squareSize / 2, startY + boardHeight + borderSize + 5, files[i], textStyle).setOrigin(0.5, 0);
            this.add.text(startX + 5, startY + i * squareSize + borderSize + squareSize / 2, ranks[i], textStyle).setOrigin(0, 0.5);
        }

        this.boardProperties = { startX, startY, squareSize, borderSize };
    }

    placePieces()
    {
        const { startX, startY, squareSize, borderSize } = this.boardProperties;
        const pieceScale = 0.4; // Adjusted scale to fit 60x60 squares

        const placePiece = (piece, col, row) => {
            const x = startX + col * squareSize + borderSize + squareSize / 2;
            const y = startY + row * squareSize + borderSize + squareSize / 2;
            const pieceObj = this.add.image(x, y, piece).setScale(pieceScale);
            pieceObj.setInteractive();
            pieceObj.piece = piece.split('-')[1];
            pieceObj.color = piece.split('-')[0];
            pieceObj.boardPosition = { col, row };
            return pieceObj;
        };

        this.pieces = this.add.group();

        // Place white pieces
        this.pieces.add(placePiece('white-rook', 0, 7));
        this.pieces.add(placePiece('white-knight', 1, 7));
        this.pieces.add(placePiece('white-bishop', 2, 7));
        this.pieces.add(placePiece('white-queen', 3, 7));
        this.pieces.add(placePiece('white-king', 4, 7));
        this.pieces.add(placePiece('white-bishop', 5, 7));
        this.pieces.add(placePiece('white-knight', 6, 7));
        this.pieces.add(placePiece('white-rook', 7, 7));

        for (let i = 0; i < 8; i++) {
            this.pieces.add(placePiece('white-pawn', i, 6));
        }

        // Place black pieces
        this.pieces.add(placePiece('black-rook', 0, 0));
        this.pieces.add(placePiece('black-knight', 1, 0));
        this.pieces.add(placePiece('black-bishop', 2, 0));
        this.pieces.add(placePiece('black-queen', 3, 0));
        this.pieces.add(placePiece('black-king', 4, 0));
        this.pieces.add(placePiece('black-bishop', 5, 0));
        this.pieces.add(placePiece('black-knight', 6, 0));
        this.pieces.add(placePiece('black-rook', 7, 0));

        for (let i = 0; i < 8; i++) {
            this.pieces.add(placePiece('black-pawn', i, 1));
        }
    }

    onPieceSelected(pointer, gameObject)
    {
        if (gameObject && gameObject.color === this.turn && this.turn === 'white') {
            if (this.selectedPiece) {
                this.selectedPiece.clearTint();
            }
            this.selectedPiece = gameObject;
            this.selectedPiece.setTint(0x00ff00);
            this.showPossibleMoves(gameObject);
        }
    }

    onBoardClicked(pointer)
    {
        if (this.selectedPiece && this.turn === 'white') {
            const { startX, startY, squareSize, borderSize } = this.boardProperties;
            const col = Math.floor((pointer.x - startX - borderSize) / squareSize);
            const row = Math.floor((pointer.y - startY - borderSize) / squareSize);

            if (col >= 0 && col < 8 && row >= 0 && row < 8) {
                if (this.isValidMove(this.selectedPiece, col, row)) {
                    this.movePiece(this.selectedPiece, col, row);
                }
            }
        }
    }

    switchTurn()
    {
        this.turn = this.turn === 'white' ? 'black' : 'white';
        const king = this.pieces.getChildren().find(piece => piece && piece.piece === 'king' && piece.color === this.turn);
        this.inCheck = king ? this.isKingInCheck(king) : false;

        if (this.isCheckmate(this.turn)) {
            const winner = this.turn === 'white' ? 'Black' : 'White';
            this.showWinMessage(winner + ' wins by checkmate!');
        } else if (this.isStalemate(this.turn)) {
            this.showWinMessage('Stalemate! The game is a draw.');
        } else if (this.turn === 'black') {
            this.makeAIMove();
        }

        if (this.turn === 'white') {
            this.fullMoveNumber++;
        }
    }

    isValidMove(piece, targetCol, targetRow)
    {
        if (!piece || !piece.boardPosition) return false;

        const { col: currentCol, row: currentRow } = piece.boardPosition;
        const dx = targetCol - currentCol;
        const dy = targetRow - currentRow;

        const targetPiece = this.getPieceAt(targetCol, targetRow);
        if (targetPiece && targetPiece.color === piece.color) {
            return false;
        }

        let isValid = false;

        switch (piece.piece) {
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1;
                if (dx === 0 && dy === direction && !targetPiece) {
                    isValid = true;
                }
                if (dx === 0 && dy === 2 * direction && !targetPiece && 
                    !this.getPieceAt(targetCol, currentRow + direction) && 
                    ((piece.color === 'white' && currentRow === 6) || (piece.color === 'black' && currentRow === 1))) {
                    isValid = true;
                }
                if (Math.abs(dx) === 1 && dy === direction && targetPiece && targetPiece.color !== piece.color) {
                    isValid = true;
                }
                break;
            case 'knight':
                isValid = (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);
                break;
            case 'bishop':
                isValid = Math.abs(dx) === Math.abs(dy) && this.isClearPath(currentCol, currentRow, targetCol, targetRow);
                break;
            case 'rook':
                isValid = (dx === 0 || dy === 0) && this.isClearPath(currentCol, currentRow, targetCol, targetRow);
                break;
            case 'queen':
                isValid = (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && this.isClearPath(currentCol, currentRow, targetCol, targetRow);
                break;
            case 'king':
                isValid = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
                if (!isValid && Math.abs(dx) === 2 && dy === 0) {
                    isValid = this.canCastle(piece, targetCol);
                }
                break;
        }

        if (isValid) {
            // Check if the move would put the king in check
            const originalPosition = { ...piece.boardPosition };
            const capturedPiece = this.getPieceAt(targetCol, targetRow);
            
            piece.boardPosition = { col: targetCol, row: targetRow };
            if (capturedPiece) {
                this.pieces.remove(capturedPiece);
            }

            const king = this.pieces.getChildren().find(p => p && p.piece === 'king' && p.color === piece.color);
            const wouldBeInCheck = king ? this.isKingInCheck(king) : false;

            // Undo the move
            piece.boardPosition = originalPosition;
            if (capturedPiece) {
                this.pieces.add(capturedPiece);
            }

            if (wouldBeInCheck) {
                isValid = false;
            }
        }

        return isValid;
    }

    isClearPath(startCol, startRow, endCol, endRow)
    {
        const dx = Math.sign(endCol - startCol);
        const dy = Math.sign(endRow - startRow);
        let currentCol = startCol + dx;
        let currentRow = startRow + dy;

        while (currentCol !== endCol || currentRow !== endRow) {
            if (this.getPieceAt(currentCol, currentRow)) {
                return false;
            }
            currentCol += dx;
            currentRow += dy;
        }

        return true;
    }

    getPieceAt(col, row)
    {
        return this.pieces.getChildren().find(piece => piece && piece.boardPosition && piece.boardPosition.col === col && piece.boardPosition.row === row);
    }

    movePiece(piece, targetCol, targetRow)
    {
        if (!piece) return;

        const { startX, startY, squareSize, borderSize } = this.boardProperties;
        const x = startX + targetCol * squareSize + borderSize + squareSize / 2;
        const y = startY + targetRow * squareSize + borderSize + squareSize / 2;

        const capturedPiece = this.getPieceAt(targetCol, targetRow);
        if (capturedPiece && capturedPiece.color !== piece.color) {
            this.pieces.remove(capturedPiece);
            capturedPiece.destroy();
            this.captureSound.play();
            this.halfMoveClock = 0;
        } else {
            this.moveSound.play();
            this.halfMoveClock++;
        }

        // Handle castling
        if (piece.piece === 'king' && Math.abs(targetCol - piece.boardPosition.col) === 2) {
            const isKingSideCastling = targetCol > piece.boardPosition.col;
            const rookCol = isKingSideCastling ? 7 : 0;
            const rookTargetCol = isKingSideCastling ? targetCol - 1 : targetCol + 1;
            const rook = this.getPieceAt(rookCol, piece.boardPosition.row);
            
            if (rook) {
                this.moveRook(rook, rookTargetCol, piece.boardPosition.row);
            }
        }

        // Update castling rights
        if (piece.piece === 'king') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        } else if (piece.piece === 'rook') {
            if (piece.boardPosition.col === 0) {
                this.castlingRights[piece.color].queenSide = false;
            } else if (piece.boardPosition.col === 7) {
                this.castlingRights[piece.color].kingSide = false;
            }
        }

        this.moveHistory.push({
            piece: piece.piece,
            color: piece.color,
            from: { col: piece.boardPosition.col, row: piece.boardPosition.row },
            to: { col: targetCol, row: targetRow }
        });

        this.tweens.add({
            targets: piece,
            x: x,
            y: y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                piece.boardPosition = { col: targetCol, row: targetRow };
                if (this.isPawnPromotion(piece, targetRow)) {
                    this.showPromotionOptions(piece, targetCol, targetRow);
                } else {
                    if (this.selectedPiece) {
                        this.selectedPiece.clearTint();
                    }
                    this.selectedPiece = null;
                    this.clearMoveIndicators();
                    this.switchTurn();
                }
            }
        });
    }

    moveRook(rook, targetCol, targetRow) {
        if (!rook) return;

        const { startX, startY, squareSize, borderSize } = this.boardProperties;
        const x = startX + targetCol * squareSize + borderSize + squareSize / 2;
        const y = startY + targetRow * squareSize + borderSize + squareSize / 2;

        this.tweens.add({
            targets: rook,
            x: x,
            y: y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                rook.boardPosition = { col: targetCol, row: targetRow };
            }
        });
    }

    isPawnPromotion(piece, targetRow) {
        return piece && piece.piece === 'pawn' && (targetRow === 0 || targetRow === 7);
    }

    showPromotionOptions(piece, col, row) {
        if (!piece) return;

        const { startX, startY, squareSize, borderSize } = this.boardProperties;
        const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
        const promotionButtons = [];

        promotionPieces.forEach((promotionPiece, index) => {
            const x = startX + col * squareSize + borderSize + squareSize / 2;
            const y = startY + (row + (piece.color === 'white' ? 1 : -1) * (index + 1)) * squareSize + borderSize + squareSize / 2;
            
            const promotionButton = this.add.image(x, y, `${piece.color}-${promotionPiece}`).setScale(0.4); // Adjusted scale
            promotionButton.setInteractive();
            promotionButton.on('pointerdown', () => this.promotePawn(piece, promotionPiece, col, row, promotionButtons));
            promotionButtons.push(promotionButton);
        });
    }

    promotePawn(pawn, newPiece, col, row, buttons) {
        if (!pawn) return;

        const { startX, startY, squareSize, borderSize } = this.boardProperties;
        const x = startX + col * squareSize + borderSize + squareSize / 2;
        const y = startY + row * squareSize + borderSize + squareSize / 2;

        this.pieces.remove(pawn);
        pawn.destroy();

        const promotedPiece = this.add.image(x, y, `${pawn.color}-${newPiece}`).setScale(0.4); // Adjusted scale
        promotedPiece.setInteractive();
        promotedPiece.piece = newPiece;
        promotedPiece.color = pawn.color;
        promotedPiece.boardPosition =  { col, row };
        this.pieces.add(promotedPiece);

        buttons.forEach(button => button.destroy());

        this.selectedPiece = null;
        this.clearMoveIndicators();
        this.switchTurn();
    }

    isCheckmate(color) {
        if (!this.inCheck) return false;

        return this.hasNoLegalMoves(color);
    }

    isStalemate(color) {
        if (this.inCheck) return false;

        return this.hasNoLegalMoves(color);
    }

    hasNoLegalMoves(color) {
        const pieces = this.pieces.getChildren().filter(piece => piece && piece.color === color);

        for (let piece of pieces) {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.isValidMove(piece, col, row)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    isKingInCheck(king) {
        if (!king) return false;

        const opponentColor = king.color === 'white' ? 'black' : 'white';
        const opponentPieces = this.pieces.getChildren().filter(piece => piece && piece.color === opponentColor);

        for (let piece of opponentPieces) {
            if (this.isValidMove(piece, king.boardPosition.col, king.boardPosition.row)) {
                return true;
            }
        }

        return false;
    }

    showWinMessage(message) {
        const { width, height } = this.sys.game.config;
        const style = { font: "32px Arial", fill: "#ffffff", align: "center" };
        const text = this.add.text(width / 2, height / 2, message, style);
        text.setOrigin(0.5);
    }

    showPossibleMoves(piece) {
        if (!piece) return;

        this.clearMoveIndicators();

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(piece, col, row)) {
                    const targetPiece = this.getPieceAt(col, row);
                    const color = targetPiece && targetPiece.color !== piece.color ? 0xff0000 : 0x00ff00;
                    this.addMoveIndicator(col, row, color);
                }
            }
        }
    }

    addMoveIndicator(col, row, color) {
        const { startX, startY, squareSize, borderSize } = this.boardProperties;
        const x = startX + col * squareSize + borderSize + squareSize / 2;
        const y = startY + row * squareSize + borderSize + squareSize / 2;

        const indicator = this.add.circle(x, y, 10, color, 0.5);
        this.moveIndicators.push(indicator);
    }

    clearMoveIndicators() {
        this.moveIndicators.forEach(indicator => indicator.destroy());
        this.moveIndicators = [];
    }

    canCastle(king, targetCol) {
        if (!king || this.inCheck) return false;

        const isKingSideCastling = targetCol > king.boardPosition.col;
        const castlingRight = isKingSideCastling ? 'kingSide' : 'queenSide';

        if (!this.castlingRights[king.color][castlingRight]) return false;

        const rookCol = isKingSideCastling ? 7 : 0;
        const rook = this.getPieceAt(rookCol, king.boardPosition.row);

        if (!rook || rook.piece !== 'rook') return false;

        const direction = isKingSideCastling ? 1 : -1;
        for (let col = king.boardPosition.col + direction; col !== rookCol; col += direction) {
            if (this.getPieceAt(col, king.boardPosition.row)) return false;
        }

        // Check if the king passes through a square that is under attack
        for (let col = king.boardPosition.col; col !== targetCol; col += direction) {
            const tempKing = { ...king, boardPosition: { col, row: king.boardPosition.row } };
            if (this.isKingInCheck(tempKing)) return false;
        }

        return true;
    }

    makeAIMove() {
        const bestMove = this.findBestMove('black', 3);
        if (bestMove) {
            const piece = this.getPieceAt(bestMove.from.col, bestMove.from.row);
            if (piece) {
                this.movePiece(piece, bestMove.to.col, bestMove.to.row);
            } else {
                console.error('No piece found at the starting position of the best move');
            }
        } else {
            console.error('No valid AI move found');
        }
    }

    findBestMove(color, depth) {
        let bestMove = null;
        let bestScore = color === 'black' ? -Infinity : Infinity;

        const pieces = this.pieces.getChildren().filter(piece => piece && piece.color === color);

        for (let piece of pieces) {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.isValidMove(piece, col, row)) {
                        const move = {
                            from: { ...piece.boardPosition },
                            to: { col, row }
                        };

                        // Make the move
                        const capturedPiece = this.getPieceAt(col, row);
                        const originalPosition = { ...piece.boardPosition };
                        piece.boardPosition = { col, row };
                        if (capturedPiece) {
                            this.pieces.remove(capturedPiece);
                        }

                        // Evaluate the move
                        const score = this.minimax(depth - 1, color === 'white' ? 'black' : 'white', -Infinity, Infinity);

                        // Undo the move
                        piece.boardPosition = originalPosition;
                        if (capturedPiece) {
                            this.pieces.add(capturedPiece);
                        }

                        if (color === 'black') {
                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = move;
                            }
                        } else {
                            if (score < bestScore) {
                                bestScore = score;
                                bestMove = move;
                            }
                        }
                    }
                }
            }
        }

        return bestMove;
    }

    minimax(depth, color, alpha, beta) {
        if (depth === 0) {
            return this.evaluateBoard();
        }

        const pieces = this.pieces.getChildren().filter(piece => piece && piece.color === color);

        if (color === 'black') {
            let maxScore = -Infinity;
            for (let piece of pieces) {
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        if (this.isValidMove(piece, col, row)) {
                            const capturedPiece = this.getPieceAt(col, row);
                            const originalPosition = { ...piece.boardPosition };
                            piece.boardPosition = { col, row };
                            if (capturedPiece) {
                                this.pieces.remove(capturedPiece);
                            }

                            const score = this.minimax(depth - 1, 'white', alpha, beta);

                            piece.boardPosition = originalPosition;
                            if (capturedPiece) {
                                this.pieces.add(capturedPiece);
                            }

                            maxScore = Math.max(maxScore, score);
                            alpha = Math.max(alpha, score);
                            if (beta <= alpha) {
                                break;
                            }
                        }
                    }
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (let piece of pieces) {
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        if (this.isValidMove(piece, col, row)) {
                            const capturedPiece = this.getPieceAt(col, row);
                            const originalPosition = { ...piece.boardPosition };
                            piece.boardPosition = { col, row };
                            if (capturedPiece) {
                                this.pieces.remove(capturedPiece);
                            }

                            const score = this.minimax(depth - 1, 'black', alpha, beta);

                            piece.boardPosition = originalPosition;
                            if (capturedPiece) {
                                this.pieces.add(capturedPiece);
                            }

                            minScore = Math.min(minScore, score);
                            beta = Math.min(beta, score);
                            if (beta <= alpha) {
                                break;
                            }
                        }
                    }
                }
            }
            return minScore;
        }
    }

    evaluateBoard() {
        const pieceValues = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 100
        };

        let score = 0;

        this.pieces.getChildren().forEach(piece => {
            if (piece && piece.piece) {
                const pieceScore = pieceValues[piece.piece];
                if (piece.color === 'white') {
                    score += pieceScore;
                } else {
                    score -= pieceScore;
                }
            }
        });

        return score;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    width: 800,
    height: 600,
    scene: Example
};

window.phaserGame = new Phaser.Game(config);