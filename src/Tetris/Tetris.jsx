import { useState, useEffect, useCallback } from 'react'
import styles from '../Tetris/Style/Tetris.module.css'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_SPEED = 1000

const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00f0f0'
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1]],
    color: '#0000f0'
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1]],
    color: '#f0a000'
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: '#f0f000'
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0]],
    color: '#00f000'
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1]],
    color: '#a000f0'
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1]],
    color: '#f00000'
  }
}

const createBoard = () => 
  Array.from({ length: BOARD_HEIGHT }, () => 
    Array(BOARD_WIDTH).fill(null)
  )

const randomTetromino = () => {
  const tetrominos = Object.keys(TETROMINOS)
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)]
  return {
    pos: { x: BOARD_WIDTH / 2 - 1, y: 0 },
    tetromino: TETROMINOS[randTetromino],
    shape: TETROMINOS[randTetromino].shape
  }
}

function Tetris() {
  const [board, setBoard] = useState(createBoard())
  const [currentPiece, setCurrentPiece] = useState(randomTetromino())
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [isStarted, setIsStarted] = useState(false)

  const isColliding = useCallback((piece, board, position) => {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const newY = y + position.y
          const newX = x + position.x

          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (board[newY] && board[newY][newX] !== null)
          ) {
            return true
          }
        }
      }
    }
    return false
  }, [])

  const mergePieceToBoard = useCallback(() => {
    const newBoard = board.map(row => [...row])
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = y + currentPiece.pos.y
          const newX = x + currentPiece.pos.x
          if (newY >= 0) {
            newBoard[newY][newX] = currentPiece.tetromino.color
          }
        }
      })
    })

    let clearedRows = 0
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1)
        newBoard.unshift(Array(BOARD_WIDTH).fill(null))
        clearedRows++
        y++
      }
    }

    if (clearedRows > 0) {
      setScore(prev => prev + (clearedRows * 100))
    }

    setBoard(newBoard)
    setCurrentPiece(randomTetromino())
  }, [board, currentPiece])

  const moveDown = useCallback(() => {
    const newPos = { ...currentPiece.pos, y: currentPiece.pos.y + 1 }
    if (!isColliding(currentPiece.shape, board, newPos)) {
      setCurrentPiece(prev => ({ ...prev, pos: newPos }))
    } else {
      if (currentPiece.pos.y <= 0) {
        setGameOver(true)
        return
      }
      mergePieceToBoard()
    }
  }, [currentPiece, board, isColliding, mergePieceToBoard])

  const moveHorizontally = useCallback((dir) => {
    const newPos = { ...currentPiece.pos, x: currentPiece.pos.x + dir }
    if (!isColliding(currentPiece.shape, board, newPos)) {
      setCurrentPiece(prev => ({ ...prev, pos: newPos }))
    }
  }, [currentPiece, board, isColliding])

  const rotatePiece = useCallback(() => {
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    )
    if (!isColliding(rotated, board, currentPiece.pos)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }))
    }
  }, [currentPiece, board, isColliding])

  useEffect(() => {
    if (!isStarted || gameOver || isPaused) return

    const interval = setInterval(() => {
      moveDown()
    }, INITIAL_SPEED)

    return () => clearInterval(interval)
  }, [isStarted, gameOver, isPaused, moveDown])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isStarted || gameOver || isPaused) return

      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontally(-1)
          break
        case 'ArrowRight':
          moveHorizontally(1)
          break
        case 'ArrowDown':
          moveDown()
          break
        case 'ArrowUp':
          rotatePiece()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isStarted, gameOver, isPaused, moveHorizontally, moveDown, rotatePiece])

  const startGame = () => {
    setBoard(createBoard())
    setCurrentPiece(randomTetromino())
    setGameOver(false)
    setIsPaused(false)
    setScore(0)
    setIsStarted(true)
  }

  const resetGame = () => {
    setIsStarted(false)
    setBoard(createBoard())
    setCurrentPiece(randomTetromino())
    setGameOver(false)
    setIsPaused(false)
    setScore(0)
  }

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    if (!gameOver && isStarted) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const newY = y + currentPiece.pos.y
            const newX = x + currentPiece.pos.x
            if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
              displayBoard[newY][newX] = currentPiece.tetromino.color
            }
          }
        })
      })
    }

    return displayBoard
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center">
        <div className={styles.score}>
          Score: {score}
        </div>
        
        <div className={styles.board}>
          {!isStarted && (
            <div className={styles.overlay}>
              <h1 className={styles.title}>
                Tetris
              </h1>
              <div className={styles.instructions}>
                <p>Use arrow keys to play:</p>
                <p>← → to move</p>
                <p>↑ to rotate</p>
                <p>↓ to drop faster</p>
              </div>
              <button className={styles.button} onClick={startGame}>
                Start Game
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className={styles.overlay}>
              <h2 className={styles.gameOver}>
                Game Over
              </h2>
              <p className={styles.score}>
                Final Score: {score}
              </p>
              <button className={styles.button} onClick={startGame}>
                Play Again
              </button>
            </div>
          )}
          
          <div 
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            }}
          >
            {renderBoard().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={styles.cell}
                  style={{
                    backgroundColor: cell || '#1a1b26'
                  }}
                />
              ))
            )}
          </div>
        </div>
        
        <div className={styles.controls}>
          {isStarted && !gameOver && (
            <>
              <button className={styles.button} onClick={resetGame}>
                Reset
              </button>
              <button 
                className={`${styles.button} ${isPaused ? styles.buttonStop : ''}`}
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        {isStarted && !gameOver && !isPaused && (
          <div className={styles.mobileControls}>
            <button
              className={styles.mobileButton}
              onClick={() => rotatePiece()}
            >
              ↑
            </button>
            <div className="flex gap-4">
              <button
                className={styles.mobileButton}
                onClick={() => moveHorizontally(-1)}
              >
                ←
              </button>
              <button
                className={styles.mobileButton}
                onClick={() => moveDown()}
              >
                ↓
              </button>
              <button
                className={styles.mobileButton}
                onClick={() => moveHorizontally(1)}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tetris