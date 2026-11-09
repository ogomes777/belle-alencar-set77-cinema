# CÂMERA E GEOMETRIA COERENTES
Modelo: centro da cena alinhado à posição inicial do visitante. Viewport não é igual a mundo; usar escala definida. Ambiente separado em rua/shopping, fachada, vidro, interior, araras, piso, teto, fundo. Cada plano tem z real; dolly move camera.position.z, não faz scale() no fundo.
Shot A: 50mm equivalent, câmera h=1.62m, frente da loja, plano estacionário, logo lendo de primeira.
Shot B: dolly aproxima de 3.2m da fachada para 0.6m, easing desacelerado, portas reveladas antes da travessia.
Shot C: atravessar limiar e fazer rack focus no rail de vestidos sem salto.
Shot D: manter referência do look selecionado ao aproximar; asset/malha compartilhado com a cena de tecido.
Shot E: quando produto aparece como card, usar shared element FLIP para garantir continuidade entre palco e catálogo.
Limitar dolly no mobile. Reduced-motion mostra frame estático coerente e permite skip. Nunca alterar scroll input ou reter o usuário.
Implementação deve medir LOD, draw calls, FPS e limitar DPR em 1–1.5 em aparelhos modestos.
