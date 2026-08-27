import asyncio
import re
from pathlib import Path
from datetime import datetime, timedelta, timezone
from app.models.download_job import DownloadJob, JobStatus
from app.core.logging import get_logger
from app.core.config import settings
from app.services.ytdlp_utils import get_base_ytdlp_args

logger = get_logger(__name__)

class DownloadService:
    @staticmethod
    async def start_download(job: DownloadJob) -> None:
        temp_dir = Path(settings.temp_dir) / str(job.id)
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        args = DownloadService._build_args(job, temp_dir)
        
        job.status = JobStatus.RUNNING
        await job.save()
        
        process = await asyncio.create_subprocess_exec(
            "yt-dlp", *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        
        last_error_line = ""
        async for line in process.stdout:
            decoded = line.decode("utf-8", errors="replace").strip()
            if any(err_kw in decoded for err_kw in ("ERROR:", "WARNING:", "HTTP Error", "HTTPError")):
                last_error_line = decoded
            await DownloadService._parse_progress(job, decoded)
        
        await process.wait()
        
        if process.returncode == 0:
            job.status = JobStatus.DONE
            job.stage = "done"
            job.video_progress = 1.0
            job.audio_progress = 1.0
            job.progress = 1.0
            job.progress_text = "Completado"
            job.expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.download_ttl_minutes)
            
            # Find the generated file
            for file_path in temp_dir.iterdir():
                if file_path.is_file():
                    job.file_path = str(file_path)
                    job.file_name = file_path.name
                    job.file_size = file_path.stat().st_size
                    break
        else:
            job.status = JobStatus.FAILED
            err_msg = last_error_line or f"yt-dlp salió con código {process.returncode}"
            job.error_message = err_msg
            job.progress_text = f"Error: {err_msg}"
            logger.error("Download job %s failed: %s", job.id, err_msg)
        
        await job.save()

    @staticmethod
    def _build_args(job: DownloadJob, output_dir: Path) -> list[str]:
        output_template = str(output_dir / "%(title)s.%(ext)s")
        base_args = get_base_ytdlp_args()
        
        if job.format in ("audioMP3", "audio"):
            return base_args + ["--no-playlist", "-x", "--audio-format", "mp3", "--newline", "-o", output_template, job.url]
        
        return base_args + ["--no-playlist", "-f", job.format_string or "bestvideo+bestaudio/best", "--merge-output-format", "mp4",
                "--newline", "-o", output_template, job.url]

    @staticmethod
    async def _parse_progress(job: DownloadJob, line: str):
        if "Destination:" in line:
            if any(ext in line.lower() for ext in (".m4a", ".webm", ".opus", ".mp3", ".aac", ".f140", ".f251")):
                job.stage = "audio"
            elif any(ext in line.lower() for ext in (".mp4", ".f137", ".f248", ".f313", ".f271", ".f136")):
                job.stage = "video"
        elif "[Merger]" in line or "[ffmpeg]" in line or "Merging formats" in line:
            job.stage = "merging"
            job.video_progress = 1.0
            job.audio_progress = 1.0
            job.progress = 1.0
            job.progress_text = "Combinando audio y video..."
            await job.save()
            return

        # "[download]  12.3% of ~1.23GiB at  5.00MiB/s ETA 00:42"
        match = re.search(r'\[download\]\s+(\d+\.\d+)%', line)
        if match:
            pct = float(match.group(1)) / 100.0
            if job.format in ("audioMP3", "audio"):
                job.stage = "audio"
                job.audio_progress = pct
                job.progress = pct
            else:
                if job.stage == "video" and job.video_progress > 0.8 and pct < 0.3:
                    job.stage = "audio"
                    job.video_progress = 1.0

                if job.stage == "audio":
                    job.audio_progress = pct
                    job.video_progress = 1.0
                    job.progress = 0.5 + (pct * 0.5)
                else:
                    job.video_progress = pct
                    job.progress = pct * 0.5

            job.progress_text = line
            await job.save()
