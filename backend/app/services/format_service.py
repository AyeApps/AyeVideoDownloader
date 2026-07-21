import asyncio
import json
from app.schemas.downloads import AvailableFormatResponse, FetchFormatsResponse
from app.core.logging import get_logger

logger = get_logger(__name__)

def _codec_label(vcodec: str) -> str:
    if vcodec.startswith("avc"): return "H.264"
    if vcodec.startswith(("hev", "hvc")): return "H.265"
    if vcodec.startswith(("vp09", "vp9")): return "VP9"
    if vcodec.startswith("av01"): return "AV1"
    return vcodec.split(".")[0]

def _height_label(height: int) -> str:
    if height >= 2160: return "4K"
    if height >= 1440: return "1440p"
    return f"{height}p"

def _size_label(filesize: int | None) -> str:
    if not filesize: return ""
    mb = filesize / 1_048_576
    return f"  {mb/1024:.1f} GB" if mb >= 1000 else f"  {mb:.0f} MB"

def _display_label(height: int, fps: float, vcodec: str, is_hdr: bool) -> str:
    h = _height_label(height)
    f = f" {int(fps)}fps" if fps > 31 else ""
    c = _codec_label(vcodec)
    hdr = " · HDR (Colores vivos)" if is_hdr else ""
    return f"{h}{f} · {c}{hdr}"

class FormatService:

    @staticmethod
    async def fetch_formats(url: str) -> FetchFormatsResponse:
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp", "--js-runtimes", "nodejs", "-j", "--no-playlist", "--skip-download", url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            err = stderr.decode("utf-8", errors="replace")[:500]
            logger.warning("yt-dlp -j falló: url=%s err=%s", url, err)
            raise ValueError(f"No se pudo obtener información: {err}")

        info = json.loads(stdout.decode("utf-8"))
        raw_formats = info.get("formats", [])

        video_formats = []
        for f in raw_formats:
            height = f.get("height")
            vcodec = f.get("vcodec", "none")
            if not height or height < 144 or vcodec == "none":
                continue

            fps = float(f.get("fps") or 0) or 30.0
            dr  = f.get("dynamic_range")
            is_hdr = dr is not None and dr != "SDR"
            fs  = f.get("filesize") or f.get("filesize_approx")

            video_formats.append(AvailableFormatResponse(
                id=f["format_id"],
                height=height,
                fps=fps,
                vcodec=vcodec,
                filesize=fs,
                dynamic_range=dr,
                height_label=_height_label(height),
                codec_label=_codec_label(vcodec),
                is_hdr=is_hdr,
                display_label=_display_label(height, fps, vcodec, is_hdr),
                size_label=_size_label(fs),
            ))

        video_formats.sort(key=lambda x: (x.height, x.fps), reverse=True)

        return FetchFormatsResponse(
            url=url,
            title=info.get("title"),
            duration=info.get("duration"),
            thumbnail=info.get("thumbnail"),
            formats=video_formats,
        )

    @staticmethod
    def build_format_string(quality: str, codec: str, hdr: str) -> str:
        HEIGHT = {
            "best": "",    "2160": "[height<=2160]", "1440": "[height<=1440]",
            "1080": "[height<=1080]", "720": "[height<=720]",
            "480":  "[height<=480]",  "360": "[height<=360]",
        }
        CODEC = {
            "any":  "",    "h264": "[vcodec~='^avc']",
            "h265": "[vcodec~='^(hev|hvc)']",
            "vp9":  "[vcodec~='^vp0?9']", "av1": "[vcodec~='^av01']",
        }
        HDR = {
            "any": "", "sdr": "[dynamic_range=SDR]", "hdr": "[dynamic_range!=SDR]",
        }
        h  = HEIGHT.get(quality, "")
        cr = CODEC.get(codec, "") + HDR.get(hdr, "")

        if not cr:
            return f"bv{h}+ba[ext=m4a]/bv{h}+ba/b{h}[ext=mp4]/b{h}/best"
        return (
            f"bv{h}{cr}+ba[ext=m4a]/bv{h}{cr}+ba"
            f"/bv{h}+ba[ext=m4a]/bv{h}+ba/b{h}[ext=mp4]/b{h}/best"
        )

    @staticmethod
    def build_format_string_from_id(format_id: str) -> str:
        return f"{format_id}+ba[ext=m4a]/{format_id}+ba/{format_id}"
