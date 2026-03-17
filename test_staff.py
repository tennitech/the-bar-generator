from playwright.sync_api import sync_playwright
import time
import subprocess

def test():
    # Start the local server
    server = subprocess.Popen(["python3", "-m", "http.server", "8000"])
    try:
        time.sleep(1) # wait for server to start
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto("http://127.0.0.1:8000")
            page.select_option("#style-select", value="music")
            time.sleep(0.5)
            
            # Click buttons to add notes
            # C4
            page.click('.key[data-note="C4"]')
            # Eighth
            page.click('.duration-btn[data-duration="0.5"]')
            # G4
            page.click('.key[data-note="G4"]')
            # A4
            page.click('.key[data-note="A4"]')
            
            # Half
            page.click('.duration-btn[data-duration="2"]')
            # E4
            page.click('.key[data-note="E4"]')
            
            time.sleep(1)
            page.screenshot(path="staff_test.png")
            print("Screenshot saved to staff_test.png")
            browser.close()
    finally:
        server.terminate()

test()
