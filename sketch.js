// Constants for card dimensions and game layout
const CARD_WIDTH = 71;
const CARD_HEIGHT = 96;
const CARD_SPACING = 15;
const MARGIN = 15;
const CARD_COLOR = '#fff';
const TABLE_COLOR = '#008000';
const BORDER_RADIUS = 8;
const DOUBLE_CLICK_DELAY = 300; // milliseconds

// Define card suits and values
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Game state variables
let deck = [];
let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let selectedCard = null;
let draggingStack = [];
let dragOffset = { x: 0, y: 0 };
let dragSource = null;
let gameResult = ''; // 'win' or 'lose'
let isDragging = false;
let lastClickTime = 0;
let lastClickedCard = null;

// Card class to represent each card
class Card {
  constructor(suit, value, faceUp = false) {
    this.suit = suit;
    this.value = value;
    this.faceUp = faceUp;
    this.x = 0;
    this.y = 0;
    this.color = (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
  }

  draw() {
    // Draw card background
    fill(CARD_COLOR);
    if (!this.faceUp) {
      // Draw card back
      fill(85, 107, 47);  // Dark green
      stroke(0);
      strokeWeight(1);
      rect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
      
      // Simple pattern for card back (retro style)
      stroke(255, 255, 255, 100);
      for (let i = 10; i < CARD_WIDTH; i += 10) {
        line(this.x + i, this.y + 10, this.x + i, this.y + CARD_HEIGHT - 10);
      }
      for (let i = 10; i < CARD_HEIGHT; i += 10) {
        line(this.x + 10, this.y + i, this.x + CARD_WIDTH - 10, this.y + i);
      }
    } else {
      stroke(0);
      strokeWeight(1);
      rect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);

      // Draw value and suit
      fill(this.color);
      textAlign(LEFT, TOP);
      textSize(16);
      text(this.value + this.suit, this.x + 5, this.y + 5);
      textAlign(RIGHT, BOTTOM);
      text(this.value + this.suit, this.x + CARD_WIDTH - 5, this.y + CARD_HEIGHT - 5);

      // Draw center suit
      textAlign(CENTER, CENTER);
      textSize(24);
      text(this.suit, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2);
    }
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + CARD_WIDTH &&
           py >= this.y && py <= this.y + CARD_HEIGHT;
  }
  
  clone() {
    const card = new Card(this.suit, this.value, this.faceUp);
    card.x = this.x;
    card.y = this.y;
    return card;
  }
}

function setup() {
  createCanvas(800, 600);
  textFont('Arial');
  startNewGame();
}

function draw() {
  background(TABLE_COLOR);
  
  // Draw empty placeholders
  drawPlaceholders();
  
  // Draw stock pile
  drawStock();
  
  // Draw waste pile
  drawWaste();
  
  // Draw foundations
  drawFoundations();
  
  // Draw tableau
  drawTableau();
  
  // Draw dragging cards if any
  if (isDragging && draggingStack.length > 0) {
    for (let i = 0; i < draggingStack.length; i++) {
      const card = draggingStack[i];
      const originalX = card.x;
      const originalY = card.y;
      
      // Temporarily update position for drawing
      card.x = mouseX - dragOffset.x;
      card.y = mouseY - dragOffset.y + i * 20;
      card.draw();
      
      // Restore original position
      card.x = originalX;
      card.y = originalY;
    }
  }
  
  // Draw game result if any
  if (gameResult) {
    drawGameResult();
  }
}

function drawPlaceholders() {
  fill(16, 74, 28);
  stroke(0);
  strokeWeight(1);
  
  // Stock placeholder
  rect(MARGIN, MARGIN, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  
  // Waste placeholder
  rect(MARGIN + CARD_WIDTH + CARD_SPACING, MARGIN, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  
  // Foundation placeholders
  for (let i = 0; i < 4; i++) {
    rect(MARGIN + (i + 3) * (CARD_WIDTH + CARD_SPACING), MARGIN, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  }
  
  // Tableau placeholders
  for (let i = 0; i < 7; i++) {
    rect(MARGIN + i * (CARD_WIDTH + CARD_SPACING), MARGIN + CARD_HEIGHT + CARD_SPACING, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
  }
}

function drawStock() {
  if (stock.length > 0) {
    const card = stock[stock.length - 1];
    card.x = MARGIN;
    card.y = MARGIN;
    card.draw();
  }
}

function drawWaste() {
  if (waste.length > 0 && !draggingStack.includes(waste[waste.length - 1])) {
    const card = waste[waste.length - 1];
    card.x = MARGIN + CARD_WIDTH + CARD_SPACING;
    card.y = MARGIN;
    card.draw();
  }
}

function drawFoundations() {
  for (let i = 0; i < 4; i++) {
    if (foundations[i].length > 0 && !draggingStack.includes(foundations[i][foundations[i].length - 1])) {
      const card = foundations[i][foundations[i].length - 1];
      card.x = MARGIN + (i + 3) * (CARD_WIDTH + CARD_SPACING);
      card.y = MARGIN;
      card.draw();
    }
  }
}

function drawTableau() {
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < tableau[i].length; j++) {
      const card = tableau[i][j];
      if (!draggingStack.includes(card)) {
        card.x = MARGIN + i * (CARD_WIDTH + CARD_SPACING);
        card.y = MARGIN + CARD_HEIGHT + CARD_SPACING + j * 20;
        card.draw();
      }
    }
  }
}

function drawGameResult() {
  fill(0, 0, 0, 200);
  rect(0, height / 2 - 50, width, 100);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text(gameResult === 'win' ? 'Congratulations! You Win!' : 'You Lose', width / 2, height / 2);
}

function startNewGame() {
  gameResult = '';
  
  // Create a new deck
  deck = [];
  for (let suit of SUITS) {
    for (let value of VALUES) {
      deck.push(new Card(suit, value));
    }
  }
  
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  // Clear the game state
  stock = [...deck];
  waste = [];
  foundations = [[], [], [], []];
  tableau = [[], [], [], [], [], [], []];
  
  // Deal cards to tableau
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = stock.pop();
      card.faceUp = (j === i);
      tableau[i].push(card);
    }
  }
}

function mousePressed() {
  // Check for double-click first
  const currentTime = millis();
  const timeSinceLastClick = currentTime - lastClickTime;
  
  // Track the currently clicked card
  let clickedCard = null;
  let clickedCardSource = null;
  
  // Check if clicking on waste
  if (waste.length > 0) {
    const lastCard = waste[waste.length - 1];
    if (lastCard.containsPoint(mouseX, mouseY)) {
      clickedCard = lastCard;
      clickedCardSource = waste;
    }
  }
  
  // Check if clicking on foundation
  if (!clickedCard) {
    for (let i = 0; i < 4; i++) {
      if (foundations[i].length > 0) {
        const lastCard = foundations[i][foundations[i].length - 1];
        if (lastCard.containsPoint(mouseX, mouseY)) {
          clickedCard = lastCard;
          clickedCardSource = foundations[i];
          break;
        }
      }
    }
  }
  
  // Check if clicking on tableau
  if (!clickedCard) {
    for (let i = 0; i < 7; i++) {
      for (let j = tableau[i].length - 1; j >= 0; j--) {
        const card = tableau[i][j];
        if (card.faceUp && card.containsPoint(mouseX, mouseY)) {
          clickedCard = card;
          clickedCardSource = tableau[i];
          break;
        }
      }
      if (clickedCard) break;
    }
  }
  
  // Check for double-click
  if (clickedCard && lastClickedCard === clickedCard && timeSinceLastClick < DOUBLE_CLICK_DELAY) {
    // Double-click detected - try to move to foundation
    for (let i = 0; i < 4; i++) {
      if (canMoveToFoundation(clickedCard, i)) {
        dragSource = clickedCardSource;
        moveCardToFoundation(clickedCard, i);
        lastClickedCard = null;
        return;
      }
    }
  }
  
  // Update last click info
  lastClickTime = currentTime;
  lastClickedCard = clickedCard;
  
  // Check if clicking on stock
  if (stock.length > 0) {
    const lastCard = stock[stock.length - 1];
    if (lastCard.containsPoint(mouseX, mouseY)) {
      if (stock.length > 0) {
        const card = stock.pop();
        card.faceUp = true;
        waste.push(card);
      }
      return;
    }
  } else if (mouseX >= MARGIN && mouseX <= MARGIN + CARD_WIDTH && 
             mouseY >= MARGIN && mouseY <= MARGIN + CARD_HEIGHT) {
    // Clicked on empty stock pile - reset stock from waste
    while (waste.length > 0) {
      const card = waste.pop();
      card.faceUp = false;
      stock.push(card);
    }
    return;
  }
  
  // If we clicked on a card, initialize dragging
  if (clickedCard) {
    selectedCard = clickedCard;
    dragSource = clickedCardSource;
    
    // Initialize dragging immediately
    isDragging = true;
    dragOffset.x = mouseX - clickedCard.x;
    dragOffset.y = mouseY - clickedCard.y;
    
    // Get the stack of cards if from tableau
    if (tableau.includes(dragSource)) {
      const index = dragSource.indexOf(clickedCard);
      draggingStack = [];
      for (let k = index; k < dragSource.length; k++) {
        draggingStack.push(dragSource[k]);
      }
    } else {
      draggingStack = [clickedCard];
    }
  }
}

function canMoveToFoundation(card, foundationIndex) {
  const foundation = foundations[foundationIndex];
  if (foundation.length === 0) {
    return card.value === 'A';
  }
  const topCard = foundation[foundation.length - 1];
  const nextValueIndex = VALUES.indexOf(topCard.value) + 1;
  return card.suit === topCard.suit && card.value === VALUES[nextValueIndex];
}

function canMoveToTableau(card, tableauPileIndex) {
  const pile = tableau[tableauPileIndex];
  if (pile.length === 0) {
    return card.value === 'K';
  }
  const lastCard = pile[pile.length - 1];
  const prevValueIndex = VALUES.indexOf(lastCard.value) - 1;
  return card.color !== lastCard.color && card.value === VALUES[prevValueIndex];
}

function moveCardToFoundation(card, foundationIndex) {
  // Remove card from its source
  if (dragSource === waste) {
    waste.pop();
  } else if (tableau.includes(dragSource)) {
    const i = tableau.indexOf(dragSource);
    dragSource.pop();
    if (dragSource.length > 0 && !dragSource[dragSource.length - 1].faceUp) {
      dragSource[dragSource.length - 1].faceUp = true;
    }
  }
  
  foundations[foundationIndex].push(card);
  checkWinCondition();
}

function moveCardToTableau(card, tableauPileIndex) {
  // Check if we're dragging a stack (from tableau)
  if (tableau.includes(dragSource)) {
    const index = dragSource.indexOf(card);
    const cardsToMove = dragSource.splice(index, dragSource.length - index);
    for (const c of cardsToMove) {
      tableau[tableauPileIndex].push(c);
    }
    
    // Make sure the last card of the source pile is face up
    if (dragSource.length > 0 && !dragSource[dragSource.length - 1].faceUp) {
      dragSource[dragSource.length - 1].faceUp = true;
    }
  } else {
    // Single card from waste or foundation
    if (dragSource === waste) {
      waste.pop();
    } else if (foundations.includes(dragSource)) {
      dragSource.pop();
    }
    tableau[tableauPileIndex].push(card);
  }
}

function checkWinCondition() {
  let cardCount = 0;
  for (let i = 0; i < 4; i++) {
    cardCount += foundations[i].length;
  }
  if (cardCount === 52) {
    gameResult = 'win';
  }
}

function mouseReleased() {
  if (!selectedCard || !isDragging) return;
  
  // Check if dropping on foundation
  for (let i = 0; i < 4; i++) {
    const fx = MARGIN + (i + 3) * (CARD_WIDTH + CARD_SPACING);
    const fy = MARGIN;
    if (mouseX >= fx && mouseX <= fx + CARD_WIDTH &&
        mouseY >= fy && mouseY <= fy + CARD_HEIGHT) {
      if (canMoveToFoundation(selectedCard, i)) {
        moveCardToFoundation(selectedCard, i);
      }
      break;
    }
  }
  
  // Check if dropping on tableau
  for (let i = 0; i < 7; i++) {
    const tx = MARGIN + i * (CARD_WIDTH + CARD_SPACING);
    const ty = MARGIN + CARD_HEIGHT + CARD_SPACING;
    if (mouseX >= tx && mouseX <= tx + CARD_WIDTH &&
        mouseY >= ty && canMoveToTableau(selectedCard, i)) {
      moveCardToTableau(selectedCard, i);
      break;
    }
  }
  
  // Reset dragging state
  selectedCard = null;
  draggingStack = [];
  dragSource = null;
  isDragging = false;
}

function keyPressed() {
  if (key === 'n' || key === 'N') {
    startNewGame();
  }
}