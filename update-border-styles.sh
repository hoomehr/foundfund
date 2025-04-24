#!/bin/bash

# Find all files with border-border class
files=$(grep -r "border-border" --include="*.tsx" --include="*.jsx" src/ | cut -d: -f1 | sort | uniq)

# Loop through each file
for file in $files; do
  # Replace 'border border-border' with 'border' and add inline style
  sed -i '' 's/border border-border/border" style={{ borderColor: '\''var(--border)'\'' }}/g' "$file"
  
  # Replace 'border-b border-border' with 'border-b' and add inline style
  sed -i '' 's/border-b border-border/border-b" style={{ borderColor: '\''var(--border)'\'' }}/g' "$file"
  
  # Replace 'border-t border-border' with 'border-t' and add inline style
  sed -i '' 's/border-t border-border/border-t" style={{ borderColor: '\''var(--border)'\'' }}/g' "$file"
done

echo "Updated all border-border styles to use inline styles"
