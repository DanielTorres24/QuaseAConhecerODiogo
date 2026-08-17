# Converte o Convite.jpeg num PNG com o fundo branco removido e, a partir
# desse PNG, extrai os bonecos usados na aplicacao.
#
# Duas fases, para que nada saia cortado:
#   1. remocao do fundo por rampa de luminancia
#        luminancia >= HI -> transparente
#        luminancia <= LO -> opaco
#        entre as duas    -> alfa proporcional (bordo suave, sem halo)
#   2. recorte por caixa generosa e depois APARA ate a caixa real do
#      desenho (bbox do canal alfa). E a apara que garante que nenhum
#      boneco fica cortado e que nao sobra margem transparente.
#
# Uso:  python tools/recortar-convite.py
import os
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(RAIZ), "Convite.jpeg")
OUT = os.path.join(RAIZ, "public", "convite")

HI = 250.0
LO = 232.0

# Margem de seguranca a volta de cada boneco depois da apara.
PADDING = 4

# Caixas generosas: podem sobrar fundo, a apara trata disso. O que nao
# podem e cortar o desenho nem apanhar o vizinho do lado.
REGIOES = {
    # O limite esquerdo evita o laco azul pendurado na corda; o inferior
    # do body evita uns riscos soltos do desenho original.
    "sapatinhos": (122, 468, 280, 682),
    "gorro":      (282, 468, 415, 676),
    "body":       (438, 478, 668, 742),
    # O coelho encosta a corda do estendal; incluimos a mola, que fica bem.
    "coelho":     (694, 420, 888, 756),
    # Laco azul da ponta esquerda do estendal.
    "laco":       (66, 386, 176, 480),
    # Cantos florais: limites escolhidos para NAO apanhar as linhas
    # tracejadas das caixas de informacao do convite.
    "flores-tl":  (0, 0, 300, 262),
    "flores-br":  (920, 1216, 1024, 1492),
}


def remover_fundo(img):
    """Devolve uma copia RGBA com o branco do papel transparente."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum >= HI:
                a = 0
            elif lum <= LO:
                a = 255
            else:
                a = int(round(255 * (HI - lum) / (HI - LO)))
            px[x, y] = (r, g, b, a)
    return img


def aparar(img, padding=PADDING):
    """Corta ate a caixa real do desenho, com uma margem."""
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


convite = remover_fundo(Image.open(SRC))

completo = os.path.join(OUT, "convite.png")
convite.save(completo, optimize=True)
print("%-14s %4d x %-4d %7.1f KB" % ("convite.png", convite.width, convite.height,
                                     os.path.getsize(completo) / 1024.0))

for nome, caixa in REGIOES.items():
    peca = aparar(convite.crop(caixa))
    caminho = os.path.join(OUT, nome + ".png")
    peca.save(caminho, optimize=True)
    print("%-14s %4d x %-4d %7.1f KB" % (nome + ".png", peca.width, peca.height,
                                         os.path.getsize(caminho) / 1024.0))
