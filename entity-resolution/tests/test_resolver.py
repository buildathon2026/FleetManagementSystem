from __future__ import annotations

from pathlib import Path

from src.entity_graph import EntityGraph
from src.resolver import EntityResolver
from src.seed import seed


def seeded_resolver(tmp_path: Path) -> EntityResolver:
    graph = EntityGraph(tmp_path / "entity_graph.db")
    seed(graph)
    return EntityResolver(graph)


def test_resolves_vin_exact(tmp_path: Path) -> None:
    resolver = seeded_resolver(tmp_path)
    result = resolver.resolve("VIN 3AKJHHDR7NSND0840")

    assert result.canonical_id == "T-084"
    assert result.confidence == 1.0
    assert result.method == "vin_exact"


def test_resolves_unit_number_variants(tmp_path: Path) -> None:
    resolver = seeded_resolver(tmp_path)

    assert resolver.resolve("truck 84").canonical_id == "T-084"
    assert resolver.resolve("#84").canonical_id == "T-084"
    assert resolver.resolve("unit 084").confidence == 0.9


def test_resolves_cdl_exact(tmp_path: Path) -> None:
    resolver = seeded_resolver(tmp_path)
    result = resolver.resolve("CDL ILD0129987")

    assert result.canonical_id == "D-012"
    assert result.confidence == 1.0


def test_resolves_plate_exact(tmp_path: Path) -> None:
    resolver = seeded_resolver(tmp_path)
    result = resolver.resolve("plate P98421")

    assert result.canonical_id == "T-084"
    assert result.confidence == 1.0


def test_resolves_description_similarity(tmp_path: Path) -> None:
    resolver = seeded_resolver(tmp_path)
    result = resolver.resolve("the white Cascadia sleeper")

    assert result.canonical_id == "T-084"
    assert 0.6 <= result.confidence <= 0.8
    assert result.method == "embedding_similarity"
