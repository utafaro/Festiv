#!/usr/bin/env bash
# Build sideloadable .ipa without Apple Dev Program license.
# Automates the manual steps from Readme.md: prebuild, pod install,
# xcodebuild archive, then repack the .app into a Payload/.ipa.
#
# Usage:
#   scripts/build-ipa.sh -t TEAM_ID [-o output.ipa] [-c Release]
#   TEAM_ID: 254626Q9MG
#
# TEAM_ID: your Apple ID "Personal Team" id, found in Xcode ->
#   Settings -> Accounts -> (your Apple ID) -> Team, or in an existing
#   project.pbxproj under DEVELOPMENT_TEAM after signing once manually.

set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MOBILE_DIR"

APP_NAME="Festiv"
SCHEME="Festiv"
CONFIGURATION="Release"
TEAM_ID=""
OUTPUT_IPA=""

usage() {
  echo "Usage: $0 -t TEAM_ID [-o output.ipa] [-c Release]"
  exit 1
}

while getopts "t:o:c:h" opt; do
  case "$opt" in
    t) TEAM_ID="$OPTARG" ;;
    o) OUTPUT_IPA="$OPTARG" ;;
    c) CONFIGURATION="$OPTARG" ;;
    h) usage ;;
    *) usage ;;
  esac
done

if [ -z "$TEAM_ID" ]; then
  echo "Error: -t TEAM_ID requis (Apple ID Personal Team id)." >&2
  usage
fi

if [ -z "$OUTPUT_IPA" ]; then
  OUTPUT_IPA="$MOBILE_DIR/build/${APP_NAME}-$(date +%Y%m%d-%H%M%S).ipa"
fi
mkdir -p "$(dirname "$OUTPUT_IPA")"

echo "==> Nettoyage ios/ et DerivedData"
rm -rf "$MOBILE_DIR/ios"
rm -rf "$HOME/Library/Developer/Xcode/DerivedData/${APP_NAME}-"*

echo "==> expo prebuild"
npx expo prebuild --platform ios --clean

echo "==> pod install"
(cd ios && pod install)

WORKSPACE="ios/${APP_NAME}.xcworkspace"
ARCHIVE_PATH="$MOBILE_DIR/build/${APP_NAME}.xcarchive"
rm -rf "$ARCHIVE_PATH"

echo "==> xcodebuild archive (team $TEAM_ID)"
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE=Automatic

APP_PATH="$ARCHIVE_PATH/Products/Applications/${APP_NAME}.app"
if [ ! -d "$APP_PATH" ]; then
  echo "Error: .app introuvable dans l'archive ($APP_PATH)." >&2
  exit 1
fi

echo "==> Packaging .ipa"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
mkdir "$WORK_DIR/Payload"
cp -R "$APP_PATH" "$WORK_DIR/Payload/"
(cd "$WORK_DIR" && zip -qry "$OUTPUT_IPA" Payload)
rm -rf "$ARCHIVE_PATH"

echo "==> Terminé: $OUTPUT_IPA"
echo "Installe-le via un sideloader (AltStore, Sideloadly, ...)."
