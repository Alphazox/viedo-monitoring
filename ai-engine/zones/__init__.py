"""Configurable monitored zones (e.g. an entrance) in frame pixel
coordinates. Generalizes the old hardcoded EntranceZone rectangle into a
small, named Zone concept — still just a dataclass/constant, not backed by a
database. A real deployment would configure zones per camera (out of scope
for this standalone service).
"""

from zones.zones import DEFAULT_ENTRANCE_ZONE, Zone

__all__ = ["Zone", "DEFAULT_ENTRANCE_ZONE"]
