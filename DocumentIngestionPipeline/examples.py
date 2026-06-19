#!/usr/bin/env python3
"""
Example usage of the Document Ingestion Pipeline.

Run this script to test the pipeline with sample documents.
"""

import asyncio
import json
from pathlib import Path

from src.ingestion import DocumentIngestionPipeline
from src.classifier import DocumentClassifier


async def example_single_document():
    """Example: Ingest a single document."""
    print("\n" + "=" * 70)
    print("EXAMPLE 1: Ingest Single Document")
    print("=" * 70)

    # Create pipeline
    pipeline = DocumentIngestionPipeline()

    # Sample fuel receipt
    fuel_receipt = """
FUEL RECEIPT
Station: Pilot Travel Center #412, Dallas TX
Date: 05/18/2026
Time: 14:32
Truck: Trk 84
Driver: John Smith
Gallons: 142.3
Price/Gal: $3.79
Total: $539.32
Odometer: 487,291
"""

    # Ingest
    result = await pipeline.ingest_document("sample_fuel_receipt.txt", fuel_receipt)

    print(f"Status: {result['status']}")
    print(f"Document Type: {result.get('doc_type')}")
    print(f"Entity ID: {result.get('entity_id')}")
    print(f"Extracted Fields:")
    for field, value in result.get("extracted_fields", {}).items():
        print(f"  {field}: {value}")

    print(f"\nPipeline Stages:")
    for stage, details in result.get("stages", {}).items():
        status = details.get("status")
        duration = details.get("duration_ms", 0)
        print(f"  {stage}: {status} ({duration:.1f}ms)")


async def example_batch_ingestion():
    """Example: Ingest multiple documents concurrently."""
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Batch Ingestion (Concurrent)")
    print("=" * 70)

    pipeline = DocumentIngestionPipeline()

    # Sample documents
    documents = [
        (
            "fuel_receipt_1.txt",
            """FUEL RECEIPT
Station: Pilot #412
Date: 05/18/2026
Truck: Unit 84
Gallons: 142.3
Total: $539.32""",
        ),
        (
            "maintenance_invoice_1.txt",
            """MAINTENANCE INVOICE
Invoice Number: INV-0001
Date: May 15, 2026
Truck: Unit 84
SERVICE RENDERED
Description: Oil Change
Hours: 1.5
TOTAL DUE: $157.50""",
        ),
        (
            "email_1.txt",
            """From: dispatch@abc.com
To: ops@abc.com
Date: May 20, 2026
Subject: Truck 84 maintenance

Unit 84 needs brake service this week.""",
        ),
    ]

    # Ingest batch
    results = await pipeline.ingest_batch(documents)

    print(f"Ingested {len(results)} documents")
    for result in results:
        print(
            f"  {result['filename']}: {result['status']} "
            f"({result.get('doc_type', 'unknown')})"
        )

    # Show stats
    stats = pipeline.get_stats()
    print(f"\nTotal Processed: {stats['database']['total_ingested']}")


async def example_classification():
    """Example: Classify documents."""
    print("\n" + "=" * 70)
    print("EXAMPLE 3: Document Classification")
    print("=" * 70)

    samples = {
        "Fuel Receipt": "FUEL RECEIPT\nStation: Pilot\nDate: 05/18/2026\nTruck: 84\nGallons: 142.3",
        "Insurance Cert": "COMMERCIAL VEHICLE INSURANCE CERTIFICATE\nCertificate Number: FL-001\nCoverage Limits: $1,000,000",
        "Email": "From: test@abc.com\nTo: ops@abc.com\nSubject: Truck issue",
        "Unknown": "This is just random text with no structure",
    }

    for sample_type, content in samples.items():
        doc_type, confidence = DocumentClassifier.classify(content)
        print(f"{sample_type:20} → {doc_type.value:20} (confidence: {confidence:.2f})")


async def example_from_synthetic_dataset():
    """Example: Ingest documents from synthetic dataset."""
    print("\n" + "=" * 70)
    print("EXAMPLE 4: Ingest from Synthetic Dataset")
    print("=" * 70)

    pipeline = DocumentIngestionPipeline()

    # Path to synthetic dataset
    dataset_dir = Path("../data/synthetic")

    if not dataset_dir.exists():
        print(f"Dataset directory not found: {dataset_dir}")
        print("Please generate the synthetic dataset first")
        return

    # Ingest fuel receipts
    fuel_dir = dataset_dir / "fuel_receipts"
    fuel_files = list(fuel_dir.glob("FUEL_*.txt"))[:5]  # First 5 files

    print(f"Ingesting {len(fuel_files)} fuel receipts...")
    documents = [(f.name, f.read_text()) for f in fuel_files]

    results = await pipeline.ingest_batch(documents)

    completed = sum(1 for r in results if r["status"] == "completed")
    print(f"Completed: {completed}/{len(results)}")

    # Show statistics
    stats = pipeline.get_stats()
    print(f"\nPipeline Statistics:")
    print(f"  Total Ingested: {stats['database']['total_ingested']}")
    print(f"  Document Types: {stats['database']['doc_types']}")
    for doc_type_stat in stats["database"]["by_type"]:
        print(f"    - {doc_type_stat['doc_type']}: {doc_type_stat['count']}")


async def example_search():
    """Example: Search ingested documents."""
    print("\n" + "=" * 70)
    print("EXAMPLE 5: Search Documents")
    print("=" * 70)

    pipeline = DocumentIngestionPipeline()

    # Get stats first
    stats = pipeline.get_stats()
    total_docs = stats["database"]["total_ingested"]

    if total_docs == 0:
        print("No documents ingested yet. Run other examples first.")
        return

    # Search for fuel-related documents
    results = pipeline.vector_store.search(
        query="fuel cost gallons",
        n_results=3,
    )

    print(f"Search Results for 'fuel cost gallons':")
    for i, result in enumerate(results, 1):
        print(f"\n  {i}. {result['id']}")
        print(f"     Similarity: {result['similarity']:.3f}")
        print(f"     Type: {result['metadata'].get('doc_type')}")
        print(f"     Entity: {result['metadata'].get('entity_id')}")
        print(f"     Preview: {result['content'][:100]}...")


async def main():
    """Run all examples."""
    print("\n" + "=" * 70)
    print("Document Ingestion Pipeline - Usage Examples")
    print("=" * 70)

    try:
        # Example 1: Single document
        await example_single_document()

        # Example 2: Batch ingestion
        await example_batch_ingestion()

        # Example 3: Classification
        await example_classification()

        # Example 4: From synthetic dataset (optional)
        try:
            await example_from_synthetic_dataset()
        except Exception as e:
            print(f"\nExample 4 skipped: {e}")

        # Example 5: Search
        await example_search()

        print("\n" + "=" * 70)
        print("Examples Complete!")
        print("=" * 70)

    except Exception as e:
        print(f"\nError running examples: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
