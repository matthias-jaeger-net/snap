let cam;
let flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");

// Camera container
const container = document.getElementById("camera-container");

// Function to position shutter dynamically
function positionShutter() {
    const margin = 90; // px above bottom
    const y = window.innerHeight - shutter.offsetHeight - margin;
    shutter.style.top = `${y}px`;
}

// Setup p5 canvas
function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent("camera-container");

    cam = createCapture({
        video: { facingMode: "environment" },
        audio: false,
    });
    cam.elt.muted = true;
    cam.hide();

    positionShutter();
}

// ASCII conversion keeping grid concept
function image2Ascii(video, x, y, w, h) {
    video.loadPixels();
    let ascii = "";
    const chars = "@%#*+=-:. "; // dark → light

    const charLen = chars.length;

    // Grid size
    const cellH = 20; // height of each ASCII character
    const rows = Math.floor(h / cellH);
    const cellW = cellH * 0.6; // approximate monospace width
    const cols = Math.floor(w / cellW);

    // Map each grid cell to video pixels
    const videoCellW = video.width / cols;
    const videoCellH = video.height / rows;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const i = Math.floor(col * videoCellW + videoCellW / 2);
            const j = Math.floor(row * videoCellH + videoCellH / 2);
            const index = (j * video.width + i) * 4;

            const r = video.pixels[index];
            const g = video.pixels[index + 1];
            const b = video.pixels[index + 2];
            const avg = (r + g + b) / 3;

            const charIndex = Math.floor(map(avg, 0, 255, charLen - 1, 0));
            ascii += chars[charIndex];
        }
        ascii += "\n";
    }

    // Camera constiner color
    const style = getComputedStyle(container);
    const textColor = style.color || "white"; // fallback

    fill(textColor);

    textFont("monospace");
    textSize(cellH);
    textLeading(cellH);
    text(ascii, x, y);
}

function draw() {
    // Camera constiner color
    const style = getComputedStyle(container);
    const backgroundColor = style.backgroundColor || "black"; // fallback
    background(backgroundColor);

    let canvasRatio = width / height;
    let videoRatio = cam.width / cam.height;
    let drawWidth, drawHeight;

    if (canvasRatio > videoRatio) {
        drawWidth = width;
        drawHeight = width / videoRatio;
    } else {
        drawHeight = height;
        drawWidth = height * videoRatio;
    }

    image2Ascii(
        cam,
        width / 2 - drawWidth / 2,
        height / 2 - drawHeight / 2,
        drawWidth,
        drawHeight,
    );
}

// Handle window resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    positionShutter();
}

// Shutter button click
shutter.addEventListener("click", takePhoto);

function takePhoto() {
    // Flash effect
    flashEl.style.opacity = 1;
    setTimeout(() => (flashEl.style.opacity = 0), 100);

    // Capture canvas
    let img = get();
    let data = img.canvas.toDataURL("image/png");

    let isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        // Overlay for long-press save
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "black";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";
        overlay.innerHTML = `
            <img src="${data}" style="max-width:100%;max-height:100%;object-fit:contain;">
            <p style="position:absolute;bottom:20px;color:white;text-align:center;width:100%;font-size:45px;">
                Tap and hold the photo to save
            </p>`;
        overlay.addEventListener("click", () =>
            document.body.removeChild(overlay),
        );
        document.body.appendChild(overlay);
    } else {
        let a = document.createElement("a");
        a.href = data;
        a.download = "photo.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
