"""Main document ingestion pipeline."""

import asyncio
import hashlib
import time
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import logging

from .classifier import DocumentClassifier, DocumentType
from .extractor import FieldExtractor
from .entity_resolver import EntityResolver
from .database import DocumentDB, init_database
from .vector_store import VectorStore

logger = logging.getLogger(__name__)


class DocumentIngestionPipeline:
    """
    Main ingestion pipeline orchestrating all stages:
    1. Classification
    2. Field Extraction
    3. Entity Resolution
    4. Database Storage
    5. Vector Embedding
    """

    def __init__(self):
        """Initialize pipeline components."""
        init_database()
        self.db = DocumentDB()
        self.vector_store = VectorStore()
        self.classifier = DocumentClassifier()
        self.extractor = FieldExtractor()

    async def ingest_document(
        self,
        filename: str,
        content: str,
    ) -> Dict[str, Any]:
        """
        Ingest a single document through the complete pipeline.

        Args:
            filename: Original filename
            content: Raw document content

        Returns:
            Dictionary with ingestion results and metadata
        """
        # Generate unique document ID
        doc_id = self._generate_doc_id(filename, content)

        result = {
            "doc_id": doc_id,
            "filename": filename,
            "status": "processing",
            "stages": {},
            "errors": [],
        }

        try:
            # Stage 1: Classification
            start_time = time.time()
            doc_type, classification_confidence = await self._classify_document(content)
            duration = (time.time() - start_time) * 1000

            result["stages"]["classification"] = {
                "status": "completed",
                "doc_type": doc_type,
                "confidence": classification_confidence,
                "duration_ms": duration,
            }
            self.db.log_pipeline_stage(doc_id, "classification", "completed", duration_ms=duration)

            if doc_type == DocumentType.UNKNOWN:
                result["status"] = "failed"
                result["errors"].append("Document type could not be determined")
                self.db.log_pipeline_stage(
                    doc_id, "classification", "failed", "Unknown document type"
                )
                return result

            # Stage 2: Field Extraction
            start_time = time.time()
            extracted_fields = await self._extract_fields(doc_type, content)
            duration = (time.time() - start_time) * 1000

            result["stages"]["extraction"] = {
                "status": "completed",
                "fields_extracted": len(extracted_fields),
                "duration_ms": duration,
            }
            self.db.log_pipeline_stage(doc_id, "extraction", "completed", duration_ms=duration)

            # Stage 3: Entity Resolution
            start_time = time.time()
            entity_id, entity_confidence = await self._resolve_entity(
                content, extracted_fields, doc_type
            )
            duration = (time.time() - start_time) * 1000

            result["stages"]["entity_resolution"] = {
                "status": "completed",
                "entity_id": entity_id,
                "confidence": entity_confidence,
                "duration_ms": duration,
            }
            self.db.log_pipeline_stage(
                doc_id, "entity_resolution", "completed", duration_ms=duration
            )

            # Stage 4: Database Storage
            start_time = time.time()
            db_success = await self._store_document(
                doc_id,
                filename,
                doc_type,
                content,
                extracted_fields,
                entity_id,
                classification_confidence,
            )
            duration = (time.time() - start_time) * 1000

            result["stages"]["database_storage"] = {
                "status": "completed" if db_success else "failed",
                "duration_ms": duration,
            }
            self.db.log_pipeline_stage(
                doc_id,
                "database_storage",
                "completed" if db_success else "failed",
                duration_ms=duration,
            )

            if not db_success:
                result["errors"].append("Failed to store document in database")

            # Stage 5: Vector Embedding
            start_time = time.time()
            embedding_success = await self._create_embedding(
                doc_id, content, doc_type, entity_id
            )
            duration = (time.time() - start_time) * 1000

            result["stages"]["vector_embedding"] = {
                "status": "completed" if embedding_success else "failed",
                "duration_ms": duration,
            }
            self.db.log_pipeline_stage(
                doc_id,
                "vector_embedding",
                "completed" if embedding_success else "failed",
                duration_ms=duration,
            )

            if not embedding_success:
                result["errors"].append("Failed to create vector embedding")

            # Final status
            if db_success and embedding_success:
                result["status"] = "completed"
            else:
                result["status"] = "completed_with_errors"

            result["extracted_fields"] = extracted_fields
            result["entity_id"] = entity_id
            result["doc_type"] = doc_type

        except Exception as e:
            logger.error(f"Pipeline error for {filename}: {e}")
            result["status"] = "failed"
            result["errors"].append(str(e))
            self.db.log_pipeline_stage(doc_id, "pipeline", "failed", str(e))

        return result

    async def ingest_batch(self, documents: list) -> list:
        """
        Ingest multiple documents concurrently.

        Args:
            documents: List of (filename, content) tuples

        Returns:
            List of ingestion results
        """
        tasks = [self.ingest_document(filename, content) for filename, content in documents]
        return await asyncio.gather(*tasks)

    async def _classify_document(self, content: str) -> Tuple[DocumentType, float]:
        """
        Stage 1: Classify document type.

        Args:
            content: Document content

        Returns:
            Tuple of (doc_type, confidence)
        """
        return DocumentClassifier.classify(content)

    async def _extract_fields(self, doc_type: DocumentType, content: str) -> Dict[str, Any]:
        """
        Stage 2: Extract fields based on document type.

        Args:
            doc_type: Classified document type
            content: Document content

        Returns:
            Dictionary of extracted fields
        """
        return FieldExtractor.extract(doc_type.value, content)

    async def _resolve_entity(
        self,
        content: str,
        extracted_fields: Dict[str, Any],
        doc_type: DocumentType,
    ) -> Tuple[Optional[str], float]:
        """
        Stage 3: Resolve entity (truck, driver, etc.) to canonical ID.

        Args:
            content: Document content
            extracted_fields: Previously extracted fields
            doc_type: Document type

        Returns:
            Tuple of (entity_id, confidence)
        """
        # Extract potential identifiers
        truck_mention = extracted_fields.get("truck_id") or EntityResolver.extract_truck_id_from_content(
            content
        )
        vin = extracted_fields.get("vin") or EntityResolver.extract_vin_from_content(content)
        plate = extracted_fields.get("plate_number") or EntityResolver.extract_plate_from_content(
            content
        )

        if not truck_mention and not vin and not plate:
            return None, 0.0

        # Resolve to canonical ID
        resolution = await EntityResolver.resolve_truck_id(
            truck_mention or "",
            doc_type=doc_type.value,
            vin=vin,
            plate=plate,
        )

        if resolution:
            return resolution
        return None, 0.0

    async def _store_document(
        self,
        doc_id: str,
        filename: str,
        doc_type: DocumentType,
        content: str,
        extracted_fields: Dict[str, Any],
        entity_id: Optional[str],
        classification_confidence: float,
    ) -> bool:
        """
        Stage 4: Store document in SQLite database.

        Args:
            doc_id: Document ID
            filename: Original filename
            doc_type: Document type
            content: Raw content
            extracted_fields: Extracted fields
            entity_id: Resolved entity ID
            classification_confidence: Classification confidence score

        Returns:
            True if successful
        """
        # Insert main document record
        success = self.db.insert_document(
            doc_id=doc_id,
            doc_type=doc_type.value,
            filename=filename,
            raw_content=content,
            extracted_fields=extracted_fields,
            entity_id=entity_id,
            confidence=classification_confidence,
        )

        if not success:
            return False

        # Insert type-specific data
        if doc_type != DocumentType.UNKNOWN:
            self.db.insert_typed_data(doc_id, doc_type.value, extracted_fields)

        return True

    async def _create_embedding(
        self,
        doc_id: str,
        content: str,
        doc_type: DocumentType,
        entity_id: Optional[str],
    ) -> bool:
        """
        Stage 5: Create vector embedding and store in ChromaDB.

        Args:
            doc_id: Document ID
            content: Document content
            doc_type: Document type
            entity_id: Entity ID

        Returns:
            True if successful
        """
        return self.vector_store.add_document(
            doc_id=doc_id,
            content=content,
            doc_type=doc_type.value,
            entity_id=entity_id,
            metadata={
                "ingested_at": datetime.utcnow().isoformat(),
                "source": "ingestion_pipeline",
            },
        )

    @staticmethod
    def _generate_doc_id(filename: str, content: str) -> str:
        """
        Generate unique document ID.

        Args:
            filename: Original filename
            content: Document content

        Returns:
            Unique document ID
        """
        # Use filename as primary ID, with hash as fallback
        base_id = filename.split(".")[0].upper()

        # Add hash suffix to ensure uniqueness
        content_hash = hashlib.md5(content.encode()).hexdigest()[:8]

        return f"{base_id}_{content_hash}"

    def get_document_status(self, doc_id: str) -> Dict[str, Any]:
        """Get ingestion status for a document."""
        doc = self.db.get_document(doc_id)
        if not doc:
            return {"status": "not_found"}

        return {
            "doc_id": doc_id,
            "status": doc["status"],
            "doc_type": doc["doc_type"],
            "entity_id": doc["entity_id"],
            "confidence": doc["confidence"],
            "ingested_at": doc["ingested_at"],
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics."""
        db_stats = self.db.get_stats()
        vector_stats = self.vector_store.get_collection_stats()

        return {
            "database": db_stats,
            "vector_store": vector_stats,
            "total_processed": db_stats.get("total_ingested", 0),
        }
