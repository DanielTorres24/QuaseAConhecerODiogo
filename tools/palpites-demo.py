# Cria 9 palpites ficticios para se poder ver o ecra de estatisticas com
# dados. So para desenvolvimento — apagar antes da festa com "npm run reset".
#
# Uso: com a app a correr,  python tools/palpites-demo.py
import json
import random
import urllib.request

random.seed(7)

NOMES = ["Ana Rita", "Bruno Costa", "Carla Sousa", "Diana Melo", "Eduardo Pires",
         "Filipa Nunes", "Gonçalo Reis", "Helena Braga", "Ivo Matos"]

PERIODOS = ["Madrugada", "Manhã", "Tarde", "Noite"]
ANTES = ["Antes da data prevista", "Na data prevista", "Depois da data prevista"]
PARECE = ["Mãe", "Pai", "Uma mistura perfeita dos dois", "Vai parecer-se com alguém da família",
          "Ainda ninguém vai perceber 😂"]
CALMO = ["Muito calmo", "Relativamente calmo", "Meio-termo", "Elétrico", "Um pequeno furacão"]
FRALDAS = ["Mãe", "Pai", "50/50", "Quem estiver mais perto 😂"]

for nome in NOMES:
    respostas = {
        "birthDate": "2026-09-%02d" % random.choice([14, 17, 19, 19, 19, 21, 24]),
        "birthTime": "%02d:%02d" % (random.randint(0, 23), random.choice([0, 15, 30, 45])),
        "weightKg": "%.2f" % random.uniform(2.9, 4.1),
        "lengthCm": str(random.randint(46, 54)),
        "beforeAfter": random.choice(ANTES),
        "birthPeriod": random.choice(PERIODOS),
        "firstAction": random.choice(["Chorar", "Chorar", "Dormir", "Fazer xixi"]),
        "hairColor": random.choice(["Castanho escuro", "Castanho claro", "Loiro"]),
        "hairAmount": random.choice(["Pouco cabelo", "Quantidade normal", "Muito cabelo"]),
        "looksLikeWho": random.choice(PARECE),
        "calmOrElectric": random.choice(CALMO),
        "sleepPattern": random.choice(["Dorminhoco", "Madrugador", "Vai dormir quando lhe apetecer"]),
        "firstWord": random.choice(["mãmã", "pápá", "ão-ão"]),
        "futureJob": random.choice(["astronauta", "médico", "futebolista", "cientista"]),
        "whoChangesMost": random.choice(FRALDAS),
        "whoWakesMore": random.choice(["Mãe", "Pai", "Os dois"]),
        "firstToSpoil": random.choice(["A avó", "O avô", "A madrinha"]),
        "futureMessage": "Sê muito feliz, Diogo!",
    }

    corpo = json.dumps({"name": nome, "answers": respostas}).encode("utf-8")
    pedido = urllib.request.Request(
        "http://localhost:3000/api/submit",
        data=corpo,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(pedido, timeout=60) as resposta:
        print(nome, "->", json.loads(resposta.read().decode("utf-8")))
