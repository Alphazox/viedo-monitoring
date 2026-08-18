from __future__ import annotations

from pathlib import Path

from streaming.hls_muxer import HlsMuxer


def test_build_command_for_rtsp_source_uses_tcp_transport(tmp_path: Path):
    muxer = HlsMuxer("rtsp://camera.local/stream", tmp_path, segment_seconds=4, playlist_size=6)
    command = muxer.build_command()

    assert "-rtsp_transport" in command
    assert "tcp" in command
    assert "-stream_loop" not in command
    assert str(tmp_path / "index.m3u8") in command
    assert "-hls_time" in command
    assert command[command.index("-hls_time") + 1] == "4"


def test_build_command_for_local_file_loops_it(tmp_path: Path):
    muxer = HlsMuxer("./storage/uploads/sample.mp4", tmp_path)
    command = muxer.build_command()

    assert "-stream_loop" in command
    assert "-rtsp_transport" not in command


def test_is_running_false_before_start(tmp_path: Path):
    muxer = HlsMuxer("rtsp://camera.local/stream", tmp_path)
    assert muxer.is_running() is False
