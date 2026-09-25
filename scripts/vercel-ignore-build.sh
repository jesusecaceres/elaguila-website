#!/bin/sh
# Vercel Ignored Build Step (referenced from vercel.json "ignoreCommand").
# Exit 1 = BUILD, exit 0 = SKIP. Kept in a script because vercel.json limits ignoreCommand to 256 characters.
# Production always builds; Previews build only for the allowlisted branches below.

case "${VERCEL_ENV}:${VERCEL_GIT_COMMIT_REF}" in
  production:*|\
  *:integration/leonix-canonical-launch-consolidation-2026-09-22|\
  *:release/golden-applications-final-2026-09-24|\
  *:recovery/golden-survivor-integration-2026-09-25)
    exit 1
    ;;
  *)
    exit 0
    ;;
esac
