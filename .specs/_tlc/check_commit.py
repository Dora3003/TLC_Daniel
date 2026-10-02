#!/usr/bin/env python3
import argparse
import re
import sys

TYPES = ["feat", "fix", "refactor", "docs", "test", "style", "perf", "build", "ci", "chore"]
HEADER_RE = re.compile(
    r"^(?P<type>\w+)(?:\((?P<scope>[^)]+)\))?(?P<bang>!)?: (?P<desc>.+)$"
)


def read_message(args):
    if args.message is not None:
        return args.message
    if args.msgfile:
        with open(args.msgfile, "r", encoding="utf-8") as f:
            return f.read()
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return ""


def check(message):
    errors, warnings = [], []
    lines = [ln for ln in message.splitlines() if not ln.lstrip().startswith("#")]
    while lines and not lines[0].strip():
        lines.pop(0)
    if not lines:
        return (["empty commit message"], warnings)

    header = lines[0].rstrip()
    if len(header) > 72:
        warnings.append(f"header is {len(header)} chars (>72)")

    m = HEADER_RE.match(header)
    if not m:
        errors.append(f"header does not match 'type(scope): description': {header!r}")
        return (errors, warnings)

    ctype = m.group("type")
    desc = m.group("desc")
    bang = m.group("bang")

    if ctype not in TYPES:
        errors.append(f"type '{ctype}' is not one of: {', '.join(TYPES)}")
    if not desc.strip():
        errors.append("description is empty")
    else:
        if desc[:1].isupper():
            errors.append(f"description should start lowercase: '{desc[:30]}'")
        if desc.rstrip().endswith("."):
            errors.append("description should not end with a period")

    body = "\n".join(lines[1:])
    breaking_footer = bool(re.search(r"^BREAKING CHANGE:", body, re.MULTILINE))
    if bang and not breaking_footer:
        errors.append("'!' breaking marker present but no 'BREAKING CHANGE:' footer")

    return (errors, warnings)


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("msgfile", nargs="?", default=None)
    p.add_argument("--message", default=None)
    args = p.parse_args(argv)
    message = read_message(args)
    if not message.strip():
        print("check_commit: no message provided", file=sys.stderr)
        return 2
    errors, warnings = check(message)
    for w in warnings:
        print(f" WARN {w}")
    for e in errors:
        print(f" ERROR {e}")
    if errors:
        print("\ncheck_commit: FAIL")
        return 1
    print("check_commit: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
