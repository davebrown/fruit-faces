#!/usr/bin/env python

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import WebDriverException
import json
import os
import sys
import shutil
import time
import traceback

DIR=os.path.dirname(os.path.realpath(__file__))
URL= os.environ.get('FF_TEST_URL', 'http://localhost:3000')
CREDS = {
  'username': None,
  'password': None
}

def testLoginAndUpload():
  driver.get(URL)
  print('logging in as %s' % CREDS['username'])
  driver.find_element(By.CLASS_NAME, 'bm-burger-button').click()
  WAIT.until(EC.element_to_be_clickable((By.LINK_TEXT, 'Login'))).click()

  windows = driver.window_handles
  driver.switch_to_window(windows[1])

  driver.find_element(By.ID, 'email').send_keys(CREDS['username'])
  driver.find_element(By.ID, 'pass').send_keys(CREDS['password'])
  driver.find_element(By.ID, 'loginbutton').click()

  windows = driver.window_handles
  driver.switch_to_window(windows[0])

  uploadLink = WAIT.until(EC.element_to_be_clickable((By.ID, 'mosaic-upload-link')))
  time.sleep(2)
  uploadLink.click()
  #driver.find_element(By.ID, 'mosaic-upload-link').click()
  driver.find_element(By.ID, 'post-to-fb-check').click()
  fbComment = driver.find_element(By.ID, 'fb-comment-text')
  fbComment.click()
  fbComment.send_keys('This is a comment from Selenium')

  fileUpload = driver.find_element(By.XPATH, "//input[@name='ajax_upload_file_input']")
  fileUpload.send_keys('%s/ff-test-image.jpg' % DIR)

  time.sleep(1)
  uploadButton = driver.find_element(By.ID, "upload-button")
  uploadButton.click()

  time.sleep(10)
  
if __name__ == '__main__':
  if len(sys.argv) != 3:
    sys.stderr.write('usage: %s <test-user-email> <test-user-password>\n' % sys.argv[0])
    sys.exit(1)

  exitVal = 0
  CREDS['username'] = sys.argv[1]
  CREDS['password'] = sys.argv[2]
  global driver
  global WAIT
  driver=webdriver.Chrome()
  WAIT = WebDriverWait(driver, 10)
  try:
    driver.set_window_size(1024, 768)
    driver.implicitly_wait(10)

    testLoginAndUpload()
  except Exception as e:
    traceback.print_exc()
    time.sleep(10)
    exitVal = 1
  finally:
    driver.quit()
  sys.exit(exitVal)

