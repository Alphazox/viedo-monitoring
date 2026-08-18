"""Person detection (YOLOv8, COCO 'person' class only).

This repo's own synthetic demo clips (see inference/demo_videos.py) draw a
stick figure with cv2.line/cv2.circle — a real YOLO model does NOT recognize
those as people. That's expected and by design: the gait and activity
subsystems fall back to background-subtraction-based tracking when YOLO
finds nobody (see events/motion.py and embeddings/service.py), so the demo
endpoints work end-to-end without any real camera footage. Endpoints that
need a genuine YOLO detection (POST /detection/annotate) require an uploaded
clip with an actual recognizable human in it.
"""
