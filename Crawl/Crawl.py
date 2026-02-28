import requests
from bs4 import BeautifulSoup
import csv
import time      ### Thư viện thời gian để đi ngủ
import random    ### Để ngủ ngẫu nhiên cho giống người thật

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
                
                description_tag = soup_detail.find('div', class_='job-description__item--content')
                description = description_tag.text.strip() if description_tag else 'Không có mô tả'

                req_section = soup_detail.find('div', class_='job-description__item job-detail-section requirement')
                if req_section:
                    req_content = req_section.find('div', class_='job-description__item--content')
                    requirement = req_content.text.strip() if req_content else 'Không có yêu cầu'
                else:
                    requirement = 'Không có yêu cầu'
                
                ben_section = soup_detail.find('div', class_='job-description__item job-detail-section benefit')
                if ben_section:
                    ben_content = ben_section.find('div', class_='job-description__item--content')
                    benefit = ben_content.text.strip() if ben_content else 'Không có quyền lợi'
                else:
                    benefit = 'Không có quyền lợi'

                return description, requirement, benefit
            
            # Nếu code không phải 200 (ví dụ 404, 500), thử lại
            else:
                print(f"   ! Lần {lan_thu + 1}: Web trả về code {res.status_code}. Đang thử lại...")
                time.sleep(3) # Nghỉ 3s rồi thử lại
                
        except Exception as e:
            # Lỗi mạng
            print(f"   ! Lỗi mạng lần {lan_thu + 1}: {e}")
            time.sleep(5) # Nghỉ 5s cho mạng hồi phục rồi thử lại

    # Nếu đã thử hết 3 lần mà vẫn không được thì báo lỗi và trả về "Lỗi" cho cả 3 trường
    print(f"   x Đã thử {MAX_RETRIES} lần nhưng thất bại: {job_url}")
    return "Lỗi", "Lỗi", "Lỗi"


# 1. Cấu hình số trang muốn cào
SO_TRANG_CAN_CAO = 5

# Link gốc (Lưu ý: chưa có số trang)
base_url = "https://www.topcv.vn/tim-viec-lam-cong-nghe-thong-tin-cr257?category_family=r257"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
csv_file = 'job_listings_multi_pages.csv'

KEYWORDS_LEVEL = ['Thực tập', 'Nhân viên', 'Chuyên viên', 'Trưởng nhóm', 'Quản lý', 'Giám đốc', 'Trưởng phòng']
KEYWORDS_EDU = ['Trung cấp', 'Cao đẳng', 'Đại học', 'Cử nhân', 'Thạc sĩ', 'Kỹ sư']

# 2. Mở file CSV trước khi bắt đầu cào
with open(csv_file, mode='w', newline='', encoding='utf-8-sig') as file:
    writer = csv.DictWriter(file, fieldnames=[
        'ID', 'Job Title', 'Link', 'Company Name', 'Location', 'Posted Date', 
        'Salary', 'Exp Year', 'Level', 'Education', 'Domain', 'Logo URL', 'Description', 'Requirement', 'Benefit'])
    
    # Chỉ viết tiêu đề 1 lần duy nhất ở đầu file
    writer.writeheader()

    # 3. Bắt đầu vòng lặp đi từng trang (Từ trang 1 đến trang N)
    for page in range(1, SO_TRANG_CAN_CAO + 1):
        
        # Tạo URL cho trang hiện tại (Thêm &page=1, &page=2...)
        current_url = f"{base_url}&page={page}"
        print(f"\n--- Đang cào trang {page}/{SO_TRANG_CAN_CAO}: {current_url} ---")
        
        try:
            response = requests.get(current_url, headers=headers)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                job_listings = soup.find_all('div', class_='job-item-search-result')
                
                # Nếu trang này không có việc nào (hết việc) thì dừng luôn
                if not job_listings:
                    print("Hết việc để cào rồi! Dừng lại thôi.")
                    break

                # Xử lý từng việc trong trang này
                for job in job_listings:
                    try:
                        job_id = job.get('data-job-id', 'No ID')
                        
                        avatar_box = job.find('div', class_='avatar')
                        logo_url = 'No Logo'
                        if avatar_box and avatar_box.find('img'):
                            logo_url = avatar_box.find('img').get('data-src')

                        title_tag = job.find('h3', class_='title')
                        job_title = title_tag.text.strip() if title_tag else 'No Title'

                        link_tag = title_tag.find('a')
                        job_link = link_tag.get('href') if link_tag else None

                        company_tag = job.find('a', class_='company')
                        company_name = company_tag.text.strip() if company_tag else 'No Company'

                        location_tag = job.find('label', class_='address truncate')
                        location = location_tag.text.strip() if location_tag else 'Toàn quốc'

                        date_tag = job.find('label', class_='label-update')
                        posted_date = date_tag.text.strip() if date_tag else 'Vừa đăng'

                        salary_tag = job.find('label', class_='title-salary')
                        salary = salary_tag.text.strip() if salary_tag else 'Thỏa thuận'

                        exp_tag = job.find('label', class_='exp')
                        exp_year = exp_tag.text.strip() if exp_tag else 'Không yêu cầu'
                        
                        level = 'Nhân viên'
                        education = 'Không yêu cầu'
                        domain_list = []

                        box_icon = job.find('div', class_='box-icon')
                        if box_icon:
                            visible_tags = box_icon.find_all('a', class_='item-tag')
                            for t in visible_tags:
                                domain_list.append(t.text.strip())
                            
                            hidden_tag = box_icon.find('span', class_='remaining-items')
                            if hidden_tag:
                                hidden_text = hidden_tag.get('title', '')
                                hidden_items = hidden_text.split(',')
                                domain_list.extend([item.strip() for item in hidden_items])
                        
                        final_domains = []
                        for item in domain_list:
                            if any(kw.lower() in item.lower() for kw in KEYWORDS_LEVEL):
                                level = item
                            elif any(kw.lower() in item.lower() for kw in KEYWORDS_EDU):
                                education = item
                            elif any(x in item for x in ['Bảo hiểm', 'Du lịch', 'Thưởng', 'Phụ cấp', 'Thiết bị']):
                                continue
                            else:
                                final_domains.append(item)
                        
                        domain_str = ", ".join(final_domains)

                        desc, req, ben = "N/A", "N/A", "N/A"
                        if job_link:
                            print(f"   -> Đang đọc chi tiết: {job_title}...")
                            desc, req, ben = job_infor(job_link)
                            time.sleep(random.randint(3, 5))

                        # Ghi ngay vào file
                        writer.writerow ({
                            'ID': job_id, 'Job Title': job_title, 'Link': job_link,'Company Name': company_name,
                            'Location': location, 'Posted Date': posted_date, 'Salary': salary,
                            'Exp Year': exp_year, 'Level': level, 'Education': education,
                            'Domain': domain_str, 'Logo URL': logo_url, 'Description': desc, 'Requirement': req, 'Benefit': ben
                        })
            
                    except Exception as e:
                        continue # Lỗi job nào bỏ qua job đó

                print(f"-> Xong trang {page}. Nghỉ xíu lấy sức...")
                
                # 4. QUAN TRỌNG: Ngủ 3-5 giây để giả làm người đọc báo
                time.sleep(random.randint(3, 5))
                
            else:
                print(f"Trang {page} bị lỗi hoặc chặn: {response.status_code}")
                
        except Exception as e:
            print(f"Lỗi kết nối ở trang {page}: {e}")

print("Hoàn thành nhiệm vụ! Mở file csv lên xem nhé.")