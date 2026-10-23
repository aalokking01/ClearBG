import { removeBackground } from "@imgly/background-removal";

export async function removeImageBackground(file) {
    console.log("ClearBG: Starting browser AI");

    const result = await removeBackground(file, {
        debug: true,
        model: "isnet_quint8",
        device: "cpu",
        progress: (key, current, total) => {
            console.log("AI Download:", key, current, total);
        }
    });

    console.log("ClearBG: Background removed");

    return URL.createObjectURL(result);
}