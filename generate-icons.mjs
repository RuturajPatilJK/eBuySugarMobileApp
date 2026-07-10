import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(__dirname, 'public', 'eBuySugarlogo.jpg');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const sizes = {
    'mipmap-mdpi':    48,
    'mipmap-hdpi':    72,
    'mipmap-xhdpi':   96,
    'mipmap-xxhdpi':  144,
    'mipmap-xxxhdpi': 192,
};

const icons = ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground'];

async function generate() {
    for (const [dir, size] of Object.entries(sizes)) {
        for (const name of icons) {
            const dest = path.join(resDir, dir, `${name}.png`);
            await sharp(src)
                .resize(size, size, { fit: 'cover', position: 'centre' })
                .png()
                .toFile(dest);
            console.log(`OK  ${dir}/${name}.png  (${size}x${size})`);
        }
    }
    console.log('\nAll icons generated!');
}

generate().catch(err => { console.error('Error:', err); process.exit(1); });
