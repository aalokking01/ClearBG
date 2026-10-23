
import sys
import json
import base64
import traceback

from rembg import remove, new_session


def send_message(message):
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


def main():
    # AI model sirf ek baar load hoga
    session = new_session("u2netp")
    send_message({"ready": True})

    for line in sys.stdin:
        request = {}

        try:
            request = json.loads(line)
            request_id = request.get("id")
            image_data = base64.b64decode(request["image"])

            # Wahi model har image ke liye reuse hoga
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
    main()

