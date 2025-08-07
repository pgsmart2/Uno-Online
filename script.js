const colors = ['Red', 'Green', 'Blue', 'Yellow'];
const specialCards = ['Skip', 'Reverse', 'Draw Two', 'Wild', 'Wild_Draw_4'];
let deck = [];
let playerHand = [];
let botHand = [];
let currentCard = null;
let gameActive = true; // Track if the game is active
let selectedColor = null; // Track the color selected for Wild cards

// Create a deck of Uno cards
function createDeck() {
    colors.forEach(color => {
        for (let i = 0; i <= 9; i++) {
            deck.push({ color, value: i.toString() });
            if (i > 0) deck.push({ color, value: i.toString() }); // Two of each number except 0
        }
        specialCards.forEach(card => {
            deck.push({ color: card === 'Wild' || card === 'Wild_Draw_4' ? 'Wild' : color, value: card });
        });
    });
    shuffleDeck();
}

// Shuffle the deck
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Deal cards to player and bot
function dealCards() {
    for (let i = 0; i < 7; i++) {
        playerHand.push(deck.pop());
        botHand.push(deck.pop());
    }
    currentCard = deck.pop();
    updateUI();
}

// Update the UI to show card images
function updateUI() {
    // Display the current card
    const currentCardImage = currentCard.value === 'Wild' || currentCard.value === 'Wild_Draw_4' 
        ? `<img src="cardImages/${currentCard.value}.jpg" alt="${currentCard.value}" class="card-image">`
        : currentCard.value === 'Draw Two' 
            ? `<img src="cardImages/${currentCard.color}_Draw_2.jpg" alt="${currentCard.color} Draw Two" class="card-image">` // Correctly reference Draw Two cards
            : `<img src="cardImages/${currentCard.color}_${currentCard.value}.jpg" alt="${currentCard.color} ${currentCard.value}" class="card-image">`;
    
    document.getElementById('current-card').innerHTML = currentCardImage;
    
    // Show player's cards as clickable images
    document.getElementById('player-hand').innerHTML = playerHand.map(card => {
        // Check if the card is a Draw Two card and format the image source accordingly
        const cardImage = card.value === 'Draw Two' 
            ? `cardImages/${card.color}_Draw_2.jpg` // Correctly reference Draw Two cards
            : `cardImages/${card.value === 'Wild' || card.value === 'Wild_Draw_4' ? card.value : card.color + '_' + card.value}.jpg`;
        
        return `<img src="${cardImage}" 
            alt="${card.color} ${card.value}" class="card-image" onclick="selectCard('${card.color}', '${card.value}')">`;
    }).join('');
    
    // Show bot's cards visually (face down)
    document.getElementById('bot-hand').innerHTML = botHand.map(() => 
        `<img src="cardImages/back.jpg" alt="Bot card" class="card-image">` // Ensure this is correct
    ).join('');
    
    document.getElementById('message').innerText = '';
}

// Select a card to play
function selectCard(color, value) {
    const cardToPlay = { color, value };
    const playableCards = playerHand.filter(card => 
        card.color === currentCard.color || 
        card.value === currentCard.value || 
        card.value === 'Wild' || 
        card.value === 'Wild_Draw_4'
    );

    // Check if the selected card is in the playable cards
    if (playableCards.some(card => card.color === cardToPlay.color && card.value === cardToPlay.value)) {
        if (cardToPlay.value === 'Wild' || cardToPlay.value === 'Wild_Draw_4') {
            // Prompt user to select a color
            selectedColor = prompt("Choose a color to play (Red, Green, Blue, Yellow):");
            if (colors.includes(selectedColor)) {
                currentCard = { color: selectedColor, value: cardToPlay.value };
                document.getElementById('message').innerText = `You played a ${cardToPlay.value} and chose ${selectedColor} as the color!`;
            } else {
                alert("Invalid color selected. Please try again.");
                return;
            }
        } else {
            currentCard = cardToPlay;
        }
        playerHand = playerHand.filter(card => !(card.color === cardToPlay.color && card.value === cardToPlay.value));
        updateUI();
        checkWinCondition(); // Check if the player has won
        if (gameActive) botTurn(); // Only let the bot play if the game is still active
    } else {
        alert("You cannot play that card!");
    }
}

// Draw a card
function drawCard() {
    if (deck.length > 0 && gameActive) {
        playerHand.push(deck.pop());
        updateUI();
    } else {
        document.getElementById('message').innerText = 'No more cards in the deck!';
    }
}

// Bot's turn
function botTurn() {
    const playableCards = botHand.filter(card => card.color === currentCard.color || card.value === currentCard.value || card.value === 'Wild');
    if (playableCards.length > 0) {
        const cardToPlay = playableCards[0]; // Bot plays the first playable card
        if (cardToPlay.value === 'Wild' || cardToPlay.value === 'Wild_Draw_4') {
            // Bot randomly selects a color
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            currentCard = { color: randomColor, value: cardToPlay.value };
        } else {
            currentCard = cardToPlay;
        }
        botHand = botHand.filter(card => !(card.color === cardToPlay.color && card.value === cardToPlay.value));
    } else {
        if (deck.length > 0) {
            botHand.push(deck.pop());
        }
    }
    updateUI();
}

// Check for a win condition
function checkWinCondition() {
    if (playerHand.length === 0) {
        document.getElementById('message').innerHTML = '<h2 style="color: green;">Congratulations! You win!</h2><p>Great job getting rid of all your cards!</p>';
        gameActive = false; // End the game
    } else if (botHand.length === 0) {
        document.getElementById('message').innerHTML = '<h2 style="color: red;">The bot wins! Better luck next time!</h2><p>Try again to beat the bot!</p>';
        gameActive = false; // End the game
    }
}

// Initialize the game
function startGame() {
    createDeck();
    dealCards();
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('game').style.display = 'flex';
    gameActive = true; // Reset game state
}

// Event listeners
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('draw-card').addEventListener('click', drawCard);
