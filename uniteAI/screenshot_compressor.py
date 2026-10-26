import base64
from io import BytesIO
from PIL import Image


def compress_base64_image(
        base64_image: str,
        max_width: int = 1280,
        quality: int = 50
) -> str | None:

    if not base64_image:
        return None

    try:

        # ======================================================
        # 1. Remove data URI prefix if present
        # ======================================================

        if base64_image.startswith("data:"):

            encoded_data = base64_image.split(",", 1)[1]

        else:

            encoded_data = base64_image

        # ======================================================
        # 2. Decode Base64
        # ======================================================

        image_bytes = base64.b64decode(
            encoded_data,
            validate=False
        )

        # ======================================================
        # 3. Open image
        # ======================================================

        image = Image.open(
            BytesIO(image_bytes)
        )

        # Force Pillow to load the image
        image.load()

        # ======================================================
        # 4. Convert to RGB
        # ======================================================

        if image.mode != "RGB":

            if image.mode in ("RGBA", "LA"):

                background = Image.new(
                    "RGB",
                    image.size,
                    "white"
                )

                alpha = image.getchannel("A")

                background.paste(
                    image,
                    mask=alpha
                )

                image = background

            else:

                image = image.convert("RGB")

        # ======================================================
        # 5. Resize
        # ======================================================

        if image.width > max_width:

            ratio = (
                max_width /
                float(image.width)
            )

            new_width = max_width

            new_height = int(
                image.height * ratio
            )

            image = image.resize(
                (
                    new_width,
                    new_height
                ),
                Image.Resampling.LANCZOS
            )

        # ======================================================
        # 6. Compress as JPEG
        # ======================================================

        output = BytesIO()

        image.save(
            output,
            format="JPEG",
            quality=quality,
            optimize=True
        )

        # ======================================================
        # 7. Encode again
        # ======================================================

        compressed_base64 = base64.b64encode(
            output.getvalue()
        ).decode("utf-8")

        # ======================================================
        # 8. Return COMPLETE data URI
        # ======================================================

        return (
            # "data:image/jpeg;base64,"
            # +
            compressed_base64
        )

    except Exception as e:

        print(
            "Screenshot compression failed:",
            str(e)
        )

        # Return original image if anything goes wrong
        return base64_image