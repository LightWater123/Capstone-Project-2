#!/usr/bin/env python3
"""
PDF inventory parser – RPCSP & PPE modes
Handles errors gracefully for API use.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pdfplumber
import re

# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------

class PDFParsingError(Exception):
    """Base exception for PDF parsing errors."""
    pass

class InvalidFormatError(PDFParsingError):
    """Raised when the PDF doesn't have the expected format."""
    pass

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean(cell) -> str:
    """Return stripped string or empty string."""
    return str(cell).strip() if cell else ""

def is_money(value: str) -> bool:
    """Check if value looks like a monetary amount."""
    value = re.sub(r"[₱$,]", "", str(value)).strip()
    return re.fullmatch(r"\d+(?:\.\d{1,2})?", value) is not None

def is_small_int(value: str) -> bool:
    """Check if value is an integer ≤ 1000."""
    value = str(value).replace(",", "").strip()
    return value.isdigit() and int(value) <= 1000

# ---------------------------------------------------------------------------
# Row filtering
# ---------------------------------------------------------------------------

def looks_like_header(row: List[str]) -> bool:
    """Check if row looks like a header row."""
    if not row:
        return False
    header_keywords = {
        "quantity", "value", "total", "grand total", "article", "description", 
        "property", "unit", "measure", "remarks", "whereabouts", "shortage", 
        "overage", "semi-expendable", "property number", "physical count"
    }
    cleaned_cells = [clean(cell).lower() for cell in row if cell]
    non_empty_cells = [cell for cell in cleaned_cells if cell]
    if len(non_empty_cells) < 3 and len(row) >= 5:
        return True
    for cell in cleaned_cells:
        for keyword in header_keywords:
            if keyword in cell:
                return True
    return False

def looks_like_subtotal(row: List[str]) -> bool:
    cleaned = [clean(c) for c in row if c]
    return (
        len(cleaned) >= 3
        and all(is_money(c) or is_small_int(c) for c in cleaned)
        and not cleaned[0].isalpha()
    )

def is_data_row(row: List[str]) -> bool:
    """Return True if row should be processed."""
    if not row or len(row) < 2:
        return False
    if looks_like_header(row) or looks_like_subtotal(row):
        return False
    if len([c for c in row if clean(c)]) < 3:
        return False
    return True

# ---------------------------------------------------------------------------
# Column splitting for RPCSP merged cell
# ---------------------------------------------------------------------------

def split_unit_and_quantity(merged: str) -> Tuple[str, str]:
    merged = merged.strip()
    if not merged:
        return "", ""
    parts = re.findall(r"\d+(?:\.\d+)?", merged)
    if len(parts) < 2:
        return merged, ""
    *unit_parts, qty = parts
    unit_value = merged[: merged.rfind(qty)].strip()
    return unit_value, qty

# ---------------------------------------------------------------------------
# Extraction strategies
# ---------------------------------------------------------------------------

TABLE_STRATEGIES = [
    {"vertical_strategy": "lines", "horizontal_strategy": "lines"},
    {"vertical_strategy": "lines_strict", "horizontal_strategy": "lines_strict"},
    {"vertical_strategy": "text", "horizontal_strategy": "text"},
    {"vertical_strategy": "explicit", "horizontal_strategy": "explicit"},
]

def extract_tables_from_page(page) -> List[List[List[str]]]:
    """Try every strategy until at least one table is returned."""
    for settings in TABLE_STRATEGIES:
        try:
            tables = page.extract_tables(table_settings=settings)
            if tables:
                return tables
        except Exception:
            continue
    return []

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_pdf_format(pdf, mode: str) -> bool:
    """Validate that the PDF contains tables with the expected format."""
    if mode.upper() == "RPCSP":
        required_keywords = {"article", "description", "semi-expendable", "property", "quantity"}
    elif mode.upper() == "PPE":
        required_keywords = {"article", "description", "property number", "quantity"}
    else:
        raise ValueError(f"Unknown mode: {mode}")
    
    for page in pdf.pages:
        tables = extract_tables_from_page(page)
        if not tables:
            continue
        for table in tables:
            if not table:
                continue
            found_keywords = set()
            for row in table[:3]:
                cleaned_row = [str(cell).lower() for cell in row if cell]
                for cell in cleaned_row:
                    for keyword in required_keywords:
                        if keyword in cell:
                            found_keywords.add(keyword)
            if len(found_keywords) >= 3:
                return True
    return False

# ---------------------------------------------------------------------------
# Row builders
# ---------------------------------------------------------------------------

EXPECTED_RPCSP_COLS = 10

def build_rpcsp_row(cells: List[str]) -> Optional[Dict]:
    if len(cells) == EXPECTED_RPCSP_COLS - 1:
        unit_value, qty_prop = split_unit_and_quantity(cells[4])
        cells[4:5] = [unit_value, qty_prop]
    while len(cells) < EXPECTED_RPCSP_COLS:
        cells.append("")
    data = {
        "article": cells[0], "description": cells[1], "semi_expendable_property_no": cells[2],
        "unit_of_measure": cells[3], "unit_value": cells[4], "quantity_per_property_card": cells[5],
        "quantity_per_physical_count": cells[6], "shortage_overage": {"quantity": cells[7], "value": cells[8]},
        "remarks_whereabouts": cells[9],
    }
    return data if data["article"] or data["description"] else None

def build_ppe_row(raw_row: List) -> Optional[Dict]:
    row = [clean(c) for c in raw_row]
    data = {
        "article": row[0], "description": row[1], "property_number_RO": row[2] if len(row) > 2 else "",
        "property_number_CO": row[3] if len(row) > 3 else "", "unit_of_measure": row[4] if len(row) > 4 else "",
        "unit_value": row[5] if len(row) > 5 else "", "quantity_per_property_card": row[6] if len(row) > 6 else "",
        "quantity_per_physical_count": row[7] if len(row) > 7 else "", "shortage_overage": {"quantity": row[8] if len(row) > 8 else "", "value": row[9] if len(row) > 9 else ""},
        "remarks_whereabouts": row[-1] if len(row) > 10 else "",
    }
    return data if data["article"] or data["description"] else None

# ---------------------------------------------------------------------------
# Main parsing loop
# ---------------------------------------------------------------------------

def parse_pdf(path: Path, mode: str, header_rows: int = 1) -> List[Dict]:
    rows: List[Dict] = []
    with pdfplumber.open(path) as pdf:
        if not validate_pdf_format(pdf, mode):
            raise InvalidFormatError("Invalid PDF format: Missing expected columns for PPE/RPCSP.")
        
        for page in pdf.pages:
            tables = extract_tables_from_page(page)
            for table in tables:
                for raw_row in table[header_rows:]:
                    if not is_data_row(raw_row):
                        continue
                    if mode.upper() == "RPCSP":
                        cells = [clean(c) for c in raw_row if c is not None]
                        parsed = build_rpcsp_row(cells)
                    elif mode.upper() == "PPE":
                        parsed = build_ppe_row(raw_row)
                    else:
                        raise ValueError(f"Unknown mode: {mode}")
                    if parsed:
                        rows.append(parsed)
    return rows

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> None:
    argv = argv or sys.argv[1:]
    if len(argv) < 2:
        # CHANGE: Print to stdout and exit with 0 to prevent 500 error
        print(json.dumps({"error": "Usage: python parser.py <file.pdf> <RPCSP|PPE> [header_rows]"}))
        sys.exit(0)

    file_path = Path(argv[0])
    mode = argv[1].strip().upper()
    header_rows = int(argv[2]) if len(argv) > 2 else 1
    
    if not file_path.exists():
        # CHANGE: Print to stdout and exit with 0 to prevent 500 error
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(0)

    try:
        data = parse_pdf(file_path, mode, header_rows)
        # On success, print the data to stdout
        print(json.dumps(data, ensure_ascii=False))
        sys.exit(0) # Explicitly exit with success code
    except PDFParsingError as e:
        # CHANGE: On validation/parsing error, print to stdout and exit with 0
        print(json.dumps({"error": str(e)}))
        sys.exit(0) # Exit with success code so the server doesn't throw a 500
    except Exception as e:
        # CHANGE: On any other unexpected error, print to stdout and exit with 0
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}))
        sys.exit(0) # Exit with success code

if __name__ == "__main__":
    main()