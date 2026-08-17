# Extrai os bonecos do icons.png para PNG com fundo transparente.
#
# O fundo do icons.png e escuro, com um degrade suave e um brilho a volta de
# cada objecto. Cortar por luminancia nao serve — o bone e as sapatilhas sao
# azul-escuro e ficariam esburacados. GrabCut tambem nao: come o laco do
# coelho e falha no body.
#
# O que funciona e crescer uma regiao a partir das margens do recorte,
# aceitando o pixel seguinte enquanto a cor mudar pouco. Segue o degrade e
# para onde a cor muda de repente, ou seja, na silhueta. As zonas escuras
# dentro do objecto ficam intactas porque nao tocam na margem.
#
# A TOLERANCIA e por objecto: variando-a, a fraccao de fundo mantem-se
# estavel e depois salta de repente — o salto e o ponto em que o
# preenchimento rompe para dentro do objecto. Os valores abaixo estao logo
# antes do salto de cada um (o coelho e o mais sensivel: o pelo bege quase
# nao contrasta com o brilho que tem por tras).
#
# Uso:  python tools/recortar-icones.py
import os
from collections import deque

import cv2
import numpy as np
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(RAIZ), "icons.png")
OUT = os.path.join(RAIZ, "public", "icons")

PADDING = 4

# Os bonecos aparecem no ecra com 60 a 110 px; 360 px de lado maior chega
# para ecras de alta densidade e evita servir megabytes ao telemovel.
LADO_MAX = 360

# nome: (caixa generosa, tolerancia)
REGIOES = {
    "sapatilhas": ((10, 10, 505, 495), 26),
    "laco":       ((530, 120, 960, 420), 26),
    "body":       ((966, 10, 1524, 625), 26),
    # O bone e azul-escuro como o fundo, por isso rompe muito cedo.
    "bone":       ((95, 545, 620, 968), 10),
    "coelho":     ((706, 412, 1168, 1022), 18),
}


def mascara_do_objecto(tile, tolerancia):
    rgb = tile.convert("RGB")
    largura, altura = rgb.size
    px = rgb.load()

    fundo = bytearray(largura * altura)
    fila = deque()

    def semear(x, y):
        i = y * largura + x
        if not fundo[i]:
            fundo[i] = 1
            fila.append((x, y))

    for x in range(largura):
        semear(x, 0)
        semear(x, altura - 1)
    for y in range(altura):
        semear(0, y)
        semear(largura - 1, y)

    while fila:
        x, y = fila.popleft()
        r, g, b = px[x, y]
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < largura and 0 <= ny < altura):
                continue
            i = ny * largura + nx
            if fundo[i]:
                continue
            nr, ng, nb = px[nx, ny]
            if abs(nr - r) + abs(ng - g) + abs(nb - b) <= tolerancia:
                fundo[i] = 1
                fila.append((nx, ny))

    frente = np.frombuffer(bytes(0 if v else 255 for v in fundo), dtype=np.uint8)
    frente = frente.reshape((altura, largura)).copy()

    # So a maior mancha ligada: e assim que caem os pedacos de objectos
    # vizinhos apanhados na caixa (o coelho no recorte do body, por exemplo).
    total, etiquetas, estatisticas, _ = cv2.connectedComponentsWithStats(frente, 8)
    if total > 1:
        maior = 1 + int(np.argmax(estatisticas[1:, cv2.CC_STAT_AREA]))
        frente = np.where(etiquetas == maior, 255, 0).astype(np.uint8)

    alfa = Image.fromarray(frente, mode="L")
    # Encolhe um pixel (o bordo traz cor do fundo) e suaviza o recorte.
    alfa = alfa.filter(ImageFilter.MinFilter(3))
    alfa = alfa.filter(ImageFilter.GaussianBlur(0.6))
    return alfa


def aparar(img, padding=PADDING):
    caixa = img.split()[-1].getbbox()
    if not caixa:
        return img
    esq, topo, dir_, baixo = caixa
    return img.crop((
        max(0, esq - padding),
        max(0, topo - padding),
        min(img.width, dir_ + padding),
        min(img.height, baixo + padding),
    ))


def reduzir(img, lado_max=LADO_MAX):
    maior = max(img.size)
    if maior <= lado_max:
        return img
    escala = lado_max / float(maior)
    novo = (max(1, round(img.width * escala)), max(1, round(img.height * escala)))
    return img.resize(novo, Image.LANCZOS)


if not os.path.isdir(OUT):
    os.makedirs(OUT)

fonte = Image.open(SRC).convert("RGB")

print("%-12s %-12s %s" % ("ficheiro", "dimensoes", "tamanho"))
for nome, (caixa, tolerancia) in REGIOES.items():
    tile = fonte.crop(caixa)
    recorte = tile.convert("RGBA")
    recorte.putalpha(mascara_do_objecto(tile, tolerancia))
    recorte = reduzir(aparar(recorte))

    caminho = os.path.join(OUT, nome + ".png")
    recorte.save(caminho, optimize=True)
    print("%-12s %4d x %-5d %7.1f KB" % (nome + ".png", recorte.width, recorte.height,
                                         os.path.getsize(caminho) / 1024.0))
