# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app



# Copy requirements file
COPY requirments.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirments.txt


# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 6666

# Run the application
CMD ["python", "main2.py"]
