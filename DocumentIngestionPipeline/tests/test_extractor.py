"""Tests for field extractor."""

import unittest
from src.extractor import FieldExtractor


class TestExtractor(unittest.TestCase):
    """Test field extraction."""

    def test_extract_fuel_receipt(self):
        """Test fuel receipt field extraction."""
        content = """
FUEL RECEIPT
Station: Pilot Travel Center #412, Dallas TX
Date: 05/18/2026
Truck: Trk 84
Driver: J. Smith
Gallons: 142.3
Price/Gal: $3.79
Total: $539.32
Odometer: 487,291
        """
        fields = FieldExtractor.extract_fuel_receipt(content)

        self.assertEqual(fields["station"], "Pilot Travel Center #412, Dallas TX")
        self.assertEqual(fields["date"], "05/18/2026")
        self.assertEqual(fields["truck_id"], "84")
        self.assertEqual(fields["driver"], "J. Smith")
        self.assertAlmostEqual(fields["gallons"], 142.3)
        self.assertAlmostEqual(fields["price_per_gallon"], 3.79)
        self.assertAlmostEqual(fields["total"], 539.32)
        self.assertEqual(fields["odometer"], 487291)

    def test_extract_maintenance_invoice(self):
        """Test maintenance invoice extraction."""
        content = """
MAINTENANCE INVOICE
Invoice Number: INV-0001
Date: May 15, 2026
Unit 84
Truck/Fleet ID: Unit 84 (T-084)
SERVICE RENDERED
Description: Oil Change
Hours: 1.5
Labor Cost: $112.50
Parts Cost: $45.00
TOTAL DUE: $157.50
        """
        fields = FieldExtractor.extract_maintenance_invoice(content)

        self.assertEqual(fields["invoice_number"], "INV-0001")
        self.assertEqual(fields["truck_id"], "84")
        self.assertAlmostEqual(fields["hours"], 1.5)
        self.assertAlmostEqual(fields["labor_cost"], 112.50)
        self.assertAlmostEqual(fields["parts_cost"], 45.00)
        self.assertAlmostEqual(fields["total"], 157.50)

    def test_extract_insurance_cert(self):
        """Test insurance certificate extraction."""
        content = """
COMMERCIAL VEHICLE INSURANCE CERTIFICATE
Certificate Number: FL-ABC-0001
Insurance Company: Progressive Commercial
Policy Number: POL-000001
Unit Number: 84
Liability Limit: $1,000,000
Expiration Date: June 15, 2027
VIN: 3AKJHHDR7BS467821
        """
        fields = FieldExtractor.extract_insurance_cert(content)

        self.assertEqual(fields["certificate_number"], "FL-ABC-0001")
        self.assertEqual(fields["policy_number"], "POL-000001")
        self.assertEqual(fields["truck_id"], "84")
        self.assertEqual(fields["vin"], "3AKJHHDR7BS467821")

    def test_extract_settlement(self):
        """Test settlement statement extraction."""
        content = """
SETTLEMENT STATEMENT
Settlement ID: STL-000001
Load #: LOAD-45821
Truck/Unit: Unit 84 (T-084)
Driver: John Smith
Miles: 1,547
Total Revenue: $2,847.50
Total Deductions: $1,087.23
NET SETTLEMENT: $1,760.27
        """
        fields = FieldExtractor.extract_settlement(content)

        self.assertEqual(fields["settlement_id"], "STL-000001")
        self.assertEqual(fields["load_number"], "LOAD-45821")
        self.assertEqual(fields["truck_id"], "84")
        self.assertEqual(fields["driver"], "John Smith")
        self.assertEqual(fields["miles"], 1547)
        self.assertAlmostEqual(fields["revenue"], 2847.50)
        self.assertAlmostEqual(fields["total_deductions"], 1087.23)
        self.assertAlmostEqual(fields["net_settlement"], 1760.27)

    def test_extract_email(self):
        """Test email extraction."""
        content = """From: mike@abctrucking.com
To: dispatch@abctrucking.com
Date: May 20, 2026
Subject: White Cascadia brake issue

Hey, unit 84 needs brake service. The white Cascadia is pulling to the left.
        """
        fields = FieldExtractor.extract_email(content)

        self.assertEqual(fields["from"], "mike@abctrucking.com")
        self.assertEqual(fields["to"], "dispatch@abctrucking.com")
        self.assertEqual(fields["subject"], "White Cascadia brake issue")
        self.assertIn("84", fields["mentioned_trucks"])


if __name__ == "__main__":
    unittest.main()
