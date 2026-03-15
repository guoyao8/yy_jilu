from playwright.sync_api import sync_playwright
import random

base_url = "http://localhost:3000"

phone1 = "1" + str(random.randint(3000000000, 9999999999))
phone2 = "1" + str(random.randint(3000000000, 9999999999))
password = "test1234"

results = []


def record(name, ok, detail=""):
    results.append((name, ok, detail))


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_default_timeout(10000)
    page.goto(base_url + "/register", wait_until="networkidle")
    page.evaluate("localStorage.clear()")

    try:
        page.locator("button").nth(0).click()
        page.locator('input[type="tel"]').wait_for()
        page.locator('input[type="tel"]').fill(phone1)
        page.locator('input[type="password"]').nth(0).fill(password)
        page.locator('input[type="password"]').nth(1).fill(password)
        page.locator('input[type="text"]').nth(0).fill("testerA")
        page.locator('input[type="text"]').nth(1).fill("familyA")
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(1500)
        url = page.url
        error_count = page.locator("p.text-red-500").count()
        record("create_family", url.endswith("/") and error_count == 0, f"url={url}, error={error_count}")
    except Exception as e:
        record("create_family", False, str(e))

    invite_code = ""
    try:
        page.goto(base_url + "/family", wait_until="networkidle")
        invite_code = page.locator("p.text-2xl").first.inner_text().strip()
        record("read_invite", bool(invite_code), invite_code)
    except Exception as e:
        record("read_invite", False, str(e))

    try:
        page.locator('button:has-text("退出")').click()
        page.wait_for_timeout(800)
        record("logout", True, "")
    except Exception as e:
        record("logout", False, str(e))

    try:
       
        page.goto(base_url + "/register", wait_until="networkidle")
        page.locator("button").nth(1).click()
        page.locator('input[type="tel"]').wait_for()
        page.locator('input[type="tel"]').fill(phone2)
        page.locator('input[type="password"]').nth(0).fill(password)
        page.locator('input[type="password"]').nth(1).fill(password)
        page.locator('input[type="text"]').nth(0).fill("testerB")
        page.locator('input[type="text"]').nth(1).fill(invite_code)
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(1500)
        url = page.url
        error_count = page.locator("p.text-red-500").count()
        record("join_family", url.endswith("/") and error_count == 0, f"url={url}, error={error_count}")
    except Exception as e:
        record("join_family", False, str(e))

    browser.close()

with open("/tmp/test_results.txt", "w", encoding="utf-8") as f:
    f.write("TEST_RESULTS\n")
    for name, ok, detail in results:
        status = "PASS" if ok else "FAIL"
        f.write(f"{name}: {status} {detail}\n")

if any(not ok for _, ok, _ in results):
    raise SystemExit(1)
