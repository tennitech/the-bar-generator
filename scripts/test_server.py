"""Serve this checkout for browser checks and time-limited previews."""
import argparse
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Event, Thread, Timer
from urllib.request import Request, urlopen


DEFAULT_TIMEOUT = 30 * 60
MERGE_CHECK_INTERVAL = 60


class BrowserTestServer(ThreadingHTTPServer):
    # A browser may request many modules while other test pages start. Python
    # versions with the small TCPServer default backlog can reset those requests.
    request_queue_size = 128


def merge_status_url(pr_url):
    match = re.fullmatch(
        r"https://github\.com/([\w.-]+)/([\w.-]+)/pull/([1-9][0-9]*)/?",
        pr_url,
        re.ASCII,
    )
    if not match:
        raise argparse.ArgumentTypeError("expected a GitHub pull request URL")
    owner, repo, number = match.groups()
    return f"https://api.github.com/repos/{owner}/{repo}/pulls/{number}/merge"


def watch_merge(server, done, status_url):
    request = Request(status_url, headers={"Accept": "application/vnd.github+json"})
    while not done.is_set():
        try:
            with urlopen(request, timeout=5) as response:
                merged = response.status == 204
        except OSError:
            merged = False

        if merged and not done.is_set():
            print("Pull request merged. Closing preview.", flush=True)
            server.shutdown()
            return
        done.wait(MERGE_CHECK_INTERVAL)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument(
        "--timeout", type=int, default=DEFAULT_TIMEOUT,
        help="preview lifetime in seconds (default: 1800)",
    )
    parser.add_argument(
        "--pr", type=merge_status_url,
        help="stop after the linked public GitHub pull request merges",
    )
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("--timeout must be a positive number of seconds")

    root = Path(__file__).resolve().parents[1]
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    with BrowserTestServer(("127.0.0.1", args.port), handler) as server:
        done = Event()

        def expire():
            print("Preview time limit reached. Closing preview.", flush=True)
            server.shutdown()

        timer = Timer(args.timeout, expire)
        timer.daemon = True
        print(
            f"Serving {root} at http://127.0.0.1:{server.server_port} for up to {args.timeout} seconds",
            flush=True,
        )
        timer.start()
        if args.pr:
            Thread(target=watch_merge, args=(server, done, args.pr), daemon=True).start()

        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            done.set()
            timer.cancel()
