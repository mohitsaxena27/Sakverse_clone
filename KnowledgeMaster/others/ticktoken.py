import tiktoken

def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))

# Example:
text = "Hello world!"
print(count_tokens(text))  # e.g. prints 4
