import asyncio
import re
from pathlib import Path
from datetime import datetime, timedelta, UTC
from app.models.download_job import DownloadJob, JobStatus
from app.core.logging import get_logger
from app.core.config import settings

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
        
        async for line in process.stdout:
            decoded = line.decode("utf-8", errors="replace").strip()
            await DownloadService._parse_progress(job, decoded)
        
        await process.wait()
        
        if process.returncode == 0:
            job.status = JobStatus.DONE
            job.progress = 1.0
            job.progress_text = "Completado"
            job.expires_at = datetime.now(UTC) + timedelta(minutes=settings.download_ttl_minutes)
            
            # Find the generated file
            for file_path in temp_dir.iterdir():
                if file_path.is_file():
                    job.file_path = str(file_path)
                    job.file_name = file_path.name
                    job.file_size = file_path.stat().st_size
                    break
        else:
            job.status = JobStatus.FAILED
            job.error_message = f"yt-dlp salió con código {process.returncode}"
        
        await job.save()

    @staticmethod
    def _build_args(job: DownloadJob, output_dir: Path) -> list[str]:
        output_template = str(output_dir / "%(title)s.%(ext)s")
        
        if job.format == "audioMP3":
            return ["-x", "--audio-format", "mp3", "--newline", "-o", output_template, job.url]
        
        return ["-f", job.format_string, "--merge-output-format", "mp4",
                "--newline", "-o", output_template, job.url]

    @staticmethod
    async def _parse_progress(job: DownloadJob, line: str):
        # "[download]  12.3% of ~1.23GiB at  5.00MiB/s ETA 00:42"
        match = re.search(r'\[download\]\s+(\d+\.\d+)%', line)
        if match:
            progress = float(match.group(1)) / 100.0
            job.progress = progress
            job.progress_text = line
            # Save progress periodically (we might not want to save on EVERY line to avoid DB overload,
            # but for this implementation we will save to maintain accuracy)
            await job.save()
