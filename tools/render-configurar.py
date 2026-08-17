# Configura o servico no Render pela API, sem passar pelo dashboard.
#
# Faz, por esta ordem:
#   1. encontra o web service e a base de dados Postgres da conta
#   2. le a Internal Connection String da base de dados
#   3. define DATABASE_URL no servico (preservando as outras variaveis)
#   4. poe o startCommand a correr as migracoes antes de arrancar
#   5. dispara um deploy e espera que fique live
#   6. confirma o estado em /api/health?db=1
#
# A chave NAO se passa por argumento (ficaria no historico da shell nem na
# lista de processos). Le-se da variavel de ambiente RENDER_API_KEY ou de um
# ficheiro indicado em RENDER_API_KEY_FILE.
#
# Uso:
#   $env:RENDER_API_KEY_FILE = "C:\...\render-key.txt"
#   python tools/render-configurar.py
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.render.com/v1"
START_COMMAND = "npm run migrate && npm run start"
SITE = os.environ.get("RENDER_SITE_URL", "https://quaseaconhecerodiogo.onrender.com")


def ler_chave():
    chave = os.environ.get("RENDER_API_KEY", "").strip()
    if not chave:
        caminho = os.environ.get("RENDER_API_KEY_FILE", "").strip()
        if caminho and os.path.isfile(caminho):
            with open(caminho, encoding="utf-8") as f:
                chave = f.read().strip()
    if not chave:
        sys.exit("Falta a chave: define RENDER_API_KEY ou RENDER_API_KEY_FILE.")
    return chave


CHAVE = ler_chave()


def pedir(metodo, caminho, corpo=None):
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    pedido = urllib.request.Request(API + caminho, data=dados, method=metodo)
    pedido.add_header("Authorization", "Bearer " + CHAVE)
    pedido.add_header("Accept", "application/json")
    if dados:
        pedido.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(pedido, timeout=90) as resposta:
            texto = resposta.read().decode("utf-8")
            return json.loads(texto) if texto else None
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")
        sys.exit("%s %s falhou: HTTP %s %s" % (metodo, caminho, erro.code, detalhe[:400]))


def desembrulhar(lista):
    """A API devolve [{'service': {...}}] ou [{...}] conforme o endpoint."""
    saida = []
    for item in lista or []:
        if isinstance(item, dict) and len(item) <= 2:
            for chave in ("service", "postgres", "envVar", "cursor"):
                if chave in item and isinstance(item[chave], dict):
                    saida.append(item[chave])
                    break
            else:
                saida.append(item)
        else:
            saida.append(item)
    return saida


def mascarar(texto, visivel=12):
    if not texto:
        return "(vazio)"
    return texto[:visivel] + "…" + ("(%d caracteres)" % len(texto))


print("== 1. servicos ==")
servicos = desembrulhar(pedir("GET", "/services?limit=50"))
webs = [s for s in servicos if s.get("type") == "web_service"]
for s in servicos:
    print("   %-14s %-26s %s" % (s.get("type"), s.get("name"), s.get("id")))

if not webs:
    sys.exit("Nenhum web service na conta.")
servico = webs[0] if len(webs) == 1 else next((s for s in webs if "diogo" in (s.get("name") or "").lower()), webs[0])
print("   -> escolhido:", servico.get("name"), servico.get("id"))

print("== 2. base de dados ==")
bases = desembrulhar(pedir("GET", "/postgres?limit=50"))
for b in bases:
    print("   %-26s %-10s %s" % (b.get("name"), b.get("status"), b.get("id")))

if not bases:
    sys.exit("Nao ha nenhuma base de dados Postgres na conta. Cria uma (o plano gratuito so permite uma).")

base = bases[0] if len(bases) == 1 else next((b for b in bases if "diogo" in (b.get("name") or "").lower()), bases[0])
ligacao = pedir("GET", "/postgres/%s/connection-info" % base.get("id"))
interna = (ligacao or {}).get("internalConnectionString") or (ligacao or {}).get("internalConnectionString".lower())
if not interna:
    sys.exit("Nao consegui a Internal Connection String: " + json.dumps(ligacao)[:300])
print("   -> %s  %s" % (base.get("name"), mascarar(interna)))

print("== 3. variaveis de ambiente ==")
atuais = desembrulhar(pedir("GET", "/services/%s/env-vars?limit=100" % servico.get("id")))
mapa = {v.get("key"): v.get("value") for v in atuais if v.get("key")}
print("   antes:", ", ".join(sorted(mapa)) or "(nenhuma)")

mapa["DATABASE_URL"] = interna
mapa.setdefault("NODE_ENV", "production")

corpo = [{"key": k, "value": v} for k, v in sorted(mapa.items())]
pedir("PUT", "/services/%s/env-vars" % servico.get("id"), corpo)
print("   depois:", ", ".join(sorted(mapa)))

print("== 4. start command ==")
pedir("PATCH", "/services/%s" % servico.get("id"),
      {"serviceDetails": {"envSpecificDetails": {"startCommand": START_COMMAND}}})
print("   ->", START_COMMAND)

print("== 5. deploy ==")
deploy = pedir("POST", "/services/%s/deploys" % servico.get("id"), {"clearCache": "clear"})
deploy_id = (deploy or {}).get("id")
print("   lancado:", deploy_id)

for _ in range(60):
    time.sleep(15)
    estado = pedir("GET", "/services/%s/deploys/%s" % (servico.get("id"), deploy_id))
    situacao = (estado or {}).get("status")
    print("   ...", situacao)
    if situacao in ("live", "build_failed", "update_failed", "canceled", "deactivated"):
        break

print("== 6. verificacao ==")
try:
    with urllib.request.urlopen(SITE + "/api/health?db=1", timeout=60) as r:
        print("   ", r.status, r.read().decode("utf-8")[:300])
except urllib.error.HTTPError as e:
    print("   ", e.code, e.read().decode("utf-8", "replace")[:300])
