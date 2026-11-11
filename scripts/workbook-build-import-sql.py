import json;d=json.load(open('data.json'))
def q(v):
    if v is None: return 'NULL'
    if isinstance(v,bool): return 'true' if v else 'false'
    if isinstance(v,(int,float)): return repr(v)
    if isinstance(v,list): return 'ARRAY['+','.join(q(x) for x in v)+']::text[]' if v else "'{}'::text[]"
    return "'"+str(v).replace("'","''")+"'"
S=[]
def ins(table,row,conflict,upd=True):
    cols=list(row); vals=[row[c] for c in cols]
    set_=', '.join(f'{c}=EXCLUDED.{c}' for c in cols if c not in conflict.split(','))
    S.append(f'INSERT INTO public.{table} ({",".join(cols)}) VALUES ({",".join((v if isinstance(v,R) else q(v)) for v in vals)}) ON CONFLICT ({conflict}) DO UPDATE SET {set_};')
def sub(t,k): return f"(SELECT id FROM public.{t} WHERE source_key={q(k)})"
class R(str): pass
for r in d['refs']: ins('"references"',r,'code')
for r in d['items']: ins('interaction_items',r,'source_key')
for m in d['meds']:
    m=dict(m); m['active_ingredients']=[m['generic_name']]; ins('medications',m,'source_key')
for b in d['brands']:
    ins('medication_brand_names',dict(medication_id=R(sub('medications',b['med'])),brand_name=b['brand_name'],source_row_no=b['source_row_no']),'medication_id,brand_name')
for f in d['food']:
    f=dict(f); med=f.pop('med'); it=f.pop('item'); f.pop('excel_row')
    f=dict(medication_id=R(sub('medications',med)),item_id=R(sub('interaction_items',it)),**f); ins('drug_food_interactions',f,'source_key')
for x in d['ddi']:
    x=dict(x); a=x.pop('a'); b=x.pop('b'); bi=x.pop('b_is_item'); x.pop('excel_row')
    x=dict(medication_1_id=R(sub('medications',a)),medication_2_id=None if bi else R(sub('medications',b)),item_2_id=R(sub('interaction_items',b)) if bi else None,**x)
    ins('drug_drug_interactions',x,'source_key')
for l in d['links']:
    l=dict(l); c=l.pop('code'); l['reference_id']=R(f'(SELECT id FROM public."references" WHERE code={q(c)})')
    ins('record_references',l,'sheet,excel_row,record_key,reference_id')
for t in d['tasks']: ins('review_tasks',t,'excel_row')
for a in d['appendix']:
    S.append(f"INSERT INTO public.source_appendix (sheet,excel_row,cells) VALUES ({q(a['sheet'])},{a['excel_row']},{q(json.dumps(a['cells'],ensure_ascii=False))}::jsonb) ON CONFLICT (sheet,excel_row) DO UPDATE SET cells=EXCLUDED.cells;")
open('import.sql','w').write('DO $imp$ BEGIN\n'+'\n'.join(S)+'\nEND $imp$;\n')
print(len(S))
