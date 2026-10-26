FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable stdout/stderr unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal build tools (helps installing some wheels like pandas if needed)
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends build-essential gcc && \
#     rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirments.txt /app/

# Upgrade pip and install dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirments.txt uvicorn[standard] gunicorn

# Copy application source
COPY . /app

# Ensure uploads folder exists
RUN mkdir -p /app/uploads

EXPOSE 5555

# Run FastAPI with Uvicorn (module: main:app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5555"]