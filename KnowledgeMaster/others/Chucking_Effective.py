from pathlib import Path
from typing import List, Dict, Any

import docx
import re
import uuid
import pdfplumber
import docx
from lxml import etree
import pandas as pd
def extract_chunks_by_section1(docx_path, max_chunk_words=1024, overlap_words=250):
    doc = docx.Document(docx_path)

    chunks = []
    current_section = ""
    current_chunk_words = []
    section_start = None

    def is_heading(paragraph):
        return paragraph.style.name.lower().startswith("heading")

    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        style_name = para.style.name.lower()

        # Skip Table of Contents paragraphs
        if "toc" in style_name:
            continue

        if not text:
            continue

        if is_heading(para):
            # Save the previous chunk before starting new section
            if current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunks.append({
                    "content": chunk_text.strip(),
                    "filename": docx_path
                })
                current_chunk_words = []
            current_section = text
            section_start = i
        else:
            current_chunk_words.extend(text.split())
            while len(current_chunk_words) >= max_chunk_words:
                chunk_text = " ".join(current_chunk_words[:max_chunk_words])
                chunks.append({
                    "content": chunk_text.strip(),
                    "filename": docx_path
                })
                # Slide window: retain last `overlap_words` for next chunk
                current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # Final leftover chunk
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": docx_path
        })

    return chunks

def extract_chunks_by_section(
    docx_path: str,
    max_chunk_words: int = 1024,
    overlap_words: int = 250
) -> List[Dict[str, Any]]:
    """
    Extracts readable text chunks from a .docx file, including:
      - Headings and paragraphs
      - Tables (including nested tables)
      - Text in shapes/textboxes
      - Footnotes / Endnotes
    Excludes:
      - Headers, Footers
      - Comments / Revisions
      - Table of Contents (TOC)
    """

    doc = docx.Document(docx_path)
    chunks = []
    current_chunk_words = []
    current_section = ""

    # ---------- Helper functions ----------

    def is_heading(paragraph):
        """Detect heading styles."""
        return paragraph.style and paragraph.style.name.lower().startswith("heading")

    def is_toc(paragraph):
        """Skip table of contents paragraphs."""
        style_name = paragraph.style.name.lower() if paragraph.style else ""
        return "toc" in style_name or "table of content" in style_name

    def extract_text_from_table(table):
        """Recursively extract text from tables and nested tables."""
        rows_text = []
        for row in table.rows:
            row_cells = []
            for cell in row.cells:
                cell_text_parts = []
                # Extract text from paragraphs
                for para in cell.paragraphs:
                    if para.text.strip():
                        cell_text_parts.append(para.text.strip())
                # Handle nested tables
                for nested_table in cell.tables:
                    cell_text_parts.append(extract_text_from_table(nested_table))
                if cell_text_parts:
                    row_cells.append(" ".join(cell_text_parts))
            rows_text.append(" | ".join(row_cells))
        return "\n".join(rows_text)

    def extract_text_from_shapes(doc):
        """Extract text from shapes / textboxes."""
        shape_texts = []
        xml = etree.tostring(doc.element.body)
        xml = etree.fromstring(xml)
        for node in xml.xpath('.//w:txbxContent', namespaces={'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}):
            texts = [
                t.text for t in node.xpath('.//w:t', namespaces={'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'})
                if t.text
            ]
            if texts:
                shape_texts.append(" ".join(texts))
        return shape_texts

    def extract_footnotes(doc):
        """Extract footnotes and endnotes."""
        notes = []
        if hasattr(doc.part, "footnotes_part"):
            footnotes = doc.part.footnotes_part
            for f in footnotes.element.xpath('//w:footnote'):
                texts = [t.text for t in f.xpath('.//w:t') if t.text]
                if texts:
                    notes.append(" ".join(texts))
        if hasattr(doc.part, "endnotes_part"):
            endnotes = doc.part.endnotes_part
            for f in endnotes.element.xpath('//w:endnote'):
                texts = [t.text for t in f.xpath('.//w:t') if t.text]
                if texts:
                    notes.append(" ".join(texts))
        return notes

    # ---------- Begin extraction ----------

    # Iterate over all document blocks (paragraphs and tables)
    for block in doc.element.body:
        # --- TABLES ---
        if block.tag.endswith("tbl"):
            table = docx.table.Table(block, doc)
            table_text = extract_text_from_table(table)
            if table_text.strip():
                current_chunk_words.extend(table_text.split())

        # --- PARAGRAPHS ---
        elif block.tag.endswith("p"):
            para = docx.text.paragraph.Paragraph(block, doc)
            text = para.text.strip()
            if not text or is_toc(para):
                continue  # skip blank or TOC entries

            if is_heading(para):
                # Save existing chunk before a new section
                if current_chunk_words:
                    chunk_text = " ".join(current_chunk_words)
                    chunks.append({
                        "content": chunk_text.strip(),
                        "filename": docx_path
                    })
                    current_chunk_words = []
                current_section = text
            else:
                current_chunk_words.extend(text.split())

        # --- Chunk slicing logic ---
        while len(current_chunk_words) >= max_chunk_words:
            chunk_text = " ".join(current_chunk_words[:max_chunk_words])
            chunks.append({
                "content": chunk_text.strip(),
                "filename": docx_path
            })
            current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # ---------- Add Text from Shapes / Textboxes ----------
    shape_texts = extract_text_from_shapes(doc)
    if shape_texts:
        current_chunk_words.extend(" ".join(shape_texts).split())

    # ---------- Add Footnotes / Endnotes ----------
    footnote_texts = extract_footnotes(doc)
    if footnote_texts:
        current_chunk_words.extend(" ".join(footnote_texts).split())

    # ---------- Final leftover chunk ----------
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": docx_path
        })

    return chunks
def extract_chunks_by_md1(md_path, max_chunk_words=1024, overlap_words=250):
    chunks = []
    current_chunk_words = []
    current_section = ""
    section_start = None

    def is_heading(line):
        # Markdown headings start with #
        return line.strip().startswith("#")

    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        text = line.strip()
        if not text:
            continue  # skip empty lines

        if is_heading(text):
            # Save previous chunk before starting new section
            if current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunks.append({
                    "content": chunk_text.strip(),
                    "filename": md_path
                })
                current_chunk_words = []

            current_section = text
            section_start = i
        else:
            current_chunk_words.extend(text.split())
            while len(current_chunk_words) >= max_chunk_words:
                chunk_text = " ".join(current_chunk_words[:max_chunk_words])
                chunks.append({
                    "content": chunk_text.strip(),
                    "filename": md_path
                })
                # Slide window: retain last `overlap_words` for next chunk
                current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # Final leftover chunk
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": md_path
        })

    return chunks

def extract_chunks_by_md(md_path, max_chunk_words=1024, overlap_words=250):
    chunks = []
    current_chunk_words = []
    current_section = []
    inside_code_block = False
    code_block_lang = None

    def get_heading_level(line):
        match = re.match(r'^(#+)\s+(.*)', line.strip())
        if match:
            return len(match.group(1)), match.group(2).strip()
        return 0, None

    def clean_inline_markdown(text):
        """Remove or simplify inline Markdown like bold, italics, links, etc."""
        text = re.sub(r'!\[([^\]]*)\]\([^\)]*\)', r'Image: \1', text)  # images
        text = re.sub(r'\[([^\]]+)\]\([^\)]*\)', r'\1', text)          # links
        text = re.sub(r'`([^`]*)`', r'[code]\1[/code]', text)          # inline code
        text = re.sub(r'\*\*|__', '', text)                            # bold markers
        text = re.sub(r'\*|_', '', text)                               # italic markers
        text = re.sub(r'<[^>]+>', '', text)                            # strip HTML tags
        return text.strip()

    # --- Read file
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # --- Optional: extract YAML front matter
    metadata = {}
    if lines and lines[0].strip() == "---":
        end = 1
        while end < len(lines) and not lines[end].strip() == "---":
            key_val = re.match(r'(\w+):\s*(.*)', lines[end].strip())
            if key_val:
                metadata[key_val.group(1)] = key_val.group(2)
            end += 1
        lines = lines[end + 1:]  # skip YAML header

    for line in lines:
        text = line.rstrip()

        # Detect code block start/end
        if text.strip().startswith("```"):
            if inside_code_block:
                inside_code_block = False
                code_block_lang = None
            else:
                inside_code_block = True
                lang_match = re.match(r"```(\w+)", text.strip())
                code_block_lang = lang_match.group(1) if lang_match else None
            continue

        # Inside code block → keep as atomic
        if inside_code_block:
            current_chunk_words.append(f"[{code_block_lang or 'code'}] {text}")
            continue

        # Horizontal rule → force new chunk
        if re.match(r'^-{3,}$', text.strip()) or re.match(r'^\*{3,}$', text.strip()):
            if current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunks.append({
                    "content": chunk_text.strip(),
                    "filename": md_path,
                    "section_path": " > ".join(current_section),
                    "metadata": metadata
                })
                current_chunk_words = []
            continue

        # Skip blank lines
        if not text.strip():
            continue

        # Handle blockquotes
        if text.strip().startswith(">"):
            text = "NOTE: " + text.lstrip(">").strip()

        # Detect heading
        level, heading_text = get_heading_level(text)
        if level > 0:
            if current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunks.append({
                    "content": chunk_text.strip(),
                    "filename": md_path,
                    "section_path": " > ".join(current_section),
                    "metadata": metadata
                })
                current_chunk_words = []
            # Update section hierarchy
            if len(current_section) < level:
                current_section.append(heading_text)
            else:
                current_section = current_section[:level-1] + [heading_text]
            continue

        # Normalize inline markdown
        text = clean_inline_markdown(text)

        # Append and handle chunking
        current_chunk_words.extend(text.split())
        while len(current_chunk_words) >= max_chunk_words:
            chunk_text = " ".join(current_chunk_words[:max_chunk_words])
            chunks.append({
                "content": chunk_text.strip(),
                "filename": md_path,
                "section_path": " > ".join(current_section),
                "metadata": metadata
            })
            current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # Final leftover
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": md_path,
            "section_path": " > ".join(current_section),
            "metadata": metadata
        })

    return chunks
def extract_chunks_from_pdf1(pdf_path, max_chunk_words=1024, overlap_words=250):
    chunks = []
    current_chunk_words = []

    def is_heading(line):
        # Heuristic: Treat a line as heading if it's short and in ALL CAPS
        return len(line.split()) < 10 and line.isupper()

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            for line in text.split("\n"):
                line = line.strip()
                if not line:
                    continue

                if is_heading(line):
                    # Save current chunk before starting new section
                    if current_chunk_words:
                        chunk_text = " ".join(current_chunk_words)
                        chunks.append({
                            "content": chunk_text.strip(),
                            "filename": pdf_path
                        })
                        current_chunk_words = []
                else:
                    current_chunk_words.extend(line.split())
                    while len(current_chunk_words) >= max_chunk_words:
                        chunk_text = " ".join(current_chunk_words[:max_chunk_words])
                        chunks.append({
                            "content": chunk_text.strip(),
                            "filename": pdf_path
                        })
                        # Retain last `overlap_words`
                        current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # Final leftover
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": pdf_path
        })

    return chunks

def extract_chunks_from_pdf(pdf_path, max_chunk_words=1024, overlap_words=250):
    chunks = []
    current_chunk_words = []
    current_section = None

    def is_heading(line):
        return (
            len(line.split()) <= 8 and
            (
                line.isupper() or
                re.match(r'^\d+(\.\d+)*\s', line) or
                line.endswith(':')
            )
        )

    def clean_text(text):
        text = re.sub(r'-\n', '', text)  # fix hyphenation
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def merge_lines(lines):
        paragraphs = []
        buffer = []
        for line in lines:
            if re.match(r'^\s*$', line):
                if buffer:
                    paragraphs.append(" ".join(buffer))
                    buffer = []
                continue
            buffer.append(line)
            if line.endswith(('.', '?', '!', ':')):
                paragraphs.append(" ".join(buffer))
                buffer = []
        if buffer:
            paragraphs.append(" ".join(buffer))
        return paragraphs

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            # Extract tables first
            for table in page.extract_tables():
                if not table:
                    continue
                table_text = "\n".join([" | ".join(row) for row in table if any(row)])
                chunks.append({
                    "content": table_text.strip(),
                    "filename": pdf_path,
                    "metadata": {"page_number": page.page_number, "source_type": "table"}
                })

            # Process textual content
            lines = text.split("\n")
            paragraphs = merge_lines([clean_text(l) for l in lines if l.strip()])

            for para in paragraphs:
                if is_heading(para):
                    if current_chunk_words:
                        chunk_text = " ".join(current_chunk_words)
                        chunks.append({
                            "content": chunk_text.strip(),
                            "filename": pdf_path,
                            "metadata": {"page_number": page.page_number, "section": current_section}
                        })
                        current_chunk_words = []
                    current_section = para
                else:
                    current_chunk_words.extend(para.split())
                    while len(current_chunk_words) >= max_chunk_words:
                        chunk_text = " ".join(current_chunk_words[:max_chunk_words])
                        chunks.append({
                            "content": chunk_text.strip(),
                            "filename": pdf_path,
                            "metadata": {"page_number": page.page_number, "section": current_section}
                        })
                        current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

        # Final leftover
        if current_chunk_words:
            chunk_text = " ".join(current_chunk_words)
            chunks.append({
                "content": chunk_text.strip(),
                "filename": pdf_path,
                "metadata": {"section": current_section}
            })

    return chunks
def extract_chunks_from_txt(txt_path, max_chunk_words=1024, overlap_words=250):
    chunks = []
    current_chunk_words = []

    def is_heading(line):
        # Simple heuristic: short & uppercase OR starts with number + dot
        return (
            (len(line.split()) < 10 and line.isupper())
            or line.strip().startswith(tuple(str(i) + "." for i in range(1, 20)))
        )

    with open(txt_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            if is_heading(line):
                # Save current chunk before starting new section
                if current_chunk_words:
                    chunk_text = " ".join(current_chunk_words)
                    chunks.append({
                        "content": chunk_text.strip(),
                        "filename": txt_path
                    })
                    current_chunk_words = []
            else:
                current_chunk_words.extend(line.split())
                while len(current_chunk_words) >= max_chunk_words:
                    chunk_text = " ".join(current_chunk_words[:max_chunk_words])
                    chunks.append({
                        "content": chunk_text.strip(),
                        "filename": txt_path
                    })
                    # Retain overlap for context
                    current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # Final leftover
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": txt_path
        })

    return chunks



def extract_chunks_from_table(file_path, max_chunk_words=1024, overlap_words=250):
    chunks = []
    current_chunk_words = []

    # Read file (CSV or Excel)
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path, dtype=str, keep_default_na=False)
    else:  # Excel
        df = pd.read_excel(file_path, dtype=str, keep_default_na=False)

    for _, row in df.iterrows():
        # Convert row to single line string
        row_text = " ".join([str(cell).strip() for cell in row if str(cell).strip()])
        if not row_text:
            continue

        # Add entire row as a unit
        row_words = row_text.split()
        current_chunk_words.extend(row_words)

        # Flush into chunks if we exceed limit
        while len(current_chunk_words) >= max_chunk_words:
            chunk_text = " ".join(current_chunk_words[:max_chunk_words])
            chunks.append({
                "content": chunk_text.strip(),
                "filename": file_path
            })
            # Retain last overlap words
            current_chunk_words = current_chunk_words[max_chunk_words - overlap_words:]

    # Add any leftover words as last chunk
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "content": chunk_text.strip(),
            "filename": file_path
        })

    return chunks

#
# # Usage
# docx_path = Path(__file__).resolve().parent.parent / "data" / "colt" / "CIC User Guide_v0.3.docx"
# #
# chunks = extract_chunks_by_section(docx_path)
#
# # Preview
# for c in chunks[:3]:
#     print(f"\n\n[SECTION]: {c['section']}\n[CHUNK]: {c['content'][:300]}...")
