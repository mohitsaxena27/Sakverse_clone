from PIL import Image, ImageDraw, ImageFont

# Create a blank white image
width, height = 500, 300
image = Image.new('RGB', (width, height), color='white')

# Create a drawing object
draw = ImageDraw.Draw(image)

# Draw shapes
draw.rectangle([(50, 50), (450, 250)], outline='black', width=3)
draw.ellipse([(200, 100), (300, 200)], fill='skyblue', outline='blue')

# Add some text
text = "Hello, World!"
font = ImageFont.load_default()
text_position = (width // 2 - len(text) * 3, height - 40)
draw.text(text_position, text, fill='black', font=font)

# Save the image
image.save('generated_image.png')

print("Image created and saved as 'generated_image.png'")