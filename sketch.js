let cam;
let facingMode = "environment"; // start with back camera

let flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");
const switchBtn = document.getElementById("switch-camera");

const overlay = document.getElementById("photo-overlay");
const overlayImage = document.getElementById("overlay-image");
const overlayDownload = document.getElementById("overlay-download");
const overlayClose = document.getElementById("overlay-close");

overlayClose.addEventListener("click", () => {
    overlay.classList.remove("active");
});

// Camera container
const container = document.getElementById("camera-container");

// Function to position shutter dynamically
function positionShutter() {
    const margin = 40;
    const y = window.innerHeight - shutter.offsetHeight - margin;
    shutter.style.top = `${y}px`;
}

// 🔁 Camera setup function
function initCamera() {
    if (cam) {
        cam.remove(); // stop previous stream
    }

    cam = createCapture({
        video: { facingMode: facingMode },
        audio: false,
    });

    cam.elt.muted = true;
    cam.hide();
}

// Setup p5 canvas
function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent("camera-container");

    initCamera();
    positionShutter();
}

// ASCII conversion
function image2Ascii(video, x, y, w, h) {
    video.loadPixels();
    let ascii = "";
    const chars = "@#/<>*+=-:,.  ";
    const charLen = chars.length;

    const cellH = 18;
    const cellW = cellH * 0.6;

    const cols = Math.ceil(w / cellW);
    const rows = Math.ceil(h / cellH);

    const videoCellW = video.width / cols;
    const videoCellH = video.height / rows;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const i = Math.floor(col * videoCellW + videoCellW * 0.5);
            const j = Math.floor(row * videoCellH + videoCellH * 0.5);

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

    const style = getComputedStyle(container);
    const textColor = style.color || "white";

    fill(textColor);
    textFont("monospace");
    textSize(cellH);
    textLeading(cellH);

    text(ascii, x, y);
}

// Draw loop
function draw() {
    const style = getComputedStyle(container);
    const backgroundColor = style.backgroundColor || "black";
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

    push();

    // 👈 Mirror front camera
    if (facingMode === "user") {
        translate(width, 0);
        scale(-1, 1);
    }

    image2Ascii(
        cam,
        width / 2 - drawWidth / 2,
        height / 2 - drawHeight / 2,
        drawWidth,
        drawHeight,
    );

    pop();
}

// Handle resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    positionShutter();
}

// 📸 Take photo
shutter.addEventListener("click", takePhoto);

async function takePhoto() {
    flashEl.style.opacity = 1;
    setTimeout(() => (flashEl.style.opacity = 0), 100);

    let img = get();
    let dataUrl = img.canvas.toDataURL("image/png");

    overlayImage.src = dataUrl;
    overlay.classList.add("active");

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "ascii-camera.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: "ASCII Camera Photo",
            });
        } catch (err) {
            console.log("Share cancelled");
        }
    } else {
        overlayDownload.href = dataUrl;
        overlayDownload.download = "ascii-camera.png";
    }
}

// 🔄 Switch camera button
switchBtn.addEventListener("click", () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    initCamera();
});
