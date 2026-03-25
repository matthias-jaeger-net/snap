let cam;
let facingMode = "environment";

let asciiMode = true;
let invertMode = false;

let flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");
const switchBtn = document.getElementById("switch-camera");

const asciiToggle = document.getElementById("ascii-toggle");
const invertToggle = document.getElementById("invert-toggle");

const overlay = document.getElementById("photo-overlay");
const overlayImage = document.getElementById("overlay-image");
const overlayDownload = document.getElementById("overlay-download");
const overlayClose = document.getElementById("overlay-close");

// Init toggles
asciiToggle.checked = true;
invertToggle.checked = false;

const settingsOverlay = document.getElementById("settings-overlay");
const openSettings = document.getElementById("open-settings");
const closeSettings = document.getElementById("close-settings");

// open
openSettings.addEventListener("click", () => {
    settingsOverlay.classList.add("active");
});

// close
closeSettings.addEventListener("click", () => {
    settingsOverlay.classList.remove("active");
});

asciiToggle.addEventListener("change", () => {
    asciiMode = asciiToggle.checked;
});

invertToggle.addEventListener("change", () => {
    invertMode = invertToggle.checked;
});

// Close overlay
overlayClose.addEventListener("click", () => {
    overlay.classList.remove("active");
});

// Camera container
const container = document.getElementById("camera-container");

// Position shutter
function positionShutter() {
    const margin = 40;
    const y = window.innerHeight - shutter.offsetHeight - margin;
    shutter.style.top = `${y}px`;
}

// Init camera
function initCamera() {
    if (cam) cam.remove();

    cam = createCapture({
        video: { facingMode: facingMode },
        audio: false,
    });

    cam.elt.muted = true;
    cam.hide();
}

// Setup
function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent("camera-container");

    initCamera();
    positionShutter();
}

// ASCII render
function image2Ascii(video, x, y, w, h, fgColor) {
    video.loadPixels();

    const chars = "@%#*+=-:. ";
    const charLen = chars.length;

    const cellH = 16;
    const cellW = cellH * 0.6;

    const cols = Math.ceil(w / cellW);
    const rows = Math.ceil(h / cellH);

    const videoCellW = video.width / cols;
    const videoCellH = video.height / rows;

    let ascii = "";

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const i = Math.floor(col * videoCellW + videoCellW * 0.5);
            const j = Math.floor(row * videoCellH + videoCellH * 0.5);

            const index = (j * video.width + i) * 4;

            const r = video.pixels[index];
            const g = video.pixels[index + 1];
            const b = video.pixels[index + 2];

            // better luminance
            const avg = 0.299 * r + 0.587 * g + 0.114 * b;

            let charIndex;

            if (invertMode) {
                charIndex = Math.floor(map(avg, 0, 255, 0, charLen - 1));
            } else {
                charIndex = Math.floor(map(avg, 0, 255, charLen - 1, 0));
            }

            ascii += chars[charIndex];
        }
        ascii += "\n";
    }

    fill(fgColor);
    textFont("monospace");
    textSize(cellH);
    textLeading(cellH);

    text(ascii, x, y);
}

// Draw loop
function draw() {
    const style = getComputedStyle(container);

    let bg = style.backgroundColor || "black";
    let fg = style.color || "white";

    // invert colors
    if (invertMode) {
        const temp = bg;
        bg = fg;
        fg = temp;
    }

    background(bg);

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

    // mirror front camera
    if (facingMode === "user") {
        translate(width, 0);
        scale(-1, 1);
    }

    if (asciiMode) {
        image2Ascii(
            cam,
            width / 2 - drawWidth / 2,
            height / 2 - drawHeight / 2,
            drawWidth,
            drawHeight,
            fg,
        );
    } else {
        image(
            cam,
            width / 2 - drawWidth / 2,
            height / 2 - drawHeight / 2,
            drawWidth,
            drawHeight,
        );
    }

    pop();
}

// Resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    positionShutter();
}

// Take photo
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
        } catch {
            console.log("Share cancelled");
        }
    } else {
        overlayDownload.href = dataUrl;
        overlayDownload.download = "ascii-camera.png";
    }
}

// Switch camera
switchBtn.addEventListener("click", () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    initCamera();
});
