#!/usr/bin/env python3
"""Local schema-validation hook used by patch tooling.

This project does not currently define an additional schema validation step for
manual patches. Keep this hook present and successful so local patch workflows
do not fail on a missing file; add real checks here if the repo later needs
patch-time schema validation.
"""

from __future__ import annotations

import sys


def main() -> int:
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
