# Cấu trúc và ranh giới module

Ứng dụng dùng Next.js + Tauri. Word, Excel và PowerPoint là các feature riêng trong cùng ứng dụng. Build và đóng gói EXE qua GitHub Actions.

## Các tầng

```text
app/                            Route, layout, điểm nhập CSS
workspace/                      Tích hợp các feature thành ứng dụng
  document/create.ts            Ghép dữ liệu khởi tạo từ từng feature
  editor/office.tsx             Shell, ribbon, lịch sử, vòng đời editor
  editor/use-active-editor.ts   Chọn tích hợp của feature theo mode
features/
  word/                         Editor văn bản
  excel/                        Editor workbook
  powerpoint/                   Editor slide
  manager/                      Launcher và danh sách phục hồi
shared/
  document/types.ts             Hợp đồng JSON dùng chung
  editor/                       Props, hợp đồng tích hợp, nút ribbon
  sessions/types.ts             Hợp đồng session frontend
  styles/globals.css            Theme, shell và CSS dùng chung

src-tauri/src/
  lib.rs, main.rs               Khởi động và đăng ký command
  workspace/
    files.rs                    Hộp thoại, điều phối đọc/ghi theo định dạng
    sessions.rs                 Session, snapshot, lưu file, cửa sổ
  features/
    word/                       Model, định dạng DOCX và adapter
    excel/                      Model, đọc XLS/XLSX, ghi XLSX và adapter
    powerpoint/                 Model, định dạng PPTX và adapter
  shared/
    document.rs                 Hợp đồng JSON và tài liệu rỗng
    ooxml.rs                    Tiện ích ZIP/XML
```

`workspace` biết các feature để ghép ứng dụng. `shared` không phụ thuộc `features`, `workspace` hoặc `app`. Feature dùng code của chính mình và `shared`, không import feature anh em hay tầng tích hợp. `app` là điểm khởi tạo, được phép nhập stylesheet của các feature.

## Code riêng cho từng tính năng

| Vị trí | Trách nhiệm |
| --- | --- |
| `features/word/` | Editor, CSS, defaults; `use-editor.tsx` cung cấp Copy, số từ, tên/đuôi file và thao tác tạo tài liệu |
| `features/excel/` | Editor ô và sheet, actions, kiểu dữ liệu, CSS, defaults; `use-editor.tsx` giữ ô đang chọn và cung cấp Copy, số sheet, thao tác thêm sheet |
| `features/powerpoint/` | Editor slide, actions, kiểu dữ liệu, CSS, defaults; `use-editor.tsx` cung cấp Copy, số slide, thao tác thêm slide |
| `features/manager/` | Launcher và danh sách phục hồi; CSS riêng trong `styles.css` |
| `src-tauri/src/features/<tên>/model.rs` | Model Rust của từng loại tài liệu |
| `src-tauri/src/features/<tên>/formats.rs` | Đọc/ghi định dạng, không xử lý hộp thoại hoặc cửa sổ |
| `src-tauri/src/features/<tên>/adapter.rs` | Chuyển đổi giữa `OfficeDocument` và model riêng, gọi trình đọc/ghi của feature |

Khi feature lớn hơn, tạo `components/`, `hooks/`, `services/`, `utils/` bên trong chính feature theo nhu cầu. Không cần tạo file/thư mục trống để làm ba feature giống nhau.

## Code dùng chung và tích hợp

| Vị trí | Trách nhiệm |
| --- | --- |
| `shared/document/types.ts` | `Mode`, `OfficeDocument`, `Sheet`, `Slide`; không import từ feature |
| `shared/editor/types.ts` | `EditorProps`, `EditorFeature`: nội dung editor, nhãn, Copy, trạng thái và thao tác Insert |
| `shared/editor/ribbon-button.tsx` | Nút ribbon tái sử dụng |
| `shared/sessions/types.ts` | Kiểu session cho Manager và editor |
| `shared/styles/globals.css` | Theme, shell, ribbon, status bar và quy tắc dùng chung |
| `workspace/document/create.ts` | `fresh()` ghép defaults; mỗi lần gọi tạo dữ liệu mới |
| `workspace/editor/use-active-editor.ts` | Gọi hook theo thứ tự ổn định và chọn feature; chỉ nội dung feature đang mở được mount |
| `workspace/editor/office.tsx` | Lưu/mở, undo/redo, phím tắt, phục hồi và giao diện bao ngoài; dùng `EditorFeature` thay cho xử lý nội dung theo mode |
| `src-tauri/src/shared/document.rs` | Hợp đồng JSON và tài liệu rỗng tương thích snapshot hiện tại |
| `src-tauri/src/shared/ooxml.rs` | XML escape, đọc XML trong ZIP, lấy text và ghi ZIP; hiện Word/PowerPoint dùng |
| `src-tauri/src/workspace/files.rs` | Chọn file, điều phối adapter, đọc/ghi JSON và command Save |
| `src-tauri/src/workspace/sessions.rs` | Tạo/mở session, snapshot phục hồi, lưu tài liệu và quản lý cửa sổ |

Sheet/Slide thuộc hợp đồng truyền dữ liệu chung; `features/excel/types.ts` và `features/powerpoint/types.ts` tái xuất chúng. Kiểu nội bộ chỉ dùng trong một feature nên khai báo trong feature đó.

## Hạ tầng và mã cũ

| Vị trí | Phân loại |
| --- | --- |
| `.github/workflows/windows-build.yml` | Kiểm tra ranh giới module, TypeScript, build frontend, Rust check/test, build và đóng gói EXE |
| `scripts/check-architecture.mjs`, `scripts/check-architecture.test.mjs` | Kiểm tra import frontend/CSS và đường dẫn phụ thuộc Rust theo quy ước hiện tại; kiểm thử bộ kiểm tra |
| `scripts/package-portable.ps1` | Đóng gói bản Windows portable |
| `src-tauri/capabilities/`, `tauri.conf.json`, `build.rs` | Quyền và cấu hình desktop |
| `legacy/egui/` | Ứng dụng Rust cũ, không thuộc build desktop hiện tại |
| `node_modules/`, `.next/`, `out/`, `target/`, `src-tauri/target/`, `dist/` nếu có | Dependency, cache, kết quả build; không chỉnh sửa như mã nguồn |

## Tương thích và kiểm tra

Giữ nguyên các trường JSON `mode`, `word`, `sheets`, `selected_sheet`, `slides`, `selected_slide`, tên command Tauri và đường dẫn snapshot. Việc tách module không yêu cầu migration. Nếu đổi cấu trúc dữ liệu sau này, cần phối hợp TypeScript, Rust và dữ liệu phục hồi cũ.

Kiểm tra nhanh tại máy phát triển:

```powershell
npm run typecheck
npm run test:architecture
npm run check:architecture
```

GitHub Actions tiếp tục chạy `npm run build`, `cargo check`, `cargo test` và `npm run desktop:build`. Test trong `workspace/files.rs` kiểm tra hợp đồng JSON và nội dung của cả ba editor qua luồng đọc/ghi và adapter. Test định dạng trong từng feature vẫn được giữ nguyên.

Thay đổi code riêng cần kiểm tra editor tương ứng. Thay đổi hợp đồng chung, shell, CSS chung, dependency hoặc build cần kiểm tra cả ba editor. Typecheck và kiểm tra ranh giới không thay thế kiểm tra giao diện, cửa sổ desktop và phục hồi khi chạy ứng dụng.
