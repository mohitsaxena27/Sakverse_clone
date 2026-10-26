from sentence_transformers import SentenceTransformer

# This will download and cache the model locally
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Save the model to a directory
model.save('models/all-MiniLM-L6-v2')