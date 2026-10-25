"""
Clinical Blood Report Parser & Biomarker Extraction Engine.

Multi-stage document processor supporting:
1. Digital & Scanned PDF reports via pdfplumber, pypdf, PyPDF2, pypdfium2, and FlateDecode streams.
2. Image blood reports (PNG, JPG, JPEG, WEBP) via pytesseract / PIL OCR.
3. Flexible regex pattern matching with unit conversion, method tag tolerance (ECLIA, CLIA, etc.), and physiological validation.
"""

import re
import io
import zlib
from PIL import Image

# Physiological validation bounds for clinical sanity checks
VALID_RANGES = {
    "iron_level": (1.0, 1500.0),       # Ferritin / Iron in ng/mL or µg/dL
    "calcium_level": (3.0, 25.0),       # Serum Calcium in mg/dL
    "vitamin_d_level": (2.0, 300.0),    # 25-OH Vitamin D in ng/mL
    "vitamin_b12_level": (20.0, 5000.0) # Vitamin B12 in pg/mL
}


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """Extract text from PNG/JPG/WEBP bytes.

    Primary OCR uses RapidOCR/ONNX so the app does not depend on a separately
    installed Tesseract executable. pytesseract is retained only as an optional
    fallback when available on the host machine.
    """
    if not image_bytes:
        return ""

    try:
        import numpy as np
        from rapidocr_onnxruntime import RapidOCR
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        engine = RapidOCR()
        result, _ = engine(np.array(img))
        if result:
            lines = []
            for item in result:
                if len(item) >= 2 and item[1]:
                    lines.append(str(item[1]))
            text = "\n".join(lines).strip()
            if text:
                return text
    except Exception:
        pass

    try:
        import pytesseract
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        text = pytesseract.image_to_string(img)
        if text and text.strip():
            return text
    except Exception:
        pass

    return ""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract readable text content from PDF byte streams.
    Attempts pdfplumber (table layout preservation), pypdf, PyPDF2, pypdfium2, and pure-Python stream decoding.
    """
    if not pdf_bytes:
        return ""

    pages_text = []

    # Method 1: pdfplumber (best layout & table structure extraction)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True) or page.extract_text() or ""
                if text.strip():
                    pages_text.append(text)
        if pages_text:
            return "\n".join(pages_text)
    except Exception:
        pass

    # Method 2: pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        if extracted:
            return "\n".join(extracted)
    except Exception:
        pass

    # Method 3: PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        if extracted:
            return "\n".join(extracted)
    except Exception:
        pass

    # Method 4: pypdfium2 (render page images & OCR if scanned PDF)
    try:
        import pypdfium2
        pdf = pypdfium2.PdfDocument(pdf_bytes)
        ocr_texts = []
        for page in pdf:
            pil_image = page.render(scale=2).to_pil()
            img_bytes = io.BytesIO()
            pil_image.save(img_bytes, format="PNG")
            txt = extract_text_from_image_bytes(img_bytes.getvalue())
            if txt.strip():
                ocr_texts.append(txt)
        if ocr_texts:
            return "\n".join(ocr_texts)
    except Exception:
        pass

    # Method 5: Pure-Python FlateDecode stream decoder for unencrypted PDF text streams
    extracted_text = []
    stream_pattern = re.compile(rb'stream\r?\n(.*?)\r?\nendstream', re.DOTALL)
    for match in stream_pattern.finditer(pdf_bytes):
        stream_data = match.group(1)
        try:
            decompressed = zlib.decompress(stream_data)
            tj_matches = re.findall(rb'\((.*?)\)\s*Tj', decompressed)
            for m in tj_matches:
                try:
                    text_str = m.decode('latin-1', errors='ignore')
                    if text_str.strip():
                        extracted_text.append(text_str)
                except Exception:
                    pass
            array_matches = re.findall(rb'\[(.*?)\]\s*TJ', decompressed, re.DOTALL)
            for arr in array_matches:
                str_parts = re.findall(rb'\((.*?)\)', arr)
                joined = "".join(p.decode('latin-1', errors='ignore') for p in str_parts)
                if joined.strip():
                    extracted_text.append(joined)
        except Exception:
            pass

    if extracted_text:
        return "\n".join(extracted_text)

    # Method 6: Extract raw literal strings from PDF structure
    literal_strings = re.findall(rb'\(([^()]{3,120})\)', pdf_bytes)
    dec_strings = [
        s.decode('latin-1', errors='ignore')
        for s in literal_strings
        if any(c.isalpha() for c in s.decode('latin-1', errors='ignore'))
    ]
    if dec_strings:
        return "\n".join(dec_strings)

    return ""


def _parse_line_value(
    text_segment: str,
    alias_pattern: str,
    unit_conversions: dict[str, float],
    valid_range: tuple[float, float]
) -> float | None:
    """
    Multi-stage biomarker value parser:
    1. Flexible regex tolerating optional assay method tags (e.g. ECLIA, CLIA, Photometry), colons, hyphens.
    2. Fallback search for any floating point number on the line matching unit conversions & valid range.
    """
    if not text_segment:
        return None

    min_v, max_v = valid_range

    # Pass 1: Flexible regex matching alias + optional method tags + separator + number + unit
    pattern1 = re.compile(
        alias_pattern + r'(?:[^\d\n\(\)]|\([^\)]*\)){0,60}?\b(\d+(?:\.\d+)?)\s*([a-zA-Z/%µu]+)?',
        re.IGNORECASE
    )

    for match in pattern1.finditer(text_segment):
        num_str = match.group(1)
        captured_unit = (match.group(2) or "").lower()

        try:
            val = float(num_str)
        except ValueError:
            continue

        multiplier = 1.0
        unit_found = False

        if captured_unit:
            for u_regex, factor in unit_conversions.items():
                if re.search(u_regex, captured_unit, re.IGNORECASE):
                    multiplier = factor
                    unit_found = True
                    break

        if not unit_found:
            after_match = text_segment[match.end(1):match.end(1) + 40].lower()
            for u_regex, factor in unit_conversions.items():
                if re.search(u_regex, after_match, re.IGNORECASE):
                    multiplier = factor
                    break

        final_val = round(val * multiplier, 2)
        if min_v <= final_val <= max_v:
            return final_val

    # Pass 2: Proximity number search on the same line after alias match
    alias_re = re.compile(alias_pattern, re.IGNORECASE)
    alias_match = alias_re.search(text_segment)
    if alias_match:
        after_text = text_segment[alias_match.end():]
        numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', after_text)
        for num_str in numbers:
            try:
                val = float(num_str)
            except ValueError:
                continue
            
            # Check unit context near number
            multiplier = 1.0
            for u_regex, factor in unit_conversions.items():
                if re.search(u_regex, after_text[:60], re.IGNORECASE):
                    multiplier = factor
                    break

            final_val = round(val * multiplier, 2)
            if min_v <= final_val <= max_v:
                return final_val

    return None


def _extract_biomarker(
    target_lines: list[str],
    full_text: str,
    alias_pattern: str,
    exclude_pattern: str | None,
    unit_conversions: dict[str, float],
    valid_range: tuple[float, float]
) -> float | None:
    """
    Multi-stage biomarker extraction:
    1. Parse targeted lines matching the biomarker alias (filtering exclusion terms).
    2. Fall back to scanning line segments across the full text.
    """
    candidates = []

    for line in target_lines:
        if exclude_pattern and re.search(exclude_pattern, line, re.IGNORECASE):
            continue
        val = _parse_line_value(line, alias_pattern, unit_conversions, valid_range)
        if val is not None:
            candidates.append(val)

    if candidates:
        return candidates[0]

    # Full text scan fallback
    if not exclude_pattern or not re.search(exclude_pattern, full_text, re.IGNORECASE):
        val = _parse_line_value(full_text, alias_pattern, unit_conversions, valid_range)
        if val is not None:
            return val

    return None


def parse_blood_report(text_content: str) -> dict:
    """
    Scan text content for typical lab report biomarkers with comprehensive alias matching,
    unit normalization, and exclusion filtering.
    """
    results = {
        "iron_level": None,
        "calcium_level": None,
        "vitamin_d_level": None,
        "vitamin_b12_level": None
    }

    if not text_content:
        return results

    lines = [line.strip() for line in text_content.splitlines() if line.strip()]
    full_text = " ".join(lines)

    # 1. Iron / Ferritin
    iron_alias = r'\b(?:serum ferritin|ferritin|s\.?\s*ferritin|ferritin,\s*serum|serum iron|iron,\s*serum|s\.?\s*iron|iron total|total iron|fe,\s*serum|iron \(fe\)|s\.ferritin|iron)\b'
    iron_lines = [
        l for l in lines
        if re.search(r'\b(?:ferritin|iron|serum iron)\b', l, re.I)
        and not re.search(r'\b(?:tibc|uibc|saturation|binding capacity)\b', l, re.I)
    ]
    results["iron_level"] = _extract_biomarker(
        target_lines=iron_lines,
        full_text=full_text,
        alias_pattern=iron_alias,
        exclude_pattern=r'\b(?:tibc|uibc|saturation|binding capacity)\b',
        unit_conversions={
            r'ng/m?l|ug/l|mcg/l': 1.0,
            r'ug/dl|mcg/dl': 1.0,
            r'pmol/l': 0.225,
        },
        valid_range=VALID_RANGES["iron_level"]
    )

    # 2. Calcium
    calcium_alias = r'\b(?:serum calcium|calcium total|total calcium|calcium,\s*serum|s\.?\s*calcium|s\.?\s*ca|ca\+\+|calcium \(total\)|s\.calcium|calcium)\b'
    calcium_lines = [
        l for l in lines
        if re.search(r'\bcalcium\b', l, re.I)
        and not re.search(r'\b(?:ionized|urine|ratio)\b', l, re.I)
    ]
    results["calcium_level"] = _extract_biomarker(
        target_lines=calcium_lines,
        full_text=full_text,
        alias_pattern=calcium_alias,
        exclude_pattern=r'\b(?:ionized|creatinine ratio|urine)\b',
        unit_conversions={
            r'mg/dl': 1.0,
            r'mmol/l': 4.0,
        },
        valid_range=VALID_RANGES["calcium_level"]
    )

    # 3. Vitamin D
    vit_d_alias = r'\b(?:25-oh-d3|25-oh vitamin d|25-hydroxyvitamin d|25-hydroxy vit d|25 hydroxyvitamin d|vitamin d \(25-oh\)|vitamin d3|vit d3|25-oh-d|vit d|vitamin d total|total vitamin d|25-oh vit\.?\s*d|vitamin d 25-hydroxy|vitamin d,\s*25-hydroxy|vitamin d|hydroxycholecalciferol)\b'
    vit_d_lines = [
        l for l in lines
        if re.search(r'\b(?:vitamin d|vit d|25-oh|hydroxyvitamin)\b', l, re.I)
    ]
    results["vitamin_d_level"] = _extract_biomarker(
        target_lines=vit_d_lines,
        full_text=full_text,
        alias_pattern=vit_d_alias,
        exclude_pattern=None,
        unit_conversions={
            r'ng/m?l|ug/l|mcg/l': 1.0,
            r'nmol/l': 1.0 / 2.497,
        },
        valid_range=VALID_RANGES["vitamin_d_level"]
    )

    # 4. Vitamin B12
    vit_b12_alias = r'\b(?:vitamin b12|vitamin b-12|cobalamin|cyanocobalamin|vit b12|vit\.?\s*b12|s\.?\s*vitamin b12|s\.?\s*b12|active b12|serum b12|serum b-12|b12|b-12)\b'
    vit_b12_lines = [
        l for l in lines
        if re.search(r'\b(?:b12|b-12|cobalamin)\b', l, re.I)
    ]
    results["vitamin_b12_level"] = _extract_biomarker(
        target_lines=vit_b12_lines,
        full_text=full_text,
        alias_pattern=vit_b12_alias,
        exclude_pattern=None,
        unit_conversions={
            r'pg/m?l|ng/l': 1.0,
            r'pmol/l': 1.355,
        },
        valid_range=VALID_RANGES["vitamin_b12_level"]
    )

    return results


def parse_report_bytes(file_bytes: bytes, filename: str) -> dict:
    """
    Parse report bytes from uploaded PDF, TXT, CSV, or Image files.
    """
    extracted_text = ""

    # Check PDF format
    if filename.lower().endswith(".pdf") or file_bytes.startswith(b"%PDF"):
        extracted_text = extract_text_from_pdf(file_bytes)

    # Check Image format (PNG, JPG, WEBP)
    if not extracted_text and any(filename.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
        extracted_text = extract_text_from_image_bytes(file_bytes)

    # String decoding fallback for plain text / CSV
    if not extracted_text:
        for enc in ["utf-8", "latin-1", "cp1252"]:
            try:
                extracted_text = file_bytes.decode(enc)
                if extracted_text.strip():
                    break
            except Exception:
                continue

    parsed = parse_blood_report(extracted_text)
    return parsed
