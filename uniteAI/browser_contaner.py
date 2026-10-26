from packaging.version import Version
import importlib.metadata


import docker
import time
import requests


# def start_browser_container():
#     client = docker.from_env()
#
#     container = client.containers.run(
#         "mcr.microsoft.com/playwright:v1.43.0-jammy",
#         command="bash -c 'npx playwright run-server --port 3000 --host 0.0.0.0'",
#         ports={'3000/tcp': None},  # dynamic port
#         detach=True
#     )
#
#     # Get mapped port
#     container.reload()
#     port = container.attrs['NetworkSettings']['Ports']['3000/tcp'][0]['HostPort']
#
#     ws_endpoint = f"http://localhost:{port}"
#
#     # Wait for container to be ready
#     for _ in range(15):
#         try:
#             requests.get(ws_endpoint)
#             break
#         except:
#             time.sleep(1)
#
#     return container, ws_endpoint

def start_browser_container():
    import docker, time

    client = docker.from_env()

    # container = client.containers.run(
    #     "mcr.microsoft.com/playwright/python:v1.57.0-noble",
    #     command="bash -c 'npx playwright run-server --port 3000 --host 0.0.0.0'",
    #     ports={'3000/tcp': None},
    #     detach=True
    # )
    #
    # container.reload()
    # port = container.attrs['NetworkSettings']['Ports']['3000/tcp'][0]['HostPort']
    #
    # # ✅ IMPORTANT: Use WS endpoint
    # ws_endpoint = f"ws://localhost:{port}"
    #
    # time.sleep(10)
    # allow server startup
    # volumes = {
    #     r"C:\TestData": {
    #         "bind": "/testdata",
    #         "mode": "rw"
    #     }
    # }
    playwright_version=importlib.metadata.version("playwright")
    print("Playwright version:", playwright_version)
    # container = client.containers.run(
    #     "mcr.microsoft.com/playwright/python:v1.58.0-noble",
    #     command='/bin/sh -c "python -m pip install playwright==1.58.0 && python -m playwright run-server --port 3888 --host 0.0.0.0"',
    #     detach=True,
    #     ports={"3888/tcp": None}
    # )
    container = client.containers.run(
        f"mcr.microsoft.com/playwright/python:v{playwright_version}-noble",

        command=(
            f'/bin/sh -c "'
            f'python -m pip install playwright=={playwright_version} && '
            f'python -m playwright run-server '
            f'--port 3888 '
            f'--host 0.0.0.0'
            f'"'
        ),

        detach=True,
        ports={"3888/tcp": None}
    )

    # wait for container boot
    time.sleep(10)

    container.reload()
    port_info = container.attrs["NetworkSettings"]["Ports"]["3888/tcp"][0]
    host_port = port_info["HostPort"]

    ws_url = f"ws://host.docker.internal:{host_port}/"
    return container, ws_url

def connect_with_retry(p, ws_endpoint, retries=30, delay=20):
    last_error = None

    for attempt in range(retries):
        try:
            browser = p.chromium.connect(ws_endpoint)
            return browser
        except Exception as e:
            last_error = e
            time.sleep(delay)

    raise Exception(f"Failed to connect after {retries} attempts: {last_error}")

