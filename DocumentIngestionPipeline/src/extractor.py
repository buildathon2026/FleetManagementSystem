"""Field extraction module for different document types."""

import re
from typing import Dict, Any, Optional


class FieldExtractor:
    """Extract structured fields from different document types."""

    @staticmethod
    def extract_fuel_receipt(content: str) -> Dict[str, Any]:
        """Extract fields from fuel receipt."""
        data = {}

        # Receipt number
        match = re.search(r"Receipt Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["receipt_number"] = match.group(1).strip() if match else None

        # Station name
        match = re.search(r"Station:\s*([^\n]+)", content, re.IGNORECASE)
        data["station"] = match.group(1).strip() if match else None

        # Date
        match = re.search(r"Date:\s*(\d{2}/\d{2}/\d{4})", content)
        data["date"] = match.group(1) if match else None

        # Truck identifier (various formats)
        truck_match = re.search(r"Truck:\s*([^\n]+)", content, re.IGNORECASE)
        if truck_match:
            truck_str = truck_match.group(1).strip()
            # Extract number from various formats: "Trk 84", "Unit 84", "84", etc.
            num_match = re.search(r"(\d{2,3})", truck_str)
            data["truck_id"] = num_match.group(1) if num_match else truck_str
        else:
            data["truck_id"] = None

        # Driver
        match = re.search(r"Driver:\s*([^\n]+)", content, re.IGNORECASE)
        data["driver"] = match.group(1).strip() if match else None

        # Gallons
        match = re.search(r"Gallons:\s*([\d.]+)", content, re.IGNORECASE)
        data["gallons"] = float(match.group(1)) if match else None

        # Price per gallon
        match = re.search(r"Price.*Gal:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["price_per_gallon"] = float(match.group(1)) if match else None

        # Total
        match = re.search(r"Total:\s*\$?([\d.]+)", content)
        data["total"] = float(match.group(1)) if match else None

        # Odometer
        match = re.search(r"Odometer:\s*([\d,]+)", content, re.IGNORECASE)
        if match:
            data["odometer"] = int(match.group(1).replace(",", ""))
        else:
            data["odometer"] = None

        return data

    @staticmethod
    def extract_maintenance_invoice(content: str) -> Dict[str, Any]:
        """Extract fields from maintenance invoice."""
        data = {}

        # Invoice number
        match = re.search(r"Invoice Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["invoice_number"] = match.group(1).strip() if match else None

        # Date
        match = re.search(r"Date:\s*([A-Za-z]+ \d{1,2}, \d{4})", content, re.IGNORECASE)
        data["date"] = match.group(1) if match else None

        # Truck/Unit ID
        truck_match = re.search(
            r"(?:Unit|Fleet ID|Truck):\s*(?:Unit\s*)?([A-Z]?-?\d{2,3})", content, re.IGNORECASE
        )
        if truck_match:
            data["truck_id"] = truck_match.group(1).strip()
        else:
            # Try alternate pattern
            match = re.search(r"Unit (\d+)", content)
            data["truck_id"] = match.group(1) if match else None

        # Service type
        match = re.search(r"Description:\s*([^\n]+)", content, re.IGNORECASE)
        data["service_type"] = match.group(1).strip() if match else None

        # Hours
        match = re.search(r"Hours:\s*([\d.]+)", content, re.IGNORECASE)
        data["hours"] = float(match.group(1)) if match else None

        # Labor cost
        match = re.search(r"Labor Cost:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["labor_cost"] = float(match.group(1)) if match else None

        # Parts cost
        match = re.search(r"Parts Cost:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["parts_cost"] = float(match.group(1)) if match else None

        # Total
        match = re.search(r"TOTAL\s*DUE:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["total"] = float(match.group(1)) if match else None

        return data

    @staticmethod
    def extract_insurance_cert(content: str) -> Dict[str, Any]:
        """Extract fields from insurance certificate."""
        data = {}

        # Certificate number
        match = re.search(r"Certificate Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["certificate_number"] = match.group(1).strip() if match else None

        # Policy number
        match = re.search(r"Policy Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["policy_number"] = match.group(1).strip() if match else None

        # Unit number / truck ID
        match = re.search(r"Unit Number:\s*(\d+)", content, re.IGNORECASE)
        data["truck_id"] = match.group(1) if match else None

        # Coverage limits
        match = re.search(r"Liability Limit:\s*\$([\d,]+)", content, re.IGNORECASE)
        data["coverage_limits"] = match.group(1).strip() if match else None

        # Expiration date
        match = re.search(r"Expiration Date:\s*([A-Za-z]+ \d{1,2}, \d{4})", content, re.IGNORECASE)
        data["expiration_date"] = match.group(1) if match else None

        # VIN
        match = re.search(r"VIN:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["vin"] = match.group(1) if match else None

        return data

    @staticmethod
    def extract_tax_form(content: str) -> Dict[str, Any]:
        """Extract fields from tax form (2290)."""
        data = {}

        # Filing ID
        match = re.search(r"Filing ID:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["filing_id"] = match.group(1).strip() if match else None

        # Tax year
        match = re.search(r"Tax Year:\s*(\d{4})", content, re.IGNORECASE)
        data["tax_year"] = match.group(1) if match else None

        # VIN
        match = re.search(r"VIN:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["vin"] = match.group(1) if match else None

        # Total tax due
        match = re.search(r"Total Tax Due:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["total_tax"] = float(match.group(1)) if match else None

        # Company name
        match = re.search(r"Company:\s*([^\n]+)", content, re.IGNORECASE)
        data["company"] = match.group(1).strip() if match else None

        # EIN
        match = re.search(r"EIN:\s*([0-9\-]+)", content)
        data["ein"] = match.group(1) if match else None

        return data

    @staticmethod
    def extract_settlement(content: str) -> Dict[str, Any]:
        """Extract fields from settlement statement."""
        data = {}

        # Settlement ID
        match = re.search(r"Settlement ID:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["settlement_id"] = match.group(1).strip() if match else None

        # Load number
        match = re.search(r"Load #:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["load_number"] = match.group(1).strip() if match else None

        # Truck/Unit
        truck_match = re.search(r"Truck/Unit:\s*(?:Unit\s*)?([A-Z]?-?\d{2,3})", content, re.IGNORECASE)
        if truck_match:
            data["truck_id"] = truck_match.group(1).strip()
        else:
            match = re.search(r"Unit (\d+)", content)
            data["truck_id"] = match.group(1) if match else None

        # Driver
        match = re.search(r"Driver:\s*([^\n]+)", content, re.IGNORECASE)
        data["driver"] = match.group(1).strip() if match else None

        # Miles
        match = re.search(r"Miles:\s*([\d,]+)", content, re.IGNORECASE)
        data["miles"] = int(match.group(1).replace(",", "")) if match else None

        # Revenue
        match = re.search(r"Total Revenue:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["revenue"] = float(match.group(1)) if match else None

        # Deductions
        match = re.search(r"Total Deductions:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["total_deductions"] = float(match.group(1)) if match else None

        # Net settlement
        match = re.search(r"NET SETTLEMENT:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["net_settlement"] = float(match.group(1)) if match else None

        # Date
        match = re.search(r"Date:\s*([A-Za-z]+ \d{1,2}, \d{4})", content, re.IGNORECASE)
        data["date"] = match.group(1) if match else None

        return data

    @staticmethod
    def extract_email(content: str) -> Dict[str, Any]:
        """Extract fields from email."""
        data = {}

        # From
        match = re.search(r"^From:\s*(.+)$", content, re.MULTILINE)
        data["from"] = match.group(1).strip() if match else None

        # To
        match = re.search(r"^To:\s*(.+)$", content, re.MULTILINE)
        data["to"] = match.group(1).strip() if match else None

        # Date
        match = re.search(r"^Date:\s*(.+)$", content, re.MULTILINE)
        data["date"] = match.group(1).strip() if match else None

        # Subject
        match = re.search(r"^Subject:\s*(.+)$", content, re.MULTILINE)
        data["subject"] = match.group(1).strip() if match else None

        # Try to extract truck references
        truck_matches = re.findall(r"(?:Unit|Truck|unit|truck)\s*(\d{2,3})", content)
        # Store as comma-separated string for database compatibility
        data["mentioned_trucks"] = ",".join(sorted(set(truck_matches))) if truck_matches else None

        return data

    @staticmethod
    def extract_inspection(content: str) -> Dict[str, Any]:
        """Extract fields from inspection report."""
        data = {}

        # Inspection number
        match = re.search(r"Inspection Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["inspection_number"] = match.group(1).strip() if match else None

        # Unit number
        match = re.search(r"Unit Number:\s*(\d+)", content, re.IGNORECASE)
        data["truck_id"] = match.group(1) if match else None

        # VIN
        match = re.search(r"VIN:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["vin"] = match.group(1) if match else None

        # Inspection date
        match = re.search(r"Inspection Date:\s*([A-Za-z]+ \d{1,2}, \d{4})", content, re.IGNORECASE)
        data["inspection_date"] = match.group(1) if match else None

        # Valid until
        match = re.search(r"Valid Until:\s*([A-Za-z]+ \d{1,2}, \d{4})", content, re.IGNORECASE)
        data["valid_until"] = match.group(1) if match else None

        # Pass/Fail status
        if re.search(r"APPROVED FOR SERVICE|OVERALL RESULT:\s*APPROVED", content, re.IGNORECASE):
            data["status"] = "PASS"
        elif re.search(r"FAILED|OUT OF SERVICE", content, re.IGNORECASE):
            data["status"] = "FAIL"
        else:
            data["status"] = "UNKNOWN"

        return data

    @staticmethod
    def extract_title(content: str) -> Dict[str, Any]:
        """Extract fields from vehicle title."""
        data = {}

        # VIN
        match = re.search(r"VIN:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["vin"] = match.group(1) if match else None

        # Unit number
        match = re.search(r"(?:Truck )?Unit Number:\s*(\d+)", content, re.IGNORECASE)
        data["truck_id"] = match.group(1) if match else None

        # Owner
        match = re.search(r"Owner Name:\s*([^\n]+)", content, re.IGNORECASE)
        data["owner"] = match.group(1).strip() if match else None

        # Title number
        match = re.search(r"Title Number:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["title_number"] = match.group(1).strip() if match else None

        # Make/Model
        match = re.search(r"Make:\s*([^\n]+)", content, re.IGNORECASE)
        data["make"] = match.group(1).strip() if match else None

        match = re.search(r"Model:\s*([^\n]+)", content, re.IGNORECASE)
        data["model"] = match.group(1).strip() if match else None

        return data

    @staticmethod
    def extract_registration(content: str) -> Dict[str, Any]:
        """Extract fields from registration certificate."""
        data = {}

        # Registration number
        match = re.search(r"Registration Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["registration_number"] = match.group(1).strip() if match else None

        # Unit number (various formats)
        unit_match = re.search(
            r"(?:Unit Number|Truck):\s*(?:Unit\s*)?([A-Z]?-?\d{2,3})", content, re.IGNORECASE
        )
        if unit_match:
            data["truck_id"] = unit_match.group(1).strip()
        else:
            match = re.search(r"Unit Number:\s*(\d+)", content, re.IGNORECASE)
            data["truck_id"] = match.group(1) if match else None

        # VIN
        match = re.search(r"VIN:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["vin"] = match.group(1) if match else None

        # Plate number
        match = re.search(r"Plate Number:\s*([A-Z0-9]+)", content, re.IGNORECASE)
        data["plate_number"] = match.group(1).strip() if match else None

        # Status
        match = re.search(r"Status:\s*([^\n]+)", content, re.IGNORECASE)
        data["status"] = match.group(1).strip() if match else None

        # Expiration date
        match = re.search(r"Expiration Date:\s*([A-Za-z]+ \d{1,2}, \d{4})", content, re.IGNORECASE)
        data["expiration_date"] = match.group(1) if match else None

        return data

    @staticmethod
    def extract_toll_receipt(content: str) -> Dict[str, Any]:
        """Extract fields from toll receipt."""
        data = {}

        # Receipt number
        match = re.search(r"Receipt Number:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["receipt_number"] = match.group(1).strip() if match else None

        # Transponder ID
        match = re.search(r"Transponder ID:\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        data["transponder_id"] = match.group(1).strip() if match else None

        # Date
        match = re.search(r"Date:\s*(\d{2}/\d{2}/\d{4})", content)
        data["date"] = match.group(1) if match else None

        # Toll charge
        match = re.search(r"Charge:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["toll_charge"] = float(match.group(1)) if match else None

        # Account balance
        match = re.search(r"Current Balance:\s*\$?([\d.]+)", content, re.IGNORECASE)
        data["account_balance"] = float(match.group(1)) if match else None

        return data

    @staticmethod
    def extract(doc_type: str, content: str) -> Dict[str, Any]:
        """
        Extract fields based on document type.

        Args:
            doc_type: The classified document type
            content: Raw document content

        Returns:
            Dictionary of extracted fields
        """
        if doc_type == "fuel_receipt":
            return FieldExtractor.extract_fuel_receipt(content)
        elif doc_type == "maintenance_invoice":
            return FieldExtractor.extract_maintenance_invoice(content)
        elif doc_type == "insurance_cert":
            return FieldExtractor.extract_insurance_cert(content)
        elif doc_type == "tax_form":
            return FieldExtractor.extract_tax_form(content)
        elif doc_type == "settlement":
            return FieldExtractor.extract_settlement(content)
        elif doc_type == "email":
            return FieldExtractor.extract_email(content)
        elif doc_type == "inspection":
            return FieldExtractor.extract_inspection(content)
        elif doc_type == "title":
            return FieldExtractor.extract_title(content)
        elif doc_type == "registration":
            return FieldExtractor.extract_registration(content)
        elif doc_type == "toll_receipt":
            return FieldExtractor.extract_toll_receipt(content)
        else:
            return {}
