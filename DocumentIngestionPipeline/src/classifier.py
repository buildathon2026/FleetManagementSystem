"""Document type classification module."""

import re
from typing import Tuple
from enum import Enum


class DocumentType(str, Enum):
    """Supported document types."""

    TITLE = "title"
    REGISTRATION = "registration"
    INSURANCE = "insurance_cert"
    TAX_FORM = "tax_form"
    FUEL_RECEIPT = "fuel_receipt"
    MAINTENANCE = "maintenance_invoice"
    INSPECTION = "inspection"
    SETTLEMENT = "settlement"
    EMAIL = "email"
    TOLL_RECEIPT = "toll_receipt"
    UNKNOWN = "unknown"


class DocumentClassifier:
    """Classify documents by type using regex patterns and heuristics."""

    # Pattern rules for classification
    PATTERNS = {
        DocumentType.TITLE: [
            r"VEHICLE TITLE",
            r"State:.*Vehicle Title",
            r"Title Number:",
            r"Lien Holder:",
        ],
        DocumentType.REGISTRATION: [
            r"VEHICLE REGISTRATION",
            r"REGISTRATION CERTIFICATE",
            r"Registration Number:",
            r"Plate Number:",
        ],
        DocumentType.INSURANCE: [
            r"INSURANCE CERTIFICATE",
            r"Commercial Vehicle Insurance",
            r"Certificate Number:",
            r"Coverage Limits:",
            r"Insurance Company:",
        ],
        DocumentType.TAX_FORM: [
            r"FORM 2290",
            r"HEAVY HIGHWAY VEHICLE USE TAX",
            r"IRS FORM 2290",
            r"Form 2290",
        ],
        DocumentType.FUEL_RECEIPT: [
            r"FUEL RECEIPT",
            r"Fuel Station",
            r"Gallons:",
            r"Price.*Gal",
            r"Receipt Number: FUEL",
        ],
        DocumentType.MAINTENANCE: [
            r"MAINTENANCE INVOICE",
            r"REPAIR.*INVOICE",
            r"Invoice Number:",
            r"SERVICE.*RENDERED",
            r"Labor Cost:",
        ],
        DocumentType.INSPECTION: [
            r"DOT INSPECTION",
            r"ANNUAL.*INSPECTION",
            r"INSPECTION REPORT",
            r"Inspection Number:",
            r"Valid Until:",
        ],
        DocumentType.SETTLEMENT: [
            r"SETTLEMENT STATEMENT",
            r"Settlement ID:",
            r"Load #:",
            r"Load Number:",
            r"NET SETTLEMENT:",
        ],
        DocumentType.EMAIL: [r"^From:", r"^To:", r"^Date:", r"^Subject:"],
        DocumentType.TOLL_RECEIPT: [
            r"TOLL RECEIPT",
            r"Transponder",
            r"Receipt Number: TOLL",
            r"Toll Authority",
        ],
    }

    @staticmethod
    def classify(content: str) -> Tuple[DocumentType, float]:
        """
        Classify document content and return type with confidence score.

        Args:
            content: Raw document text

        Returns:
            Tuple of (document_type, confidence_score)
        """
        if not content or not isinstance(content, str):
            return DocumentType.UNKNOWN, 0.0

        content_upper = content.upper()
        scores = {}

        # Score each document type
        for doc_type, patterns in DocumentClassifier.PATTERNS.items():
            score = 0
            matches = 0

            for pattern in patterns:
                if re.search(pattern, content_upper, re.IGNORECASE):
                    matches += 1
                    score += 1

            if matches > 0:
                # Confidence = number of matching patterns / total patterns
                confidence = matches / len(patterns)
                scores[doc_type] = confidence

        if not scores:
            return DocumentType.UNKNOWN, 0.0

        # Get highest scoring type
        best_type = max(scores.items(), key=lambda x: x[1])
        return best_type[0], best_type[1]

    @staticmethod
    def classify_batch(
        documents: list,
    ) -> list:
        """
        Classify multiple documents.

        Args:
            documents: List of (filename, content) tuples

        Returns:
            List of (filename, doc_type, confidence) tuples
        """
        results = []
        for filename, content in documents:
            doc_type, confidence = DocumentClassifier.classify(content)
            results.append((filename, doc_type, confidence))
        return results
