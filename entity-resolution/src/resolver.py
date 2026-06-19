from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Optional, Union

from .embeddings import HashingEmbedder, cosine_similarity
from .entity_graph import EntityGraph


VIN_RE = re.compile(r"\b[A-HJ-NPR-Z0-9]{17}\b", re.IGNORECASE)
CDL_RE = re.compile(r"\b(?:CDL|DL|LICENSE)\s*[:#-]?\s*([A-Z0-9-]{5,20})\b", re.IGNORECASE)
PLATE_RE = re.compile(r"\b(?:PLATE|TAG)\s*[:#-]?\s*([A-Z0-9-]{2,12})\b", re.IGNORECASE)
UNIT_RE = re.compile(r"(?:\btruck\b|\bunit\b|#)?\s*0*([0-9]{1,4})\b", re.IGNORECASE)


@dataclass(frozen=True)
class ResolutionResult:
    canonical_id: Optional[str]
    type: Optional[str]
    canonical_name: Optional[str]
    aliases: list[str]
    confidence: float
    method: str
    matched_text: Optional[str] = None


def normalize_exact(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def normalize_unit(unit: str) -> str:
    digits = re.sub(r"\D", "", unit)
    return f"UNIT:{int(digits):03d}" if digits else ""


class EntityResolver:
    def __init__(
        self,
        graph: Optional[EntityGraph] = None,
        embedder: Optional[HashingEmbedder] = None,
    ) -> None:
        self.graph = graph or EntityGraph()
        self.embedder = embedder or HashingEmbedder()

    def resolve(self, mention: str) -> ResolutionResult:
        cleaned = mention.strip()
        if not cleaned:
            return self._empty("empty")

        for match_text, alias_key, methods in self._rule_candidates(cleaned):
            row = self.graph.find_alias(alias_key, methods)
            if row:
                return self._from_row(row, match_text)

        embedding_match = self._resolve_by_embedding(cleaned)
        if embedding_match:
            return embedding_match

        return self._empty("no_match")

    def _rule_candidates(self, mention: str) -> list[tuple[str, str, list[str]]]:
        candidates: list[tuple[str, str, list[str]]] = []

        for vin in VIN_RE.findall(mention):
            candidates.append((vin, f"VIN:{normalize_exact(vin)}", ["vin_exact"]))

        cdl_match = CDL_RE.search(mention)
        if cdl_match:
            value = cdl_match.group(1)
            candidates.append((value, f"CDL:{normalize_exact(value)}", ["cdl_exact"]))

        plate_match = PLATE_RE.search(mention)
        if plate_match:
            value = plate_match.group(1)
            candidates.append((value, f"PLATE:{normalize_exact(value)}", ["plate_exact"]))

        for unit in UNIT_RE.findall(mention):
            key = normalize_unit(unit)
            if key:
                candidates.append((unit, key, ["unit_normalized"]))

        exact_key = normalize_exact(mention)
        if exact_key:
            candidates.append((mention, f"ALIAS:{exact_key}", ["alias_exact"]))

        return candidates

    def _resolve_by_embedding(self, mention: str) -> Optional[ResolutionResult]:
        query_vector = self.embedder.embed(mention)
        best: Optional[tuple[float, Any]] = None

        for entity in self.graph.entities_with_descriptions():
            text = " ".join(
                part
                for part in [
                    entity["canonical_name"],
                    entity["description"],
                    self._metadata_text(entity["metadata_json"]),
                ]
                if part
            )
            score = cosine_similarity(query_vector, self.embedder.embed(text))
            if best is None or score > best[0]:
                best = (score, entity)

        if not best or best[0] < 0.25:
            return None

        raw_score, entity = best
        confidence = min(0.8, max(0.6, 0.6 + raw_score * 0.25))
        aliases = [alias["alias_text"] for alias in self.graph.get_aliases(entity["id"])]
        return ResolutionResult(
            canonical_id=entity["id"],
            type=entity["type"],
            canonical_name=entity["canonical_name"],
            aliases=aliases,
            confidence=round(confidence, 3),
            method="embedding_similarity",
            matched_text=mention,
        )

    def _from_row(self, row: Any, matched_text: str) -> ResolutionResult:
        aliases = [alias["alias_text"] for alias in self.graph.get_aliases(row["entity_id"])]
        return ResolutionResult(
            canonical_id=row["entity_id"],
            type=row["type"],
            canonical_name=row["canonical_name"],
            aliases=aliases,
            confidence=float(row["confidence"]),
            method=row["method"],
            matched_text=matched_text,
        )

    def _empty(self, method: str) -> ResolutionResult:
        return ResolutionResult(
            canonical_id=None,
            type=None,
            canonical_name=None,
            aliases=[],
            confidence=0.0,
            method=method,
        )

    def _metadata_text(self, metadata_json: str) -> str:
        try:
            metadata = json.loads(metadata_json or "{}")
        except json.JSONDecodeError:
            return ""
        return " ".join(str(value) for value in metadata.values() if value is not None)
