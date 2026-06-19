"""Entity resolution module for matching document entities to canonical fleet entities."""

import re
from typing import Optional, Tuple
import httpx

# Entity resolver service URL (Module 2)
ENTITY_RESOLVER_URL = "http://localhost:8003"


class EntityResolver:
    """Resolve entity mentions to canonical fleet entities."""

    # Cache for resolved entities (in production, use Redis)
    _cache = {}

    @staticmethod
    async def resolve_truck_id(
        truck_mention: str,
        doc_type: Optional[str] = None,
        vin: Optional[str] = None,
        plate: Optional[str] = None,
    ) -> Optional[Tuple[str, float]]:
        """
        Resolve a truck mention to canonical truck ID.

        Args:
            truck_mention: Raw truck reference from document
            doc_type: Document type (for context)
            vin: VIN if available
            plate: Plate number if available

        Returns:
            Tuple of (canonical_truck_id, confidence) or None
        """
        if not truck_mention:
            return None

        # Try cache first
        cache_key = f"{truck_mention}_{vin}_{plate}"
        if cache_key in EntityResolver._cache:
            return EntityResolver._cache[cache_key]

        try:
            # Try to resolve via entity resolver service
            async with httpx.AsyncClient() as client:
                # Try VIN first (highest confidence)
                if vin:
                    response = await client.get(
                        f"{ENTITY_RESOLVER_URL}/resolve",
                        params={"mention": vin},
                        timeout=5.0,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        canonical_id = data.get("canonical_id")
                        confidence = data.get("confidence", 0.0)
                        if canonical_id and confidence >= 0.8:
                            result = (canonical_id, confidence)
                            EntityResolver._cache[cache_key] = result
                            return result

                # Try plate number
                if plate:
                    response = await client.get(
                        f"{ENTITY_RESOLVER_URL}/resolve",
                        params={"mention": plate},
                        timeout=5.0,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        canonical_id = data.get("canonical_id")
                        confidence = data.get("confidence", 0.0)
                        if canonical_id and confidence >= 0.8:
                            result = (canonical_id, confidence)
                            EntityResolver._cache[cache_key] = result
                            return result

                # Try truck mention
                response = await client.get(
                    f"{ENTITY_RESOLVER_URL}/resolve",
                    params={"mention": truck_mention},
                    timeout=5.0,
                )
                if response.status_code == 200:
                    data = response.json()
                    canonical_id = data.get("canonical_id")
                    confidence = data.get("confidence", 0.0)
                    if canonical_id:
                        result = (canonical_id, confidence)
                        EntityResolver._cache[cache_key] = result
                        return result
        except Exception as e:
            print(f"Error calling entity resolver service: {e}")

        # Fallback: local resolution rules
        return EntityResolver._resolve_locally(truck_mention)

    @staticmethod
    def _resolve_locally(mention: str) -> Optional[Tuple[str, float]]:
        """
        Fallback local entity resolution using regex rules.

        Args:
            mention: Raw truck mention

        Returns:
            Tuple of (truck_id, confidence) or None
        """
        if not mention:
            return None

        mention_upper = mention.upper().strip()

        # Extract numeric part
        num_match = re.search(r"(\d{2,3})", mention_upper)
        if not num_match:
            return None

        truck_num = num_match.group(1)

        # Map to canonical format (T-NNN)
        canonical_id = f"T-{int(truck_num):03d}"

        # Determine confidence based on format
        if re.match(r"^T-\d{3}$", mention_upper):
            confidence = 1.0  # Exact format match
        elif re.match(r"^UNIT\s*\d{2,3}$", mention_upper):
            confidence = 0.95  # Unit format
        elif re.match(r"^T(RK)?\s*\d{2,3}$", mention_upper):
            confidence = 0.90  # "Trk" format
        elif re.match(r"^\d{2,3}$", mention_upper):
            confidence = 0.80  # Bare number (most ambiguous)
        else:
            confidence = 0.70

        return (canonical_id, confidence)

    @staticmethod
    def extract_truck_id_from_content(content: str) -> Optional[str]:
        """
        Try to extract truck ID from document content.

        Args:
            content: Document content

        Returns:
            Extracted truck mention or None
        """
        # Try various patterns
        patterns = [
            r"Unit[:\s]+([A-Z]?-?\d{2,3})",
            r"Truck[:\s]+([^\n]+)",
            r"Unit Number[:\s]+(\d{2,3})",
            r"Fleet ID[:\s]+([A-Z]?-?\d{2,3})",
            r"Trk\s+(\d{2,3})",
        ]

        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    @staticmethod
    def extract_vin_from_content(content: str) -> Optional[str]:
        """
        Extract VIN from document content.

        Args:
            content: Document content

        Returns:
            VIN or None
        """
        match = re.search(r"VIN[:\s]+([A-Z0-9]{17})", content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None

    @staticmethod
    def extract_plate_from_content(content: str) -> Optional[str]:
        """
        Extract license plate from document content.

        Args:
            content: Document content

        Returns:
            License plate or None
        """
        match = re.search(r"Plate[:\s#]+([A-Z0-9]+)", content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None

    @staticmethod
    def clear_cache():
        """Clear resolution cache."""
        EntityResolver._cache.clear()
