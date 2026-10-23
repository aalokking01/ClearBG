
import { removeImageBackground } from "./browser-ai.js";

const imageInput = document.getElementById("image");
const uploadBox = document.getElementById("uploadBox");
const uploadPrompt = document.getElementById("uploadPrompt");
const chooseButton = document.getElementById("chooseImage");
const originalImage = document.getElementById("originalImage");
const uploadHelp = document.getElementById("uploadHelp");
const removeButton = document.getElementById("remove");
const preview = document.getElementById("preview");
const downloadButton = document.getElementById("download");

let selectedFile = null;
let originalUrl = null;
let resultUrl = null;
let isProcessing = false;

function openFilePicker() {
    if (!isProcessing) imageInput.click();
}

chooseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openFilePicker();
});

uploadBox.addEventListener("click", (event) => {
    if (event.target !== imageInput) openFilePicker();
});

uploadBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFilePicker();
    }
});

uploadBox.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadBox.classList.add("drag-over");
});

uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("drag-over");
});

uploadBox.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadBox.classList.remove("drag-over");

    if (isProcessing) return;

    const file = event.dataTransfer.files[0];
    if (file) setSelectedFile(file);
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) setSelectedFile(file);
});

function setSelectedFile(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Please choose a JPG, PNG, or WebP image.");
        imageInput.value = "";
        return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    selectedFile = file;
    originalUrl = URL.createObjectURL(file);
    resultUrl = null;

    originalImage.src = originalUrl;
    originalImage.hidden = false;
    uploadPrompt.hidden = true;

    uploadHelp.textContent =
        "Click the image to choose another file.";

    removeButton.disabled = false;
    removeButton.innerHTML =
        "<span>&#10022;</span> Remove Background";

    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Your Result Will appear here.";

    preview.replaceChildren(empty);

    downloadButton.hidden = true;
    downloadButton.removeAttribute("href");
}

// Browser-based AI background removal
removeButton.addEventListener("click", async () => {
    if (!selectedFile || isProcessing) return;

    isProcessing = true;
    removeButton.disabled = true;
    removeButton.textContent = "AI Processing...";

    try {
        // AI runs locally in the user's browser
        const newResultUrl =
            await removeImageBackground(selectedFile);

        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = newResultUrl;

        const resultImage = document.createElement("img");
        resultImage.src = resultUrl;
        resultImage.alt = "Background removed result";

        preview.replaceChildren(resultImage);

        downloadButton.href = resultUrl;
        downloadButton.download = "clearbg.png";
        downloadButton.hidden = false;

    } catch (error) {
        console.error("ClearBG AI Error:", error);
        alert(
            "Background removal failed: " +
            (error.message || "Unknown error")
        );
    } finally {
        isProcessing = false;
        removeButton.disabled = !selectedFile;
        removeButton.innerHTML =
            "<span>&#10022;</span> Remove Background";
    }
});

// Contact form
const contactForm = document.getElementById("forms");

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        alert(
            "Thanks for your message! Contact form delivery is not connected yet."
        );
    });
}

// Clean temporary image URLs
window.addEventListener("beforeunload", () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
});
