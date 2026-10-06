import re
from pathlib import Path
R = Path(r"C:\Users\pc1ag\shopcarta")

def preco_produto(base, pasta):
    f = R/base/"produtos"/pasta/"index.html"
    if not f.is_file(): return None
    t = f.read_text(encoding="utf-8")
    m = re.search(r'text-2xl font-bold leading-none[^>]*>\s*R\$ ?([\d.,]+)', t)
    if not m: return None
    return float(m.group(1).replace(".","").replace(",","."))

for base in ("loja","back2"):
    t = (R/base/"index.html").read_text(encoding="utf-8")
    print(f"\n{'='*74}\n{base}/index.html\n{'='*74}")
    print(f"{'PRODUTO':-<26s} {'CARD':>9s} {'OCULTO':>9s} {'PAGINA':>9s}  situacao")
    for m in re.finditer(r"<article\b.*?</article>", t, re.S):
        c = m.group(0)
        hr = re.findall(r'href="produtos/([^"/]+)', c) + re.findall(r"location\.href='produtos/([^'/]+)", c)
        if not hr: continue
        pasta = hr[0]
        h3 = re.search(r"<h3[^>]*>(.*?)</h3>", c, re.S)
        tit = re.sub(r"\s+"," ",h3.group(1)).strip()[:24] if h3 else pasta
        pe = re.search(r'text-\[18px\] font-bold[^>]*>R\$\s*([\d.,]+)<', c)
        ph = re.search(r'name="preco"\s+value="([^"]*)"', c)
        card = float(pe.group(1).replace(".","").replace(",",".")) if pe else None
        oc   = float(ph.group(1)) if ph and ph.group(1) else None
        pg   = preco_produto(base, pasta)
        flags = []
        if card is not None and pg is not None and abs(card-pg) > .01: flags.append("card!=pagina")
        if oc   is not None and pg is not None and abs(oc-pg)   > .01: flags.append("oculto!=pagina")
        if pg is None: flags.append("sem pagina")
        print(f"{tit:-<26s} {card if card is not None else '-':>9} {oc if oc is not None else '-':>9} {pg if pg is not None else '-':>9}  {', '.join(flags) or 'ok'}")
