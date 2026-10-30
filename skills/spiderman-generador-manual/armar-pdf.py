"""Imprime el manual HTML a PDF con Chrome (o Edge) y arma una vista previa.

Uso:  python -I armar-pdf.py <manual.html> <salida.pdf>

Deja junto al PDF un `montaje.png` con todas las páginas lado a lado, para
revisar de un vistazo que nada se desborde. Imprime el número de páginas.
"""
import pathlib
import subprocess
import sys

import fitz  # PyMuPDF

NAVEGADORES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def navegador():
    for ruta in NAVEGADORES:
        if pathlib.Path(ruta).exists():
            return ruta
    sys.exit("No encontré Chrome ni Edge para imprimir el PDF.")


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    html = pathlib.Path(sys.argv[1]).resolve()
    pdf = pathlib.Path(sys.argv[2]).resolve()
    pdf.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [navegador(), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf}", html.as_uri()],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
    )
    if not pdf.exists():
        sys.exit("El navegador no generó el PDF.")

    doc = fitz.open(pdf)
    ancho, alto, sep = 595, 842, 10
    montaje = fitz.open()
    hoja = montaje.new_page(width=(ancho + sep) * doc.page_count, height=alto)
    for i in range(doc.page_count):
        x = i * (ancho + sep)
        marco = fitz.Rect(x, 0, x + ancho, alto)
        hoja.show_pdf_page(marco, doc, i)
        hoja.draw_rect(marco, color=(0, 0, 0), width=1)
    vista = html.parent / "montaje.png"
    hoja.get_pixmap(dpi=45).save(vista)

    print(f"paginas={doc.page_count}")
    print(f"pdf={pdf}")
    print(f"montaje={vista}")


if __name__ == "__main__":
    main()
