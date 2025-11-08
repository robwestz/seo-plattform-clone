#!/bin/bash
# SEO Platform Progress Monitor

while true; do
    clear
    echo "🔍 SEO PLATFORM BUILD STATUS"
    echo "============================"
    date
    echo ""
    
    # Check mega-files
    echo "MEGA-FILES CREATED:"
    for team in alpha beta gamma delta epsilon zeta eta theta iota kappa; do
        count=$(find mega-files/$team -name "*.yaml" 2>/dev/null | wc -l)
        printf "%-10s: %2d/10\n" "$team" "$count"
    done
    
    echo ""
    echo "Press Ctrl+C to exit"
    sleep 10
done
