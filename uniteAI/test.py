from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "https://dev.compliancealpha.com/"

OUTPUT_DIR = Path("results")
OUTPUT_DIR.mkdir(exist_ok=True)


def run_test(playwright, headless: bool):
    mode = "headless" if headless else "headed"

    browser = playwright.chromium.launch(
        channel="chrome",
        headless=headless,
    )

    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
    )

    page = context.new_page()

    print(f"\n===== {mode.upper()} =====")

    response = page.goto(
        URL,
        wait_until="networkidle",
        timeout=60000,
    )

    if response:
        print("HTTP Status:", response.status)

    print("Title:", page.title())
    print("URL:", page.url)

    # Give the fingerprint tests time to complete
    page.wait_for_timeout(5000)

    # Save screenshot
    screenshot = OUTPUT_DIR / f"{mode}.png"
    page.screenshot(
        path=str(screenshot),
        full_page=True,
    )

    # Save HTML
    html = OUTPUT_DIR / f"{mode}.html"
    html.write_text(page.content(), encoding="utf-8")

    print(f"Screenshot: {screenshot}")
    print(f"HTML:       {html}")

    browser.close()


with sync_playwright() as p:
    run_test(p, headless=False)
    run_test(p, headless=True)