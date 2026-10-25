"""Offline integration self-test for AlteraVie.

This test deliberately mocks only external internet providers. It verifies the
real local API wiring, auth, persistence, extraction, model weights and route
contracts without creating data in the user's normal database.
"""
from __future__ import annotations
import io
import os
import tempfile
import uuid
from pathlib import Path

_tmp = tempfile.NamedTemporaryFile(prefix="alteravie-selftest-", suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"

from fastapi.testclient import TestClient
from PIL import Image
import main

c = TestClient(main.app)

def ok(name): print(f"   OK  {name}")

def assert_status(r, code=200):
    assert r.status_code == code, f"{r.request.method} {r.request.url}: {r.status_code} {r.text}"

try:
    print("1) API boot + core routes")
    r=c.get('/'); assert_status(r); ok("FastAPI root")
    paths={getattr(x,'path','') for x in main.app.routes}
    for path in ['/auth/register','/blood-report/extract','/blood-report/upload','/specialists/search','/specialists/search-place','/chat','/food-vision/predict','/live-data/foods/search','/pantry/suggest','/predict/status']:
        assert path in paths, f"Missing route: {path}"
    ok("required routes registered")

    print("2) Blood report extraction without login")
    lab=b'Serum Ferritin 18.4 ng/mL\nCalcium 8.7 mg/dL\nVitamin D, 25-Hydroxy 16.2 ng/mL\nVitamin B12 175 pg/mL\n'
    r=c.post('/blood-report/extract',files={'file':('sample-lab.txt',lab,'text/plain')});assert_status(r)
    j=r.json(); assert j['iron_level']==18.4 and j['calcium_level']==8.7 and j['vitamin_d_level']==16.2 and j['vitamin_b12_level']==175.0,j
    ok("TXT extraction")

    print("3) Authentication + persisted report")
    email=f'selftest-{uuid.uuid4().hex[:8]}@example.com'
    r=c.post('/auth/register',json={'email':email.upper(),'name':'Self Test','password':'Password123'});assert_status(r,201)
    assert r.json()['email']==email
    r=c.post('/auth/login',json={'email':email,'password':'Password123'});assert_status(r); token=r.json()['token']; headers={'Authorization':f'Bearer {token}'}
    r=c.post('/blood-report/upload',headers=headers,files={'file':('sample-lab.txt',lab,'text/plain')});assert_status(r,201)
    r=c.get('/blood-report/history',headers=headers);assert_status(r); assert len(r.json())==1
    ok("register/login/upload/history")

    print("4) Profile save -> history round trip")
    profile={
      'user_id':r.request.headers.get('x-unused'), 'name':'Self Test','age':29,'gender':'female','height_cm':164,'weight_kg':58,
      'activity_level':'moderate','sleep_hours':7.2,'water_intake_l':2.1,'diet':'vegetarian',
      'symptoms':{'fatigue':True,'brittle_nails':True,'brain_fog':True},
      'medical_history':{'celiac_disease':True,'metformin':True,'none':False},
      'iron_level':18.4,'calcium_level':8.7,'vitamin_d_level':16.2,'vitamin_b12_level':175,
      'allergies':['nuts'],'disliked_foods':['mushroom']
    }
    # Obtain authenticated user id and associate this assessment.
    me=c.get('/auth/me',headers=headers);assert_status(me);profile['user_id']=me.json()['id']
    r=c.post('/user',json=profile);assert_status(r,201)
    r=c.get('/user/history',headers=headers);assert_status(r); h=r.json()[0]
    assert h['symptom_brittle_nails'] is True and h['symptom_brain_fog'] is True and h['medical_celiac_disease'] is True and h['medication_metformin'] is True,h
    ok("all symptom/medical fields preserved")

    print("5) Nutrition engine contract")
    r=c.post('/nutrition',json={'age':29,'gender':'female','weight_kg':58,'activity_level':'moderate','diet':'vegetarian','focus_nutrients':['Iron'],'cooking_method':'steamed','allergies':['nuts'],'disliked_foods':['mushroom']})
    assert_status(r); assert 'daily_requirements' in r.json() and 'nutrient_analysis' in r.json(); ok("nutrition response")

    print("6) Trained Food Vision weights")
    from food_vision.routes import get_classifier
    img=Image.new('RGB',(224,224),'white');buf=io.BytesIO();img.save(buf,format='JPEG')
    dish,confidence=get_classifier().predict(buf.getvalue()); assert dish and 0<=confidence<=1
    ok(f"classifier loaded ({dish}, confidence={confidence:.3f})")

    print("7) Recommendation + Food Vision end-to-end contracts")
    from module2_prediction.schemas import PredictionResponse, DeficiencyProbability
    import module4_recommendation.routes as rr
    import module3_chemical.food_database as fdb
    import module10_live_data.client as ldc
    old_predict = rr.predictor.predict
    old_fdb_live = fdb.live_food_recommendations
    old_ldc_live = ldc.live_food_recommendations
    sample_food = {
        'fdc_id': 101, 'name': 'Lentils, cooked',
        'nutrients': {'protein': 9.0, 'iron': 3.3, 'calcium': 19.0},
        'source': 'USDA FoodData Central', 'source_url': 'https://fdc.nal.usda.gov/'
    }
    rr.predictor.predict = lambda req: PredictionResponse(
        predictions=[
            DeficiencyProbability(nutrient='Iron', probability_percent=82.0),
            DeficiencyProbability(nutrient='Vitamin D', probability_percent=42.0),
            DeficiencyProbability(nutrient='Calcium', probability_percent=25.0),
            DeficiencyProbability(nutrient='Vitamin B12', probability_percent=20.0),
            DeficiencyProbability(nutrient='Protein', probability_percent=10.0),
        ],
        top_deficiencies=['Iron'],
    )
    fdb.live_food_recommendations = lambda nutrient, diet='vegetarian', limit=6: [sample_food]
    ldc.live_food_recommendations = lambda nutrient, diet='vegetarian', limit=6: [sample_food]
    rec_payload={
        'age':29,'gender':'female','height_cm':164,'weight_kg':58,'activity_level':'moderate',
        'sleep_hours':7.2,'water_intake_l':2.1,'diet':'vegetarian','cooking_method':'steamed',
        'allergies':['nuts'],'disliked_foods':['mushroom'],'occupation':'Desk / Office Worker'
    }
    r=c.post('/recommend',json=rec_payload);assert_status(r); rec=r.json()
    assert rec['predictions'] and rec['detailed_recommendations'] and isinstance(rec['deals_on_sale'], list), rec
    assert rec['detailed_recommendations'][0]['recommended_foods'], rec
    rr.predictor.predict = old_predict; fdb.live_food_recommendations = old_fdb_live; ldc.live_food_recommendations = old_ldc_live
    ok("recommendation route + live-food contract")

    import food_vision.nutrient_aggregator as fna
    old_usda = fna.usda_search_foods
    fna.usda_search_foods = lambda q, page_size=5: [{
        'fdc_id': 202, 'name': q, 'nutrients': {
            'calories': 120, 'protein': 5, 'fat': 2, 'carbs': 20, 'iron': 1.1,
            'calcium': 30, 'vitamin d': 0.2, 'vitamin b12': 0.1, 'vitamin c': 3, 'fiber': 2
        }, 'source':'USDA FoodData Central','source_url':'https://fdc.nal.usda.gov/'
    }]
    r=c.post('/food-vision/predict?portion_multiplier=1.0',files={'file':('meal.jpg',buf.getvalue(),'image/jpeg')});assert_status(r)
    fv=r.json(); assert fv['predicted_dish'] and 'is_mock' not in fv and fv['total_nutrients']['calories']==120.0, fv
    fna.usda_search_foods = old_usda
    ok("real classifier + USDA nutrient response contract")

    print("8) External-provider route contracts (mocked network only)")
    import module7_specialist.routes as sr
    original_overpass,original_geo=sr.fetch_overpass_specialists,sr.geocode_place
    sr.fetch_overpass_specialists=lambda lat,lng,radius_meters=20000:[{'id':'osm-1','name':'Test Clinic','credentials':'OSM','specialties':'Clinic','latitude':lat,'longitude':lng,'phone':None,'email':None,'address':'Test','distance_miles':0.0,'source':'OpenStreetMap / Overpass','website':None}]
    sr.geocode_place=lambda q:{'latitude':11.0168,'longitude':76.9558,'display_name':'Coimbatore, Tamil Nadu, India'}
    r=c.get('/specialists/search?lat=11.0168&lng=76.9558');assert_status(r);assert len(r.json())==1
    r=c.get('/specialists/search-place?q=Coimbatore');assert_status(r);assert len(r.json()['places'])==1
    sr.fetch_overpass_specialists, sr.geocode_place=original_overpass,original_geo
    ok("specialist finder route wiring")

    import module10_live_data.routes as lr
    old_search=lr.usda_search_foods
    lr.usda_search_foods=lambda q,page_size=10:[{'fdc_id':1,'name':'Spinach','nutrients':{'iron':2.7},'source':'USDA FoodData Central','source_url':'https://fdc.nal.usda.gov/'}]
    r=c.get('/live-data/foods/search?q=spinach');assert_status(r);assert r.json()['foods'][0]['name']=='Spinach';lr.usda_search_foods=old_search
    ok("USDA route wiring")

    import module9_rag.engine as re
    old_pub,old_food=re.pubmed_retrieve,re.live_food_recommendations
    re.pubmed_retrieve=lambda q,top_k=4:[{'title':'Test paper','snippet':'Evidence sentence.','citation':'Journal 2026','category':'Peer-reviewed literature','source':'PubMed / NCBI','source_url':'https://pubmed.ncbi.nlm.nih.gov/1/'}]
    re.live_food_recommendations=lambda nutrient,diet='vegetarian',limit=6:[{'fdc_id':1,'name':'Spinach','nutrients':{'iron':2.7},'source':'USDA FoodData Central','source_url':'https://fdc.nal.usda.gov/'}]
    r=c.post('/chat',json={'message':'foods high in iron','user_profile':{'diet':'vegetarian'},'conversation_history':[]});assert_status(r);assert r.json()['citations']
    re.pubmed_retrieve,re.live_food_recommendations=old_pub,old_food
    ok("RAG route wiring")

    print("9) Prediction model state")
    r=c.get('/predict/status');assert_status(r); print('   INFO model_ready =',r.json()['model_ready'])

    print("\nALL OFFLINE INTEGRATION TESTS PASSED")
    print("External USDA/PubMed/OpenStreetMap availability is intentionally not faked at runtime; those features require internet.")
finally:
    try: os.remove(_tmp.name)
    except OSError: pass
