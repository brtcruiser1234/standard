#!/bin/bash
# Validate YAML syntax on file save
# Called by Claude Code after editing .yml/.yaml files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the file that was edited
FILE="$1"

# Check if file exists and is YAML
if [[ ! "$FILE" =~ \.(yml|yaml)$ ]]; then
    exit 0  # Not a YAML file, skip
fi

if [[ ! -f "$FILE" ]]; then
    exit 0  # File doesn't exist
fi

# Try to validate YAML
if command -v python3 &> /dev/null; then
    if python3 -c "import yaml; yaml.safe_load(open('$FILE'))" 2>&1; then
        echo -e "${GREEN}✓ $FILE${NC} - Valid YAML"
        exit 0
    else
        ERROR=$(python3 -c "import yaml; yaml.safe_load(open('$FILE'))" 2>&1)
        echo -e "${RED}✗ $FILE${NC} - YAML Syntax Error:"
        echo "$ERROR"
        exit 1
    fi
elif command -v yq &> /dev/null; then
    if yq eval '.' "$FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $FILE${NC} - Valid YAML"
        exit 0
    else
        ERROR=$(yq eval '.' "$FILE" 2>&1)
        echo -e "${RED}✗ $FILE${NC} - YAML Syntax Error:"
        echo "$ERROR"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ YAML validation requires python3 or yq${NC}"
    exit 0
fi
