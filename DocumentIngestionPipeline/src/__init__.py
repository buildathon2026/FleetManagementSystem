"""Document Ingestion Pipeline - Module 3."""

from .ingestion import DocumentIngestionPipeline
from .classifier import DocumentClassifier, DocumentType
from .extractor import FieldExtractor
from .entity_resolver import EntityResolver
from .database import DocumentDB, init_database
from .vector_store import VectorStore

__version__ = "1.0.0"
__all__ = [
    "DocumentIngestionPipeline",
    "DocumentClassifier",
    "DocumentType",
    "FieldExtractor",
    "EntityResolver",
    "DocumentDB",
    "init_database",
    "VectorStore",
]
