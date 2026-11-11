from urllib.request import Request, urlopen
from pathlib import Path
from datetime import date
from html import unescape
import re, json, sys
root=Path(__file__).resolve().parents[1]
source="https://bambulab-eu.myshopify.com/de/pages/bambu-filament"
try:
    request=Request(source,headers={"User-Agent":"Mozilla/5.0 Musterteil-Student-Reference/1.0"})
    with urlopen(request,timeout=25) as resp: html=resp.read(2000000).decode("utf-8","replace")
    text=re.sub(r"\s+"," ",unescape(re.sub(r"<[^>]*>"," ",html)))
    items={}
    for key,label in {"abs":"ABS","pla":"PLA Basic","petg":"PETG HF"}.items():
        match=re.search(r"\b"+re.escape(label)+r"\s+With Spool\s+€\s*(\d{1,2}[,.]\d{2})",text,re.I)
        if not match: raise ValueError("No verified regular price for "+label)
        value=float(match.group(1).replace(",","."))
        if not 10<=value<=80:raise ValueError("Implausible price for "+label)
        items[key]=value
    path=root/"prices.json"
    old=json.loads(path.read_text(encoding="utf-8"));old.update(materials=items,verified=date.today().isoformat(),source=source)
    path.write_text(json.dumps(old,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Reference verified:",old["verified"],items)
except Exception as exc:
    print("No validated update, keep last dated snapshot:",exc,file=sys.stderr)
