#!/usr/bin/env python3
"""Reproducible technical gate for the installed48 demo assets; semantic review is separate."""
from pathlib import Path
import argparse,json,hashlib,collections
from PIL import Image,ImageChops
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]/'public/assets/belle/products');parser.add_argument('--report',type=Path)
a=parser.parse_args();root=a.root;items=json.loads((root/'catalogo_48_novo.json').read_text());errors=[];rows=[];counts=collections.Counter(x['category'] for x in items)
if len(items)!=48 or len({x['slug'] for x in items})!=48:errors.append('48 unique products required')
if set(counts)!=set(['camisas','croppeds','vestidos','saias','calcas','bolsas','pulseiras','aneis']) or any(n!=6 for n in counts.values()):errors.append('Eight categories with six products each required')
for product in items:
 slug=product['slug'];row={'slug':slug,'name':product['name'],'category':product['category'],'files':{}}
 if not product.get('isDemo') or product.get('price') is not None or product.get('inventoryConfirmed'):errors.append(f'{slug}: invalid commercial status')
 alpha_png=None
 for key in ['cutoutPng','cutoutWebp','packshotWebp']:
  rel=Path(product[key]).relative_to('assets/products');file=root/rel
  try:
   im=Image.open(file);im.load()
   if im.format!=('PNG' if key=='cutoutPng' else 'WEBP'):errors.append(f'{slug}/{key}: wrong format')
   if 'A' not in im.getbands():raise ValueError('missing alpha')
   alpha=im.getchannel('A');bbox=alpha.getbbox();expected=tuple(product['packshotDimensions' if key=='packshotWebp' else 'cutoutDimensions'])
   if im.size!=expected:errors.append(f'{slug}/{key}: dimensions differ from manifest')
   if alpha.getextrema()!=(0,255) or not bbox:errors.append(f'{slug}/{key}: invalid alpha coverage')
   corners=[alpha.getpixel(pos) for pos in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]]
   if any(corners):errors.append(f'{slug}/{key}: opaque corner')
   if bbox and (bbox[0]<=0 or bbox[1]<=0 or bbox[2]>=im.width or bbox[3]>=im.height):errors.append(f'{slug}/{key}: opaque content touches edge')
   if key=='cutoutPng':alpha_png=alpha.copy()
   elif key=='cutoutWebp' and alpha_png is not None and ImageChops.difference(alpha_png,alpha).getbbox():errors.append(f'{slug}: PNG/WebP alpha differs')
   hist=alpha.histogram();row['files'][key]={'path':str(rel),'size':list(im.size),'alphaBBox':bbox,'transparentPercent':round(100*hist[0]/(im.width*im.height),2),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
  except Exception as exc:errors.append(f'{slug}/{key}: {exc}')
 rows.append(row)
result={'productCount':len(items),'categoryCounts':dict(counts),'fileCount':sum(len(x['files'])for x in rows),'errors':errors,'products':rows}
if a.report:a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items()if k!='products'},ensure_ascii=False))
raise SystemExit(1 if errors else 0)
