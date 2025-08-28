import { 
  Role, 
  StatusPeminjaman, 
  StatusBooking, 
  StatusPembayaran, 
  JenisNotifikasi, 
  TipePengguna,
  Pengguna,
  Fasilitas,
  JadwalFasilitas,
  Peminjaman,
  SuratPermohonan,
  SIP,
  Tagihan,
  Notifikasi,
  Panduan,
  AuditLog
} from '@prisma/client'

// Re-export Prisma types
export type {
  Role,
  StatusPeminjaman,
  StatusBooking,
  StatusPembayaran,
  JenisNotifikasi,
  TipePengguna,
  Pengguna,
  Fasilitas,
  JadwalFasilitas,
  Peminjaman,
  SuratPermohonan,
  SIP,
  Tagihan,
  Notifikasi,
  Panduan,
  AuditLog
}

// Extended types with relations
export type PeminjamanWithRelations = Peminjaman & {
  user: Pengguna
  fasilitas: Fasilitas
  suratPermohonan?: SuratPermohonan | null
  sip?: SIP | null
  tagihan?: Tagihan | null
}

export type FasilitasWithJadwal = Fasilitas & {
  jadwalFasilitas: JadwalFasilitas[]
}

export type NotifikasiWithUser = Notifikasi & {
  user: Pengguna
}

// Form types
export interface PeminjamanFormData {
  fasilitasId: string
  tglMulai: string
  tglSelesai: string
  tujuan: string
  keterangan?: string
}

export interface VerifikasiFormData {
  status: StatusPeminjaman
  alasanTolak?: string
  biaya?: number
}

export interface SuratPermohonanFormData {
  file: File
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Filter types
export interface PeminjamanFilter {
  status?: StatusPeminjaman
  fasilitasId?: string
  userId?: string
  startDate?: string
  endDate?: string
}

export interface FasilitasFilter {
  jenis?: string
  lokasi?: string
  tanggal?: string
}

// Dashboard types
export interface DashboardStats {
  totalPeminjaman: number
  peminjamanAktif: number
  peminjamanMenunggu: number
  totalFasilitas: number
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  resource?: unknown
}

// Session types (NextAuth extension)
export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  ssoId?: string
}

// File upload types
export interface FileUploadResult {
  success: boolean
  filePath?: string
  error?: string
}

// Export report types
export interface LaporanBulanan {
  bulan: number
  tahun: number
  totalPeminjaman: number
  peminjamanDisetujui: number
  peminjamanDitolak: number
  totalPendapatan: number
  fasilitasTerpopuler: {
    nama: string
    jumlahPeminjaman: number
  }[]
}