let cam;
let flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");

// Function to position shutter dynamically
function positionShutter() {
    const margin = 20; // px above bottom of viewport
    // Position relative to visible viewport top
    const y = window.innerHeight - shutter.offsetHeight - margin;
    shutter.style.top = `${y}px`;
}

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

    // Initial shutter position
    positionShutter();
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

// Handle window resize / orientation changes
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    positionShutter(); // recalc shutter position
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

    // Detect iOS
    let isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        // Show photo in overlay for long-press save
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "black";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";
        overlay.innerHTML = `<img src="${data}" style="max-width:100%;max-height:100%;object-fit:contain;"><p style="position:absolute;bottom:20px;color:white;text-align:center;width:100%;font-size:14px;">Tap and hold the photo to save</p>`;
        overlay.addEventListener("click", () =>
            document.body.removeChild(overlay),
        );
        document.body.appendChild(overlay);
    } else {
        // Normal download for Android / Desktop
        let a = document.createElement("a");
        a.href = data;
        a.download = "photo.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
