var board = null;
var $board = $('#myBoard');
var game = new Chess();
var gSum = 0;
var squareToHighlight = null;
var colorToHighlight = null;

// Instantiate a stack for the moves that will be undone.
var stackMove =[];

var config = {
  draggable: true,
  position: 'start',
	showNotation: true,
	onDragStart: onDragStart,
  onDrop: onDrop,
	onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

board = Chessboard('myBoard', config);

var pieceWeights = {
  p:100, 
  r:500, 
  n:320, 
  b:330, 
  q:900, 
  k:200000000,
  kE:200000000
};

var pstEvalWhite = {
  p:[
    [100, 100, 100, 100, 100, 100, 100, 100],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5,-10, 0, 0,-10, -5, 5],
    [5, 10, 10,-20,-20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  r:[
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  n:[  
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b:[
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  q:[
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k:[  
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
  kE:[  
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ]
};

function mirrorArray(array){
  // Mirror the given array, this is for black's perspective.
  return array.slice().reverse();
}

var pstEvalBlack = {
  // Black's perspective is mirror of White's, 
  // and so the PST's need to be mirrored.
  p: mirrorArray(pstEvalWhite['p']),
  r: mirrorArray(pstEvalWhite['r']),
  n: mirrorArray(pstEvalWhite['n']),
  b: mirrorArray(pstEvalWhite['b']),
  q: mirrorArray(pstEvalWhite['q']),
  k: mirrorArray(pstEvalWhite['k']),
  kE: mirrorArray(pstEvalWhite['kE']),
};

// If it is black's turn, then the PST values should be swapped, as black is the minimiser.
var pstBlack = {
  w: pstEvalBlack, 
  b: pstEvalWhite
};

var pstWhite = {
  w: pstEvalWhite, 
  b: pstEvalBlack
};

function getCoordinates(move){
  // Coordinates are set as the x,y plane, 1 shows the previous coordinate, and 2 is the new coordinate. 
  var x1 = 8 - parseInt(move.from[1]);
  var y1 = move.from.charCodeAt(0) - 'a'.charCodeAt(0);
  var x2 = 8 - parseInt(move.to[1]);
  var y2 = move.to.charCodeAt(0) - 'a'.charCodeAt(0);

  return [x1, y1, x2, y2];
}

// Randomly sort the given array using the Fisher-Yates shuffle.
function FisherYatesShuffle(array) {
  // Iterate through the array, starting from the end.
  for (var i = array.length - 1; i > 0; i--) {
    // Generate a random number between 0 and the index of the current element.
    var j = Math.floor(Math.random() * (i + 1));
    // Swap the element at the random index with the current element.
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function evalBoard(game, move, updatedSum, colour) {  
  var [rankFrom, fileFrom, rankTo, fileTo] = getCoordinates(move);

  // If checkmate, game is over, returns large evaluation.
	if (game.in_checkmate()){
		if (move.color === colour){
			return 200000000;
		} else{
			return -200000000;
		}
	} 

  // If draw, game is over, return zero evaluation as game drawed.
  if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate()){
		return 0;
	} 

  // If in endgame, PST changes for endgame king.
  if (updatedSum < -1550){
    // Only change if we have moved the king, for the PST
    if (move.piece === 'k') {
      move.piece = 'kE';
    }
  }
		
  // If player is in check, add sum
	if (game.in_check()){
		if (move.color === colour){
			updatedSum += 50;
		} else{
			updatedSum -= 50;
		}
	}

 // If player's move captures piece, add that pieces weight to evaluation.
	if ('captured' in move){
		if (move.color === colour){
			updatedSum += pieceWeights[move.captured] + pstBlack[move.color][move.captured][rankTo][fileTo];
		} else{
			updatedSum -= pieceWeights[move.captured] + pstWhite[move.color][move.captured][rankTo][fileTo];
		}
  }

  // If player promotes piece, add the new pieces weight.
  if ('promotion' in move){
		if (move.color === colour){
      updatedSum -= pieceWeights[move.piece] + pstWhite[move.color][move.piece][rankFrom][fileFrom];
			updatedSum += pieceWeights[move.promotion] + pstWhite[move.color][move.promotion][rankTo][fileTo];
		} else{
      updatedSum += pieceWeights[move.piece] + pstWhite[move.color][move.piece][rankFrom][fileFrom];
			updatedSum -= pieceWeights[move.promotion] + pstWhite[move.color][move.promotion][rankFrom][fileFrom];
		}
  // If no captures or promotions have happened, then the piece has only moved,
  // and so update position value
	} else{
    if (move.color === colour){
      updatedSum -= pstWhite[move.color][move.piece][rankFrom][fileFrom];
      updatedSum += pstWhite[move.color][move.piece][rankTo][fileTo];
    } else{
      updatedSum += pstWhite[move.color][move.piece][rankFrom][fileFrom];
      updatedSum -= pstWhite[move.color][move.piece][rankTo][fileTo];
    }
  }

	return updatedSum;
}

function minimax(game, sum, colour, isMaxPlayer, depth, alpha, beta){

  // Generate all possible moves.
  var leafNodesUnsorted = game.ugly_moves({ verbose: true });

  // The list of possible moves must be sorted randomly,
  // otherwise it would always lead to a draw for the aiVsai function.
  var leafNodes = FisherYatesShuffle(leafNodesUnsorted);

  //var currentNode;
  // If we have reached the depth, or there are no more leaf nodes, return sum.
  if (depth === 0 || leafNodes.length === 0) {
    return [null, sum];
  }

  // maxEval is negative infinity, and minEval is positive infinity.
  // Of course, neither are actually infinity, but this number is big enough.
  // NOTE: we must set these variables after checking if the depth or length of moves is zero.
  var maxEval = Number.NEGATIVE_INFINITY;
  var minEval = Number.POSITIVE_INFINITY;
  var aiMove;
  // Loop through every move generated.
  for (var leafNode of leafNodes) {
    // Make the move.
    var currentNode = game.ugly_move(leafNode);
    // Evaluate the board with this new move.
    var updatedSum = evalBoard(game, currentNode, sum, colour);
    // Recursively call minimax() to find the best move and value of said move.
    var [nodeMove, nodeValue] = minimax(game, updatedSum, colour, !isMaxPlayer, depth - 1, alpha, beta);
    // Undo the move so it can be done later in the programme.
    game.undo();
   
    // If it is the maximising player, find the best move.
    if (isMaxPlayer){
      // If this moves value is greater than the previous moves value,
      // set this as the best move and value.
      if (nodeValue > maxEval) {
        maxEval = nodeValue;
        aiMove = currentNode;
      }
      // If this node evaluation is larger than alpha, set that as alpha.
      // Alpha is the best move for the maximising player.  
      alpha = Math.max(alpha, nodeValue);
    // If not, find the worst move.
    } else{
      // If this moves value is greater than the previous moves value,
      // set this as the best move and value.
      if (nodeValue < minEval) {
        minEval = nodeValue;
        aiMove = currentNode;
      }
      // If this node evaluation is smaller than beta, set that as beta.
      // Beta is the best move for the minimising player.  
      beta = Math.min(beta, nodeValue);
    }
    // This node cannot contain the best move, and so is pruned.
    if (beta <= alpha) break;
  }

  // Once all moves have been traversed, return best move and value for said move.
  if (isMaxPlayer){
    return [aiMove, maxEval];
  } else{
    return [aiMove, minEval];
  }
}

function evalBestMove(game, colour, sum){
  // Get the depth dropdown element
  var depthDropdown = document.getElementById('depth-dropdown');
  // Initialize the depth variable to the default value
  var givenDepth = parseInt(depthDropdown.value);
  // Add an event listener to the depth dropdown
  depthDropdown.addEventListener('change', function(event) {
    // Update the value of the depth variable
    givenDepth = parseInt(event.target.value);
  });

  // Generate the best move, and the value of that move
  var bestMove = minimax(game, sum, colour, true, givenDepth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
  return bestMove[0];
}

function playBestMove(colour){
  // Generate the best move for either black or white.
  if (colour === 'b'){
    var move = evalBestMove(game,colour,gSum);
  }else {
    // gSum is negative for white.
    var move = evalBestMove(game,colour,-gSum);
  }

  // Evaluate the board with the given move.
  globalSum = evalBoard(game, move, gSum, 'b');
  // Play the move on the board, and update the FEN string.
  game.move(move);
  board.position(game.fen());

  // Highlight the new move
  highlightMove(move, colour);
}

function undoMove() {
  // Can only undo when two moves have been played.
  if (game.history().length >= 2) {
    // Remove any highlighting
    $board.find('.square-55d63').removeClass('highlight-white');
    $board.find('.square-55d63').removeClass('highlight-black');
    $board.find('.square-55d63').removeClass('highlight-hint');

    // Undo both players previous moves.
    for (let i = 0; i < 2; i++) {
      var move = game.undo();
      stackMove.push(move);
      board.position(game.fen());
    }
    console.log('undo');
  } else{
    console.log('cannot undo')
  }
}

function redoMove() {
  // Can only redo when two moves have been undid.
  if (stackMove.length >= 2) {
    // Redo both players previous moves.
    for (let i = 0; i < 2; i++) {
      game.move(stackMove.pop());
      board.position(game.fen());
    }
    console.log('redo');
  } else{
    console.log('cannot redo');
  }
}

function resetGame(){
  // Reset the game object.
  game.reset();
  // The sum is set back to zero for a new game.
	gSum = 0;
  // Remove highlighting.
	$board.find('.square-55d63').removeClass('highlight-white');
  $board.find('.square-55d63').removeClass('highlight-black');
  $board.find('.square-55d63').removeClass('highlight-hint');
  // Update the chessboard with the starting positions.
	board.position(game.fen());
}

$('#reset').on('click', function(){
  // Reset the game, load the resetted chessboard.
  resetGame();
});

$('#undo').on('click', function(){
  undoMove();
});

$('#redo').on('click', function(){
  redoMove();
});

function aiVSai(colour){
  // Keep making moves for either colour until the game is over
  while(!(game.in_checkmate() || game.in_draw())){
    playBestMove(colour);
    gameResult(colour);
    // After every move, the next colour then will make a move. 
    if(colour === 'w'){
      colour = 'b';
    } else {
      colour = 'w';
    }
  }
}

$('#aiVSai').on('click', function(){
  // Reset any game that is happening first, 
  // and then let the AI play against eachother.
  resetGame();
  aiVSai('w');
});

function gameResult(colour) {
  // Initialize the end status.
  var endStatus = "No checkmate, draw, or check";

  // Check if the game is in checkmate.
  if (game.in_checkmate()) {
    endStatus = "Checkmate";
  }

  // Check if the game is a draw.
  if (game.insufficient_material()) {
    endStatus = "Draw - Insufficient material";
  } else if (game.in_threefold_repetition()) {
    endStatus = "Draw - Threefold repetition";
  } else if (game.in_stalemate()) {
    endStatus = "Draw - Stalemate";
  } else if (game.in_draw()) {
    endStatus = "Draw - 50 move rule";
  }
  
  if (colour === 'w'){
    $('.currentPlay').html('Black');
  } else{
    $('.currentPlay').html('White');
  }

  $('.gamePGN').html(game.pgn());
  $('.gameFEN').html(game.fen());
  $('.moveCount').html(game.history().length);
  $('.checkStatus').html(endStatus);
}

function clearGreySquares() {
  // Get all of the grey squares on the board.
  const greySquares = document.querySelectorAll('#myBoard .square-55d63');

  // Remove the grey background from each square.
  for (const square of greySquares) {
    square.style.backgroundColor = '';
  }
}

function setGreySquare(square) {
  // Get the square element.
  const $square = document.querySelector('#myBoard .square-' + square);

  // Set the background color of the square.
  if ($square.classList.contains('black-3c85d')) {
    $square.style.backgroundColor = '#696969';
  } else {
    $square.style.backgroundColor = '#a9a9a9';
  }
}

function onDragStart(source, piece, position, orientation) {
  // Check if the game is over.
  if (game.game_over()) {
    return false;
  }

  // Check if the piece is the correct colour for the current player.
  const colour = game.turn();
  const pieceColour = piece.charAt(0);
  if (pieceColour !== colour) {
    return false;
  }

  // Allow the piece to be dragged.
  return true;
}

function highlightMove(move, colour){
  var hColour;
  if (colour === 'w'){
    hColour = 'white';
  } else {
    hColour = 'black';
  }

	// Remove existing highlight
	$board.find('.square-55d63').removeClass('highlight-' + hColour);
	
	// Highlight current move
  $board.find('.square-' + move.from).addClass('highlight-' + hColour);

  squareToHighlight = move.to;
  colorToHighlight = hColour;

	// Highlight Previous move
	$board
    .find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight);
}

function onDrop(source, target) {
	// Grey Squares must be cleared after piece is moved.
	clearGreySquares();
	
  // Will return null is the move was illegal, otherwise Legal. 
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  // Illegal move.
  if (move === null) {
    return 'snapback';
  }

  gSum = evalBoard(game, move, gSum, 'b');
  highlightMove(move, 'w');
  
	if (game.turn() === 'w') {  
		gameResult('w');
  } else {
    // Black can only make a move if the game isn't over.
    if (!(game.in_checkmate() || game.in_draw())){
      playBestMove('b');
    }
    gameResult('b');
  } 
}

function onMouseoverSquare(square, piece) {
  // Get the list of possible moves for this square.
  const moves = game.moves({
    square,
    verbose: true,
  });

  // If there are no moves available for this square, exit early.
  if (moves.length === 0) {
    return;
  }

  // Highlight the square that the mouse is currently over.
  setGreySquare(square);

  // Highlight all of the possible squares for this piece.
  for (const move of moves) {
    setGreySquare(move.to);
  }
}

function onMouseoutSquare(square, piece) {
	// When the mouse moves away from a square, clear grey squares.
  clearGreySquares()
}

function onSnapEnd() {
  // Update the board position to the current game state.
  board.position(game.fen());
}
