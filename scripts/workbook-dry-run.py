import openpyxl, json, re, sys, collections
wb=openpyxl.load_workbook('/mnt/user-uploads/DOSE_APP.xlsx',data_only=True)
def rows(name):
    ws=wb[name]; it=list(ws.iter_rows(values_only=True))
    hdr=[h for h in it[0]]
    out=[]
    for i,r in enumerate(it[1:],2):
        if not any(c not in (None,'') for c in r): continue
        out.append((i,{hdr[j]:r[j] for j in range(len(hdr)) if hdr[j] is not None}))
    return out
err=[]
def t(v): return None if v is None or (isinstance(v,str) and v.strip()=='') else (v if isinstance(v,str) else (str(int(v)) if isinstance(v,float) and v.is_integer() else str(v)))
def num(v): return None if v in (None,'') else float(v)
items={}
for i,r in rows('العناصر'):
    k=t(r['id']); typ=t(r['النوع (food / supplement / otc)'])
    if k in items: err.append(f'item dup {k}')
    if typ not in ('food','supplement','otc'): err.append(f'item type {k} {typ}')
    items[k]=dict(source_key=k,name_en=t(r['الاسم بالإنجليزي']),name_ar=t(r['بالعربي']),item_type=typ)
meds={}
for i,r in rows('الأدوية'):
    k=t(r['id'])
    if k in meds: err.append(f'med dup {k}')
    meds[k]=dict(source_key=k,source_row_no=num(r['م']),generic_name=t(r['الاسم العلمي']),name_ar=t(r['الاسم بالعربي']),
      brand_examples_text=t(r['الاسم التجاري (أمثلة، تحقق منها)']),drug_class_ar=t(r['الفئة']),indication_ar=t(r['الاستخدام']),
      timing_ar=t(r['وقت الأخذ المقترح']),time_of_day_code=t(r['time_of_day']),meal_ar=t(r['مع أو بدون أكل']),meal_rule_code=t(r['meal_rule']),
      notes_ar=t(r['ملاحظات التوقيت والتعارض']),reference_text=t(r['المرجع']),evidence_status_ar=t(r['حالة المعلومات']),
      evidence_status_code=t(r['status_code']),pharmacist_reviewed_ar=t(r['راجعه الصيدلي؟']),reviewer_text=t(r['اسم المراجع والتاريخ']))
    if not meds[k]['generic_name']: err.append(f'med no name {k}')
brands=[];seen=set()
for i,r in rows('الأسماء_التجارية'):
    d=t(r['drug_id']);b=t(r['الاسم التجاري'])
    if d not in meds: err.append(f'brand unknown drug {d} row {i}')
    if (d,b) in seen: err.append(f'brand dup {d} {b}')
    seen.add((d,b)); brands.append(dict(med=d,brand_name=b,source_row_no=i))
for k,m in meds.items(): m['brand_names']=[b['brand_name'] for b in brands if b['med']==k]
LV={'تجنب':'avoid','انتبه':'caution'}
food=[]
for i,r in rows('تعارض_أكل'):
    d=t(r['drug_id']);it=t(r['item_id']);sev=t(r['الخطورة'])
    if d not in meds: err.append(f'food unknown drug {d}')
    if it not in items: err.append(f'food unknown item {it}')
    if sev not in LV or LV[sev]!=t(r['severity_code']): err.append(f'food sev row {i} {sev}')
    desc=t(r['ملاحظة']); rec=t(r['التوصية'])
    if not desc or not rec: err.append(f'food empty text row {i}')
    food.append(dict(source_key=f'{d} + {it}',source_row_no=num(r['م']),med=d,item=it,food_or_beverage=t(r['الأكل أو المكمل']),
      interaction_description=desc,recommendation=rec,drug_name_ar=t(r['الدواء بالعربي']),action_level_ar=sev,action_level=LV.get(sev),
      reference_text=t(r['المرجع']),gap_text_ar=t(r['الفاصل الزمني في التطبيق']),gap_minutes=num(r['gap_minutes']),gap_side=t(r['gap_side']),
      note_ar=desc,evidence_status_ar=t(r['حالة المعلومات']),evidence_status_code=t(r['status_code']),pharmacist_reviewed_ar=t(r['راجعه الصيدلي؟']),
      conflict_group=num(r['conflict_group']),counts_once=None if r['counts_once'] in (None,'') else int(r['counts_once']),excel_row=i))
ddi=[];pairs=set()
for i,r in rows('تعارض_دواء'):
    a=t(r['drug_a_id']);b=t(r['drug_b_id']);sev=t(r['الخطورة'])
    if a not in meds: err.append(f'ddi unknown a {a} row {i}')
    bm=b in meds; bi=b in items
    if bm==bi: err.append(f'ddi second party unresolved/ambiguous {b} row {i}')
    pk=(frozenset((a,b)),bi)
    if pk in pairs: err.append(f'ddi dup pair {a} {b} row {i}')
    pairs.add(pk)
    if sev not in LV or LV[sev]!=t(r['severity_code']): err.append(f'ddi sev row {i} {sev}')
    desc=t(r['ملاحظة']); rec=t(r['التوصية'])
    if not desc or not rec: err.append(f'ddi empty text row {i}')
    ddi.append(dict(source_key=f'{a} + {b}',source_row_no=num(r['م']),a=a,b=b,b_is_item=bi,interaction_description=desc,recommendation=rec,
      drug_a_ar=t(r['أ بالعربي']),drug_b_en=t(r['الدواء ب']),drug_b_ar=t(r['ب بالعربي']),action_level_ar=sev,action_level=LV.get(sev),
      reference_text=t(r['المرجع']),gap_text_ar=t(r['الفاصل الزمني في التطبيق']),gap_minutes=num(r['gap_minutes']),gap_side=t(r['gap_side']),
      note_ar=desc,evidence_status_ar=t(r['حالة المعلومات']),evidence_status_code=t(r['status_code']),pharmacist_reviewed_ar=t(r['راجعه الصيدلي؟']),
      conflict_group=num(r['conflict_group']),counts_once=None if r['counts_once'] in (None,'') else int(r['counts_once']),excel_row=i))
# sources sheet
ws=wb['مصادر السجلات']; allr=list(ws.iter_rows(values_only=True))
refs={};links=[];appendix=[];inapp=False
for i,r in enumerate(allr[1:],2):
    if not any(c not in (None,'') for c in r): continue
    if not inapp and isinstance(r[0],str) and r[0].startswith('ملحق'): inapp=True
    if inapp:
        appendix.append(dict(sheet='مصادر السجلات',excel_row=i,cells=[t(c) for c in r])); continue
    code=t(r[3]); ref=dict(code=code,title=t(r[4]),organization_or_authors=t(r[5]),published_text=t(r[6]),url_or_doi=t(r[7]))
    if code in refs and refs[code]!=ref: err.append(f'ref inconsistent {code} row {i}')
    if not ref['title']: err.append(f'ref no title {code}')
    refs.setdefault(code,ref)
    sheet=t(r[0]);key=t(r[2])
    links.append(dict(sheet=sheet,excel_row=int(r[1]),record_key=key,code=code,section=t(r[8]),support_note=t(r[9])))
recrows={('الأدوية',None)}
valid={('الأدوية',k) for k in meds}|{('تعارض_أكل',f['source_key']) for f in food}|{('تعارض_دواء',d['source_key']) for d in ddi}
rowmap={('الأدوية',2+n):None for n in range(0)}
for l in links:
    if l['sheet'] not in ('الأدوية','تعارض_أكل','تعارض_دواء'): err.append(f"link sheet {l['sheet']}")
lk=collections.Counter((l['sheet'],l['excel_row'],l['record_key'],l['code']) for l in links)
for k,c in lk.items():
    if c>1: err.append(f'link dup {k}')
tasks=[]
for i,r in rows('مراجعة الصيدلي'):
    tasks.append(dict(excel_row=i,priority=t(r['الأولوية']),sheet=t(r['الورقة']),record_excel_row=None if r['صف Excel'] is None else int(r['صف Excel']),
      record_key=t(r['معرّف السجل / الزوج']),evidence_status=t(r['حالة الأدلة']),required_decision=t(r['القرار المطلوب']),review_status=t(r['حالة المراجعة'])))
exp=dict(meds=18,items=15,brands=179,food=14,ddi=36)
got=dict(meds=len(meds),items=len(items),brands=len(brands),food=len(food),ddi=len(ddi))
for k in exp:
    if exp[k]!=got[k]: err.append(f'count {k} {got[k]}!={exp[k]}')
data=dict(items=list(items.values()),meds=list(meds.values()),brands=brands,food=food,ddi=ddi,refs=list(refs.values()),links=links,tasks=tasks,appendix=appendix)
json.dump(data,open('/tmp/imp/data.json','w'),ensure_ascii=False)
print(json.dumps(dict(counts=got,refs=len(refs),links=len(links),tasks=len(tasks),appendix=len(appendix),ddi_item_rows=sum(d['b_is_item'] for d in ddi),errors=err),ensure_ascii=False,indent=1))
