import requests
from bs4 import BeautifulSoup
import csv  # Thư viện để ghi file CSV
import time
import random

def company_infor(company_url):
    MAX_RETRIES = 3
    for lan_thu in range(MAX_RETRIES):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            res = requests.get(company_url, headers=headers, timeout=10)
            if res.status_code == 200:
                soup_company = BeautifulSoup(res.content, 'html.parser')
                
                company_name_tag = soup_company.find('h1', class_='company-detail-name text-highlight')
                company_name = company_name_tag.text.strip() if company_name_tag else 'Không có tên công ty'

                icon_tag = soup_company.find('i', class_='fa-solid fa-buildings')
                company_size = 'Không có mô tả công ty' # Gán sẵn mặc định
                if icon_tag:
                    # Nhảy lên cái hộp div to bọc cả icon lẫn chữ
                    parent_div = icon_tag.find_parent('div', class_='company-subdetail-info')
                    if parent_div:
                        # Từ hộp div to, tìm cái hộp span chứa chữ
                        text_tag = parent_div.find('span', class_='company-subdetail-info-text')
                        if text_tag:
                            company_size = text_tag.text.strip()

                company_logo_tag = soup_company.find('div', class_='company-image-logo')
                company_logo = company_logo_tag.find('img')['src'] if company_logo_tag and company_logo_tag.find('img') else 'Không có logo'

                return company_name, company_size, company_logo
            else:
                print(f"   ! Lần {lan_thu + 1}: Web trả về code {res.status_code}. Đang thử lại...")
                time.sleep(3)
        except Exception as e:
            print(f"   ! Lỗi mạng lần {lan_thu + 1}: {e}")
            time.sleep(5)
    print(f"   x Đã thử {MAX_RETRIES} lần nhưng thất bại: {company_url}")
    return "Lỗi", "Lỗi", "Lỗi"

# ... (Giữ nguyên hàm company_infor ở trên nha, tui chỉ sửa từ đoạn SO_TRANG_CAN_CAO) ...

SO_TRANG_CAN_CAO = 5
base_url = "https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-cr257?category_family=r257"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
csv_file = 'company_listings.csv'

scraped_companies = set()

# Dùng 'utf-8-sig' để Excel không bị lỗi font tiếng Việt nha
with open(csv_file, mode='w', newline='', encoding='utf-8-sig') as file:
    fieldnames = ['Company Name', 'Company Size', 'Company Logo']
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()

    for page in range(1, SO_TRANG_CAN_CAO + 1):
        print(f"\n--- Đang cào trang {page} ---")
        current_url = f"{base_url}&page={page}"
        try:
            res = requests.get(current_url, headers=headers, timeout=10)
            if res.status_code == 200:
                soup = BeautifulSoup(res.content, 'html.parser')
                job_listings = soup.find_all('div', class_='job-item-search-result')
                
                if not job_listings:
                    print("Hết việc để cào rồi! Dừng lại thôi.")
                    break

                for job in job_listings:
                    try:
                        company_link_tag = job.find('a', class_='company')
                        company_link = company_link_tag['href'] if company_link_tag else None
                        
                        if company_link:
                            # KIỂM TRA SỔ TAY: Đã cào công ty này chưa?
                            if company_link in scraped_companies:
                                continue # Đã cào rồi thì bỏ qua luôn cho nhanh
                            
                            # Chưa cào thì ghi vào sổ tay
                            scraped_companies.add(company_link)
                            
                            print(f" -> Đang cào công ty mới: {company_link}")
                            company_name, company_size, company_logo = company_infor(company_link)
                            time.sleep(random.randint(3, 5))
                            
                            writer.writerow({
                                'Company Name': company_name,
                                'Company Size': company_size,
                                'Company Logo': company_logo
                            })
                    except Exception as e:
                        print(f"   ! Lỗi khi xử lý 1 công ty trong danh sách: {e}")
                        continue
        except Exception as e:
            print(f"   ! Lỗi khi truy cập trang {page}: {e}")
            time.sleep(5)
            continue
            
print("Xong xuôi hết rồi nha, bà mở file CSV lên check thử xem!")