"""Send one request to a locally running ticket triage API."""

import json
from urllib.request import Request, urlopen

payload = json.dumps(
    {
        "text": "I was charged twice and this is unacceptable.",
    }
).encode("utf-8")
request = Request(
    "http://127.0.0.1:8000/api/v1/predictions",
    data=payload,
    headers={"Content-Type": "application/json"},
)
with urlopen(request, timeout=10) as response:
    print(response.read().decode("utf-8"))
