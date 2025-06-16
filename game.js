const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let basketEggs = 80;
let isDragging = false;
let draggedEgg = null;
let mouseX = 0;
let mouseY = 0;
let isSad = false;
let sadAnimationProgress = 0;
let currentMessage = null;  // Track current message
let messageTimer = null;    // Track message display time
let sadMessage = null;  // Track sad message

// Get basket canvas
const basketCanvas = document.getElementById('basketCanvas');
const basketCtx = basketCanvas.getContext('2d');

// Sound setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createCrunchSound() {
    // Create oscillator and gain nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
    
    // Configure gain (volume envelope)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function createPartySound() {
    // Create multiple oscillators for a party sound
    const duration = 0.5;
    
    // High pitched beep
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    osc1.frequency.setValueAtTime(1320, audioContext.currentTime + 0.25); // E6 note
    gain1.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    // Lower pitched beep
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    osc2.frequency.setValueAtTime(660, audioContext.currentTime + 0.25); // E5 note
    gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    
    // Start and stop both oscillators
    osc1.start();
    osc2.start();
    osc1.stop(audioContext.currentTime + duration);
    osc2.stop(audioContext.currentTime + duration);
}

function createScarySound() {
    // Create oscillator and gain nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator for a scary sound
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
    
    // Configure gain (volume envelope)
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Update the speakEggQuestion function with better error handling and logging
function speakEggQuestion() {
    if ('speechSynthesis' in window) {
        try {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance("Would you like to buy an 80 pack of eggs?");
            utterance.rate = 0.9;  // Slightly slower than normal
            utterance.pitch = 1.1; // Slightly higher pitch
            
            // Add event listeners for debugging
            utterance.onstart = () => console.log('Speech started');
            utterance.onend = () => console.log('Speech ended');
            utterance.onerror = (event) => console.error('Speech error:', event);
            
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Speech synthesis error:', error);
        }
    } else {
        console.log('Speech synthesis not supported');
    }
}

// Add this function after speakEggQuestion
function speakFortyEggLoss() {
    // Only speak if we'll have eggs remaining after the loss
    if (basketEggs > 40) {
        if ('speechSynthesis' in window) {
            try {
                // Cancel any ongoing speech
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance("That one egg was 40 eggs??");
                utterance.rate = 0.8;  // Slower to sound confused
                utterance.pitch = 1.3; // Higher pitch to sound surprised/confused
                
                // Add event listeners for debugging
                utterance.onstart = () => console.log('40-egg speech started');
                utterance.onend = () => console.log('40-egg speech ended');
                utterance.onerror = (event) => console.error('40-egg speech error:', event);
                
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('Speech synthesis error:', error);
            }
        }
    }
}

// Add new function for game over sound byte
function speakGameOver() {
    if ('speechSynthesis' in window) {
        try {
            // Force cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            // Create and configure the utterance
            const utterance = new SpeechSynthesisUtterance("EggBoy got real sad now");
            utterance.rate = 0.6;  // Slower to sound sad
            utterance.pitch = 0.7; // Lower pitch to sound sad
            
            // Add event listeners for debugging
            utterance.onstart = () => console.log('Game over speech started');
            utterance.onend = () => console.log('Game over speech ended');
            utterance.onerror = (event) => console.error('Game over speech error:', event);
            
            // Force the speech to play
            window.speechSynthesis.speak(utterance);
            
            // Ensure it plays by trying again if needed
            setTimeout(() => {
                if (!window.speechSynthesis.speaking) {
                    window.speechSynthesis.speak(utterance);
                }
            }, 100);
        } catch (error) {
            console.error('Speech synthesis error:', error);
        }
    }
}

// EggBoy properties
const eggBoy = {
    x: canvas.width - 250,  // Adjusted position for larger size
    y: canvas.height - 350,  // Adjusted position for larger size
    width: 300,  // 3x bigger
    height: 450,  // 3x bigger
    face: {
        eyes: { x1: -60, y1: -60, x2: 60, y2: -60 },  // Scaled up
        mouth: { 
            x: 0, 
            y: 30, 
            width: 90,  // Scaled up
            height: 45,  // Scaled up
            isEating: false,
            eatProgress: 0
        }
    },
    legs: {
        left: { x: -90, y: 180 },  // Scaled up
        right: { x: 90, y: 180 }   // Scaled up
    },
    isAnimating: false
};

// Draggable egg properties
const draggableEgg = {
    x: 100,
    y: canvas.height - 150,
    width: 60,
    height: 80
};

// Draw EggBoy
function drawEggBoy() {
    ctx.save();
    ctx.translate(eggBoy.x, eggBoy.y);
    
    // Calculate size based on sad state
    const currentWidth = isSad ? eggBoy.width * (1 - sadAnimationProgress * 0.3) : eggBoy.width;
    const currentHeight = isSad ? eggBoy.height * (1 - sadAnimationProgress * 0.3) : eggBoy.height;
    
    // Draw body
    ctx.fillStyle = isSad ? '#90EE90' : '#FFFFFF';  // Light green when sad
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, currentWidth / 2, currentHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw "EggBoy" text on belly
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EggBoy', 0, 120);

    // Draw face
    ctx.fillStyle = '#000000';
    
    // Eyes - sad when isSad is true
    if (isSad) {
        // Sad eyes
        ctx.beginPath();
        ctx.arc(eggBoy.face.eyes.x1, eggBoy.face.eyes.y1, 15, Math.PI * 0.2, Math.PI * 0.8);
        ctx.arc(eggBoy.face.eyes.x2, eggBoy.face.eyes.y2, 15, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
    } else {
        // Normal eyes
        ctx.beginPath();
        ctx.arc(eggBoy.face.eyes.x1, eggBoy.face.eyes.y1, 15, 0, Math.PI * 2);
        ctx.arc(eggBoy.face.eyes.x2, eggBoy.face.eyes.y2, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    // Mouth - sad when isSad is true
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (isSad) {
        // Sad mouth
        ctx.arc(eggBoy.face.mouth.x, eggBoy.face.mouth.y + 20, 45, Math.PI * 0.2, Math.PI * 0.8);
    } else if (eggBoy.face.mouth.isEating) {
        // Eating mouth
        const mouthOpen = Math.sin(eggBoy.face.mouth.eatProgress) * 45;
        ctx.arc(eggBoy.face.mouth.x, eggBoy.face.mouth.y, 45, 0, Math.PI - mouthOpen);
    } else {
        // Normal mouth
        ctx.arc(eggBoy.face.mouth.x, eggBoy.face.mouth.y, 45, 0, Math.PI);
    }
    ctx.stroke();

    // Legs
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(eggBoy.legs.left.x, eggBoy.legs.left.y);
    ctx.lineTo(eggBoy.legs.left.x, eggBoy.legs.left.y + 120);
    ctx.moveTo(eggBoy.legs.right.x, eggBoy.legs.right.y);
    ctx.lineTo(eggBoy.legs.right.x, eggBoy.legs.right.y + 120);
    ctx.stroke();

    ctx.restore();
}

// Draw draggable egg
function drawDraggableEgg(x, y) {
    ctx.fillStyle = '#FFFDD0';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, draggableEgg.width / 2, draggableEgg.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

// Draw custom cursor
function drawCustomCursor(x, y, isGrabbing) {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw hand outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isGrabbing) {
        // Grabbing hand (closed)
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
    } else {
        // Grabbing hand (open)
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 15);
    }
    ctx.stroke();
    
    // Draw hand fill
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    if (isGrabbing) {
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
    } else {
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
    }
    ctx.fill();
    
    ctx.restore();
}

// Update cursor
function updateCursor() {
    if (isDragging) {
        canvas.style.cursor = 'none';
        drawCustomCursor(mouseX, mouseY, true);
    } else if (isPointInEgg(mouseX, mouseY, draggableEgg.x, draggableEgg.y) && basketEggs > 0) {
        canvas.style.cursor = 'none';
        drawCustomCursor(mouseX, mouseY, false);
    } else {
        canvas.style.cursor = 'default';
    }
}

// Check if point is inside egg
function isPointInEgg(x, y, eggX, eggY) {
    const dx = x - eggX;
    const dy = y - eggY;
    return (dx * dx) / ((draggableEgg.width / 2) * (draggableEgg.width / 2)) +
           (dy * dy) / ((draggableEgg.height / 2) * (draggableEgg.height / 2)) <= 1;
}

// Check if egg is fed to EggBoy
function isEggFed(x, y) {
    const dx = x - eggBoy.x;
    const dy = y - eggBoy.y;
    return (dx * dx) / ((eggBoy.width / 2) * (eggBoy.width / 2)) +
           (dy * dy) / ((eggBoy.height / 2) * (eggBoy.height / 2)) <= 1;
}

// Celebration animation
function celebrate() {
    eggBoy.isAnimating = true;
    let frames = 0;
    let isDancing = true;
    
    // Play party sound
    createPartySound();
    
    function animate() {
        if (frames >= 180) { // 3 seconds at 60fps
            if (isDancing) {
                // Pause at the end for 2 seconds
                isDancing = false;
                setTimeout(() => {
                    eggBoy.isAnimating = false;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    draw();
                }, 2000);
                return;
            }
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate text position to ensure it's centered and not cut off
        const textY = Math.max(200, eggBoy.y - 400); // Significantly increased distance from EggBoy
        const fontSize = Math.min(72, canvas.width / 12); // Scale font size based on canvas width
        
        // Draw celebration text above EggBoy with background
        ctx.save();
        // Draw text background with more padding
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; // Increased opacity for better visibility
        ctx.fillRect(0, textY - fontSize - 30, canvas.width, fontSize * 2.5); // Increased padding and height
        // Draw text
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#FF0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Congrats Big Boy!', canvas.width / 2, textY);
        ctx.restore();
        
        // Draw dancing EggBoy
        ctx.save();
        ctx.translate(eggBoy.x, eggBoy.y);
        
        // Dance movement
        const bounceHeight = Math.sin(frames * 0.1) * 30; // Bouncing up and down
        const swayAmount = Math.sin(frames * 0.05) * 20;  // Swaying side to side
        ctx.translate(swayAmount, bounceHeight);
        
        // Rotation dance
        const wiggleAmount = Math.sin(frames * 0.2) * 0.2; // Wiggling rotation
        ctx.rotate(wiggleAmount);
        
        // Draw EggBoy's body
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, eggBoy.width / 2, eggBoy.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw "EggBoy" text on belly
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EggBoy', 0, 120);

        // Draw happy face
        ctx.fillStyle = '#000000';
        // Dancing eyes (wider)
        ctx.beginPath();
        ctx.arc(eggBoy.face.eyes.x1, eggBoy.face.eyes.y1, 15, 0, Math.PI * 2);
        ctx.arc(eggBoy.face.eyes.x2, eggBoy.face.eyes.y2, 15, 0, Math.PI * 2);
        ctx.fill();

        // Big smile
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(eggBoy.face.mouth.x, eggBoy.face.mouth.y, 45, 0, Math.PI);
        ctx.stroke();

        // Dancing legs
        ctx.lineWidth = 12;
        ctx.beginPath();
        // Left leg with kick
        const leftLegKick = Math.sin(frames * 0.2) * 30;
        ctx.moveTo(eggBoy.legs.left.x, eggBoy.legs.left.y);
        ctx.lineTo(eggBoy.legs.left.x + leftLegKick, eggBoy.legs.left.y + 120);
        // Right leg with opposite kick
        ctx.moveTo(eggBoy.legs.right.x, eggBoy.legs.right.y);
        ctx.lineTo(eggBoy.legs.right.x - leftLegKick, eggBoy.legs.right.y + 120);
        ctx.stroke();

        ctx.restore();
        
        frames++;
        if (isDancing) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Eating animation
function startEatingAnimation() {
    eggBoy.face.mouth.isEating = true;
    eggBoy.face.mouth.eatProgress = 0;
    
    function animateEating() {
        if (eggBoy.face.mouth.eatProgress >= Math.PI * 2) {
            eggBoy.face.mouth.isEating = false;
            return;
        }
        
        eggBoy.face.mouth.eatProgress += 0.2;
        requestAnimationFrame(animateEating);
    }
    
    animateEating();
}

// Event handlers
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPointInEgg(x, y, draggableEgg.x, draggableEgg.y) && basketEggs > 0) {
        isDragging = true;
        draggedEgg = { x: x - draggableEgg.x, y: y - draggableEgg.y };
        updateCursor();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (isDragging) {
        draggableEgg.x = mouseX - draggedEgg.x;
        draggableEgg.y = mouseY - draggedEgg.y;
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        if (isEggFed(draggableEgg.x, draggableEgg.y)) {
            // Play crunch sound
            createCrunchSound();
            
            // Start eating animation
            startEatingAnimation();
            
            // Clear any existing message and timer
            if (messageTimer) {
                clearTimeout(messageTimer);
                messageTimer = null;
            }
            currentMessage = null;
            
            // Handle egg loss based on current basket count
            if (basketEggs > 40) {
                // Only allow 40 egg loss if we have more than 40 eggs
                if (Math.random() < 0.08) {
                    const newCount = basketEggs - 40;
                    // Only show message and play sound if we'll still have eggs after loss
                    if (newCount > 0) {
                        basketEggs = newCount;
                        currentMessage = "That one egg was 40 eggs??";
                        messageTimer = 3;
                        createScarySound();
                        speakFortyEggLoss();
                    } else {
                        // If we would go to 0, just lose one egg instead
                        basketEggs--;
                    }
                } else {
                    basketEggs--;
                }
            } else {
                // If we have 40 or fewer eggs, always lose just one
                basketEggs--;
            }
            
            // Update egg count display
            drawBasket();
            
            // Check if we're out of eggs
            if (basketEggs <= 0) {
                // Cancel any ongoing speech first
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                
                isSad = true;
                sadAnimationProgress = 0;
                
                // Play game over sound immediately
                setTimeout(() => {
                    speakGameOver();
                }, 50);
                
                function animateSad() {
                    if (sadAnimationProgress < 1) {
                        sadAnimationProgress += 0.02;
                        requestAnimationFrame(animateSad);
                    }
                }
                animateSad();
            }
            
            // 7.5% chance to trigger egg purchase (reduced by 50% from 15%)
            if (Math.random() < 0.075) {
                showPurchaseModal();
            }
            
            // 3.75% chance to win (increased by 25% from 3%)
            if (Math.random() < 0.0375) {
                celebrate();
            }
        }
        
        // Reset egg position
        draggableEgg.x = 100;
        draggableEgg.y = canvas.height - 150;
    }
    
    isDragging = false;
    updateCursor();
});

// Buy eggs function
window.buyEggs = function() {
    const input = document.getElementById('payment').value.toLowerCase().trim();
    if (input === 'no') {
        // Subtract 31 eggs when user says no
        basketEggs = Math.max(0, basketEggs - 31);
        drawBasket();
        
        // Check if we're out of eggs after subtraction
        if (basketEggs <= 0) {
            // Cancel any ongoing speech first
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            
            isSad = true;
            sadAnimationProgress = 0;
            
            // Play game over sound immediately
            setTimeout(() => {
                speakGameOver();
            }, 50);
            
            function animateSad() {
                if (sadAnimationProgress < 1) {
                    sadAnimationProgress += 0.02;
                    requestAnimationFrame(animateSad);
                }
            }
            animateSad();
        }
    } else if (input !== '') {  // Any other non-empty input buys eggs
        basketEggs = 80;
        isSad = false;
        sadAnimationProgress = 0;
        drawBasket();
    }
    document.getElementById('modal').style.display = 'none';
    document.getElementById('payment').value = '';
};

// Update the showPurchaseModal function to use the correct modal ID
function showPurchaseModal() {
    const modal = document.getElementById('modal');  // Changed from 'purchaseModal' to 'modal'
    if (modal) {
        modal.style.display = 'block';
        speakEggQuestion();
    } else {
        console.error('Modal element not found');
    }
}

// Draw basket with eggs
function drawBasket() {
    basketCtx.clearRect(0, 0, basketCanvas.width, basketCanvas.height);
    
    // Draw basket
    basketCtx.fillStyle = '#8B4513';  // Brown color
    basketCtx.strokeStyle = '#654321';
    basketCtx.lineWidth = 2;
    
    // Basket shape
    basketCtx.beginPath();
    basketCtx.moveTo(20, 30);
    basketCtx.quadraticCurveTo(100, 0, 180, 30);
    basketCtx.lineTo(180, 120);
    basketCtx.quadraticCurveTo(100, 150, 20, 120);
    basketCtx.closePath();
    basketCtx.fill();
    basketCtx.stroke();
    
    // Basket weave pattern
    basketCtx.strokeStyle = '#654321';
    for (let i = 0; i < 5; i++) {
        basketCtx.beginPath();
        basketCtx.moveTo(20, 40 + i * 20);
        basketCtx.quadraticCurveTo(100, 50 + i * 20, 180, 40 + i * 20);
        basketCtx.stroke();
    }
    
    // Draw eggs in basket
    const maxEggs = 12;  // Maximum number of eggs to show
    const eggsToShow = Math.min(basketEggs, maxEggs);
    const rows = Math.ceil(eggsToShow / 4);
    
    for (let i = 0; i < eggsToShow; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const x = 40 + col * 35;
        const y = 50 + row * 25;
        
        // Draw egg
        basketCtx.fillStyle = '#FFFDD0';
        basketCtx.strokeStyle = '#000000';
        basketCtx.lineWidth = 1;
        basketCtx.beginPath();
        basketCtx.ellipse(x, y, 15, 20, 0, 0, Math.PI * 2);
        basketCtx.fill();
        basketCtx.stroke();
    }
    
    // Update egg count text
    document.getElementById('eggCount').textContent = basketEggs;
}

// Main draw function
function draw() {
    if (!eggBoy.isAnimating) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawEggBoy();
        drawDraggableEgg(draggableEgg.x, draggableEgg.y);
        drawBasket();
        
        // Draw current message if it exists
        if (currentMessage) {
            ctx.save();
            // Position to the left of EggBoy, but not too far left
            const messageX = Math.max(200, eggBoy.x - 300);  // Ensure minimum distance from left edge
            const messageY = eggBoy.y;        // Same height as EggBoy
            
            // Draw background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(messageX - 150, messageY - 25, 300, 50);  // Smaller background
            
            // Draw text
            ctx.font = 'bold 28px Arial';  // Smaller font
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentMessage, messageX, messageY);
            ctx.restore();
        }
        
        // Draw sad message if out of eggs
        if (isSad) {
            ctx.save();
            // Position to the left of EggBoy, but not too far left
            const messageX = Math.max(200, eggBoy.x - 300);  // Ensure minimum distance from left edge
            const messageY = eggBoy.y;        // Same height as EggBoy
            
            // Draw background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(messageX - 150, messageY - 25, 300, 50);  // Smaller background
            
            // Draw text
            ctx.font = 'bold 28px Arial';  // Smaller font
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('EggBoy got REAL sad now', messageX, messageY);
            ctx.restore();
        }
        
        updateCursor();
    }
    requestAnimationFrame(draw);
}

// Start the game
draw();
updateCursor(); 