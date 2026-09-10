#!/usr/bin/env python3
"""Rasterize PDF drawing sheets to PNG for upload to Sanity.

Sanity's image pipeline only accepts raster formats, so each PDF sheet
needs converting before it can go into a `drawing.image` field. Output is
sized so its long edge hits --long-edge pixels, regardless of the sheet's
paper size (A1 and A2 sheets end up comparably sized, not comparably zoomed).

Accepts individual PDF files, or one or more folders. For a folder, every
.pdf directly inside it gets converted, every .png gets copied over (shrunk
to the same long-edge cap if it's larger; left alone otherwise), everything
else is ignored, and the results land together in a `png` subfolder of
that folder.
"""

import argparse
import shutil
import sys
from pathlib import Path

import pymupdf as fitz
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # source sheets are trusted, not untrusted uploads


def convert_pdf(pdf_path: Path, out_dir: Path, long_edge: int) -> list[tuple[Path, int, int]]:
	doc = fitz.open(pdf_path)
	written = []

	for page_index, page in enumerate(doc):
		width_pt, height_pt = page.rect.width, page.rect.height
		zoom = long_edge / max(width_pt, height_pt)
		matrix = fitz.Matrix(zoom, zoom)

		pixmap = page.get_pixmap(matrix=matrix, alpha=False)

		suffix = "" if doc.page_count == 1 else f"-p{page_index + 1}"
		out_path = out_dir / f"{pdf_path.stem}{suffix}.png"
		pixmap.save(out_path)
		written.append((out_path, pixmap.width, pixmap.height))

	doc.close()
	return written


def report(out_path: Path, width: int, height: int, note: str):
	size_mb = out_path.stat().st_size / (1024 * 1024)
	print(f"{out_path.name}: {width}x{height}, {size_mb:.2f} MB ({note})")


def process_file(pdf_path: Path, out_dir: Path, long_edge: int):
	out_dir.mkdir(parents=True, exist_ok=True)
	for out_path, width, height in convert_pdf(pdf_path, out_dir, long_edge):
		report(out_path, width, height, "converted")


def process_folder(folder: Path, out_dir: Path, long_edge: int):
	out_dir.mkdir(parents=True, exist_ok=True)
	entries = sorted(p for p in folder.iterdir() if p.is_file())

	for path in entries:
		suffix = path.suffix.lower()

		if suffix == ".pdf":
			for out_path, width, height in convert_pdf(path, out_dir, long_edge):
				report(out_path, width, height, "converted")
		elif suffix == ".png":
			out_path = out_dir / path.name
			with Image.open(path) as img:
				width, height = img.size
				if max(width, height) <= long_edge:
					shutil.copy2(path, out_path)
					report(out_path, width, height, "copied")
					continue

				scale = long_edge / max(width, height)
				new_size = (round(width * scale), round(height * scale))
				if img.mode == "P":
					img = img.convert("RGBA")
				img.resize(new_size, Image.LANCZOS).save(out_path, optimize=True, compress_level=9)
				report(out_path, *new_size, "resized")


def main():
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("paths", nargs="+", type=Path, help="PDF file(s) and/or folder(s) to process")
	parser.add_argument(
		"--long-edge",
		type=int,
		default=5000,
		help="Target pixel length of the longer side (default: 5000)",
	)
	parser.add_argument(
		"--out-dir",
		type=Path,
		default=None,
		help="Output directory. Default: alongside the source file, or a `png` subfolder for a folder input.",
	)
	args = parser.parse_args()

	for path in args.paths:
		if not path.exists():
			print(f"Skipping (not found): {path}", file=sys.stderr)
			continue

		if path.is_dir():
			process_folder(path, args.out_dir or path / "png", args.long_edge)
		else:
			process_file(path, args.out_dir or path.parent, args.long_edge)


if __name__ == "__main__":
	main()
