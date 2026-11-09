# VESTIDO COM VIDA | ESPECIFICAÇÃO TÉCNICA
OBJETIVO: animação realista de vestido flutuando, voando e reagindo à câmera/scroll.

## Pipeline recomendado
1. Receber roupa real oficial: fotos frente/costas/lateral, tecido, cor, medidas e autorização.
2. Modelar no Blender (mesh e UV) ou obter digital twin com caimento verdadeiro; exportar GLB/GLTF com textura compactada.
3. Rig com dobradiças/constraints, tecido em região de saia, manga e alça.
4. Simulação offline: Blender cloth/physics baked em animação, ou GPU/vertex shader controlado para movimento leve. Não gastar física completa onde não agrega.
5. Exportar LOD 0/1/2 + poster. Malha simplificada mobile, versão sem WebGL.
6. Mapear scroll em poses: repouso → despertar → separar da arara → flutuar → macro da trama → voltar a catálogo.
7. Gesto: drag/orbit com controle interrompível; não capturar scroll vertical touch.
8. Luz: 3-point suave + spots de boutique, sombra de contato, anisotropic highlights e material PBR.
9. Acompanhamento: 30+ fps no mobile alvo (ideal 60), testar iPhone/Android; fallback poster e reduced motion.
10. Vista 360 com peça REAL só após asset aprovado. Se apenas ilustração, rotular “estudo visual”.

## Gate de aprovação
Silhueta fiel, nenhuma manga teletransportando, sem explosão de textura, sem tremular em idle, sem distorção de rótulo, sombra conectada ao piso; transições frame a frame sem pop visual.
