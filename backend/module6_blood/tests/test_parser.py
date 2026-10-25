"""
Unit tests for Module 6 — Blood Report Parser.
"""

from module6_blood.parser import parse_blood_report, parse_report_bytes


def test_parse_quest_diagnostics_report():
    text = """
    PATIENT REPORT - LAB DIAGNOSTICS
    --------------------------------------------------
    TEST NAME                  RESULT    UNITS     REFERENCE INTERVAL
    Serum Ferritin             15.4      ng/mL     30.0 - 400.0 (LOW)
    Serum Calcium              8.1       mg/dL     8.5 - 10.5 (LOW)
    25-OH Vitamin D Total      18.2      ng/mL     30.0 - 100.0 (DEFICIENT)
    Vitamin B12                450.0     pg/mL     211.0 - 911.0 (NORMAL)
    TIBC                       350.0     ug/dL     250.0 - 450.0
    """
    res = parse_blood_report(text)
    assert res["iron_level"] == 15.4
    assert res["calcium_level"] == 8.1
    assert res["vitamin_d_level"] == 18.2
    assert res["vitamin_b12_level"] == 450.0


def test_parse_eclia_clia_method_annotated_report():
    text = """
    METROPOLIS / DR LAL PATHLABS CLINICAL REPORT
    FERRITIN (ECLIA) : 18.5 ng/ml (Reference: 30-400)
    CALCIUM, SERUM (Photometry) : 9.2 mg/dL
    VITAMIN D (25-OH) (CLIA) = 19.2 ng/ml
    S. VITAMIN B12 (CMIA) = 380.0 pg/ml
    """
    res = parse_blood_report(text)
    assert res["iron_level"] == 18.5
    assert res["calcium_level"] == 9.2
    assert res["vitamin_d_level"] == 19.2
    assert res["vitamin_b12_level"] == 380.0


def test_parse_international_units_conversion():
    # Vitamin D in nmol/L, B12 in pmol/L, Calcium in mmol/L
    text = """
    25-OH-D3: 50.0 nmol/L
    Vitamin B12: 300.0 pmol/L
    Calcium Total: 2.1 mmol/L
    Serum Ferritin = 25.0 ng/mL
    """
    res = parse_blood_report(text)
    # 50 nmol/L / 2.497 = 20.02 ng/mL
    assert 19.5 <= res["vitamin_d_level"] <= 20.5
    # 300 pmol/L * 1.355 = 406.5 pg/mL
    assert 400.0 <= res["vitamin_b12_level"] <= 415.0
    # 2.1 mmol/L * 4.0 = 8.4 mg/dL
    assert res["calcium_level"] == 8.4
    assert res["iron_level"] == 25.0


def test_exclusion_patterns_tibc_and_ionized():
    # Should not confuse TIBC (350) for Iron (45) or Ionized Calcium (1.15) for Serum Calcium (8.2)
    text = """
    Total Iron Binding Capacity (TIBC): 350 ug/dL
    Serum Iron: 45.0 ug/dL
    Ionized Calcium: 1.15 mmol/L
    Serum Calcium: 8.2 mg/dL
    """
    res = parse_blood_report(text)
    assert res["iron_level"] == 45.0
    assert res["calcium_level"] == 8.2


def test_parse_report_bytes_plain_text():
    bytes_data = b"Serum Ferritin: 12.0 ng/mL\nCalcium: 9.1 mg/dL\n25-OH Vitamin D: 15.0 ng/mL\nVit B12: 350 pg/mL"
    res = parse_report_bytes(bytes_data, "report.txt")
    assert res["iron_level"] == 12.0
    assert res["calcium_level"] == 9.1
    assert res["vitamin_d_level"] == 15.0
    assert res["vitamin_b12_level"] == 350.0
