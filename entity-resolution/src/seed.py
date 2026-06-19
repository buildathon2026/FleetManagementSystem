from __future__ import annotations

from typing import Optional

from .entity_graph import Entity, EntityGraph
from .resolver import normalize_exact, normalize_unit


def seed(graph: Optional[EntityGraph] = None) -> EntityGraph:
    graph = graph or EntityGraph()

    entities = [
        Entity(
            id="T-084",
            type="truck",
            canonical_name="Truck 084",
            lat=41.8781,
            lng=-87.6298,
            description="White Freightliner Cascadia sleeper tractor assigned to long-haul routes.",
            metadata={"vin": "3AKJHHDR7NSND0840", "plate": "P98421", "unit": "084", "driver": "D-012"},
        ),
        Entity(
            id="D-012",
            type="driver",
            canonical_name="Maya Patel",
            lat=41.8818,
            lng=-87.6231,
            description="Driver Maya Patel CDL ILD0129987 currently assigned to Truck 084.",
            metadata={"cdl": "ILD0129987", "assigned_truck": "T-084"},
        ),
        Entity(
            id="T-117",
            type="truck",
            canonical_name="Truck 117",
            lat=39.7684,
            lng=-86.1581,
            description="Blue Volvo VNL day cab used for regional deliveries.",
            metadata={"vin": "4V4NC9EH1NN117000", "plate": "K77117", "unit": "117", "driver": "D-021"},
        ),
    ]

    for entity in entities:
        graph.upsert_entity(entity)

    graph.add_alias("T-084", "Truck 084", "ALIAS:TRUCK084", 1.0, "alias_exact", "seed")
    graph.add_alias("T-084", "84", normalize_unit("84"), 0.9, "unit_normalized", "seed")
    graph.add_alias("T-084", "#84", normalize_unit("#84"), 0.9, "unit_normalized", "seed")
    graph.add_alias("T-084", "084", normalize_unit("084"), 0.9, "unit_normalized", "seed")
    graph.add_alias("T-084", "3AKJHHDR7NSND0840", f"VIN:{normalize_exact('3AKJHHDR7NSND0840')}", 1.0, "vin_exact", "seed")
    graph.add_alias("T-084", "P98421", f"PLATE:{normalize_exact('P98421')}", 1.0, "plate_exact", "seed")

    graph.add_alias("D-012", "Maya Patel", "ALIAS:MAYAPATEL", 1.0, "alias_exact", "seed")
    graph.add_alias("D-012", "ILD0129987", f"CDL:{normalize_exact('ILD0129987')}", 1.0, "cdl_exact", "seed")

    graph.add_alias("T-117", "Truck 117", "ALIAS:TRUCK117", 1.0, "alias_exact", "seed")
    graph.add_alias("T-117", "117", normalize_unit("117"), 0.9, "unit_normalized", "seed")
    graph.add_alias("T-117", "4V4NC9EH1NN117000", f"VIN:{normalize_exact('4V4NC9EH1NN117000')}", 1.0, "vin_exact", "seed")
    graph.add_alias("T-117", "K77117", f"PLATE:{normalize_exact('K77117')}", 1.0, "plate_exact", "seed")

    return graph


if __name__ == "__main__":
    seed()
    print("Seeded entity graph.")
