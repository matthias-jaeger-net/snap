let cam;
let flashEl = document.getElementById("flash");

const shutter = document.getElementById("shutter");
shutter.style.bottom = `${window.innerHeight * 0.05}px`;

// Setup p5 canvas
function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent("camera-container");

    // Use rear camera, audio off
    cam = createCapture({
        video: { facingMode: "environment" },
        audio: false,
    });

    cam.elt.muted = true;
    cam.hide();
}

function draw() {
    background(0);

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

    image(
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
    shutter.style.bottom = `${window.innerHeight * 0.05}px`;
}

// Shutter button click
shutter.addEventListener("click", takePhoto);

function takePhoto() {
    // Flash effect
    flashEl.style.opacity = 1;
    setTimeout(() => (flashEl.style.opacity = 0), 100);

    // Capture image from canvas
    let img = get();
    let data = img.canvas.toDataURL("image/png");

    // Use anchor to trigger download
    let a = document.createElement("a");
    a.href = data;
    a.download = "photo.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
