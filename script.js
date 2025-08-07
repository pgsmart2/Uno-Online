// UNO MANIA 3D - Enhanced Game Logic with Bug Fixes and Animations

class UnoGame {
    constructor() {
        this.colors = ['Red', 'Green', 'Blue', 'Yellow'];
        this.specialCards = ['Skip', 'Reverse', 'Draw_2', 'Wild', 'Wild_Draw_4'];
        this.deck = [];
        this.playerHand = [];
        this.botHand = [];
        this.currentCard = null;
        this.gameActive = false;
        this.selectedColor = null;
        this.currentPlayer = 'player'; // 'player' or 'bot'
        this.gameDirection = 1; // 1 for normal, -1 for reverse
        this.drawCount = 0; // For stacking draw cards
        this.mustDraw = false; // If player must draw due to draw cards
        this.playerCalledUno = false;
        this.botCalledUno = false;
        
        this.initializeEventListeners();
    }

    // Create a complete UNO deck
    createDeck() {
        this.deck = [];
        
        // Number cards (0-9) for each color
        this.colors.forEach(color => {
            // One 0 card per color
            this.deck.push({ color, value: '0', type: 'number' });
            
            // Two of each number 1-9 per color
            for (let i = 1; i <= 9; i++) {
                this.deck.push({ color, value: i.toString(), type: 'number' });
                this.deck.push({ color, value: i.toString(), type: 'number' });
            }
            
            // Two of each action card per color
            ['Skip', 'Reverse', 'Draw_2'].forEach(action => {
                this.deck.push({ color, value: action, type: 'action' });
                this.deck.push({ color, value: action, type: 'action' });
            });
        });
        
        // Wild cards (4 of each)
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'Wild', value: 'Wild', type: 'wild' });
            this.deck.push({ color: 'Wild', value: 'Wild_Draw_4', type: 'wild' });
        }
        
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // Deal 7 cards to each player
        for (let i = 0; i < 7; i++) {
            this.playerHand.push(this.deck.pop());
            this.botHand.push(this.deck.pop());
        }
        
        // Set starting card (cannot be wild or action card)
        do {
            this.currentCard = this.deck.pop();
        } while (this.currentCard.type === 'wild' || this.currentCard.type === 'action');
        
        this.updateUI();
    }

    getCardImagePath(card) {
        if (card.value === 'Wild' || card.value === 'Wild_Draw_4') {
            return `cardImages/${card.value}.jpg`;
        }
        if (card.value === 'Draw_2') {
            return `cardImages/${card.color}_Draw_2.jpg`;
        }
        return `cardImages/${card.color}_${card.value}.jpg`;
    }

    updateUI() {
        this.updateCurrentCard();
        this.updatePlayerHand();
        this.updateBotHand();
        this.updateGameStats();
        this.updateUnoButton();
    }

    updateCurrentCard() {
        const currentCardContainer = document.getElementById('current-card');
        const cardImage = `<img src="${this.getCardImagePath(this.currentCard)}" 
            alt="${this.currentCard.color} ${this.currentCard.value}" 
            class="card-image current-card">`;
        
        currentCardContainer.innerHTML = cardImage;
        
        // Show wild color indicator if needed
        const wildIndicator = document.getElementById('wild-color-indicator');
        const selectedColorSpan = document.getElementById('selected-color');
        
        if (this.currentCard.type === 'wild' && this.selectedColor) {
            wildIndicator.style.display = 'block';
            selectedColorSpan.textContent = this.selectedColor;
            selectedColorSpan.style.color = this.getColorHex(this.selectedColor);
        } else {
            wildIndicator.style.display = 'none';
        }
    }

    updatePlayerHand() {
        const playerHandContainer = document.getElementById('player-hand');
        playerHandContainer.innerHTML = this.playerHand.map((card, index) => {
            const isPlayable = this.isCardPlayable(card);
            const playableClass = isPlayable ? 'playable' : '';
            
            return `<img src="${this.getCardImagePath(card)}" 
                alt="${card.color} ${card.value}" 
                class="card-image ${playableClass}" 
                onclick="game.selectCard(${index})" 
                style="--i: ${index}">`;
        }).join('');
    }

    updateBotHand() {
        const botHandContainer = document.getElementById('bot-hand');
        botHandContainer.innerHTML = this.botHand.map((_, index) => 
            `<img src="cardImages/back.jpg" 
            alt="Bot card" 
            class="card-image" 
            style="--i: ${index}">`
        ).join('');
    }

    updateGameStats() {
        document.getElementById('deck-count').textContent = this.deck.length;
        document.getElementById('current-turn').textContent = 
            this.currentPlayer === 'player' ? 'You' : 'Bot';
        document.getElementById('player-card-count').textContent = this.playerHand.length;
        document.getElementById('bot-card-count').textContent = this.botHand.length;
    }

    updateUnoButton() {
        const unoButton = document.getElementById('call-uno');
        if (this.playerHand.length === 2 && !this.playerCalledUno) {
            unoButton.style.display = 'block';
        } else {
            unoButton.style.display = 'none';
        }
    }

    isCardPlayable(card) {
        if (this.mustDraw && this.currentPlayer === 'player') {
            // If player must draw, only draw cards are playable
            return card.value === 'Draw_2' || card.value === 'Wild_Draw_4';
        }
        
        const currentColor = this.selectedColor || this.currentCard.color;
        
        return (
            card.color === currentColor ||
            card.value === this.currentCard.value ||
            card.type === 'wild' ||
            (this.currentCard.type === 'wild' && card.color === this.selectedColor)
        );
    }

    selectCard(cardIndex) {
        if (!this.gameActive || this.currentPlayer !== 'player') return;
        
        const card = this.playerHand[cardIndex];
        
        if (!this.isCardPlayable(card)) {
            this.showMessage('You cannot play that card!', 'error');
            this.shakeCard(cardIndex);
            return;
        }
        
        this.playCard(card, cardIndex, 'player');
    }

    playCard(card, cardIndex, player) {
        // Remove card from hand
        if (player === 'player') {
            this.playerHand.splice(cardIndex, 1);
            this.createParticleEffect('play');
        } else {
            this.botHand.splice(cardIndex, 1);
        }
        
        // Handle wild cards
        if (card.type === 'wild') {
            if (player === 'player') {
                this.showWildColorSelector();
                this.pendingWildCard = card;
                return;
            } else {
                // Bot chooses random color
                this.selectedColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            }
        } else {
            this.selectedColor = null;
        }
        
        this.currentCard = { ...card };
        if (this.selectedColor) {
            this.currentCard.color = this.selectedColor;
        }
        
        // Handle special card effects
        this.handleSpecialCard(card);
        
        this.updateUI();
        this.checkWinCondition();
        
        if (this.gameActive) {
            this.nextTurn();
        }
    }

    handleSpecialCard(card) {
        switch (card.value) {
            case 'Skip':
                this.showMessage(`${this.currentPlayer === 'player' ? 'You' : 'Bot'} played Skip!`, 'warning');
                this.nextTurn(); // Skip the next player
                break;
                
            case 'Reverse':
                this.gameDirection *= -1;
                this.showMessage(`${this.currentPlayer === 'player' ? 'You' : 'Bot'} played Reverse!`, 'warning');
                break;
                
            case 'Draw_2':
                this.drawCount += 2;
                this.mustDraw = true;
                this.showMessage(`${this.currentPlayer === 'player' ? 'You' : 'Bot'} played Draw 2!`, 'warning');
                break;
                
            case 'Wild_Draw_4':
                this.drawCount += 4;
                this.mustDraw = true;
                this.showMessage(`${this.currentPlayer === 'player' ? 'You' : 'Bot'} played Wild Draw 4!`, 'warning');
                break;
                
            case 'Wild':
                this.showMessage(`${this.currentPlayer === 'player' ? 'You' : 'Bot'} played Wild!`, 'success');
                break;
        }
    }

    nextTurn() {
        // Handle draw card effects
        if (this.mustDraw) {
            const nextPlayer = this.currentPlayer === 'player' ? 'bot' : 'player';
            
            if (nextPlayer === 'player') {
                // Player must draw
                for (let i = 0; i < this.drawCount; i++) {
                    if (this.deck.length > 0) {
                        this.playerHand.push(this.deck.pop());
                    }
                }
                this.showMessage(`You drew ${this.drawCount} cards!`, 'error');
            } else {
                // Bot must draw
                for (let i = 0; i < this.drawCount; i++) {
                    if (this.deck.length > 0) {
                        this.botHand.push(this.deck.pop());
                    }
                }
                this.showMessage(`Bot drew ${this.drawCount} cards!`, 'success');
            }
            
            this.drawCount = 0;
            this.mustDraw = false;
            this.currentPlayer = nextPlayer;
        } else {
            // Normal turn change
            this.currentPlayer = this.currentPlayer === 'player' ? 'bot' : 'player';
        }
        
        this.updateUI();
        
        // Check for UNO penalty
        this.checkUnoCall();
        
        if (this.currentPlayer === 'bot' && this.gameActive) {
            setTimeout(() => this.botTurn(), 1500);
        }
    }

    botTurn() {
        if (!this.gameActive || this.currentPlayer !== 'bot') return;
        
        // Bot calls UNO if needed
        if (this.botHand.length === 2) {
            this.botCalledUno = true;
            this.showMessage('Bot called UNO!', 'warning');
        }
        
        const playableCards = this.botHand.filter((card, index) => {
            return this.isCardPlayable(card);
        });
        
        if (playableCards.length > 0) {
            // Bot strategy: prefer action cards, then matching color, then matching number
            let cardToPlay = this.chooseBestBotCard(playableCards);
            let cardIndex = this.botHand.findIndex(card => 
                card.color === cardToPlay.color && card.value === cardToPlay.value
            );
            
            this.playCard(cardToPlay, cardIndex, 'bot');
        } else {
            // Bot must draw
            if (this.deck.length > 0) {
                this.botHand.push(this.deck.pop());
                this.showMessage('Bot drew a card', 'warning');
                this.updateUI();
                this.nextTurn();
            }
        }
    }

    chooseBestBotCard(playableCards) {
        // Prioritize action cards
        const actionCards = playableCards.filter(card => card.type === 'action');
        if (actionCards.length > 0) {
            return actionCards[0];
        }
        
        // Then wild cards if hand is large
        if (this.botHand.length > 3) {
            const wildCards = playableCards.filter(card => card.type === 'wild');
            if (wildCards.length > 0) {
                return wildCards[0];
            }
        }
        
        // Then matching color
        const colorMatches = playableCards.filter(card => 
            card.color === (this.selectedColor || this.currentCard.color)
        );
        if (colorMatches.length > 0) {
            return colorMatches[0];
        }
        
        // Finally any playable card
        return playableCards[0];
    }

    drawCard() {
        if (!this.gameActive || this.currentPlayer !== 'player') return;
        
        if (this.deck.length === 0) {
            this.showMessage('No more cards in deck!', 'error');
            return;
        }
        
        this.playerHand.push(this.deck.pop());
        this.createParticleEffect('draw');
        this.updateUI();
        
        // Check if drawn card is playable
        const drawnCard = this.playerHand[this.playerHand.length - 1];
        if (this.isCardPlayable(drawnCard)) {
            this.showMessage('You can play the card you just drew!', 'success');
        } else {
            this.showMessage('Card drawn - turn passes to bot', 'warning');
            this.nextTurn();
        }
    }

    callUno() {
        if (this.playerHand.length === 2) {
            this.playerCalledUno = true;
            this.showMessage('UNO! You have one card left!', 'success');
            this.createParticleEffect('uno');
            document.getElementById('call-uno').style.display = 'none';
        }
    }

    checkUnoCall() {
        // Check if player forgot to call UNO
        if (this.playerHand.length === 1 && !this.playerCalledUno) {
            // Penalty: draw 2 cards
            for (let i = 0; i < 2; i++) {
                if (this.deck.length > 0) {
                    this.playerHand.push(this.deck.pop());
                }
            }
            this.showMessage('UNO penalty! You forgot to call UNO and drew 2 cards!', 'error');
        }
        
        // Check if bot forgot to call UNO
        if (this.botHand.length === 1 && !this.botCalledUno) {
            for (let i = 0; i < 2; i++) {
                if (this.deck.length > 0) {
                    this.botHand.push(this.deck.pop());
                }
            }
            this.showMessage('Bot penalty! Bot forgot to call UNO!', 'success');
        }
    }

    checkWinCondition() {
        if (this.playerHand.length === 0) {
            this.endGame('player');
        } else if (this.botHand.length === 0) {
            this.endGame('bot');
        }
    }

    endGame(winner) {
        this.gameActive = false;
        
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameOverTitle = document.getElementById('game-over-title');
        const gameOverMessage = document.getElementById('game-over-message');
        
        if (winner === 'player') {
            gameOverTitle.textContent = '🎉 YOU WIN! 🎉';
            gameOverTitle.className = 'game-over-title win';
            gameOverMessage.textContent = 'Congratulations! You defeated the bot!';
            this.createParticleEffect('win');
        } else {
            gameOverTitle.textContent = '😔 YOU LOSE 😔';
            gameOverTitle.className = 'game-over-title lose';
            gameOverMessage.textContent = 'Better luck next time! The bot won this round.';
        }
        
        document.getElementById('game').style.display = 'none';
        gameOverScreen.style.display = 'flex';
    }

    showWildColorSelector() {
        const selector = document.getElementById('wild-color-selector');
        selector.style.display = 'block';
    }

    selectWildColor(color) {
        this.selectedColor = color;
        document.getElementById('wild-color-selector').style.display = 'none';
        
        if (this.pendingWildCard) {
            this.currentCard = { ...this.pendingWildCard };
            this.currentCard.color = color;
            
            this.handleSpecialCard(this.pendingWildCard);
            this.pendingWildCard = null;
            
            this.updateUI();
            this.checkWinCondition();
            
            if (this.gameActive) {
                this.nextTurn();
            }
        }
    }

    getColorHex(color) {
        const colorMap = {
            'Red': '#FF0000',
            'Green': '#00FF00',
            'Blue': '#0000FF',
            'Yellow': '#FFFF00'
        };
        return colorMap[color] || '#ffffff';
    }

    showMessage(text, type = 'info') {
        const messageContainer = document.getElementById('message');
        messageContainer.textContent = text;
        messageContainer.className = `message-container ${type}`;
        
        // Auto-hide message after 3 seconds
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = 'message-container';
        }, 3000);
    }

    createParticleEffect(type) {
        const container = document.getElementById('particles-container');
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#ffffff'];
        
        const particleCount = type === 'win' ? 50 : type === 'uno' ? 30 : 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            
            container.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }
    }

    shakeCard(cardIndex) {
        const playerHand = document.getElementById('player-hand');
        const cards = playerHand.children;
        if (cards[cardIndex]) {
            cards[cardIndex].style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                cards[cardIndex].style.animation = '';
            }, 500);
        }
    }

    startGame() {
        this.gameActive = true;
        this.currentPlayer = 'player';
        this.gameDirection = 1;
        this.drawCount = 0;
        this.mustDraw = false;
        this.selectedColor = null;
        this.playerCalledUno = false;
        this.botCalledUno = false;
        
        this.createDeck();
        this.dealCards();
        
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('game').style.display = 'flex';
        
        this.showMessage('Game started! Your turn!', 'success');
    }

    initializeEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('draw-card').addEventListener('click', () => this.drawCard());
        document.getElementById('call-uno').addEventListener('click', () => this.callUno());
        document.getElementById('play-again').addEventListener('click', () => this.startGame());
        
        // Wild color selector
        document.querySelectorAll('.color-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectWildColor(e.target.dataset.color);
            });
        });
    }
}

// Initialize the game
const game = new UnoGame();
