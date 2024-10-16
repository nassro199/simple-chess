# Simple Chess

A simple chess game built with JavaScript using the Phaser.js game engine.

## How to Run It

1. **Download the Files**: Clone or download the repository to your local machine.
2. **Open the Game**: Double-click `index.html` to launch the game in your default web browser.
   
## Changelog

- Added the isKingInCheck function: This new function was implemented to check if a given king is in check using the Chess.js library.

- Modified the switchTurn method: The check for whether a king is in check was updated to use the Chess.js library's in_check() method directly.

- Removed redundant code: Some unnecessary code removed.

- Integrated Chess.js more deeply: The code now relies more heavily on the Chess.js library for game logic, including legal move generation and game state checking.

- Updated AI move implementation: The AI move function now uses the Stockfish API to get the best move, which is then executed using the Chess.js library.

- Improved error handling: Added some error checking and logging, particularly in the AI move function.

## Acknowledgements

- [Phaser.js](https://phaser.io/) - A fast and robust framework for creating 2D games in HTML5.
- [Lichess API](https://lichess.org/api) - For integrating the Stockfish chess engine.
