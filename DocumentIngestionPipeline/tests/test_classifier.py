"""Tests for document classifier."""

import unittest
from src.classifier import DocumentClassifier, DocumentType


class TestClassifier(unittest.TestCase):
    """Test document classification."""

    def test_fuel_receipt_classification(self):
        """Test fuel receipt classification."""
        content = """
        FUEL RECEIPT
        Station: Pilot Travel Center #412
        Date: 05/18/2026
        Truck: Trk 84
        Gallons: 142.3
        Price/Gal: $3.79
        Total: $539.32
        """
        doc_type, confidence = DocumentClassifier.classify(content)
        self.assertEqual(doc_type, DocumentType.FUEL_RECEIPT)
        self.assertGreaterEqual(confidence, 0.8)

    def test_maintenance_invoice_classification(self):
        """Test maintenance invoice classification."""
        content = """
        MAINTENANCE INVOICE
        Invoice Number: INV-0001
        Date: May 15, 2026
        Truck: Unit 84
        SERVICE RENDERED
        Oil Change
        Hours: 1.5
        Labor Cost: $112.50
        Parts Cost: $45.00
        """
        doc_type, confidence = DocumentClassifier.classify(content)
        self.assertEqual(doc_type, DocumentType.MAINTENANCE)
        self.assertGreaterEqual(confidence, 0.8)

    def test_insurance_cert_classification(self):
        """Test insurance certificate classification."""
        content = """
        INSURANCE CERTIFICATE
        Certificate Number: FL-ABC-0001
        Insurance Company: Progressive Commercial
        Coverage Limits: $1,000,000
        """
        doc_type, confidence = DocumentClassifier.classify(content)
        self.assertEqual(doc_type, DocumentType.INSURANCE)
        self.assertGreaterEqual(confidence, 0.8)

    def test_email_classification(self):
        """Test email classification."""
        content = """
From: mike@abctrucking.com
To: dispatch@abctrucking.com
Date: May 20, 2026
Subject: Truck 84 brake issue

The white Cascadia needs brake service.
        """
        doc_type, confidence = DocumentClassifier.classify(content)
        self.assertEqual(doc_type, DocumentType.EMAIL)
        self.assertGreaterEqual(confidence, 0.6)

    def test_unknown_document(self):
        """Test unknown document handling."""
        content = "This is some random text with no structure."
        doc_type, confidence = DocumentClassifier.classify(content)
        self.assertEqual(doc_type, DocumentType.UNKNOWN)
        self.assertEqual(confidence, 0.0)

    def test_empty_content(self):
        """Test empty content handling."""
        doc_type, confidence = DocumentClassifier.classify("")
        self.assertEqual(doc_type, DocumentType.UNKNOWN)


if __name__ == "__main__":
    unittest.main()
