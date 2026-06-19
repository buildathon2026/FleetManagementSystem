#!/usr/bin/env python3
"""Ingest all synthetic documents from ../data/synthetic/ into the pipeline."""

import asyncio
from pathlib import Path

from src.ingestion import DocumentIngestionPipeline


async def ingest_all():
    pipeline = DocumentIngestionPipeline()
    dataset_dir = Path("../data/synthetic")

    if not dataset_dir.exists():
        print("ERROR: ../data/synthetic/ not found. Run make generate-data first.")
        return

    all_files = sorted(dataset_dir.rglob("*.txt"))
    if not all_files:
        print("ERROR: No .txt files found in ../data/synthetic/")
        return

    print(f"Found {len(all_files)} documents to ingest...")
    documents = [(f.name, f.read_text()) for f in all_files]

    batch_size = 20
    total_ok = 0
    total_fail = 0

    for i in range(0, len(documents), batch_size):
        batch = documents[i : i + batch_size]
        results = await pipeline.ingest_batch(batch)
        ok = sum(1 for r in results if r.get("status") == "completed")
        fail = len(results) - ok
        total_ok += ok
        total_fail += fail
        print(f"  Batch {i // batch_size + 1}: {ok}/{len(batch)} succeeded")

    print()
    print(f"Done: {total_ok} ingested, {total_fail} failed, {total_ok + total_fail} total")
    stats = pipeline.get_stats()
    print(f"DB total: {stats['database']['total_ingested']} documents")


if __name__ == "__main__":
    asyncio.run(ingest_all())
