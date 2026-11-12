import sharp from 'sharp';
for(let n=1;n<=3;n++) await sharp(`public/images/mount-st-mary-${n}.jpg`).webp({quality:85}).toFile(`public/images/mount-st-mary-${n}.webp`);
await sharp('public/images/mount-st-mary-2.jpg').resize(1200,630,{fit:'cover'}).jpeg({quality:85}).toFile('public/og-default.jpg');
