
const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Frontend files ka folder
const projectDir = path.join(__dirname, "..");

// Python 3.11 virtual environment
const pythonExe =
  process.env.PYTHON_EXECUTABLE ||
  (process.platform === "win32"
    ? path.join(__dirname, ".venv311", "Scripts", "python.exe")
    : "python3");

const pythonScript = path.join(
  __dirname,
  "python",
  "clearbg.py"
);

// Upload settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images are allowed."));
    }
  }
});

let workerReady = false;
let workerStopped = false;

const pending = new Map();
const requestQueue = [];

// Python AI worker ko sirf ek baar start karo
const python = spawn(pythonExe, [pythonScript], {
  stdio: ["pipe", "pipe", "pipe"]
});

const output = readline.createInterface({
  input: python.stdout
});

// Python se aane wale messages
output.on("line", (line) => {
  let message;

  try {
    message = JSON.parse(line);
  } catch {
    console.error("Invalid Python response:", line);
    return;
  }

  // Model load ho gaya
  if (message.ready) {
    workerReady = true;
    console.log("ClearBG AI model ready!");
    processQueue();
    return;
  }

  const task = pending.get(message.id);

  if (!task) return;

  pending.delete(message.id);

  if (message.error) {
    task.reject(new Error(message.error));
  } else {
    task.resolve(Buffer.from(message.image, "base64"));
  }

  // Agli queued image process karo
  processQueue();
});

// Python ke errors terminal mein dikhao
python.stderr.on("data", (data) => {
  console.error("Python:", data.toString().trim());
});

function rejectAll(message) {
  for (const task of pending.values()) {
    task.reject(new Error(message));
  }

  pending.clear();

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    task.reject(new Error(message));
  }
}

python.on("error", (error) => {
  workerStopped = true;

  console.error("Python start nahi hua:", error.message);

  rejectAll(
    "Python start nahi hua. .venv311 ka path check karo."
  );
});

python.on("close", (code) => {
  workerStopped = true;
  workerReady = false;

  console.error("Python worker stopped. Exit code:", code);

  rejectAll("AI worker band ho gaya. Backend restart karo.");
});

// Queue se ek waqt mein ek image process karo
function processQueue() {
  if (!workerReady || workerStopped) return;
  if (pending.size > 0) return;
  if (requestQueue.length === 0) return;

  const task = requestQueue.shift();

  pending.set(task.id, task);

  python.stdin.write(
    JSON.stringify({
      id: task.id,
      image: task.image.toString("base64")
    }) + "\n",
    (error) => {
      if (!error) return;

      if (pending.has(task.id)) {
        pending.delete(task.id);
        task.reject(
          new Error("Image Python ko send nahi ho saki.")
        );
      }

      processQueue();
    }
  );
}

// Image processing request ko queue mein daalo
function processImage(buffer) {
  return new Promise((resolve, reject) => {
    if (workerStopped) {
      reject(
        new Error("AI worker band hai. Backend restart karo.")
      );
      return;
    }

    requestQueue.push({
      id: crypto.randomUUID(),
      image: buffer,
      resolve,
      reject
    });

    processQueue();
  });
}

// Frontend serve karo
app.use(express.static(projectDir));

// Background removal API
app.post("/api/remove-bg", (req, res, next) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return next(err);

    if (!req.file) {
      return res.status(400).json({
        error: "Please select an image first."
      });
    }

    try {
      const result = await processImage(req.file.buffer);

      res.setHeader("Content-Type", "image/png");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="clearbg.png"'
      );

      res.send(result);
    } catch (error) {
      console.error(
        "Image processing failed:",
        error.message
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: "Background removal failed. Backend terminal check karo."
        });
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) return next(err);

  res.status(400).json({
    error: err.message || "Something went wrong."
  });
});
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "ClearBG Backend Running",
    aiReady: workerReady
  });
});
// Server start
app.listen(PORT, () => {
  console.log(`ClearBG running at http://localhost:${PORT}`);
  console.log("AI model load ho raha hai. Pehli baar wait karo.");
});
