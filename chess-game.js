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
        this.game = null;
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

        this.load.script('chessjs', 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');
    }

    create ()
    {
        this.moveSound = this.sound.add('move-sound');
        this.captureSound = this.sound.add('capture-sound');

        this.createCheckerboard();
        this.placePieces();
        this.input.on('gameobjectdown', this.onPieceSelected, this);
        this.input.on('pointerdown', this.onBoardClicked, this);

        this.game = new Chess();
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
        this.game.reset();
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
        const pieceScale = 0.4;

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
                const move = {
                    from: this.getSquareName(this.selectedPiece.boardPosition.col, this.selectedPiece.boardPosition.row),
                    to: this.getSquareName(col, row)
                };

                const result = this.game.move(move);
                if (result) {
                    this.movePiece(this.selectedPiece, col, row);
                }
            }
        }
    }

    getSquareName(col, row) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[col] + ranks[row];
    }

    switchTurn()
    {
        this.turn = this.turn === 'white' ? 'black' : 'white';
        const king = this.pieces.getChildren().find(piece => piece && piece.piece === 'king' && piece.color === this.turn);
        this.inCheck = this.game.in_check();

        if (this.game.in_checkmate()) {
            const winner = this.turn === 'white' ? 'Black' : 'White';
            this.showWinMessage(winner + ' wins by checkmate!');
        } else if (this.game.in_stalemate()) {
            this.showWinMessage('Stalemate! The game is a draw.');
        } else if (this.turn === 'black') {
            this.makeAIMove();
        }

        if (this.turn === 'white') {
            this.fullMoveNumber++;
        }
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

    getPieceAt(col, row)
    {
        return this.pieces.getChildren().find(piece => piece && piece.boardPosition && piece.boardPosition.col === col && piece.boardPosition.row === row);
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
            
            const promotionButton = this.add.image(x, y, `${piece.color}-${promotionPiece}`).setScale(0.4);
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

        const promotedPiece = this.add.image(x, y, `${pawn.color}-${newPiece}`).setScale(0.4);
        promotedPiece.setInteractive();
        promotedPiece.piece = newPiece;
        promotedPiece.color = pawn.color;
        promotedPiece.boardPosition =  { col, row };
        this.pieces.add(promotedPiece);

        buttons.forEach(button => button.destroy());

        this.game.move({
            from: this.getSquareName(pawn.boardPosition.col, pawn.boardPosition.row),
            to: this.getSquareName(col, row),
            promotion: newPiece[0]
        });

        this.selectedPiece = null;
        this.clearMoveIndicators();
        this.switchTurn();
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

        const legalMoves = this.game.moves({ square: this.getSquareName(piece.boardPosition.col, piece.boardPosition.row), verbose: true });

        legalMoves.forEach(move => {
            const col = 'abcdefgh'.indexOf(move.to[0]);
            const row = '87654321'.indexOf(move.to[1]);
            const color = move.captured ? 0xff0000 : 0x00ff00;
            this.addMoveIndicator(col, row, color);
        });
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

    makeAIMove() {
        const possibleMoves = this.game.moves({ verbose: true });
        if (possibleMoves.length === 0) {
            const chessGameHistory = this.game.history();
            const prompt = 'we are in the middle of playing a chess game here is the chessGameHistory= ' + chessGameHistory + ', I just played: ' + chessGameHistory[chessGameHistory.length-1] +', checkmate. Do not break character. be concise, do not drone on.';
            
            var chatScene = this.scene.get('ChatScene');
            chatScene.sendChessMove(prompt, chatScene.chatManager);
            return;
        }

        const apiUrl = `https://stockfish.online/api/stockfish.php/?fen=${this.game.fen()}&depth=${5}&mode=bestmove`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const bestMove = data.data.split(' ')[1];
                const move = this.game.move({
                    from: bestMove.slice(0,2),
                    to: bestMove.slice(2,4),
                    promotion: bestMove.length === 5 ? bestMove[4] : undefined
                });

                if (move) {
                    const fromCol = 'abcdefgh'.indexOf(move.from[0]);
                    const fromRow = '87654321'.indexOf(move.from[1]);
                    const toCol = 'abcdefgh'.indexOf(move.to[0]);
                    const toRow = '87654321'.indexOf(move.to[1]);

                    const piece = this.getPieceAt(fromCol, fromRow);
                    if (piece) {
                        this.movePiece(piece, toCol, toRow);
                    }

                    const chessGameHistory = this.game.history();
                    const prompt = 'we are in the middle of playing a chess game here is the chessGameHistory= ' + chessGameHistory.slice(0,-2).join(', ') + ', make a comment on the move I just played: ' + chessGameHistory[chessGameHistory.length-2] + ' then on the move you just played ' + chessGameHistory[chessGameHistory.length-1] + ' Do not break character, be concise, do not drone on.';
                    var chatScene = this.scene.get('ChatScene');
                    chatScene.sendChessMove(prompt, chatScene.chatManager);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    isKingInCheck(king) {
        if (!king) return false;
        
        const square = this.getSquareName(king.boardPosition.col, king.boardPosition.row);
        return this.game.in_check() && this.game.turn() === king.color[0];
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
