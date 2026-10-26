import base64
import logging
from io import BytesIO
from datetime import datetime

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader


# Suppress PIL debug logs
logging.getLogger("PIL").setLevel(logging.WARNING)


class TestExecutionPDFGenerator:

    def __init__(self, output_path: str):
        self.output_path = output_path
        self.styles = getSampleStyleSheet()

    def generate(self, execution_data: dict) -> str:

        doc = SimpleDocTemplate(self.output_path, pagesize=A4)
        elements = []

        # =========================
        # HEADER
        # =========================
        elements.append(Paragraph("Test Execution Report", self.styles["Heading1"]))
        elements.append(Spacer(1, 0.3 * inch))

        elements.append(
            Paragraph(
                f"Overall Status: {execution_data.get('status', 'N/A')}",
                self.styles["Heading2"]
            )
        )

        elements.append(
            Paragraph(
                f"Generated On: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                self.styles["Normal"]
            )
        )

        elements.append(Spacer(1, 0.4 * inch))

        # =========================
        # SUMMARY
        # =========================
        results = execution_data.get("results", [])

        total = len(results)
        passed = len([r for r in results if r.get("status") == "passed"])
        failed = len([r for r in results if r.get("status") == "failed"])

        summary_table = Table([
            ["Total Steps", total],
            ["Passed", passed],
            ["Failed", failed]
        ], colWidths=[2.5 * inch, 2 * inch])

        summary_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 1), (-1, 1), colors.lightgreen),
            ('BACKGROUND', (0, 2), (-1, 2), colors.salmon),
        ]))

        elements.append(summary_table)
        elements.append(PageBreak())

        # =========================
        # DETAILED STEPS
        # =========================
        for index, result in enumerate(results, start=1):

            elements.append(
                Paragraph(
                    f"Step {index}: {result.get('step', '')}",
                    self.styles["Heading2"]
                )
            )

            elements.append(Spacer(1, 0.2 * inch))

            table_data = [
                ["Step Type", result.get("step_type", "")],
                ["Status", result.get("status", "")],
                ["Target", result.get("target", "")],
                ["Data", result.get("data", "")],
                ["Error", result.get("error", "")]
            ]

            table = Table(table_data, colWidths=[2.2 * inch, 4 * inch])

            status_color = colors.lightgreen if result.get(
                "status") == "passed" else colors.salmon

            table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BACKGROUND', (0, 1), (-1, 1), status_color),
            ]))

            elements.append(table)
            elements.append(Spacer(1, 0.3 * inch))

            # =========================
            # SCREENSHOT (No temp file)
            # =========================
            screenshot_data = result.get("screenshot")

            if screenshot_data:
                try:
                    image_bytes = base64.b64decode(screenshot_data)
                    image_stream = BytesIO(image_bytes)

                    image_reader = ImageReader(image_stream)
                    iw, ih = image_reader.getSize()
                    aspect = ih / float(iw)

                    img = Image(
                        image_stream,
                        width=5 * inch,
                        height=(5 * inch) * aspect
                    )

                    elements.append(img)
                    elements.append(Spacer(1, 0.3 * inch))

                except Exception as e:
                    elements.append(
                        Paragraph(
                            f"Screenshot rendering failed: {str(e)}",
                            self.styles["Normal"]
                        )
                    )

            elements.append(PageBreak())

        # =========================
        # BUILD PDF
        # =========================
        doc.build(elements)

        return self.output_path