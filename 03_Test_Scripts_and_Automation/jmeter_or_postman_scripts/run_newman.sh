#!/bin/bash
# =============================================================
# NEWMAN API TEST RUNNER – EduScale
# Script ini menjalankan Postman collection menggunakan Newman
#
# Prasyarat:
#   npm install -g newman newman-reporter-htmlextra
#
# Cara Menjalankan:
#   cd tests/postman
#   chmod +x run_newman.sh
#   ./run_newman.sh
#
# Output:
#   - CLI report di terminal
#   - HTML report di: tests/postman/reports/newman_report.html
# =============================================================

set -e

COLLECTION="EduScale_API.postman_collection.json"
ENVIRONMENT="EduScale_Env.postman_environment.json"
REPORT_DIR="reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
HTML_REPORT="${REPORT_DIR}/newman_report_${TIMESTAMP}.html"
JSON_REPORT="${REPORT_DIR}/newman_report_${TIMESTAMP}.json"

# Buat direktori reports jika belum ada
mkdir -p "$REPORT_DIR"

echo "======================================================="
echo "  EDUSCALE – Newman API Test Runner"
echo "  Tanggal: $(date '+%d-%m-%Y %H:%M:%S')"
echo "======================================================="
echo ""
echo "Collection : $COLLECTION"
echo "Environment: $ENVIRONMENT"
echo "Report Dir : $REPORT_DIR"
echo ""

# Cek apakah Newman terinstall
if ! command -v newman &> /dev/null; then
    echo "❌ Newman tidak ditemukan. Install dengan:"
    echo "   npm install -g newman newman-reporter-htmlextra"
    exit 1
fi

echo "✅ Newman ditemukan: $(newman --version)"
echo ""
echo "🚀 Menjalankan API tests..."
echo ""

# Jalankan Newman
newman run "$COLLECTION" \
    --environment "$ENVIRONMENT" \
    --reporters cli,htmlextra,json \
    --reporter-htmlextra-export "$HTML_REPORT" \
    --reporter-json-export "$JSON_REPORT" \
    --reporter-htmlextra-title "EduScale API Test Report" \
    --reporter-htmlextra-browserTitle "EduScale QA" \
    --reporter-htmlextra-showEnvironmentData \
    --reporter-htmlextra-showGlobalData \
    --reporter-htmlextra-showMarkdownLinks \
    --color on \
    --timeout-request 10000 \
    --delay-request 100

EXIT_CODE=$?

echo ""
echo "======================================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "  ✅ SEMUA TEST PASSED"
else
    echo "  ❌ ADA TEST YANG FAILED (exit code: $EXIT_CODE)"
fi
echo ""
echo "  📄 HTML Report : $HTML_REPORT"
echo "  📄 JSON Report : $JSON_REPORT"
echo "======================================================="

exit $EXIT_CODE
