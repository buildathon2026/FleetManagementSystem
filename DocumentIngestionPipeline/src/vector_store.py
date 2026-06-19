"""Vector store for document embeddings using ChromaDB."""

from typing import Optional, List, Dict, Any
import json

try:
    import chromadb
except ImportError:
    chromadb = None


class VectorStore:
    """Handle document embeddings and vector storage."""

    def __init__(self, persist_directory: str = "./chromadb"):
        """Initialize ChromaDB vector store."""
        if chromadb is None:
            raise ImportError("chromadb is not installed. Install it with: pip install chromadb")

        self.persist_directory = persist_directory
        try:
            # Try new API (chromadb >= 0.4.0)
            self.client = chromadb.PersistentClient(path=persist_directory)
        except (TypeError, AttributeError):
            # Fallback to old API for older versions
            try:
                from chromadb.config import Settings
                self.client = chromadb.Client(
                    Settings(
                        chroma_db_impl="duckdb+parquet",
                        persist_directory=persist_directory,
                        anonymized_telemetry=False,
                    )
                )
            except (ImportError, TypeError):
                # If Settings import fails, try simple Client initialization
                self.client = chromadb.Client()

        # Get or create collection for fleet documents
        try:
            self.collection = self.client.get_or_create_collection(
                name="fleet_documents",
                metadata={"hnsw:space": "cosine"},
            )
        except Exception as e:
            # Fallback: create collection without metadata if that fails
            self.collection = self.client.get_or_create_collection(
                name="fleet_documents"
            )

    def add_document(
        self,
        doc_id: str,
        content: str,
        doc_type: str,
        entity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Add document to vector store.

        Args:
            doc_id: Unique document identifier
            content: Full document text
            doc_type: Document type (from classifier)
            entity_id: Resolved entity ID (truck ID, etc.)
            metadata: Additional metadata

        Returns:
            True if successful, False otherwise
        """
        try:
            # Prepare metadata
            meta = metadata or {}
            meta["doc_type"] = doc_type
            if entity_id:
                meta["entity_id"] = entity_id
            meta["active"] = True

            # Add to collection (ChromaDB handles embedding automatically)
            self.collection.add(
                ids=[doc_id],
                documents=[content],
                metadatas=[meta],
            )
            return True
        except Exception as e:
            print(f"Error adding document to vector store: {e}")
            return False

    def search(
        self,
        query: str,
        n_results: int = 5,
        entity_id: Optional[str] = None,
        doc_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for documents by semantic similarity.

        Args:
            query: Search query text
            n_results: Number of results to return
            entity_id: Filter by entity (optional)
            doc_type: Filter by document type (optional)

        Returns:
            List of results with scores and metadata
        """
        try:
            where_filter = None

            # Build metadata filter if needed
            if entity_id or doc_type:
                where_filter = {}
                if entity_id:
                    where_filter["entity_id"] = entity_id
                if doc_type:
                    where_filter["doc_type"] = doc_type
                where_filter["active"] = True

            # Query collection
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_filter,
                include=["distances", "documents", "metadatas"],
            )

            # Format results
            formatted_results = []
            if results and results["ids"] and len(results["ids"]) > 0:
                for i, doc_id in enumerate(results["ids"][0]):
                    # Convert distance to similarity score (cosine distance -> similarity)
                    distance = results["distances"][0][i]
                    similarity = 1 - distance  # Convert distance to similarity

                    formatted_results.append(
                        {
                            "id": doc_id,
                            "content": results["documents"][0][i],
                            "similarity": similarity,
                            "metadata": results["metadatas"][0][i],
                        }
                    )

            return formatted_results
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []

    def get_documents_by_entity(
        self,
        entity_id: str,
        doc_type: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all documents for a specific entity.

        Args:
            entity_id: Entity ID to filter by
            doc_type: Optional document type filter
            limit: Maximum documents to return

        Returns:
            List of documents
        """
        try:
            where_filter = {"entity_id": entity_id, "active": True}
            if doc_type:
                where_filter["doc_type"] = doc_type

            results = self.collection.get(
                where=where_filter,
                include=["documents", "metadatas"],
                limit=limit,
            )

            formatted_results = []
            if results and results["ids"]:
                for i, doc_id in enumerate(results["ids"]):
                    formatted_results.append(
                        {
                            "id": doc_id,
                            "content": results["documents"][i],
                            "metadata": results["metadatas"][i],
                        }
                    )

            return formatted_results
        except Exception as e:
            print(f"Error getting documents by entity: {e}")
            return []

    def update_document(
        self,
        doc_id: str,
        content: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Update document in vector store.

        Args:
            doc_id: Document ID to update
            content: New content (optional)
            metadata: New metadata (optional)

        Returns:
            True if successful
        """
        try:
            if content or metadata:
                update_data = {}
                if content:
                    update_data["documents"] = [content]
                if metadata:
                    update_data["metadatas"] = [metadata]

                self.collection.update(
                    ids=[doc_id],
                    **update_data,
                )
            return True
        except Exception as e:
            print(f"Error updating document: {e}")
            return False

    def delete_document(self, doc_id: str) -> bool:
        """
        Delete document from vector store.

        Args:
            doc_id: Document ID to delete

        Returns:
            True if successful
        """
        try:
            self.collection.delete(ids=[doc_id])
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False

    def archive_document(self, doc_id: str) -> bool:
        """
        Mark document as archived (inactive).

        Args:
            doc_id: Document ID to archive

        Returns:
            True if successful
        """
        try:
            self.collection.update(
                ids=[doc_id],
                metadatas=[{"active": False}],
            )
            return True
        except Exception as e:
            print(f"Error archiving document: {e}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        try:
            results = self.collection.get(include=[])
            total_docs = len(results["ids"]) if results and results["ids"] else 0

            # Get doc types breakdown
            all_results = self.collection.get(include=["metadatas"])
            doc_types = {}
            if all_results and all_results["metadatas"]:
                for meta in all_results["metadatas"]:
                    doc_type = meta.get("doc_type", "unknown")
                    doc_types[doc_type] = doc_types.get(doc_type, 0) + 1

            return {
                "total_documents": total_docs,
                "by_type": doc_types,
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {"total_documents": 0, "by_type": {}}

    def persist(self):
        """Persist data to disk."""
        try:
            self.client.persist()
            return True
        except Exception as e:
            print(f"Error persisting data: {e}")
            return False
