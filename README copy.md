Web Next.js hiển thị leaderboard game và biểu đồ rank theo ngày (tuần/tháng), lấy dữ liệu từ MongoDB.

## Getting Started

### 1) Cấu hình môi trường

Tạo file `.env.local`:

```bash
MONGODB_URI=...
MONGODB_DB_NAME=webscraper_v2_db
```

### 2) Chạy dev server

Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 3) Sử dụng

- TRANG `/`: chọn `platform` + `leaderboard`, xem Top 50 theo snapshot mới nhất.
- Click vào game để vào `/game?url=...`: xem biểu đồ line theo `Tuần/Tháng` (X: ngày, Y: rank 1..50).

## Build

```bash
npm run build
npm start
```
