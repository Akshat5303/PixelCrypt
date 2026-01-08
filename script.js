// --- 1. BACKGROUND PIXEL ANIMATION ---
const canvas = document.getElementById('pixel-bg');
const ctx = canvas.getContext('2d');

let particlesArray;

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 1; // Random pixel size
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        // Bounce off edges
        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
    }
    draw() {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.1)'; // faint green pixels
        ctx.fillRect(this.x, this.y, this.size, this.size); // Draw squares (pixels)
    }
}

function initParticles() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
});


// --- 2. TAB SWITCHING LOGIC (Navbar & Buttons) ---

function switchTab(mode) {
    // Buttons
    document.getElementById('tab-encrypt').classList.remove('active');
    document.getElementById('tab-decrypt').classList.remove('active');
    
    // Panels
    document.getElementById('panel-encrypt').classList.remove('active-panel');
    document.getElementById('panel-decrypt').classList.remove('active-panel');

    // Activate selected
    document.getElementById('tab-' + mode).classList.add('active');
    document.getElementById('panel-' + mode).classList.add('active-panel');
}


// --- 3. STEGANOGRAPHY LOGIC (The Core Project) ---

// Setup Canvas for Encoding
const canvasEncode = document.getElementById('canvas-encode');
const ctxEncode = canvasEncode.getContext('2d');
const uploadEncode = document.getElementById('upload-encode');

// Setup Canvas for Decoding
const canvasDecode = document.getElementById('canvas-decode');
const ctxDecode = canvasDecode.getContext('2d');
const uploadDecode = document.getElementById('upload-decode');

// Handle Image Upload (Encrypt)
uploadEncode.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvasEncode.width = img.width;
            canvasEncode.height = img.height;
            ctxEncode.drawImage(img, 0, 0);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Handle Image Upload (Decrypt)
uploadDecode.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvasDecode.width = img.width;
            canvasDecode.height = img.height;
            ctxDecode.drawImage(img, 0, 0);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// ENCRYPT FUNCTION
function encodeMessage() {
    const text = document.getElementById('secret-message').value + "~~~~"; // Stop signal
    const imgData = ctxEncode.getImageData(0, 0, canvasEncode.width, canvasEncode.height);
    const data = imgData.data;

    // Convert text to binary
    let binaryText = "";
    for (let i = 0; i < text.length; i++) {
        binaryText += text.charCodeAt(i).toString(2).padStart(8, '0');
    }

    if (binaryText.length > data.length / 4) {
        alert("Text is too long for this image!");
        return;
    }

    let dataIndex = 0;
    for (let i = 0; i < binaryText.length; i++) {
        if ((dataIndex + 1) % 4 === 0) dataIndex++; // Skip Alpha channel
        
        // Modify the LSB
        let currentVal = data[dataIndex];
        if (binaryText[i] === '1') {
             data[dataIndex] = currentVal | 1; 
        } else {
             data[dataIndex] = currentVal & 254; 
        }
        dataIndex++;
    }

    ctxEncode.putImageData(imgData, 0, 0);
    
    // Download
    const link = document.createElement('a');
    link.download = 'pixelcrypt_secured.png';
    link.href = canvasEncode.toDataURL();
    link.click();
}

// DECRYPT FUNCTION
function decodeMessage() {
    const imgData = ctxDecode.getImageData(0, 0, canvasDecode.width, canvasDecode.height);
    const data = imgData.data;
    let binaryText = "";
    let decodedText = "";

    for (let i = 0; i < data.length; i++) {
        if ((i + 1) % 4 === 0) continue;
        binaryText += (data[i] & 1).toString();
    }

    // Convert binary to text
    for (let i = 0; i < binaryText.length; i += 8) {
        let byte = binaryText.slice(i, i + 8);
        let char = String.fromCharCode(parseInt(byte, 2));
        decodedText += char;

        if (decodedText.endsWith("~~~~")) {
            document.getElementById('decoded-output').innerText = decodedText.slice(0, -4);
            return;
        }
    }
    document.getElementById('decoded-output').innerText = "No hidden message found.";
}