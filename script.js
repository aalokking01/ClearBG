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
    // Any click inside the upload box lets the user choose/replace an image.
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
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

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
    uploadHelp.textContent = "Click the image to choose another file.";

    removeButton.disabled = false;
    removeButton.innerHTML = "<span>&#10022;</span> Remove Background";

    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Your Result Will appear here.";
    preview.replaceChildren(empty);

    downloadButton.hidden = true;
    downloadButton.removeAttribute("href");
}

removeButton.addEventListener("click", async () => {
    if (!selectedFile || isProcessing) return;

    isProcessing = true;
    removeButton.disabled = true;
    removeButton.textContent = "Removing background...";

    try {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const response = await fetch("https://clearbg-backendweb.onrender.com/api/remove-bg", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Background removal failed.");
        }

        const blob = await response.blob();
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = URL.createObjectURL(blob);

        const resultImage = document.createElement("img");
        resultImage.src = resultUrl;
        resultImage.alt = "Background removed result";
        preview.replaceChildren(resultImage);

        downloadButton.href = resultUrl;
        downloadButton.download = "clearbg.png";
        downloadButton.hidden = false;
    } catch (error) {
        alert(error.message);
    } finally {
        isProcessing = false;
        removeButton.disabled = !selectedFile;
        removeButton.innerHTML = "<span>&#10022;</span> Remove Background";
    }
});

// Keep the contact form from reloading the page until it has a backend.
document.getElementById("forms").addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Thanks for your message! Contact form delivery is not connected yet.");
});

window.addEventListener("beforeunload", () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
});

