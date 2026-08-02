import re

def clean_text(text: str) -> str:
    """
    Cleans raw extracted PDF text by:
    - Trimming leading/trailing whitespace from each line and the whole document
    - Normalizing multiple horizontal spaces (spaces and tabs) to a single space
    - Collapsing consecutive blank lines into at most one blank line
    """
    if not text:
        return ""
    
    # Normalize horizontal spaces/tabs on each line
    text = re.sub(r"[ \t]+", " ", text)
    
    # Split into lines and trim whitespace on each line
    lines = [line.strip() for line in text.splitlines()]
    
    # Remove repeated blank lines (allow at most one blank line between content lines)
    cleaned_lines = []
    prev_was_empty = False
    
    for line in lines:
        if line == "":
            if not prev_was_empty:
                cleaned_lines.append("")
                prev_was_empty = True
        else:
            cleaned_lines.append(line)
            prev_was_empty = False
            
    # Rejoin the lines and trim final output
    return "\n".join(cleaned_lines).strip()
