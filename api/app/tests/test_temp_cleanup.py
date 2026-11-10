"""Tests para remove_job_temp_dir_sync en app.services.download_service."""
from app.services.download_service import remove_job_temp_dir_sync


def test_removes_valid_subfolder(temp_dir):
    """Debe borrar una subcarpeta válida dentro de TEMP_DIR."""
    subfolder = temp_dir / "job_abc123"
    subfolder.mkdir()
    (subfolder / "file.txt").write_text("data")

    result = remove_job_temp_dir_sync("job_abc123")
    assert result is True
    assert not subfolder.exists()


def test_blocks_dotdot(temp_dir):
    """Debe devolver False y no borrar nada con '..'."""
    # Crear la carpeta hermana para verificar que no se borra
    sibling = temp_dir.parent / "sibling_dir"
    sibling.mkdir(exist_ok=True)

    result = remove_job_temp_dir_sync("../sibling_dir")
    assert result is False
    assert sibling.exists()


def test_blocks_path_outside_temp_dir(temp_dir, tmp_path):
    """Debe devolver False con una ruta que sale fuera de TEMP_DIR."""
    # Intentar apuntar a otro directorio usando path traversal
    result = remove_job_temp_dir_sync("../../etc")
    assert result is False


def test_blocks_dot(temp_dir):
    """Debe devolver False con '.' (que resuelve a TEMP_DIR misma)."""
    result = remove_job_temp_dir_sync(".")
    assert result is False


def test_blocks_empty_name(temp_dir):
    """Debe devolver False con nombre vacío."""
    result = remove_job_temp_dir_sync("")
    assert result is False


def test_returns_false_if_not_exists(temp_dir):
    """Debe devolver False si la carpeta no existe."""
    result = remove_job_temp_dir_sync("carpeta_inexistente")
    assert result is False
