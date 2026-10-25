"""Dựng dữ liệu từ vựng A1–B1 từ bộ English Vocabulary Profile (reference/English_Profile_Vocabulary.apkg).
Chạy: python3 scripts/build-vocab.py   (cần tệp apkg trong reference/, không commit tệp đó ra ngoài kho riêng).
Chỉ giữ từ đơn có định nghĩa và ít nhất một câu ví dụ chứa đúng từ đó (dạng nguyên mẫu hoặc biến cách thường gặp)."""
import html, json, re, sqlite3, tempfile, zipfile, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src/content/vocab/en")
KEEP = {"A1": "a1", "A2": "a2", "B1": "b1", "B2": "b2"}
import sys
ONLY = set(sys.argv[1:])  # ví dụ: python3 scripts/build-vocab.py b2 (chỉ dựng cấp b2, các cấp khác giữ nguyên)
POS_MAP = {"noun": "noun", "verb": "verb", "adjective": "adjective", "adverb": "adverb"}

def clean(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s)

def field(text, name, stop):
    m = re.search(rf"{name}:\s*(.*?)\s*(?:{stop}|$)", text, re.S)
    return m.group(1).strip() if m else ""

tmp = tempfile.mkdtemp()
with zipfile.ZipFile(os.path.join(ROOT, "reference/English_Profile_Vocabulary.apkg")) as z:
    z.extract("collection.anki21", tmp)
con = sqlite3.connect(os.path.join(tmp, "collection.anki21"))
rows = collections.defaultdict(list)
seen = collections.Counter()
for (flds,) in con.execute("select flds from notes"):
    front, back = flds.split("\x1f")[:2]
    f, b = clean(front), clean(back)
    word = field(f, "Word", "Pronunciation:")
    pos = field(f, "Part of Speech", "Level:").split(":")[0].strip().lower()
    level = field(f, "Level", r"\[sound|$").split("\n")[0].strip()
    if level not in KEEP or pos not in POS_MAP or not re.fullmatch(r"[a-z]+", word):
        continue
    d = field(b, "Definition", "Dictionary Examples:|Learner Examples:")
    ex_block = field(b, "Dictionary Examples", "Learner Examples:")
    exs = [re.sub(r"^\d+\.\s*", "", l).strip() for l in ex_block.split("\n") if l.strip()]
    stem = word[:-1] if word.endswith("e") else word
    forms = re.compile(rf"\b{re.escape(stem)}(?:e|es|s|ed|d|ing|ly|er|est)?\b", re.I)
    exs = [e for e in exs if 12 <= len(e) <= 110 and len(e.split()) >= 3 and forms.search(e)]
    if not d or len(d) > 140 or re.search(rf"\b{re.escape(word)}\b", d, re.I) or not exs:
        continue
    seen[(word, pos)] += 1
    rows[KEEP[level]].append({"id": f"v-{word}-{POS_MAP[pos]}-{seen[(word, pos)]}", "word": word, "pos": POS_MAP[pos], "def": d, "ex": exs[:2]})
os.makedirs(OUT, exist_ok=True)
for lv, items in rows.items():
    if ONLY and lv not in ONLY:
        continue
    items.sort(key=lambda x: x["word"])
    path = os.path.join(OUT, f"{lv}.json")
    if os.path.exists(path):  # giữ nghĩa tiếng Việt (vi) đã soạn
        old = {x["id"]: x.get("vi") for x in json.load(open(path))}
        for it in items:
            if old.get(it["id"]): it["vi"] = old[it["id"]]
    with open(os.path.join(OUT, f"{lv}.json"), "w") as fh:
        json.dump(items, fh, ensure_ascii=False, indent=0)
        fh.write("\n")
    print(lv, len(items), collections.Counter(i["pos"] for i in items))
