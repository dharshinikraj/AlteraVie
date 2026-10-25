"""Official CDC NHANES training-data loader. No synthetic rows are permitted."""
from __future__ import annotations
import os, time, urllib.request
from typing import Dict
import numpy as np
import pandas as pd
FEATURE_COLUMNS=["age","gender","bmi"]
TARGET_COLUMNS=["iron","vitamin_d","calcium","vitamin_b12","protein"]
CLINICAL_THRESHOLDS={"iron":30.0,"vitamin_d":20.0,"calcium":8.5,"vitamin_b12":200.0,"protein":3.5}
DATA_DIR=os.path.join(os.path.dirname(__file__),"data")
NHANES_2017={"demo":("DEMO_J.xpt","2017-2018"),"body":("BMX_J.xpt","2017-2018"),"ferritin":("FERTIN_J.xpt","2017-2018"),"vit_d":("VID_J.xpt","2017-2018"),"biochem":("BIOPRO_J.xpt","2017-2018")}
NHANES_2013={"demo":("DEMO_H.xpt","2013-2014"),"body":("BMX_H.xpt","2013-2014"),"b12":("VITB12_H.xpt","2013-2014")}
def _urls(filename,cycle):
    y=cycle[:4]; return [f"https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/{y}/DataFiles/{filename}",f"https://wwwn.cdc.gov/Nchs/NHanes/{cycle}/{filename}"]
def _path(filename): return os.path.join(DATA_DIR,filename)
def _is_xpt(path):
    if not os.path.exists(path) or os.path.getsize(path)<1024:return False
    try:
        h=open(path,"rb").read(256).upper(); return b"HEADER RECORD" in h and b"<HTML" not in h and b"<!DOCTYPE" not in h
    except OSError:return False
def _download(filename,cycle,label):
    os.makedirs(DATA_DIR,exist_ok=True); path=_path(filename)
    if os.path.exists(path) and not _is_xpt(path):
        try:os.remove(path)
        except OSError:pass
    errors=[]
    if not _is_xpt(path):
        for url in _urls(filename,cycle):
            for attempt in range(2):
                tmp=path+".part"
                try:
                    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; AlteraVie/2.3)","Accept":"application/octet-stream,*/*"})
                    with urllib.request.urlopen(req,timeout=60) as r,open(tmp,"wb") as out:out.write(r.read())
                    if _is_xpt(tmp):os.replace(tmp,path);break
                    errors.append(f"{url}: not XPT")
                except Exception as exc:errors.append(f"{url}: {exc}")
                finally:
                    if os.path.exists(tmp) and not _is_xpt(tmp):
                        try:os.remove(tmp)
                        except OSError:pass
                time.sleep(.5*(attempt+1))
            if _is_xpt(path):break
    if not _is_xpt(path):raise RuntimeError(f"Could not download official CDC NHANES {label} ({filename}). Manually download {filename} from the CDC {cycle} data page into {DATA_DIR}. Details: {' | '.join(errors[-4:])}")
    try:return pd.read_sas(path,format="xport")
    except Exception as exc:raise RuntimeError(f"Could not parse {path}: {exc}") from exc
def _require(df,cols,label):
    missing=[c for c in cols if c not in df.columns]
    if missing:raise RuntimeError(f"{label} missing expected columns: {', '.join(missing)}")
def _base(demo,body,cycle):
    _require(demo,["SEQN","RIDAGEYR","RIAGENDR"],f"DEMO {cycle}");_require(body,["SEQN","BMXBMI"],f"BMX {cycle}")
    m=demo.merge(body,on="SEQN",how="inner"); f=pd.DataFrame(index=m.index); f["SEQN"]=pd.to_numeric(m.SEQN,errors="coerce");f["age"]=pd.to_numeric(m.RIDAGEYR,errors="coerce");g=pd.to_numeric(m.RIAGENDR,errors="coerce");f["gender"]=np.where(g==2,1.0,np.where(g==1,0.0,np.nan));f["bmi"]=pd.to_numeric(m.BMXBMI,errors="coerce");return f
def _final(base,lab,col,target,transform=None):
    _require(lab,["SEQN",col],target);j=base.merge(lab[["SEQN",col]],on="SEQN",how="inner");v=pd.to_numeric(j[col],errors="coerce");v=transform(v) if transform else v;o=j[FEATURE_COLUMNS].copy();o[target]=(v<CLINICAL_THRESHOLDS[target]).astype(float);valid=pd.concat([o,v.rename("_lab")],axis=1).dropna();
    if len(valid)<100:raise RuntimeError(f"Only {len(valid)} complete real NHANES rows for {target}; refusing to train.")
    return valid[FEATURE_COLUMNS+[target]].astype(float)
def _load(group):return {k:_download(fn,cy,f"{cy} {k}") for k,(fn,cy) in group.items()}
def build_target_datasets()->Dict[str,pd.DataFrame]:
    d17=_load(NHANES_2017);b17=_base(d17["demo"],d17["body"],"2017-2018")
    out={"iron":_final(b17,d17["ferritin"],"LBXFER","iron"),"vitamin_d":_final(b17,d17["vit_d"],"LBXVIDMS","vitamin_d",lambda s:s/2.497),"calcium":_final(b17,d17["biochem"],"LBXSCA","calcium"),"protein":_final(b17,d17["biochem"],"LBXSAL","protein")}
    d13=_load(NHANES_2013);b13=_base(d13["demo"],d13["body"],"2013-2014");out["vitamin_b12"]=_final(b13,d13["b12"],"LBDB12","vitamin_b12");return out
def build_nhanes_clinical_dataset():raise RuntimeError("Use build_target_datasets(); B12 and the other labs are released in different NHANES cycles.")
