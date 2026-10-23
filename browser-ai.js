
import { removeBackground } from "@imgly/background-removal";

let devicePromise;

async function getBestDevice() {
    if (!devicePromise) {
        devicePromise = (async () => {
            try {
                if (!navigator.gpu) return "cpu";

                const adapter = await navigator.gpu.requestAdapter();
                return adapter ? "gpu" : "cpu";
            } catch {
                return "cpu";
            }
        })();
    }

    return devicePromise;
}

export async function removeImageBackground(file) {
    console.log("ClearBG: Starting browser AI");

    const device = await getBestDevice();
    console.log("ClearBG: Selected device:", device);

    const result = await removeBackground(file, {
        debug: false,
        model: "isnet_quint8",
        device,
        progress: (key, current, total) => {
            console.log("AI Download:", key, current, total);
        }
    });

    console.log("ClearBG: Background removed");

    return URL.createObjectURL(result);
}
