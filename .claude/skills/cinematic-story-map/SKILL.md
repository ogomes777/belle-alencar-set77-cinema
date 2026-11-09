---
name: cinematic-story-map
description: Storyboard narrativo de 12 atos. Ative esta skill ao implementar ou revisar componentes relacionados.
---
# Storyboard narrativo de 12 atos

## Objetivo
Planejar cena→emoção→ação→CTA→técnica→asset→fallback. Demonstrar continuidade de câmera entre seções.

## Passos
1. Ler CLAUDE.md, knowledge/MOTION_ATLAS_371.md e os docs do capítulo envolvido.
2. Detectar recursos reais disponíveis e estado atual da implementação; não pressupor que existe GLB, acervo oficial ou backend.
3. Propor efeito/cena ligado à narrativa, com progress, entrada, estado, saída e modo essencial.
4. Implementar isoladamente com fallback e teardown. Sem bloquear a compra.
5. Testar 390x844 e 1440x900, teclado, touch, reduced-motion e ausência de erro.
6. Registrar evidência e item de QA; sem declarar status falso.

## Entregáveis
Código versionado, teste de regressão, screenshots/vídeo quando possível, relatório de performance e pendências.
