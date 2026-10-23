import sys
import json
import base64
import traceback

print("DEBUG: Python worker started", file=sys.stderr, flush=True)

from rembg import remove, new_session

print("DEBUG: rembg imported successfully", file=sys.stderr, flush=True)


def send_message(message):
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


def main():
    print("DEBUG: Loading u2netp model...", file=sys.stderr, flush=True)

    session = new_session("u2netp")

    print("DEBUG: AI model loaded successfully!", file=sys.stderr, flush=True)

    send_message({"ready": True})

    for line in sys.stdin:
        request = {}

        try:
            request = json.loads(line)
            request_id = request.get("id")
            image_data = base64.b64decode(request["image"])

            result = remove(image_data, session=session)

            send_message({
                "id": request_id,
                "image": base64.b64encode(result).decode("ascii")
            })

        except Exception as error:
            traceback.print_exc(file=sys.stderr)

            send_message({
                "id": request.get("id"),
                "error": str(error)
            })


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)