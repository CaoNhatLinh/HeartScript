"use server";

import fs from 'fs';
import path from 'path';

export async function getValentineImages() {
    const imgDir = path.join(process.cwd(), 'public', 'valentine', 'img');

    try {
        if (!fs.existsSync(imgDir)) {
            return [];
        }

        const files = fs.readdirSync(imgDir);
        // Filter for images only
        const images = files.filter(file =>
            /\.(png|jpe?g|gif|svg|webp)$/i.test(file)
        ).map(file => `/valentine/img/${file}`);

        return images.sort((a, b) => a.localeCompare(b));
    } catch (error) {
        console.error("Error reading valentine images directory:", error);
        return [];
    }
}
