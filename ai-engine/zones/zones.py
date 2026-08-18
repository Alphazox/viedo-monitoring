from dataclasses import dataclass


@dataclass(frozen=True)
class Zone:
    """A rectangular region in frame pixel coordinates representing a
    monitored region — an entrance, a restricted perimeter, etc. Distance
    from a point is 0 inside the rectangle and the Euclidean distance to the
    nearest edge otherwise.
    """

    name: str
    x1: int
    y1: int
    x2: int
    y2: int

    def distance_to(self, x: int, y: int) -> float:
        cx = min(max(x, self.x1), self.x2)
        cy = min(max(y, self.y1), self.y2)
        return ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5

    def as_dict(self) -> dict:
        return {"name": self.name, "x1": self.x1, "y1": self.y1, "x2": self.x2, "y2": self.y2}


# Matches the entrance target used by inference/demo_videos.py's
# approach-and-loiter clips; a real deployment would configure this per
# camera/zone rather than hardcoding it.
DEFAULT_ENTRANCE_ZONE = Zone(name="main-entrance", x1=220, y1=80, x2=300, y2=190)
