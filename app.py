import os, json, sqlite3, math, hmac, secrets, time, hashlib, threading
from pathlib import Path
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, request, jsonify, session, redirect, send_from_directory, make_response, abort
from werkzeug.security import check_password_hash, generate_password_hash

ROOT=Path(__file__).resolve().parent
DATA=ROOT/'instance'; DATA.mkdir(exist_ok=True)
DB=DATA/'training.sqlite3'
TRAIN_LOCK=threading.RLock()
app=Flask(__name__, static_folder=None)
app.config.update(SECRET_KEY=os.environ.get('DX_SECRET_KEY') or secrets.token_hex(32), SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax', SESSION_COOKIE_SECURE=os.environ.get('DX_HTTPS','1')=='1', MAX_CONTENT_LENGTH=3*1024*1024)
PASS_HASH=os.environ.get('DX_ADMIN_PASSWORD_HASH','')
if not PASS_HASH and os.environ.get('DX_ADMIN_PASSWORD'):
    PASS_HASH=generate_password_hash(os.environ['DX_ADMIN_PASSWORD'])
BASE=json.loads((ROOT/'model.json').read_text(encoding='utf-8'))
PRIOR=BASE['w']; B0=BASE['b']

def db():
    c=sqlite3.connect(DB,timeout=30);c.row_factory=sqlite3.Row;c.execute('PRAGMA busy_timeout=30000');return c
with db() as c:
    c.execute('CREATE TABLE IF NOT EXISTS samples (id INTEGER PRIMARY KEY AUTOINCREMENT, mode TEXT NOT NULL, label INTEGER NOT NULL, features TEXT NOT NULL, snippet TEXT NOT NULL, created TEXT NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS versions (id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT NOT NULL, status TEXT NOT NULL, metrics TEXT NOT NULL, model TEXT NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS fingerprints (fingerprint TEXT PRIMARY KEY, sample_id INTEGER UNIQUE)')

def rows():
    with db() as c: return [dict(r) for r in c.execute('SELECT * FROM samples ORDER BY id')]

def clamp(x,a,b): return max(a,min(b,x))
def sigmoid(z): return 1/(1+math.exp(-clamp(z,-40,40)))
def fit(items,epochs=300):
    m={'b':dict(B0),'w':dict(PRIOR)};n=len(items)
    if not n:return m
    cn=[sum(x['label']==i for x in items) for i in (0,1)]
    weights=[n/(2*max(cn[x['label']],1)) for x in items]
    lam=.02*50/(50+n);lr=6
    for _ in range(epochs):
        gw={};gb={'text':0.,'code':0.}
        for x,sw in zip(items,weights):
            f=json.loads(x['features']);mode=x['mode']
            z=m['b'][mode]+sum(m['w'].get(k,0)*(v-.5) for k,v in f.items())
            delta=(sigmoid(z)-x['label'])*sw/n;gb[mode]+=delta
            for k,v in f.items():gw[k]=gw.get(k,0)+delta*(v-.5)
        for k in m['w']:
            m['w'][k]=clamp(m['w'][k]-lr*(gw.get(k,0)+lam*(m['w'][k]-PRIOR[k])),-15,15)
        for k in m['b']:
            m['b'][k]=clamp(m['b'][k]-lr*(gb[k]+lam*.2*(m['b'][k]-B0[k])),-5,5)
    return m

def predict(m, x):
    f=json.loads(x['features'])
    return sigmoid(m['b'][x['mode']]+sum(m['w'].get(k,0)*(v-.5) for k,v in f.items()))

def score(m, items):
    if not items:return None
    tp=fp=fn=tn=0
    for x in items:
        actual=x['label']; predicted=int(predict(m,x)>=.5)
        if actual and predicted:tp+=1
        elif not actual and predicted:fp+=1
        elif actual:fn+=1
        else:tn+=1
    precision=tp/max(tp+fp,1);recall=tp/max(tp+fn,1)
    return {'n':len(items),'accuracy':round((tp+tn)/len(items),4),'precision':round(precision,4),'recall':round(recall,4),'f1':round(2*precision*recall/max(precision+recall,1e-9),4),'human':tn+fp,'ai':tp+fn}

def fingerprint(x):
    return hashlib.sha256(json.dumps([x['mode'],x['features']],sort_keys=True,ensure_ascii=False).encode('utf-8')).hexdigest()

def rebuild(c):
    items=[dict(r) for r in c.execute('SELECT * FROM samples ORDER BY id')]
    # Stable, deterministic split: the same sample never changes partitions.
    train=[x for x in items if int(fingerprint(x)[:8],16)%5!=0]
    hold=[x for x in items if int(fingerprint(x)[:8],16)%5==0]
    # Do not claim meaningful quality on tiny or single-class holdouts.
    valid=len(hold)>=30 and len(train)>=60 and {x['label'] for x in hold}=={0,1} and {x['label'] for x in train}=={0,1}
    candidate=fit(train if valid else items)
    oldrow=c.execute('SELECT value FROM settings WHERE key=?',('model',)).fetchone()
    old=json.loads(oldrow['value']) if oldrow else BASE
    previous=score(old,hold) if valid else None
    current=score(candidate,hold) if valid else None
    # A new candidate must not degrade held-out F1 by > 0.02.
    # For small datasets, retain automatic behavior but explicitly mark unvalidated.
    promote=not valid or current['f1']+0.02>=previous['f1']
    chosen=candidate if promote else {'b':old['b'],'w':old['w']}
    h=sum(x['label']==0 for x in items)
    obj={'v':3,'updated':datetime.now(timezone.utc).isoformat(),'meta':{'n':len(items),'human':h,'ai':len(items)-h},'b':{k:round(v,6) for k,v in chosen['b'].items()},'w':{k:round(v,6) for k,v in chosen['w'].items()}}
    metrics={'validated':valid,'holdout':current,'previous':previous,'promoted':promote,'reason':('Новая модель прошла проверку' if valid and promote else 'Качество снизилось: сохранена предыдущая модель' if valid else 'Недостаточно независимых примеров для надёжной оценки')}
    c.execute('INSERT INTO versions(created,status,metrics,model) VALUES(?,?,?,?)',(obj['updated'],'published' if promote else 'rejected',json.dumps(metrics,ensure_ascii=False),json.dumps(obj,ensure_ascii=False)))
    if promote:c.execute('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',('model',json.dumps(obj,ensure_ascii=False)))
    c.execute('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',('evaluation',json.dumps(metrics,ensure_ascii=False)))
    return obj,metrics

def authorized():return session.get('admin') is True

def protected(fn):
    @wraps(fn)
    def wrapper(*a,**kw):
        if not authorized():return jsonify(error='Требуется вход администратора'),401
        if request.method not in ('GET','HEAD') and request.headers.get('X-DX-CSRF')!=session.get('csrf'):return jsonify(error='Ошибка проверки запроса'),403
        return fn(*a,**kw)
    return wrapper

@app.after_request
def headers(r):
    r.headers['X-Content-Type-Options']='nosniff';r.headers['X-Frame-Options']='DENY';r.headers['Referrer-Policy']='same-origin';r.headers['Cache-Control']='no-store' if request.path.startswith('/api/') or request.path=='/model.json' else 'public, max-age=300'
    return r

@app.route('/')
def home():return send_from_directory(ROOT,'index.html')
@app.route('/engine.js')
def engine():return send_from_directory(ROOT,'engine.js')
@app.route('/style.css')
def style():return send_from_directory(ROOT,'style.css')
@app.route('/model.json')
def model():
    with db() as c:r=c.execute('SELECT value FROM settings WHERE key=?',('model',)).fetchone()
    return jsonify(json.loads(r['value']) if r else BASE)
@app.route('/admin.html')
def old_admin():abort(404)
@app.route('/control/login',methods=['GET','POST'])
def login():
    if request.method=='GET':return send_from_directory(ROOT,'login.html')
    # Simple throttling per session; a production WAF can provide additional rate limits
    now=time.time(); attempts=session.get('attempts',[]);attempts=[x for x in attempts if now-x<900]
    if len(attempts)>=8:return jsonify(error='Слишком много попыток. Повторите позже.'),429
    supplied=str((request.get_json(silent=True) or {}).get('password',''))
    if not PASS_HASH or not check_password_hash(PASS_HASH,supplied):
        attempts.append(now);session['attempts']=attempts
        return jsonify(error='Неверный пароль'),401
    session.clear();session['admin']=True;session['csrf']=secrets.token_urlsafe(32)
    return jsonify(ok=True,csrf=session['csrf'])
@app.route('/control/console')
def console():
    if not authorized():return redirect('/control/login')
    return send_from_directory(ROOT,'console.html')
@app.route('/api/session')
@protected
def state():return jsonify(csrf=session['csrf'])
@app.route('/api/stats')
@protected
def stats():
    items=rows();h=sum(x['label']==0 for x in items)
    with db() as c:r=c.execute('SELECT value FROM settings WHERE key=?',('model',)).fetchone()
    with db() as c: ev=c.execute('SELECT value FROM settings WHERE key=?',('evaluation',)).fetchone();vers=c.execute('SELECT id,created,status,metrics FROM versions ORDER BY id DESC LIMIT 8').fetchall()
    return jsonify(evaluation=json.loads(ev['value']) if ev else None,versions=[dict(v) for v in vers],total=len(items),human=h,ai=len(items)-h,code=sum(x['mode']=='code' for x in items),model=json.loads(r['value']) if r else BASE,recent=[{'id':x['id'],'label':x['label'],'snippet':x['snippet'],'created':x['created']} for x in items[-15:][::-1]])
@app.route('/api/train',methods=['POST'])
@protected
def train():
    obj=request.get_json(silent=True) or {};samples=obj.get('samples')
    if not isinstance(samples,list) or not 1<=len(samples)<=100:return jsonify(error='Отправьте от 1 до 100 примеров'),400
    cleaned=[]
    for x in samples:
        if not isinstance(x,dict) or x.get('mode') not in ('text','code') or type(x.get('label')) is not int or x['label'] not in (0,1):return jsonify(error='Неверный тип или метка'),400
        f=x.get('features');
        if not isinstance(f,dict) or len(f)>100 or not all(k in PRIOR and type(v) in (float,int) and math.isfinite(v) and 0<=v<=1 for k,v in f.items()):return jsonify(error='Неверные признаки'),400
        cleaned.append((x['mode'],x['label'],json.dumps(f,ensure_ascii=False),str(x.get('snippet',''))[:120],datetime.now(timezone.utc).isoformat()))
    with TRAIN_LOCK, db() as c:
        added=0;skipped=0
        for mode,label,features,snippet,created in cleaned:
            fp=fingerprint({'mode':mode,'features':features})
            if c.execute('SELECT 1 FROM fingerprints WHERE fingerprint=?',(fp,)).fetchone():skipped+=1;continue
            cur=c.execute('INSERT INTO samples(mode,label,features,snippet,created) VALUES(?,?,?,?,?)',(mode,label,features,snippet,created))
            c.execute('INSERT INTO fingerprints(fingerprint,sample_id) VALUES(?,?)',(fp,cur.lastrowid));added+=1
        if added:m,ev=rebuild(c)
        else:
            row=c.execute('SELECT value FROM settings WHERE key=?',('model',)).fetchone();m=json.loads(row['value']) if row else BASE
            ev={'promoted':False,'reason':'Новых уникальных примеров нет'}
    return jsonify(ok=True,model_version=m.get('updated'),count=m['meta']['n'],added=added,skipped=skipped,evaluation=ev)
@app.route('/api/undo',methods=['POST'])
@protected
def undo():
    with TRAIN_LOCK, db() as c:
        c.execute('DELETE FROM fingerprints WHERE sample_id=(SELECT MAX(id) FROM samples)')
        c.execute('DELETE FROM samples WHERE id=(SELECT MAX(id) FROM samples)');m,ev=rebuild(c)
    return jsonify(ok=True,count=m['meta']['n'],evaluation=ev)
@app.route('/api/logout',methods=['POST'])
@protected
def logout():session.clear();return jsonify(ok=True)
@app.route('/api/backup')
@protected
def backup():return jsonify(samples=rows())
@app.route('/api/restore',methods=['POST'])
@protected
def restore():
    obj=request.get_json(silent=True) or {};samples=obj.get('samples')
    if not isinstance(samples,list) or len(samples)>10000:return jsonify(error='Некорректный бэкап'),400
    clean=[]
    for x in samples:
        if not isinstance(x,dict) or x.get('mode') not in ('text','code') or type(x.get('label')) is not int or x['label'] not in (0,1):return jsonify(error='Некорректный бэкап'),400
        try:f=json.loads(x['features']) if isinstance(x.get('features'),str) else x['features']
        except (ValueError,KeyError):return jsonify(error='Некорректные признаки'),400
        if not isinstance(f,dict) or len(f)>100 or not all(k in PRIOR and type(v) in (float,int) and math.isfinite(v) and 0<=v<=1 for k,v in f.items()):return jsonify(error='Некорректные признаки'),400
        clean.append((x['mode'],x['label'],json.dumps(f,ensure_ascii=False),str(x.get('snippet',''))[:120],str(x.get('created',''))[:50]))
    with TRAIN_LOCK, db() as c:
        c.execute('DELETE FROM fingerprints');c.execute('DELETE FROM samples')
        for mode,label,features,snippet,created in clean:
            fp=fingerprint({'mode':mode,'features':features})
            if c.execute('SELECT 1 FROM fingerprints WHERE fingerprint=?',(fp,)).fetchone():continue
            cur=c.execute('INSERT INTO samples(mode,label,features,snippet,created) VALUES(?,?,?,?,?)',(mode,label,features,snippet,created))
            c.execute('INSERT INTO fingerprints(fingerprint,sample_id) VALUES(?,?)',(fp,cur.lastrowid))
        m,ev=rebuild(c)
    return jsonify(ok=True,count=m['meta']['n'],evaluation=ev)

@app.route('/api/rollback',methods=['POST'])
@protected
def rollback():
    obj=request.get_json(silent=True) or {}
    if type(obj.get('version_id')) is not int:return jsonify(error='Укажите версию'),400
    with TRAIN_LOCK, db() as c:
        row=c.execute('SELECT model FROM versions WHERE id=? AND status=?',(obj['version_id'],'published')).fetchone()
        if not row:return jsonify(error='Версия не найдена'),404
        model=json.loads(row['model'])
        c.execute('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',('model',json.dumps(model,ensure_ascii=False)))
    return jsonify(ok=True,version_id=obj['version_id'])

if __name__=='__main__':app.run(debug=False)
