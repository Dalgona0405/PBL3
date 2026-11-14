import requests
from bs4 import BeautifulSoup
import csv
import time     ### Thư viện thời gian để đi ngủ
import random   ### Để ngủ ngẫu nhiên cho giống người thật

def job_infor(job_url):
    # Cấu hình thử lại tối đa 3 lần
    MAX_RETRIES = 3
    
    for lan_thu in range(MAX_RETRIES):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            # Thêm timeout=10 để nếu mạng lag quá 10s thì tự cắt, không treo máy
            res = requests.get(job_url, headers=headers, timeout=10)
            
            if res.status_code == 200:
                soup_detail = BeautifulSoup(res.content, 'html.parser')

                deadline = 'Không có deadline'
                dia_chi_sach = 'Không có địa chỉ'

                # Tìm deadline
                deadline_tag = soup_detail.find('div', class_='job-detail__info--deadline-date')
                if deadline_tag:
                    deadline = deadline_tag.text.strip()

                # Tìm địa chỉ
                danh_sach_ngan_tu = soup_detail.find_all('div', class_='job-description__item')

                for ngan_tu in danh_sach_ngan_tu:
                    nhan_dan = ngan_tu.find('h3')
                    
                    if nhan_dan and 'Địa điểm làm việc' in nhan_dan.get_text():
                        noi_dung = ngan_tu.find('div', class_='job-description__item--content')
                        # Dùng get_text và tiện tay cắt bỏ dấu gạch ngang ở đầu "- Hà Nội..."
                        dia_chi_sach = noi_dung.get_text(strip=True).replace("- ", "", 1)
                        print("    [+] Bắt được địa chỉ:", dia_chi_sach)
                        break 
                        
                return deadline, dia_chi_sach
            
            else:
                print(f"   ! Lần {lan_thu + 1}: Web trả về code {res.status_code}. Đang thử lại...")
                time.sleep(3)
                
        except Exception as e:
            print(f"   ! Lỗi mạng lần {lan_thu + 1}: {e}")
            time.sleep(5)

    # Nếu thử hết 3 lần không được thì báo lỗi
    print(f"   x Đã thử {MAX_RETRIES} lần nhưng thất bại: {job_url}")
    return "Lỗi", "Lỗi"

SO_TRANG_CAN_CAO = 7

# Link gốc
base_url = "https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-cr257?category_family=r257"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
csv_file = 'job_listings_1.csv'

with open(csv_file, mode='w', newline='', encoding='utf-8-sig') as file:
    writer = csv.DictWriter(file, fieldnames=['OriginalId', 'Deadline', 'Address'])
    writer.writeheader()

    for page in range(1, SO_TRANG_CAN_CAO + 1):
        current_url = f"{base_url}&page={page}"
        print(f"\n--- Đang cào trang {page}/{SO_TRANG_CAN_CAO} ---")
        
        try:
            response = requests.get(current_url, headers=headers)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                job_listings = soup.find_all('div', class_='job-item-search-result')
                
                if not job_listings:
                    print("Hết việc để cào rồi! Dừng lại thôi.")
                    break

                for job in job_listings:
                    try:
                        job_id = job.get('data-job-id', 'No ID')
                        title_tag = job.find('h3', class_='title')
                        job_title = title_tag.text.strip() if title_tag else 'No Title'
                        link_tag = title_tag.find('a') if title_tag else None
                        job_link = link_tag.get('href') if link_tag else None

                        deadline, address = 'N/A', 'N/A'
                        if job_link:
                            print(f"  -> Đang đọc: {job_title[:30]}...") 
                            deadline, address = job_infor(job_link)
                            time.sleep(random.randint(3, 7))
                        
                        writer.writerow({
                            'OriginalId': job_id,
                            'Deadline': deadline,
                            'Address': address
                        })
                    except Exception as e:
                        continue 

                print(f"-> Xong trang {page}. Nghỉ xíu lấy sức...")
                time.sleep(random.randint(3, 10))
                
            else:
                print(f"Trang {page} bị lỗi: {response.status_code}")
                
        except Exception as e:
            print(f"Lỗi kết nối trang {page}: {e}")