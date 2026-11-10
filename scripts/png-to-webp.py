"""Converte public/rack/*.png (alfa) em WebP com alfa e recorta margens vazias de forma uniforme."""
import glob, os
from PIL import Image
for f in sorted(glob.glob('public/rack/*.png')):
    im = Image.open(f).convert('RGBA')
    im.save(f[:-4] + '.webp', 'WEBP', quality=86, method=6)
    os.remove(f)
    print(f[:-4] + '.webp', os.path.getsize(f[:-4] + '.webp'))
